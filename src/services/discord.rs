use std::collections::HashMap;
use std::sync::mpsc;
use std::sync::Arc;
use std::sync::atomic::Ordering;
use std::path::Path;
use std::fs;

use tokio::sync::Mutex;
use sha2::{Sha256, Digest};

use poise::serenity_prelude as serenity;
use serenity::{
    ChannelId, MessageId, UserId,
    CreateAttachment, CreateMessage, EditMessage,
};

use crate::services::claude::{self, CancelToken, StreamMessage, DEFAULT_ALLOWED_TOOLS};
use crate::ui::ai_screen::{self, HistoryItem, HistoryType, SessionData};

// Re-use telegram's helpers for settings persistence
use crate::services::telegram;

/// Discord message length limit
const DISCORD_MSG_LIMIT: usize = 2000;

/// Per-channel session state
struct DiscordSession {
    session_id: Option<String>,
    current_path: Option<String>,
    history: Vec<HistoryItem>,
    pending_uploads: Vec<String>,
    cleared: bool,
}

/// Bot-level settings persisted to disk
#[derive(Clone)]
struct DiscordBotSettings {
    allowed_tools: Vec<String>,
    /// channel_id (string) → last working directory path
    last_sessions: std::collections::HashMap<String, String>,
    /// Discord user ID of the registered owner (imprinting auth)
    owner_user_id: Option<u64>,
    /// Additional authorized user IDs (added by owner via /adduser)
    allowed_user_ids: Vec<u64>,
}

impl Default for DiscordBotSettings {
    fn default() -> Self {
        Self {
            allowed_tools: DEFAULT_ALLOWED_TOOLS.iter().map(|s| s.to_string()).collect(),
            last_sessions: std::collections::HashMap::new(),
            owner_user_id: None,
            allowed_user_ids: Vec::new(),
        }
    }
}

/// Shared state for the Discord bot (multi-channel: each channel has its own session)
struct SharedData {
    /// Per-channel sessions (each Discord channel can have its own Claude Code session)
    sessions: HashMap<ChannelId, DiscordSession>,
    /// Bot settings
    settings: DiscordBotSettings,
    /// Per-channel cancel tokens for in-progress AI requests
    cancel_tokens: HashMap<ChannelId, Arc<CancelToken>>,
    /// Per-channel timestamps of the last Discord API call (for rate limiting)
    api_timestamps: HashMap<ChannelId, tokio::time::Instant>,
    /// Cached skill list: (name, description)
    skills_cache: Vec<(String, String)>,
}

/// Poise user data type
struct Data {
    shared: Arc<Mutex<SharedData>>,
    token: String,
}

type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

/// Compute a short hash key from the bot token (first 16 chars of SHA-256 hex)
/// Uses "discord_" prefix to avoid collision with Telegram settings.
fn discord_token_hash(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    let result = hasher.finalize();
    format!("discord_{}", hex::encode(&result[..8]))
}

/// Path to bot settings file: ~/.cokacdir/bot_settings.json
fn bot_settings_path() -> Option<std::path::PathBuf> {
    dirs::home_dir().map(|h| h.join(".cokacdir").join("bot_settings.json"))
}

/// Load Discord bot settings from bot_settings.json
fn load_bot_settings(token: &str) -> DiscordBotSettings {
    let Some(path) = bot_settings_path() else {
        return DiscordBotSettings::default();
    };
    let Ok(content) = fs::read_to_string(&path) else {
        return DiscordBotSettings::default();
    };
    let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) else {
        return DiscordBotSettings::default();
    };
    let key = discord_token_hash(token);
    let Some(entry) = json.get(&key) else {
        return DiscordBotSettings::default();
    };
    let owner_user_id = entry.get("owner_user_id").and_then(|v| v.as_u64());
    let Some(tools_arr) = entry.get("allowed_tools").and_then(|v| v.as_array()) else {
        return DiscordBotSettings { owner_user_id, ..DiscordBotSettings::default() };
    };
    let tools: Vec<String> = tools_arr
        .iter()
        .filter_map(|v| v.as_str().map(String::from))
        .collect();
    if tools.is_empty() {
        return DiscordBotSettings { owner_user_id, ..DiscordBotSettings::default() };
    }
    let last_sessions = entry.get("last_sessions")
        .and_then(|v| v.as_object())
        .map(|obj| {
            obj.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect()
        })
        .unwrap_or_default();
    let allowed_user_ids = entry.get("allowed_user_ids")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_u64()).collect())
        .unwrap_or_default();
    DiscordBotSettings { allowed_tools: tools, last_sessions, owner_user_id, allowed_user_ids }
}

/// Save Discord bot settings to bot_settings.json
fn save_bot_settings(token: &str, settings: &DiscordBotSettings) {
    let Some(path) = bot_settings_path() else { return };
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let mut json: serde_json::Value = if let Ok(content) = fs::read_to_string(&path) {
        serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({}))
    } else {
        serde_json::json!({})
    };
    let key = discord_token_hash(token);
    let mut entry = serde_json::json!({
        "token": token,
        "allowed_tools": settings.allowed_tools,
        "last_sessions": settings.last_sessions,
        "allowed_user_ids": settings.allowed_user_ids,
    });
    if let Some(owner_id) = settings.owner_user_id {
        entry["owner_user_id"] = serde_json::json!(owner_id);
    }
    json[key] = entry;
    if let Ok(s) = serde_json::to_string_pretty(&json) {
        let _ = fs::write(&path, s);
    }
}

/// Resolve a Discord bot token from its hash by searching bot_settings.json
pub fn resolve_discord_token_by_hash(hash: &str) -> Option<String> {
    let path = bot_settings_path()?;
    let content = fs::read_to_string(&path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let obj = json.as_object()?;
    let entry = obj.get(hash)?;
    entry.get("token").and_then(|v| v.as_str()).map(String::from)
}

/// Normalize tool name: first letter uppercase, rest lowercase
fn normalize_tool_name(name: &str) -> String {
    let lower = name.to_lowercase();
    let mut chars = lower.chars();
    match chars.next() {
        Some(c) => c.to_uppercase().to_string() + chars.as_str(),
        None => String::new(),
    }
}

/// All available tools with (name, description, is_destructive)
const ALL_TOOLS: &[(&str, &str, bool)] = &[
    ("Bash",            "Execute shell commands",                          true),
    ("Read",            "Read file contents from the filesystem",          false),
    ("Edit",            "Perform find-and-replace edits in files",         true),
    ("Write",           "Create or overwrite files",                       true),
    ("Glob",            "Find files by name pattern",                      false),
    ("Grep",            "Search file contents with regex",                 false),
    ("Task",            "Launch autonomous sub-agents for complex tasks",  true),
    ("TaskOutput",      "Retrieve output from background tasks",           false),
    ("TaskStop",        "Stop a running background task",                  false),
    ("WebFetch",        "Fetch and process web page content",              true),
    ("WebSearch",       "Search the web for up-to-date information",       true),
    ("NotebookEdit",    "Edit Jupyter notebook cells",                     true),
    ("Skill",           "Invoke slash-command skills",                     false),
    ("TaskCreate",      "Create a structured task in the task list",       false),
    ("TaskGet",         "Retrieve task details by ID",                     false),
    ("TaskUpdate",      "Update task status or details",                   false),
    ("TaskList",        "List all tasks and their status",                 false),
    ("AskUserQuestion", "Ask the user a question (interactive)",           false),
    ("EnterPlanMode",   "Enter planning mode (interactive)",               false),
    ("ExitPlanMode",    "Exit planning mode (interactive)",                false),
];

/// Tool info: (description, is_destructive)
fn tool_info(name: &str) -> (&'static str, bool) {
    ALL_TOOLS.iter()
        .find(|(n, _, _)| *n == name)
        .map(|(_, desc, destr)| (*desc, *destr))
        .unwrap_or(("Custom tool", false))
}

/// Format a risk badge for display
fn risk_badge(destructive: bool) -> &'static str {
    if destructive { "⚠️" } else { "" }
}

/// Claude Code built-in slash commands
const BUILTIN_SKILLS: &[(&str, &str)] = &[
    ("compact",     "Compact conversation to reduce context"),
    ("cost",        "Show token usage and cost for this session"),
    ("doctor",      "Check Claude Code health and configuration"),
    ("init",        "Initialize project with CLAUDE.md guide"),
    ("login",       "Switch Anthropic accounts"),
    ("logout",      "Sign out from Anthropic account"),
    ("memory",      "Edit CLAUDE.md memory files"),
    ("model",       "Switch AI model"),
    ("permissions", "View and manage tool permissions"),
    ("pr-comments", "View PR comments for current branch"),
    ("review",      "Code review for uncommitted changes"),
    ("status",      "Show session status and git info"),
    ("terminal-setup", "Install Shift+Enter key binding"),
    ("vim",         "Toggle vim keybinding mode"),
];

/// Extract a description from a skill .md file.
/// Priority: 1) frontmatter `description:` field  2) first meaningful text line
fn extract_skill_description(content: &str) -> String {
    let lines: Vec<&str> = content.lines().collect();

    // Check for YAML frontmatter (starts with ---)
    if lines.first().map(|l| l.trim()) == Some("---") {
        // Find closing ---
        for (i, line) in lines.iter().enumerate().skip(1) {
            let trimmed = line.trim();
            if trimmed == "---" {
                // Look for description: inside frontmatter
                for fm_line in &lines[1..i] {
                    let fm_trimmed = fm_line.trim();
                    if let Some(desc) = fm_trimmed.strip_prefix("description:") {
                        let desc = desc.trim();
                        if !desc.is_empty() {
                            return desc.chars().take(80).collect();
                        }
                    }
                }
                // No description in frontmatter, use first line after frontmatter
                for after_line in &lines[(i + 1)..] {
                    let t = after_line.trim().trim_start_matches('#').trim();
                    if !t.is_empty() {
                        return t.chars().take(80).collect();
                    }
                }
                break;
            }
        }
    }

    // No frontmatter: skip heading lines like "# 역할", use first non-heading meaningful line
    let mut found_heading = false;
    for line in &lines {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if trimmed.starts_with('#') {
            found_heading = true;
            continue;
        }
        // Use this line as description
        return trimmed.chars().take(80).collect();
    }

    // Fallback: if only heading exists, use heading text
    if found_heading {
        for line in &lines {
            let trimmed = line.trim();
            if trimmed.starts_with('#') {
                let t = trimmed.trim_start_matches('#').trim();
                if !t.is_empty() {
                    return t.chars().take(80).collect();
                }
            }
        }
    }

    "Custom skill".to_string()
}

/// Scan for available Claude Code skills (slash commands).
/// Searches: ~/.claude/commands/ and <project>/.claude/commands/
/// Also includes Claude Code built-in commands.
fn scan_skills(project_path: Option<&str>) -> Vec<(String, String)> {
    let mut skills: Vec<(String, String)> = Vec::new();
    let mut seen = std::collections::HashSet::new();

    // Add built-in commands first
    for (name, desc) in BUILTIN_SKILLS {
        seen.insert(name.to_string());
        skills.push((name.to_string(), desc.to_string()));
    }

    let mut dirs_to_scan: Vec<std::path::PathBuf> = Vec::new();

    // Global skills: ~/.claude/commands/
    if let Some(home) = dirs::home_dir() {
        dirs_to_scan.push(home.join(".claude").join("commands"));
    }

    // Project-level skills: <project>/.claude/commands/
    if let Some(proj) = project_path {
        dirs_to_scan.push(Path::new(proj).join(".claude").join("commands"));
    }

    for dir in dirs_to_scan {
        if !dir.is_dir() {
            continue;
        }
        let Ok(entries) = fs::read_dir(&dir) else { continue };
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.extension().map(|e| e == "md").unwrap_or(false) {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    let name = stem.to_string();
                    if seen.insert(name.clone()) {
                        let desc = fs::read_to_string(&path)
                            .ok()
                            .map(|content| extract_skill_description(&content))
                            .unwrap_or_else(|| format!("Skill: {}", name));
                        skills.push((name, desc));
                    }
                }
            }
        }
    }

    skills.sort_by(|a, b| a.0.cmp(&b.0));
    skills
}

/// Entry point: start the Discord bot
pub async fn run_bot(token: &str) {
    let bot_settings = load_bot_settings(token);

    match bot_settings.owner_user_id {
        Some(owner_id) => println!("  ✓ Owner: {owner_id}"),
        None => println!("  ⚠ No owner registered — first user will be registered as owner"),
    }

    let initial_skills = scan_skills(None);
    let skill_count = initial_skills.len();
    println!("  ✓ Skills loaded: {skill_count}");

    let shared = Arc::new(Mutex::new(SharedData {
        sessions: HashMap::new(),
        settings: bot_settings,
        cancel_tokens: HashMap::new(),
        api_timestamps: HashMap::new(),
        skills_cache: initial_skills,
    }));

    let token_owned = token.to_string();
    let shared_clone = shared.clone();

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![
                cmd_start(),
                cmd_pwd(),
                cmd_clear(),
                cmd_stop(),
                cmd_down(),
                cmd_shell(),
                cmd_cc(),
                cmd_allowedtools(),
                cmd_allowed(),
                cmd_adduser(),
                cmd_removeuser(),
                cmd_help(),
            ],
            event_handler: |ctx, event, _framework, data| {
                Box::pin(handle_event(ctx, event, data))
            },
            ..Default::default()
        })
        .setup(move |ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                println!("  ✓ Bot connected — Listening for messages");
                Ok(Data {
                    shared: shared_clone,
                    token: token_owned,
                })
            })
        })
        .build();

    let intents = serenity::GatewayIntents::GUILD_MESSAGES
        | serenity::GatewayIntents::DIRECT_MESSAGES
        | serenity::GatewayIntents::MESSAGE_CONTENT;

    let mut client = serenity::ClientBuilder::new(token, intents)
        .framework(framework)
        .await
        .expect("Failed to create Discord client");

    if let Err(e) = client.start().await {
        eprintln!("  ✗ Discord bot error: {e}");
    }
}

/// Check if a user is authorized (owner or allowed user)
/// Returns true if authorized, false if rejected.
/// On first use, registers the user as owner.
async fn check_auth(
    user_id: UserId,
    user_name: &str,
    shared: &Arc<Mutex<SharedData>>,
    token: &str,
) -> bool {
    let mut data = shared.lock().await;
    match data.settings.owner_user_id {
        None => {
            // Imprint: register first user as owner
            data.settings.owner_user_id = Some(user_id.get());
            save_bot_settings(token, &data.settings);
            let ts = chrono::Local::now().format("%H:%M:%S");
            println!("  [{ts}] ★ Owner registered: {user_name} (id:{})", user_id.get());
            true
        }
        Some(owner_id) => {
            let uid = user_id.get();
            if uid == owner_id || data.settings.allowed_user_ids.contains(&uid) {
                true
            } else {
                let ts = chrono::Local::now().format("%H:%M:%S");
                println!("  [{ts}] ✗ Rejected: {user_name} (id:{})", uid);
                false
            }
        }
    }
}

/// Check if a user is the owner (not just allowed)
async fn check_owner(
    user_id: UserId,
    shared: &Arc<Mutex<SharedData>>,
) -> bool {
    let data = shared.lock().await;
    data.settings.owner_user_id == Some(user_id.get())
}

/// Rate limit helper — ensures minimum 1s gap between API calls per channel
async fn rate_limit_wait(shared: &Arc<Mutex<SharedData>>, channel_id: ChannelId) {
    let min_gap = tokio::time::Duration::from_millis(1000);
    let sleep_until = {
        let mut data = shared.lock().await;
        let last = data.api_timestamps.entry(channel_id).or_insert_with(||
            tokio::time::Instant::now() - tokio::time::Duration::from_secs(10)
        );
        let earliest_next = *last + min_gap;
        let now = tokio::time::Instant::now();
        let target = if earliest_next > now { earliest_next } else { now };
        *last = target;
        target
    };
    tokio::time::sleep_until(sleep_until).await;
}

/// Add a reaction to a message
async fn add_reaction(
    ctx: &serenity::Context,
    channel_id: ChannelId,
    message_id: MessageId,
    emoji: char,
) {
    let reaction = serenity::ReactionType::Unicode(emoji.to_string());
    let _ = channel_id.create_reaction(&ctx.http, message_id, reaction).await;
}

// ─── Event handler ───────────────────────────────────────────────────────────

/// Handle raw Discord events (non-slash-command messages, file uploads)
async fn handle_event(
    ctx: &serenity::Context,
    event: &serenity::FullEvent,
    data: &Data,
) -> Result<(), Error> {
    match event {
        serenity::FullEvent::Message { new_message } => {
            // Ignore bot messages and messages starting with / (slash commands)
            if new_message.author.bot {
                return Ok(());
            }

            // Ignore messages that look like slash commands
            if new_message.content.starts_with('/') {
                return Ok(());
            }

            let user_id = new_message.author.id;
            let user_name = &new_message.author.name;
            let channel_id = new_message.channel_id;

            // Auth check
            if !check_auth(user_id, user_name, &data.shared, &data.token).await {
                return Ok(());
            }

            // Handle file attachments
            if !new_message.attachments.is_empty() {
                let ts = chrono::Local::now().format("%H:%M:%S");
                println!("  [{ts}] ◀ [{user_name}] Upload: {} file(s)", new_message.attachments.len());
                handle_file_upload(ctx, new_message, &data.shared).await?;
                return Ok(());
            }

            let text = new_message.content.trim();
            if text.is_empty() {
                return Ok(());
            }

            // Auto-restore session
            auto_restore_session(&data.shared, channel_id).await;

            // Block messages while AI is in progress for this channel
            {
                let d = data.shared.lock().await;
                if d.cancel_tokens.contains_key(&channel_id) {
                    drop(d);
                    rate_limit_wait(&data.shared, channel_id).await;
                    let _ = channel_id.say(&ctx.http, "AI request in progress. Use `/stop` to cancel.").await;
                    return Ok(());
                }
            }

            // Shell command shortcut
            if text.starts_with('!') {
                let ts = chrono::Local::now().format("%H:%M:%S");
                let preview = truncate_str(text, 60);
                println!("  [{ts}] ◀ [{user_name}] Shell: {preview}");
                handle_shell_command_raw(ctx, channel_id, text, &data.shared).await?;
                return Ok(());
            }

            // Regular text → Claude AI
            let ts = chrono::Local::now().format("%H:%M:%S");
            let preview = truncate_str(text, 60);
            println!("  [{ts}] ◀ [{user_name}] {preview}");
            handle_text_message(ctx, channel_id, new_message.id, text, &data.shared, &data.token).await?;
        }
        _ => {}
    }
    Ok(())
}

// ─── Slash commands ──────────────────────────────────────────────────────────

/// /start [path] — Start session at directory
#[poise::command(slash_command, rename = "start")]
async fn cmd_start(
    ctx: Context<'_>,
    #[description = "Directory path (empty for auto workspace)"] path: Option<String>,
) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{user_name}] /start");

    let path_str = path.as_deref().unwrap_or("").trim();

    let canonical_path = if path_str.is_empty() {
        // Create random workspace directory
        let Some(home) = dirs::home_dir() else {
            ctx.say("Error: cannot determine home directory.").await?;
            return Ok(());
        };
        let workspace_dir = home.join(".cokacdir").join("workspace");
        use rand::Rng;
        let random_name: String = rand::thread_rng()
            .sample_iter(&rand::distributions::Alphanumeric)
            .take(8)
            .map(|b| (b as char).to_ascii_lowercase())
            .collect();
        let new_dir = workspace_dir.join(&random_name);
        if let Err(e) = fs::create_dir_all(&new_dir) {
            ctx.say(format!("Error: failed to create workspace: {}", e)).await?;
            return Ok(());
        }
        new_dir.display().to_string()
    } else {
        // Expand ~ to home directory
        let expanded = if path_str.starts_with("~/") || path_str == "~" {
            if let Some(home) = dirs::home_dir() {
                home.join(path_str.strip_prefix("~/").unwrap_or("")).display().to_string()
            } else {
                path_str.to_string()
            }
        } else {
            path_str.to_string()
        };
        let p = Path::new(&expanded);
        if !p.exists() || !p.is_dir() {
            ctx.say(format!("Error: '{}' is not a valid directory.", expanded)).await?;
            return Ok(());
        }
        p.canonicalize()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|_| expanded)
    };

    // Try to load existing session for this path
    let existing = load_existing_session(&canonical_path);

    let mut response_lines = Vec::new();

    {
        let mut data = ctx.data().shared.lock().await;
        let channel_id = ctx.channel_id();

        let session = data.sessions.entry(channel_id).or_insert_with(|| DiscordSession {
            session_id: None,
            current_path: None,
            history: Vec::new(),
            pending_uploads: Vec::new(),
            cleared: false,
        });

        if let Some((session_data, _)) = &existing {
            session.session_id = Some(session_data.session_id.clone());
            session.current_path = Some(canonical_path.clone());
            session.history = session_data.history.clone();

            let ts = chrono::Local::now().format("%H:%M:%S");
            println!("  [{ts}] ▶ Session restored: {canonical_path}");
            response_lines.push(format!("Session restored at `{}`.", canonical_path));
            response_lines.push(String::new());

            // Show last 5 conversation items
            let history_len = session_data.history.len();
            let start_idx = if history_len > 5 { history_len - 5 } else { 0 };
            for item in &session_data.history[start_idx..] {
                let prefix = match item.item_type {
                    HistoryType::User => "You",
                    HistoryType::Assistant => "AI",
                    HistoryType::Error => "Error",
                    HistoryType::System => "System",
                    HistoryType::ToolUse => "Tool",
                    HistoryType::ToolResult => "Result",
                };
                let content: String = item.content.chars().take(200).collect();
                let truncated = if item.content.chars().count() > 200 { "..." } else { "" };
                response_lines.push(format!("[{}] {}{}", prefix, content, truncated));
            }
        } else {
            session.session_id = None;
            session.current_path = Some(canonical_path.clone());
            session.history.clear();

            let ts = chrono::Local::now().format("%H:%M:%S");
            println!("  [{ts}] ▶ Session started: {canonical_path}");
            response_lines.push(format!("Session started at `{}`.", canonical_path));
        }

        // Persist channel → path mapping for auto-restore
        data.settings.last_sessions.insert(channel_id.get().to_string(), canonical_path.clone());
        save_bot_settings(&ctx.data().token, &data.settings);

        // Rescan skills with project path to pick up project-level commands
        data.skills_cache = scan_skills(Some(&canonical_path));
    }

    let response_text = response_lines.join("\n");
    send_long_message_ctx(ctx, &response_text).await?;

    Ok(())
}

/// /pwd — Show current working directory
#[poise::command(slash_command, rename = "pwd")]
async fn cmd_pwd(ctx: Context<'_>) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{user_name}] /pwd");

    let current_path = {
        let data = ctx.data().shared.lock().await;
        data.sessions.get(&ctx.channel_id()).and_then(|s| s.current_path.clone())
    };

    match current_path {
        Some(path) => ctx.say(&path).await?,
        None => ctx.say("No active session. Use `/start <path>` first.").await?,
    };
    Ok(())
}

/// /clear — Clear AI conversation history
#[poise::command(slash_command, rename = "clear")]
async fn cmd_clear(ctx: Context<'_>) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{user_name}] /clear");

    let channel_id = ctx.channel_id();

    // Cancel in-progress AI request if any
    let cancel_token = {
        let data = ctx.data().shared.lock().await;
        data.cancel_tokens.get(&channel_id).cloned()
    };
    if let Some(token) = cancel_token {
        token.cancelled.store(true, Ordering::Relaxed);
        if let Ok(guard) = token.child_pid.lock() {
            if let Some(pid) = *guard {
                #[cfg(unix)]
                unsafe { libc::kill(pid as libc::pid_t, libc::SIGTERM); }
            }
        }
    }

    {
        let mut data = ctx.data().shared.lock().await;
        if let Some(session) = data.sessions.get_mut(&channel_id) {
            session.session_id = None;
            session.history.clear();
            session.pending_uploads.clear();
            session.cleared = true;
        }
        data.cancel_tokens.remove(&channel_id);
    }

    ctx.say("Session cleared.").await?;
    println!("  [{ts}] ▶ [{user_name}] Session cleared");
    Ok(())
}

/// /stop — Cancel in-progress AI request
#[poise::command(slash_command, rename = "stop")]
async fn cmd_stop(ctx: Context<'_>) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{user_name}] /stop");

    let channel_id = ctx.channel_id();
    let token = {
        let data = ctx.data().shared.lock().await;
        data.cancel_tokens.get(&channel_id).cloned()
    };

    match token {
        Some(token) => {
            if token.cancelled.load(Ordering::Relaxed) {
                ctx.say("Already stopping...").await?;
                return Ok(());
            }

            ctx.say("Stopping...").await?;

            token.cancelled.store(true, Ordering::Relaxed);
            if let Ok(guard) = token.child_pid.lock() {
                if let Some(pid) = *guard {
                    #[cfg(unix)]
                    unsafe { libc::kill(pid as libc::pid_t, libc::SIGTERM); }
                }
            }
            println!("  [{ts}] ■ Cancel signal sent");
        }
        None => {
            ctx.say("No active request to stop.").await?;
        }
    }
    Ok(())
}

/// /down <file> — Download file from server
#[poise::command(slash_command, rename = "down")]
async fn cmd_down(
    ctx: Context<'_>,
    #[description = "File path to download"] file: String,
) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{user_name}] /down {file}");

    let file_path = file.trim();
    if file_path.is_empty() {
        ctx.say("Usage: `/down <filepath>`\nExample: `/down /home/user/file.txt`").await?;
        return Ok(());
    }

    // Resolve relative path
    let resolved_path = if Path::new(file_path).is_absolute() {
        file_path.to_string()
    } else {
        let current_path = {
            let data = ctx.data().shared.lock().await;
            data.sessions.get(&ctx.channel_id()).and_then(|s| s.current_path.clone())
        };
        match current_path {
            Some(base) => format!("{}/{}", base.trim_end_matches('/'), file_path),
            None => {
                ctx.say("No active session. Use absolute path or `/start <path>` first.").await?;
                return Ok(());
            }
        }
    };

    let path = Path::new(&resolved_path);
    if !path.exists() {
        ctx.say(format!("File not found: {}", resolved_path)).await?;
        return Ok(());
    }
    if !path.is_file() {
        ctx.say(format!("Not a file: {}", resolved_path)).await?;
        return Ok(());
    }

    // Send file as attachment
    let attachment = CreateAttachment::path(path).await?;
    ctx.send(poise::CreateReply::default().attachment(attachment)).await?;

    Ok(())
}

/// /shell <command> — Run shell command directly
#[poise::command(slash_command, rename = "shell")]
async fn cmd_shell(
    ctx: Context<'_>,
    #[description = "Shell command to execute"] command: String,
) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    let preview = truncate_str(&command, 60);
    println!("  [{ts}] ◀ [{user_name}] /shell {preview}");

    // Defer for potentially long-running commands
    ctx.defer().await?;

    let working_dir = {
        let data = ctx.data().shared.lock().await;
        data.sessions.get(&ctx.channel_id())
            .and_then(|s| s.current_path.clone())
            .unwrap_or_else(|| {
                dirs::home_dir()
                    .map(|h| h.display().to_string())
                    .unwrap_or_else(|| "/".to_string())
            })
    };

    let cmd_owned = command.clone();
    let working_dir_clone = working_dir.clone();

    let result = tokio::task::spawn_blocking(move || {
        let child = std::process::Command::new("bash")
            .args(["-c", &cmd_owned])
            .current_dir(&working_dir_clone)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn();

        match child {
            Ok(child) => child.wait_with_output(),
            Err(e) => Err(e),
        }
    }).await;

    let response = match result {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            let exit_code = output.status.code().unwrap_or(-1);

            let mut parts = Vec::new();
            if !stdout.is_empty() {
                parts.push(format!("```\n{}\n```", stdout.trim_end()));
            }
            if !stderr.is_empty() {
                parts.push(format!("stderr:\n```\n{}\n```", stderr.trim_end()));
            }
            if parts.is_empty() {
                parts.push(format!("(exit code: {})", exit_code));
            } else if exit_code != 0 {
                parts.push(format!("(exit code: {})", exit_code));
            }
            parts.join("\n")
        }
        Ok(Err(e)) => format!("Failed to execute: {}", e),
        Err(e) => format!("Task error: {}", e),
    };

    send_long_message_ctx(ctx, &response).await?;
    println!("  [{ts}] ▶ [{user_name}] Shell done");
    Ok(())
}

/// /allowedtools — Show currently allowed tools
#[poise::command(slash_command, rename = "allowedtools")]
async fn cmd_allowedtools(ctx: Context<'_>) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{user_name}] /allowedtools");

    let tools = {
        let data = ctx.data().shared.lock().await;
        data.settings.allowed_tools.clone()
    };

    let mut msg = String::from("**Allowed Tools**\n\n");
    for tool in &tools {
        let (desc, destructive) = tool_info(tool);
        let badge = risk_badge(destructive);
        if badge.is_empty() {
            msg.push_str(&format!("`{}` — {}\n", tool, desc));
        } else {
            msg.push_str(&format!("`{}` {} — {}\n", tool, badge, desc));
        }
    }
    msg.push_str(&format!("\n{} = destructive\nTotal: {}", risk_badge(true), tools.len()));

    send_long_message_ctx(ctx, &msg).await?;
    Ok(())
}

/// /allowed <+/-tool> — Add or remove a tool
#[poise::command(slash_command, rename = "allowed")]
async fn cmd_allowed(
    ctx: Context<'_>,
    #[description = "Use +name to add, -name to remove (e.g. +Bash or -Bash)"] action: String,
) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{user_name}] /allowed {action}");

    let arg = action.trim();
    let (op, raw_name) = if let Some(name) = arg.strip_prefix('+') {
        ('+', name.trim())
    } else if let Some(name) = arg.strip_prefix('-') {
        ('-', name.trim())
    } else {
        ctx.say("Use `+toolname` to add or `-toolname` to remove.\nExample: `/allowed +Bash`").await?;
        return Ok(());
    };

    if raw_name.is_empty() {
        ctx.say("Tool name cannot be empty.").await?;
        return Ok(());
    }

    let tool_name = normalize_tool_name(raw_name);

    let response_msg = {
        let mut data = ctx.data().shared.lock().await;
        match op {
            '+' => {
                if data.settings.allowed_tools.iter().any(|t| t == &tool_name) {
                    format!("`{}` is already in the list.", tool_name)
                } else {
                    data.settings.allowed_tools.push(tool_name.clone());
                    save_bot_settings(&ctx.data().token, &data.settings);
                    format!("Added `{}`", tool_name)
                }
            }
            '-' => {
                let before_len = data.settings.allowed_tools.len();
                data.settings.allowed_tools.retain(|t| t != &tool_name);
                if data.settings.allowed_tools.len() < before_len {
                    save_bot_settings(&ctx.data().token, &data.settings);
                    format!("Removed `{}`", tool_name)
                } else {
                    format!("`{}` is not in the list.", tool_name)
                }
            }
            _ => unreachable!(),
        }
    };

    ctx.say(&response_msg).await?;
    Ok(())
}

/// /adduser @user — Allow another user to use the bot (owner only)
#[poise::command(slash_command, rename = "adduser")]
async fn cmd_adduser(
    ctx: Context<'_>,
    #[description = "User to add"] user: serenity::User,
) -> Result<(), Error> {
    let author_id = ctx.author().id;
    let author_name = &ctx.author().name;
    if !check_auth(author_id, author_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }
    if !check_owner(author_id, &ctx.data().shared).await {
        ctx.say("Only the owner can add users.").await?;
        return Ok(());
    }

    let target_id = user.id.get();
    let target_name = &user.name;

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{author_name}] /adduser {target_name}");

    {
        let mut data = ctx.data().shared.lock().await;
        if data.settings.allowed_user_ids.contains(&target_id) {
            ctx.say(format!("`{}` is already authorized.", target_name)).await?;
            return Ok(());
        }
        data.settings.allowed_user_ids.push(target_id);
        save_bot_settings(&ctx.data().token, &data.settings);
    }

    ctx.say(format!("Added `{}` as authorized user.", target_name)).await?;
    println!("  [{ts}] ▶ Added user: {target_name} (id:{target_id})");
    Ok(())
}

/// /removeuser @user — Remove a user's access (owner only)
#[poise::command(slash_command, rename = "removeuser")]
async fn cmd_removeuser(
    ctx: Context<'_>,
    #[description = "User to remove"] user: serenity::User,
) -> Result<(), Error> {
    let author_id = ctx.author().id;
    let author_name = &ctx.author().name;
    if !check_auth(author_id, author_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }
    if !check_owner(author_id, &ctx.data().shared).await {
        ctx.say("Only the owner can remove users.").await?;
        return Ok(());
    }

    let target_id = user.id.get();
    let target_name = &user.name;

    let ts = chrono::Local::now().format("%H:%M:%S");
    println!("  [{ts}] ◀ [{author_name}] /removeuser {target_name}");

    {
        let mut data = ctx.data().shared.lock().await;
        let before_len = data.settings.allowed_user_ids.len();
        data.settings.allowed_user_ids.retain(|&id| id != target_id);
        if data.settings.allowed_user_ids.len() == before_len {
            ctx.say(format!("`{}` is not in the authorized list.", target_name)).await?;
            return Ok(());
        }
        save_bot_settings(&ctx.data().token, &data.settings);
    }

    ctx.say(format!("Removed `{}` from authorized users.", target_name)).await?;
    println!("  [{ts}] ▶ Removed user: {target_name} (id:{target_id})");
    Ok(())
}

/// /help — Show help information
#[poise::command(slash_command, rename = "help")]
async fn cmd_help(ctx: Context<'_>) -> Result<(), Error> {
    let help = "\
**cokacdir Discord Bot**
Manage server files & chat with Claude AI.
Each channel gets its own independent Claude Code session.

**Session**
`/start <path>` — Start session at directory
`/start` — Start with auto-generated workspace
`/pwd` — Show current working directory
`/clear` — Clear AI conversation history
`/stop` — Stop current AI request

**File Transfer**
`/down <file>` — Download file from server
Send a file/photo — Upload to session directory

**Shell**
`!<command>` — Run shell command directly
`/shell <command>` — Run shell command (slash command)

**AI Chat**
Any other message is sent to Claude AI.
AI can read, edit, and run commands in your session.

**Tool Management**
`/allowedtools` — Show currently allowed tools
`/allowed +name` — Add tool (e.g. `/allowed +Bash`)
`/allowed -name` — Remove tool

**Skills**
`/cc <skill>` — Run a Claude Code skill (autocomplete)

**User Management** (owner only)
`/adduser @user` — Allow a user to use the bot
`/removeuser @user` — Remove a user's access

`/help` — Show this help";

    ctx.say(help).await?;
    Ok(())
}

/// Autocomplete handler for /cc skill names
async fn autocomplete_skill<'a>(
    ctx: Context<'a>,
    partial: &'a str,
) -> Vec<serenity::AutocompleteChoice> {
    let data = ctx.data().shared.lock().await;
    let partial_lower = partial.to_lowercase();
    data.skills_cache
        .iter()
        .filter(|(name, _)| {
            partial.is_empty() || name.to_lowercase().contains(&partial_lower)
        })
        .take(25) // Discord autocomplete limit
        .map(|(name, desc)| {
            let label = format!("{} — {}", name, truncate_str(desc, 60));
            serenity::AutocompleteChoice::new(label, name.clone())
        })
        .collect()
}

/// /cc <skill> [args] — Run a Claude Code skill
#[poise::command(slash_command, rename = "cc")]
async fn cmd_cc(
    ctx: Context<'_>,
    #[description = "Skill name"]
    #[autocomplete = "autocomplete_skill"]
    skill: String,
    #[description = "Additional arguments for the skill"] args: Option<String>,
) -> Result<(), Error> {
    let user_id = ctx.author().id;
    let user_name = &ctx.author().name;
    if !check_auth(user_id, user_name, &ctx.data().shared, &ctx.data().token).await {
        return Ok(());
    }

    let ts = chrono::Local::now().format("%H:%M:%S");
    let args_str = args.as_deref().unwrap_or("");
    println!("  [{ts}] ◀ [{user_name}] /cc {skill} {args_str}");

    // Verify skill exists
    let skill_exists = {
        let data = ctx.data().shared.lock().await;
        data.skills_cache.iter().any(|(name, _)| name == &skill)
    };

    if !skill_exists {
        ctx.say(format!("Unknown skill: `{}`. Use `/cc` to see available skills.", skill)).await?;
        return Ok(());
    }

    // Auto-restore session
    auto_restore_session(&ctx.data().shared, ctx.channel_id()).await;

    // Check session exists
    let has_session = {
        let data = ctx.data().shared.lock().await;
        data.sessions.get(&ctx.channel_id())
            .and_then(|s| s.current_path.as_ref())
            .is_some()
    };

    if !has_session {
        ctx.say("No active session. Use `/start <path>` first.").await?;
        return Ok(());
    }

    // Block if AI is in progress
    {
        let d = ctx.data().shared.lock().await;
        if d.cancel_tokens.contains_key(&ctx.channel_id()) {
            drop(d);
            ctx.say("AI request in progress. Use `/stop` to cancel.").await?;
            return Ok(());
        }
    }

    // Build the prompt that tells Claude to invoke the skill
    let skill_prompt = if args_str.is_empty() {
        format!(
            "Execute the skill `/{skill}` now. \
             Use the Skill tool with skill=\"{skill}\"."
        )
    } else {
        format!(
            "Execute the skill `/{skill}` with arguments: {args_str}\n\
             Use the Skill tool with skill=\"{skill}\", args=\"{args_str}\"."
        )
    };

    // Send a confirmation message that we can use as the "user message" for reactions
    ctx.defer().await?;
    let confirm = ctx.channel_id().send_message(
        ctx.serenity_context(),
        CreateMessage::new().content(format!("⚡ Running skill: `/{skill}`")),
    ).await?;

    // Hand off to the text message handler (it creates its own placeholder)
    handle_text_message(
        ctx.serenity_context(),
        ctx.channel_id(),
        confirm.id,
        &skill_prompt,
        &ctx.data().shared,
        &ctx.data().token,
    ).await?;

    Ok(())
}

// ─── Text message → Claude AI ───────────────────────────────────────────────

/// Handle regular text messages — send to Claude AI
async fn handle_text_message(
    ctx: &serenity::Context,
    channel_id: ChannelId,
    user_msg_id: MessageId,
    user_text: &str,
    shared: &Arc<Mutex<SharedData>>,
    token: &str,
) -> Result<(), Error> {
    // Get session info, allowed tools, and pending uploads
    let (session_info, allowed_tools, pending_uploads) = {
        let mut data = shared.lock().await;
        let info = data.sessions.get(&channel_id).and_then(|session| {
            session.current_path.as_ref().map(|_| {
                (session.session_id.clone(), session.current_path.clone().unwrap_or_default())
            })
        });
        let tools = data.settings.allowed_tools.clone();
        let uploads = data.sessions.get_mut(&channel_id)
            .map(|s| {
                s.cleared = false;
                std::mem::take(&mut s.pending_uploads)
            })
            .unwrap_or_default();
        (info, tools, uploads)
    };

    let (session_id, current_path) = match session_info {
        Some(info) => info,
        None => {
            rate_limit_wait(shared, channel_id).await;
            let _ = channel_id.say(&ctx.http, "No active session. Use `/start <path>` first.").await;
            return Ok(());
        }
    };

    // Add hourglass reaction to user's message
    add_reaction(ctx, channel_id, user_msg_id, '⏳').await;

    // Send placeholder message
    rate_limit_wait(shared, channel_id).await;
    let placeholder = channel_id.send_message(
        &ctx.http,
        CreateMessage::new().content("..."),
    ).await?;
    let placeholder_msg_id = placeholder.id;

    // Sanitize input
    let sanitized_input = ai_screen::sanitize_user_input(user_text);

    // Prepend pending file uploads
    let context_prompt = if pending_uploads.is_empty() {
        sanitized_input
    } else {
        let upload_context = pending_uploads.join("\n");
        format!("{}\n\n{}", upload_context, sanitized_input)
    };

    // Build disabled tools notice
    let default_tools: std::collections::HashSet<&str> = DEFAULT_ALLOWED_TOOLS.iter().copied().collect();
    let allowed_set: std::collections::HashSet<&str> = allowed_tools.iter().map(|s| s.as_str()).collect();
    let disabled: Vec<&&str> = default_tools.iter().filter(|t| !allowed_set.contains(**t)).collect();
    let disabled_notice = if disabled.is_empty() {
        String::new()
    } else {
        let names: Vec<&str> = disabled.iter().map(|t| **t).collect();
        format!(
            "\n\nDISABLED TOOLS: The following tools have been disabled by the user: {}.\n\
             You MUST NOT attempt to use these tools. \
             If a user's request requires a disabled tool, do NOT proceed with the task. \
             Instead, clearly inform the user which tool is needed and that it is currently disabled. \
             Suggest they re-enable it with: /allowed +ToolName",
            names.join(", ")
        )
    };

    // Build skills notice for system prompt
    let skills_notice = {
        let data = shared.lock().await;
        if data.skills_cache.is_empty() {
            String::new()
        } else {
            let list: Vec<String> = data.skills_cache.iter()
                .map(|(name, desc)| format!("  - /{}: {}", name, desc))
                .collect();
            format!(
                "\n\nAvailable skills (invoke via the Skill tool):\n{}",
                list.join("\n")
            )
        }
    };

    // Build system prompt
    let system_prompt_owned = format!(
        "You are chatting with a user through Discord.\n\
         Current working directory: {}\n\n\
         When your work produces a file the user would want (generated code, reports, images, archives, etc.),\n\
         send it by running this bash command:\n\n\
         cokacdir --discord-sendfile <filepath> --channel {} --key {}\n\n\
         This delivers the file directly to the user's Discord channel.\n\
         Do NOT tell the user to use /down — use the command above instead.\n\n\
         Always keep the user informed about what you are doing. \
         Briefly explain each step as you work (e.g. \"Reading the file...\", \"Creating the script...\", \"Running tests...\"). \
         The user cannot see your tool calls, so narrate your progress so they know what is happening.\n\n\
         IMPORTANT: The user is on Discord and CANNOT interact with any interactive prompts, dialogs, or confirmation requests. \
         All tools that require user interaction (such as AskUserQuestion, EnterPlanMode, ExitPlanMode) will NOT work. \
         Never use tools that expect user interaction. If you need clarification, just ask in plain text.{}{}",
        current_path, channel_id.get(), discord_token_hash(token), disabled_notice, skills_notice
    );

    // Create cancel token
    let cancel_token = Arc::new(CancelToken::new());
    {
        let mut data = shared.lock().await;
        data.cancel_tokens.insert(channel_id, cancel_token.clone());
    }

    // Create channel for streaming
    let (tx, rx) = mpsc::channel();

    let session_id_clone = session_id.clone();
    let current_path_clone = current_path.clone();
    let cancel_token_clone = cancel_token.clone();

    // Run Claude in a blocking thread
    tokio::task::spawn_blocking(move || {
        let result = claude::execute_command_streaming(
            &context_prompt,
            session_id_clone.as_deref(),
            &current_path_clone,
            tx.clone(),
            Some(&system_prompt_owned),
            Some(&allowed_tools),
            Some(cancel_token_clone),
        );

        if let Err(e) = result {
            let _ = tx.send(StreamMessage::Error { message: e });
        }
    });

    // Spawn the polling loop
    let http = ctx.http.clone();
    let shared_owned = shared.clone();
    let user_text_owned = user_text.to_string();
    tokio::spawn(async move {
        const SPINNER: &[&str] = &[
            "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏",
        ];
        let mut full_response = String::new();
        let mut last_edit_text = String::new();
        let mut done = false;
        let mut cancelled = false;
        let mut new_session_id: Option<String> = None;
        let mut spin_idx: usize = 0;
        let mut current_msg_id = placeholder_msg_id;
        let mut current_msg_len: usize = 0;

        while !done {
            if cancel_token.cancelled.load(Ordering::Relaxed) {
                cancelled = true;
                break;
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(3000)).await;

            if cancel_token.cancelled.load(Ordering::Relaxed) {
                cancelled = true;
                break;
            }

            // Drain all available messages
            loop {
                match rx.try_recv() {
                    Ok(msg) => {
                        match msg {
                            StreamMessage::Init { session_id: sid } => {
                                new_session_id = Some(sid);
                            }
                            StreamMessage::Text { content } => {
                                full_response.push_str(&content);
                            }
                            StreamMessage::ToolUse { name, input } => {
                                let summary = telegram::format_tool_input(&name, &input);
                                let ts = chrono::Local::now().format("%H:%M:%S");
                                println!("  [{ts}]   ⚙ {name}: {}", truncate_str(&summary, 80));
                                full_response.push_str(&format!("\n\n⚙️ {}\n", summary));
                            }
                            StreamMessage::ToolResult { content, is_error } => {
                                if is_error {
                                    let ts = chrono::Local::now().format("%H:%M:%S");
                                    println!("  [{ts}]   ✗ Error: {}", truncate_str(&content, 80));
                                    let truncated = truncate_str(&content, 500);
                                    if truncated.contains('\n') {
                                        full_response.push_str(&format!("\n❌\n```\n{}\n```\n", truncated));
                                    } else {
                                        full_response.push_str(&format!("\n❌ `{}`\n\n", truncated));
                                    }
                                } else if !content.is_empty() {
                                    let truncated = truncate_str(&content, 300);
                                    if truncated.contains('\n') {
                                        full_response.push_str(&format!("\n```\n{}\n```\n", truncated));
                                    } else {
                                        full_response.push_str(&format!("\n✅ `{}`\n\n", truncated));
                                    }
                                }
                            }
                            StreamMessage::TaskNotification { summary, .. } => {
                                if !summary.is_empty() {
                                    full_response.push_str(&format!("\n[Task: {}]\n", summary));
                                }
                            }
                            StreamMessage::Done { result, session_id: sid } => {
                                if !result.is_empty() && full_response.is_empty() {
                                    full_response = result;
                                }
                                if let Some(s) = sid {
                                    new_session_id = Some(s);
                                }
                                done = true;
                            }
                            StreamMessage::Error { message } => {
                                full_response = format!("Error: {}", message);
                                done = true;
                            }
                        }
                    }
                    Err(std::sync::mpsc::TryRecvError::Empty) => break,
                    Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                        done = true;
                        break;
                    }
                }
            }

            // Build display text with spinner
            let indicator = SPINNER[spin_idx % SPINNER.len()];
            spin_idx += 1;

            let display_text = if full_response.is_empty() {
                format!("{} Processing...", indicator)
            } else {
                let normalized = normalize_empty_lines(&full_response);
                let truncated = truncate_str(&normalized, DISCORD_MSG_LIMIT - 30);
                format!("{}\n\n{}", truncated, indicator)
            };

            if display_text != last_edit_text && !done {
                // Check if we need to start a new message (content too long)
                if display_text.len() > DISCORD_MSG_LIMIT - 50 && current_msg_len > 100 {
                    // Finalize current message with content up to this point
                    let normalized = normalize_empty_lines(&full_response);
                    let finalize_text = truncate_str(&normalized, DISCORD_MSG_LIMIT - 10);
                    current_msg_len = finalize_text.len();

                    rate_limit_wait(&shared_owned, channel_id).await;
                    let _ = channel_id.edit_message(
                        &http,
                        current_msg_id,
                        EditMessage::new().content(&finalize_text),
                    ).await;

                    // Start new message
                    rate_limit_wait(&shared_owned, channel_id).await;
                    if let Ok(new_msg) = channel_id.send_message(
                        &http,
                        CreateMessage::new().content(format!("{} Processing...", indicator)),
                    ).await {
                        current_msg_id = new_msg.id;
                        current_msg_len = 0;
                    }
                } else {
                    rate_limit_wait(&shared_owned, channel_id).await;
                    let _ = channel_id.edit_message(
                        &http,
                        current_msg_id,
                        EditMessage::new().content(&display_text),
                    ).await;
                    current_msg_len = display_text.len();
                }
                last_edit_text = display_text;
            }
        }

        // Remove cancel token for this channel
        {
            let mut data = shared_owned.lock().await;
            data.cancel_tokens.remove(&channel_id);
        }

        // Remove hourglass reaction
        remove_reaction_raw(&http, channel_id, user_msg_id, '⏳').await;

        if cancelled {
            // Kill child process
            if let Ok(guard) = cancel_token.child_pid.lock() {
                if let Some(pid) = *guard {
                    #[cfg(unix)]
                    unsafe { libc::kill(pid as libc::pid_t, libc::SIGTERM); }
                }
            }

            let stopped_response = if full_response.trim().is_empty() {
                "[Stopped]".to_string()
            } else {
                let normalized = normalize_empty_lines(&full_response);
                format!("{}\n\n[Stopped]", normalized)
            };

            // Send final stopped message
            rate_limit_wait(&shared_owned, channel_id).await;
            let _ = channel_id.edit_message(
                &http,
                current_msg_id,
                EditMessage::new().content(truncate_str(&stopped_response, DISCORD_MSG_LIMIT)),
            ).await;

            // Add stop reaction
            add_reaction_raw(&http, channel_id, user_msg_id, '🛑').await;

            let ts = chrono::Local::now().format("%H:%M:%S");
            println!("  [{ts}] ■ Stopped");

            // Record in history
            let mut data = shared_owned.lock().await;
            if let Some(session) = data.sessions.get_mut(&channel_id) {
                if !session.cleared {
                    if let Some(sid) = new_session_id {
                        session.session_id = Some(sid);
                    }
                    session.history.push(HistoryItem {
                        item_type: HistoryType::User,
                        content: user_text_owned,
                    });
                    session.history.push(HistoryItem {
                        item_type: HistoryType::Assistant,
                        content: stopped_response,
                    });
                    if let Some(ref path) = session.current_path {
                        save_session_to_file(session, path);
                    }
                }
            }

            return;
        }

        // Final response
        if full_response.is_empty() {
            full_response = "(No response)".to_string();
        }

        let full_response = normalize_empty_lines(&full_response);

        // Delete placeholder and send final split messages
        rate_limit_wait(&shared_owned, channel_id).await;
        let _ = channel_id.delete_message(&http, current_msg_id).await;

        if let Err(e) = send_long_message_raw(&http, channel_id, &full_response, &shared_owned).await {
            let ts = chrono::Local::now().format("%H:%M:%S");
            println!("  [{ts}]   ⚠ send_long_message failed: {e}");
            // Fallback: send truncated
            rate_limit_wait(&shared_owned, channel_id).await;
            let _ = channel_id.send_message(
                &http,
                CreateMessage::new().content(truncate_str(&full_response, DISCORD_MSG_LIMIT)),
            ).await;
        }

        // Add checkmark reaction
        add_reaction_raw(&http, channel_id, user_msg_id, '✅').await;

        // Update session state
        {
            let mut data = shared_owned.lock().await;
            if let Some(session) = data.sessions.get_mut(&channel_id) {
                if !session.cleared {
                    if let Some(sid) = new_session_id {
                        session.session_id = Some(sid);
                    }
                    session.history.push(HistoryItem {
                        item_type: HistoryType::User,
                        content: user_text_owned,
                    });
                    session.history.push(HistoryItem {
                        item_type: HistoryType::Assistant,
                        content: full_response,
                    });
                    if let Some(ref path) = session.current_path {
                        save_session_to_file(session, path);
                    }
                }
            }
        }

        let ts = chrono::Local::now().format("%H:%M:%S");
        println!("  [{ts}] ▶ Response sent");
    });

    Ok(())
}

// ─── File upload handling ────────────────────────────────────────────────────

/// Handle file uploads from Discord messages
async fn handle_file_upload(
    ctx: &serenity::Context,
    msg: &serenity::Message,
    shared: &Arc<Mutex<SharedData>>,
) -> Result<(), Error> {
    let channel_id = msg.channel_id;

    let current_path = {
        let data = shared.lock().await;
        data.sessions.get(&channel_id).and_then(|s| s.current_path.clone())
    };

    let Some(save_dir) = current_path else {
        rate_limit_wait(shared, channel_id).await;
        let _ = channel_id.say(&ctx.http, "No active session. Use `/start <path>` first.").await;
        return Ok(());
    };

    for attachment in &msg.attachments {
        let file_name = &attachment.filename;

        // Download file from Discord CDN
        let buf = match reqwest::get(&attachment.url).await {
            Ok(resp) => match resp.bytes().await {
                Ok(bytes) => bytes,
                Err(e) => {
                    rate_limit_wait(shared, channel_id).await;
                    let _ = channel_id.say(&ctx.http, format!("Download failed: {}", e)).await;
                    continue;
                }
            },
            Err(e) => {
                rate_limit_wait(shared, channel_id).await;
                let _ = channel_id.say(&ctx.http, format!("Download failed: {}", e)).await;
                continue;
            }
        };

        // Save to session path (sanitize filename)
        let safe_name = Path::new(file_name)
            .file_name()
            .unwrap_or_else(|| std::ffi::OsStr::new("uploaded_file"));
        let dest = Path::new(&save_dir).join(safe_name);
        let file_size = buf.len();

        match fs::write(&dest, &buf) {
            Ok(_) => {
                let msg_text = format!("Saved: {}\n({} bytes)", dest.display(), file_size);
                rate_limit_wait(shared, channel_id).await;
                let _ = channel_id.say(&ctx.http, &msg_text).await;
            }
            Err(e) => {
                rate_limit_wait(shared, channel_id).await;
                let _ = channel_id.say(&ctx.http, format!("Failed to save file: {}", e)).await;
                continue;
            }
        }

        // Record upload in session
        let upload_record = format!(
            "[File uploaded] {} → {} ({} bytes)",
            file_name, dest.display(), file_size
        );
        {
            let mut data = shared.lock().await;
            if let Some(session) = data.sessions.get_mut(&channel_id) {
                session.history.push(HistoryItem {
                    item_type: HistoryType::User,
                    content: upload_record.clone(),
                });
                session.pending_uploads.push(upload_record);
                if let Some(ref path) = session.current_path {
                    save_session_to_file(session, path);
                }
            }
        }
    }

    Ok(())
}

/// Handle shell commands from raw text messages (! prefix)
async fn handle_shell_command_raw(
    ctx: &serenity::Context,
    channel_id: ChannelId,
    text: &str,
    shared: &Arc<Mutex<SharedData>>,
) -> Result<(), Error> {
    let cmd_str = text.strip_prefix('!').unwrap_or("").trim();
    if cmd_str.is_empty() {
        rate_limit_wait(shared, channel_id).await;
        let _ = channel_id.say(&ctx.http, "Usage: `!<command>`\nExample: `!ls -la`").await;
        return Ok(());
    }

    let working_dir = {
        let data = shared.lock().await;
        data.sessions.get(&channel_id)
            .and_then(|s| s.current_path.clone())
            .unwrap_or_else(|| {
                dirs::home_dir()
                    .map(|h| h.display().to_string())
                    .unwrap_or_else(|| "/".to_string())
            })
    };

    let cmd_owned = cmd_str.to_string();
    let working_dir_clone = working_dir.clone();

    let result = tokio::task::spawn_blocking(move || {
        let child = std::process::Command::new("bash")
            .args(["-c", &cmd_owned])
            .current_dir(&working_dir_clone)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn();
        match child {
            Ok(child) => child.wait_with_output(),
            Err(e) => Err(e),
        }
    }).await;

    let response = match result {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            let exit_code = output.status.code().unwrap_or(-1);
            let mut parts = Vec::new();
            if !stdout.is_empty() {
                parts.push(format!("```\n{}\n```", stdout.trim_end()));
            }
            if !stderr.is_empty() {
                parts.push(format!("stderr:\n```\n{}\n```", stderr.trim_end()));
            }
            if parts.is_empty() {
                parts.push(format!("(exit code: {})", exit_code));
            } else if exit_code != 0 {
                parts.push(format!("(exit code: {})", exit_code));
            }
            parts.join("\n")
        }
        Ok(Err(e)) => format!("Failed to execute: {}", e),
        Err(e) => format!("Task error: {}", e),
    };

    send_long_message_raw(&ctx.http, channel_id, &response, shared).await?;
    Ok(())
}

// ─── Sendfile (CLI) ──────────────────────────────────────────────────────────

/// Send a file to a Discord channel (called from CLI --discord-sendfile)
pub async fn send_file_to_channel(
    token: &str,
    channel_id: u64,
    file_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(file_path);
    if !path.exists() {
        return Err(format!("File not found: {}", file_path).into());
    }

    let http = serenity::Http::new(token);

    let channel = ChannelId::new(channel_id);
    let attachment = CreateAttachment::path(path).await?;

    channel.send_message(
        &http,
        CreateMessage::new()
            .content(format!("📎 {}", path.file_name().unwrap_or_default().to_string_lossy()))
            .add_file(attachment),
    ).await?;

    Ok(())
}

// ─── Session persistence ─────────────────────────────────────────────────────

/// Auto-restore session from bot_settings.json if not in memory
async fn auto_restore_session(
    shared: &Arc<Mutex<SharedData>>,
    channel_id: ChannelId,
) {
    let mut data = shared.lock().await;
    if data.sessions.contains_key(&channel_id) {
        return;
    }

    let channel_key = channel_id.get().to_string();
    if let Some(last_path) = data.settings.last_sessions.get(&channel_key).cloned() {
        if Path::new(&last_path).is_dir() {
            let existing = load_existing_session(&last_path);
            let session = data.sessions.entry(channel_id).or_insert_with(|| DiscordSession {
                session_id: None,
                current_path: None,
                history: Vec::new(),
                pending_uploads: Vec::new(),
                cleared: false,
            });
            session.current_path = Some(last_path.clone());
            if let Some((session_data, _)) = existing {
                session.session_id = Some(session_data.session_id.clone());
                session.history = session_data.history.clone();
            }
            // Rescan skills with project path
            data.skills_cache = scan_skills(Some(&last_path));
            let ts = chrono::Local::now().format("%H:%M:%S");
            println!("  [{ts}] ↻ Auto-restored session: {last_path}");
        }
    }
}

/// Load existing session from ai_sessions directory
fn load_existing_session(current_path: &str) -> Option<(SessionData, std::time::SystemTime)> {
    let sessions_dir = ai_screen::ai_sessions_dir()?;

    if !sessions_dir.exists() {
        return None;
    }

    let mut matching_session: Option<(SessionData, std::time::SystemTime)> = None;

    if let Ok(entries) = fs::read_dir(&sessions_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.extension().map(|e| e == "json").unwrap_or(false) {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(session_data) = serde_json::from_str::<SessionData>(&content) {
                        if session_data.current_path == current_path {
                            if let Ok(metadata) = path.metadata() {
                                if let Ok(modified) = metadata.modified() {
                                    match &matching_session {
                                        None => matching_session = Some((session_data, modified)),
                                        Some((_, latest_time)) if modified > *latest_time => {
                                            matching_session = Some((session_data, modified));
                                        }
                                        _ => {}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    matching_session
}

/// Save session to file in the ai_sessions directory
fn save_session_to_file(session: &DiscordSession, current_path: &str) {
    let Some(ref session_id) = session.session_id else {
        return;
    };

    if session.history.is_empty() {
        return;
    }

    let Some(sessions_dir) = ai_screen::ai_sessions_dir() else {
        return;
    };

    if fs::create_dir_all(&sessions_dir).is_err() {
        return;
    }

    let saveable_history: Vec<HistoryItem> = session.history.iter()
        .filter(|item| !matches!(item.item_type, HistoryType::System))
        .cloned()
        .collect();

    if saveable_history.is_empty() {
        return;
    }

    let session_data = SessionData {
        session_id: session_id.clone(),
        history: saveable_history,
        current_path: current_path.to_string(),
        created_at: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    };

    let file_path = sessions_dir.join(format!("{}.json", session_id));

    if let Some(parent) = file_path.parent() {
        if parent != sessions_dir {
            return;
        }
    }

    if let Ok(json) = serde_json::to_string_pretty(&session_data) {
        let _ = fs::write(file_path, json);
    }
}

// ─── Message utilities ──────────────────────────────────────────────────────

/// Find the largest byte index <= `index` that is a valid UTF-8 char boundary
fn floor_char_boundary(s: &str, index: usize) -> usize {
    if index >= s.len() {
        s.len()
    } else {
        let mut i = index;
        while !s.is_char_boundary(i) {
            i -= 1;
        }
        i
    }
}

/// Truncate a string to max_len bytes at a safe UTF-8 and line boundary
fn truncate_str(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        return s.to_string();
    }
    let safe_end = floor_char_boundary(s, max_len);
    let truncated = &s[..safe_end];
    if let Some(pos) = truncated.rfind('\n') {
        truncated[..pos].to_string()
    } else {
        truncated.to_string()
    }
}

/// Normalize consecutive empty lines to maximum of one
fn normalize_empty_lines(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut prev_was_empty = false;

    for line in s.lines() {
        let is_empty = line.is_empty();
        if is_empty {
            if !prev_was_empty {
                result.push('\n');
            }
            prev_was_empty = true;
        } else {
            if !result.is_empty() {
                result.push('\n');
            }
            result.push_str(line);
            prev_was_empty = false;
        }
    }

    result
}

/// Send a message using poise Context, splitting if necessary
async fn send_long_message_ctx(ctx: Context<'_>, text: &str) -> Result<(), Error> {
    if text.len() <= DISCORD_MSG_LIMIT {
        ctx.say(text).await?;
        return Ok(());
    }

    let chunks = split_message(text);
    for (i, chunk) in chunks.iter().enumerate() {
        if i == 0 {
            ctx.say(chunk).await?;
        } else {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            ctx.channel_id().say(ctx.serenity_context(), chunk).await?;
        }
    }

    Ok(())
}

/// Send a long message using raw HTTP, splitting if necessary
async fn send_long_message_raw(
    http: &serenity::Http,
    channel_id: ChannelId,
    text: &str,
    shared: &Arc<Mutex<SharedData>>,
) -> Result<(), Error> {
    if text.len() <= DISCORD_MSG_LIMIT {
        rate_limit_wait(shared, channel_id).await;
        channel_id.send_message(http, CreateMessage::new().content(text)).await?;
        return Ok(());
    }

    let chunks = split_message(text);
    for chunk in &chunks {
        rate_limit_wait(shared, channel_id).await;
        channel_id.send_message(http, CreateMessage::new().content(chunk)).await?;
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    Ok(())
}

/// Split a message into chunks that fit within Discord's 2000 char limit.
/// Handles code block boundaries correctly.
fn split_message(text: &str) -> Vec<String> {
    let mut chunks = Vec::new();
    let mut remaining = text;
    let mut in_code_block = false;
    let mut code_block_lang = String::new();

    while !remaining.is_empty() {
        // Reserve space for code block tags we may need to add
        let tag_overhead = if in_code_block {
            // closing ``` + opening ```lang\n
            3 + 3 + code_block_lang.len() + 1
        } else {
            0
        };
        let effective_limit = DISCORD_MSG_LIMIT.saturating_sub(tag_overhead).saturating_sub(10);

        if remaining.len() <= effective_limit {
            let mut chunk = String::new();
            if in_code_block {
                chunk.push_str("```");
                chunk.push_str(&code_block_lang);
                chunk.push('\n');
            }
            chunk.push_str(remaining);
            chunks.push(chunk);
            break;
        }

        // Find a safe split point
        let safe_end = floor_char_boundary(remaining, effective_limit);
        let split_at = remaining[..safe_end]
            .rfind('\n')
            .unwrap_or(safe_end);

        let (raw_chunk, rest) = remaining.split_at(split_at);

        let mut chunk = String::new();
        if in_code_block {
            chunk.push_str("```");
            chunk.push_str(&code_block_lang);
            chunk.push('\n');
        }
        chunk.push_str(raw_chunk);

        // Track code blocks across chunk boundaries
        for line in raw_chunk.lines() {
            let trimmed = line.trim_start();
            if trimmed.starts_with("```") {
                if in_code_block {
                    in_code_block = false;
                    code_block_lang.clear();
                } else {
                    in_code_block = true;
                    code_block_lang = trimmed.strip_prefix("```").unwrap_or("").to_string();
                }
            }
        }

        // Close unclosed code block at end of chunk
        if in_code_block {
            chunk.push_str("\n```");
        }

        chunks.push(chunk);
        remaining = rest.strip_prefix('\n').unwrap_or(rest);
    }

    chunks
}

/// Add reaction using raw HTTP reference
async fn add_reaction_raw(
    http: &serenity::Http,
    channel_id: ChannelId,
    message_id: MessageId,
    emoji: char,
) {
    let reaction = serenity::ReactionType::Unicode(emoji.to_string());
    let _ = channel_id.create_reaction(http, message_id, reaction).await;
}

/// Remove reaction using raw HTTP reference
async fn remove_reaction_raw(
    http: &serenity::Http,
    channel_id: ChannelId,
    message_id: MessageId,
    emoji: char,
) {
    let reaction = serenity::ReactionType::Unicode(emoji.to_string());
    let _ = channel_id.delete_reaction(http, message_id, None, reaction).await;
}
