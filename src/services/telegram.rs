use std::collections::HashMap;
use std::sync::mpsc;
use std::sync::Arc;
use std::path::Path;
use std::fs;

use tokio::sync::Mutex;
use teloxide::prelude::*;
use teloxide::types::ParseMode;
use sha2::{Sha256, Digest};

use crate::services::claude::{self, StreamMessage, DEFAULT_ALLOWED_TOOLS};
use crate::ui::ai_screen::{self, HistoryItem, HistoryType, SessionData};

/// Per-chat session state
struct ChatSession {
    session_id: Option<String>,
    current_path: Option<String>,
    history: Vec<HistoryItem>,
}

/// Bot-level settings persisted to disk
#[derive(Clone)]
struct BotSettings {
    allowed_tools: Vec<String>,
    /// chat_id (string) → last working directory path
    last_sessions: HashMap<String, String>,
}

impl Default for BotSettings {
    fn default() -> Self {
        Self {
            allowed_tools: DEFAULT_ALLOWED_TOOLS.iter().map(|s| s.to_string()).collect(),
            last_sessions: HashMap::new(),
        }
    }
}

/// Shared state: per-chat sessions + bot settings
struct SharedData {
    sessions: HashMap<ChatId, ChatSession>,
    settings: BotSettings,
}

type SharedState = Arc<Mutex<SharedData>>;

/// Telegram message length limit
const TELEGRAM_MSG_LIMIT: usize = 4096;

/// Compute a short hash key from the bot token (first 16 chars of SHA-256 hex)
fn token_hash(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    let result = hasher.finalize();
    hex::encode(&result[..8]) // 16 hex chars
}

/// Path to bot settings file: ~/.cokacdir/bot_settings.json
fn bot_settings_path() -> Option<std::path::PathBuf> {
    dirs::home_dir().map(|h| h.join(".cokacdir").join("bot_settings.json"))
}

/// Load bot settings from bot_settings.json
fn load_bot_settings(token: &str) -> BotSettings {
    let Some(path) = bot_settings_path() else {
        return BotSettings::default();
    };
    let Ok(content) = fs::read_to_string(&path) else {
        return BotSettings::default();
    };
    let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) else {
        return BotSettings::default();
    };
    let key = token_hash(token);
    let Some(entry) = json.get(&key) else {
        return BotSettings::default();
    };
    let Some(tools_arr) = entry.get("allowed_tools").and_then(|v| v.as_array()) else {
        return BotSettings::default();
    };
    let tools: Vec<String> = tools_arr
        .iter()
        .filter_map(|v| v.as_str().map(String::from))
        .collect();
    if tools.is_empty() {
        return BotSettings::default();
    }
    let last_sessions = entry.get("last_sessions")
        .and_then(|v| v.as_object())
        .map(|obj| {
            obj.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect()
        })
        .unwrap_or_default();
    BotSettings { allowed_tools: tools, last_sessions }
}

/// Save bot settings to bot_settings.json
fn save_bot_settings(token: &str, settings: &BotSettings) {
    let Some(path) = bot_settings_path() else { return };
    // Ensure directory exists
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    // Load existing JSON or start fresh
    let mut json: serde_json::Value = if let Ok(content) = fs::read_to_string(&path) {
        serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({}))
    } else {
        serde_json::json!({})
    };
    let key = token_hash(token);
    json[key] = serde_json::json!({
        "allowed_tools": settings.allowed_tools,
        "last_sessions": settings.last_sessions,
    });
    if let Ok(s) = serde_json::to_string_pretty(&json) {
        let _ = fs::write(&path, s);
    }
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

/// All available tools with (description, is_destructive)
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
    if destructive { "!!!" } else { "" }
}

/// Entry point: start the Telegram bot with long polling
pub async fn run_bot(token: &str) {
    let bot = Bot::new(token);
    let bot_settings = load_bot_settings(token);
    let state: SharedState = Arc::new(Mutex::new(SharedData {
        sessions: HashMap::new(),
        settings: bot_settings,
    }));

    println!("  ✓ Bot connected — Listening for messages");

    let shared_state = state.clone();
    let token_owned = token.to_string();
    teloxide::repl(bot, move |bot: Bot, msg: Message| {
        let state = shared_state.clone();
        let token = token_owned.clone();
        async move {
            handle_message(bot, msg, state, &token).await
        }
    })
    .await;
}

/// Route incoming messages to appropriate handlers
async fn handle_message(
    bot: Bot,
    msg: Message,
    state: SharedState,
    token: &str,
) -> ResponseResult<()> {
    let chat_id = msg.chat.id;
    let user_name = msg.from.as_ref()
        .map(|u| u.first_name.as_str())
        .unwrap_or("unknown");
    let timestamp = chrono::Local::now().format("%H:%M:%S");

    // Handle file/photo uploads
    if msg.document().is_some() || msg.photo().is_some() {
        let file_hint = if msg.document().is_some() { "document" } else { "photo" };
        println!("  [{timestamp}] ◀ [{user_name}] Upload: {file_hint}");
        let result = handle_file_upload(&bot, chat_id, &msg, &state).await;
        println!("  [{timestamp}] ▶ [{user_name}] Upload complete");
        return result;
    }

    let Some(text) = msg.text() else {
        return Ok(());
    };

    let text = text.to_string();
    let preview = truncate_str(&text, 60);

    // Auto-restore session from bot_settings.json if not in memory
    if !text.starts_with("/start") {
        let mut data = state.lock().await;
        if !data.sessions.contains_key(&chat_id) {
            if let Some(last_path) = data.settings.last_sessions.get(&chat_id.0.to_string()).cloned() {
                if Path::new(&last_path).is_dir() {
                    let existing = load_existing_session(&last_path);
                    let session = data.sessions.entry(chat_id).or_insert_with(|| ChatSession {
                        session_id: None,
                        current_path: None,
                        history: Vec::new(),
                    });
                    session.current_path = Some(last_path.clone());
                    if let Some((session_data, _)) = existing {
                        session.session_id = Some(session_data.session_id.clone());
                        session.history = session_data.history.clone();
                    }
                    let ts = chrono::Local::now().format("%H:%M:%S");
                    println!("  [{ts}] ↻ [{user_name}] Auto-restored session: {last_path}");
                }
            }
        }
    }

    if text.starts_with("/help") {
        println!("  [{timestamp}] ◀ [{user_name}] /help");
        handle_help_command(&bot, chat_id).await?;
    } else if text.starts_with("/start") {
        println!("  [{timestamp}] ◀ [{user_name}] /start");
        handle_start_command(&bot, chat_id, &text, &state, token).await?;
    } else if text.starts_with("/clear") {
        println!("  [{timestamp}] ◀ [{user_name}] /clear");
        handle_clear_command(&bot, chat_id, &state).await?;
        println!("  [{timestamp}] ▶ [{user_name}] Session cleared");
    } else if text.starts_with("/pwd") {
        println!("  [{timestamp}] ◀ [{user_name}] /pwd");
        handle_pwd_command(&bot, chat_id, &state).await?;
    } else if text.starts_with("/down") {
        println!("  [{timestamp}] ◀ [{user_name}] /down {}", text.strip_prefix("/down").unwrap_or("").trim());
        handle_down_command(&bot, chat_id, &text, &state).await?;
    } else if text.starts_with("/availabletools") {
        println!("  [{timestamp}] ◀ [{user_name}] /availabletools");
        handle_availabletools_command(&bot, chat_id).await?;
    } else if text.starts_with("/allowedtools") {
        println!("  [{timestamp}] ◀ [{user_name}] /allowedtools");
        handle_allowedtools_command(&bot, chat_id, &state).await?;
    } else if text.starts_with("/allowed") {
        println!("  [{timestamp}] ◀ [{user_name}] /allowed {}", text.strip_prefix("/allowed").unwrap_or("").trim());
        handle_allowed_command(&bot, chat_id, &text, &state, token).await?;
    } else if text.starts_with('!') {
        println!("  [{timestamp}] ◀ [{user_name}] Shell: {preview}");
        handle_shell_command(&bot, chat_id, &text, &state).await?;
        println!("  [{timestamp}] ▶ [{user_name}] Shell done");
    } else {
        println!("  [{timestamp}] ◀ [{user_name}] {preview}");
        handle_text_message(&bot, chat_id, &text, &state).await?;
        println!("  [{timestamp}] ▶ [{user_name}] Response sent");
    }

    Ok(())
}

/// Handle /help command
async fn handle_help_command(
    bot: &Bot,
    chat_id: ChatId,
) -> ResponseResult<()> {
    let help = "\
<b>cokacdir Telegram Bot</b>
Manage server files &amp; chat with Claude AI.

<b>Session</b>
<code>/start &lt;path&gt;</code> — Start session at directory
<code>/start</code> — Start with auto-generated workspace
<code>/pwd</code> — Show current working directory
<code>/clear</code> — Clear AI conversation history

<b>File Transfer</b>
<code>/down &lt;file&gt;</code> — Download file from server
Send a file/photo — Upload to session directory

<b>Shell</b>
<code>!&lt;command&gt;</code> — Run shell command directly
  e.g. <code>!ls -la</code>, <code>!git status</code>

<b>AI Chat</b>
Any other message is sent to Claude AI.
AI can read, edit, and run commands in your session.

<b>Tool Management</b>
<code>/availabletools</code> — List all available tools
<code>/allowedtools</code> — Show currently allowed tools
<code>/allowed +name</code> — Add tool (e.g. <code>/allowed +Bash</code>)
<code>/allowed -name</code> — Remove tool

<code>/help</code> — Show this help";

    bot.send_message(chat_id, help)
        .parse_mode(ParseMode::Html)
        .await?;

    Ok(())
}

/// Handle /start <path> command
async fn handle_start_command(
    bot: &Bot,
    chat_id: ChatId,
    text: &str,
    state: &SharedState,
    token: &str,
) -> ResponseResult<()> {
    // Extract path from "/start <path>"
    let path_str = text.strip_prefix("/start").unwrap_or("").trim();

    let canonical_path = if path_str.is_empty() {
        // Create random workspace directory
        let Some(home) = dirs::home_dir() else {
            bot.send_message(chat_id, "Error: cannot determine home directory.")
                .await?;
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
            bot.send_message(chat_id, format!("Error: failed to create workspace: {}", e))
                .await?;
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
        // Validate path exists
        let path = Path::new(&expanded);
        if !path.exists() || !path.is_dir() {
            bot.send_message(chat_id, format!("Error: '{}' is not a valid directory.", expanded))
                .await?;
            return Ok(());
        }
        path.canonicalize()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|_| expanded)
    };

    // Try to load existing session for this path
    let existing = load_existing_session(&canonical_path);

    let mut response_lines = Vec::new();

    {
        let mut data = state.lock().await;
        let session = data.sessions.entry(chat_id).or_insert_with(|| ChatSession {
            session_id: None,
            current_path: None,
            history: Vec::new(),
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
                // Truncate long items for display
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
    }

    // Persist chat_id → path mapping for auto-restore after restart
    {
        let mut data = state.lock().await;
        data.settings.last_sessions.insert(chat_id.0.to_string(), canonical_path);
        save_bot_settings(token, &data.settings);
    }

    let response_text = response_lines.join("\n");
    send_long_message(bot, chat_id, &response_text, None).await?;

    Ok(())
}

/// Handle /clear command
async fn handle_clear_command(
    bot: &Bot,
    chat_id: ChatId,
    state: &SharedState,
) -> ResponseResult<()> {
    {
        let mut data = state.lock().await;
        if let Some(session) = data.sessions.get_mut(&chat_id) {
            session.session_id = None;
            session.history.clear();
        }
    }

    bot.send_message(chat_id, "Session cleared.")
        .await?;

    Ok(())
}

/// Handle /pwd command - show current session path
async fn handle_pwd_command(
    bot: &Bot,
    chat_id: ChatId,
    state: &SharedState,
) -> ResponseResult<()> {
    let current_path = {
        let data = state.lock().await;
        data.sessions.get(&chat_id).and_then(|s| s.current_path.clone())
    };

    match current_path {
        Some(path) => bot.send_message(chat_id, &path).await?,
        None => bot.send_message(chat_id, "No active session. Use /start <path> first.").await?,
    };

    Ok(())
}

/// Handle /down <filepath> - send file to user
async fn handle_down_command(
    bot: &Bot,
    chat_id: ChatId,
    text: &str,
    state: &SharedState,
) -> ResponseResult<()> {
    let file_path = text.strip_prefix("/down").unwrap_or("").trim();

    if file_path.is_empty() {
        bot.send_message(chat_id, "Usage: /down <filepath>\nExample: /down /home/kst/file.txt")
            .await?;
        return Ok(());
    }

    // Resolve relative path using current session path
    let resolved_path = if Path::new(file_path).is_absolute() {
        file_path.to_string()
    } else {
        let current_path = {
            let data = state.lock().await;
            data.sessions.get(&chat_id).and_then(|s| s.current_path.clone())
        };
        match current_path {
            Some(base) => format!("{}/{}", base.trim_end_matches('/'), file_path),
            None => {
                bot.send_message(chat_id, "No active session. Use absolute path or /start <path> first.")
                    .await?;
                return Ok(());
            }
        }
    };

    let path = Path::new(&resolved_path);
    if !path.exists() {
        bot.send_message(chat_id, &format!("File not found: {}", resolved_path)).await?;
        return Ok(());
    }
    if !path.is_file() {
        bot.send_message(chat_id, &format!("Not a file: {}", resolved_path)).await?;
        return Ok(());
    }

    bot.send_document(chat_id, teloxide::types::InputFile::file(path))
        .await?;

    Ok(())
}

/// Handle file/photo upload - save to current session path
async fn handle_file_upload(
    bot: &Bot,
    chat_id: ChatId,
    msg: &Message,
    state: &SharedState,
) -> ResponseResult<()> {
    // Get current session path
    let current_path = {
        let data = state.lock().await;
        data.sessions.get(&chat_id).and_then(|s| s.current_path.clone())
    };

    let Some(save_dir) = current_path else {
        bot.send_message(chat_id, "No active session. Use /start <path> first.")
            .await?;
        return Ok(());
    };

    // Get file_id and file_name
    let (file_id, file_name) = if let Some(doc) = msg.document() {
        let name = doc.file_name.clone().unwrap_or_else(|| "uploaded_file".to_string());
        (doc.file.id.clone(), name)
    } else if let Some(photos) = msg.photo() {
        // Get the largest photo
        if let Some(photo) = photos.last() {
            let name = format!("photo_{}.jpg", photo.file.unique_id);
            (photo.file.id.clone(), name)
        } else {
            return Ok(());
        }
    } else {
        return Ok(());
    };

    // Download file from Telegram via HTTP
    let file = bot.get_file(&file_id).await?;
    let url = format!("https://api.telegram.org/file/bot{}/{}", bot.token(), file.path);
    let buf = match reqwest::get(&url).await {
        Ok(resp) => match resp.bytes().await {
            Ok(bytes) => bytes,
            Err(e) => {
                bot.send_message(chat_id, &format!("Download failed: {}", e)).await?;
                return Ok(());
            }
        },
        Err(e) => {
            bot.send_message(chat_id, &format!("Download failed: {}", e)).await?;
            return Ok(());
        }
    };

    // Save to session path
    let dest = Path::new(&save_dir).join(&file_name);
    match fs::write(&dest, &buf) {
        Ok(_) => {
            let msg_text = format!("Saved: {}\n({} bytes)", dest.display(), buf.len());
            bot.send_message(chat_id, &msg_text).await?;
        }
        Err(e) => {
            bot.send_message(chat_id, &format!("Failed to save file: {}", e)).await?;
        }
    }

    Ok(())
}

/// Handle !command - execute shell command directly
async fn handle_shell_command(
    bot: &Bot,
    chat_id: ChatId,
    text: &str,
    state: &SharedState,
) -> ResponseResult<()> {
    let cmd_str = text.strip_prefix('!').unwrap_or("").trim();

    if cmd_str.is_empty() {
        bot.send_message(chat_id, "Usage: !<command>\nExample: !mkdir /home/kst/testcode")
            .await?;
        return Ok(());
    }

    // Get current_path for working directory (default to home directory)
    let working_dir = {
        let data = state.lock().await;
        data.sessions.get(&chat_id)
            .and_then(|s| s.current_path.clone())
            .unwrap_or_else(|| {
                dirs::home_dir()
                    .map(|h| h.display().to_string())
                    .unwrap_or_else(|| "/".to_string())
            })
    };

    let cmd_owned = cmd_str.to_string();
    let working_dir_clone = working_dir.clone();

    // Run shell command in blocking thread with stdin closed and timeout
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
                parts.push(format!("<pre>{}</pre>", html_escape(stdout.trim_end())));
            }
            if !stderr.is_empty() {
                parts.push(format!("stderr:\n<pre>{}</pre>", html_escape(stderr.trim_end())));
            }
            if parts.is_empty() {
                parts.push(format!("(exit code: {})", exit_code));
            } else if exit_code != 0 {
                parts.push(format!("(exit code: {})", exit_code));
            }

            parts.join("\n")
        }
        Ok(Err(e)) => format!("Failed to execute: {}", html_escape(&e.to_string())),
        Err(e) => format!("Task error: {}", html_escape(&e.to_string())),
    };

    send_long_message(bot, chat_id, &response, Some(ParseMode::Html)).await?;

    Ok(())
}

/// Handle /availabletools command - show all available tools
async fn handle_availabletools_command(
    bot: &Bot,
    chat_id: ChatId,
) -> ResponseResult<()> {
    let mut msg = String::from("<b>Available Tools</b>\n\n");

    for &(name, desc, destructive) in ALL_TOOLS {
        let badge = risk_badge(destructive);
        if badge.is_empty() {
            msg.push_str(&format!("<code>{}</code> — {}\n", html_escape(name), html_escape(desc)));
        } else {
            msg.push_str(&format!("<code>{}</code> {} — {}\n", html_escape(name), badge, html_escape(desc)));
        }
    }
    msg.push_str(&format!("\n{} = destructive\nTotal: {}", risk_badge(true), ALL_TOOLS.len()));

    send_long_message(bot, chat_id, &msg, Some(ParseMode::Html)).await?;

    Ok(())
}

/// Handle /allowedtools command - show current allowed tools list
async fn handle_allowedtools_command(
    bot: &Bot,
    chat_id: ChatId,
    state: &SharedState,
) -> ResponseResult<()> {
    let tools = {
        let data = state.lock().await;
        data.settings.allowed_tools.clone()
    };

    let mut msg = String::from("<b>Allowed Tools</b>\n\n");
    for tool in &tools {
        let (desc, destructive) = tool_info(tool);
        let badge = risk_badge(destructive);
        if badge.is_empty() {
            msg.push_str(&format!("<code>{}</code> — {}\n", html_escape(tool), html_escape(desc)));
        } else {
            msg.push_str(&format!("<code>{}</code> {} — {}\n", html_escape(tool), badge, html_escape(desc)));
        }
    }
    msg.push_str(&format!("\n{} = destructive\nTotal: {}", risk_badge(true), tools.len()));

    bot.send_message(chat_id, &msg)
        .parse_mode(ParseMode::Html)
        .await?;

    Ok(())
}

/// Handle /allowed command - add/remove tools
/// Usage: /allowed +toolname  (add)
///        /allowed -toolname  (remove)
async fn handle_allowed_command(
    bot: &Bot,
    chat_id: ChatId,
    text: &str,
    state: &SharedState,
    token: &str,
) -> ResponseResult<()> {
    let arg = text.strip_prefix("/allowed").unwrap_or("").trim();

    if arg.is_empty() {
        bot.send_message(chat_id, "Usage:\n/allowed +toolname — Add a tool\n/allowed -toolname — Remove a tool\n/allowedtools — Show current list")
            .await?;
        return Ok(());
    }

    // Skip if argument starts with "tools" (that's /allowedtools handled separately)
    if arg.starts_with("tools") {
        // This shouldn't happen due to routing order, but just in case
        return handle_allowedtools_command(bot, chat_id, state).await;
    }

    let (op, raw_name) = if let Some(name) = arg.strip_prefix('+') {
        ('+', name.trim())
    } else if let Some(name) = arg.strip_prefix('-') {
        ('-', name.trim())
    } else {
        bot.send_message(chat_id, "Use +toolname to add or -toolname to remove.\nExample: /allowed +Bash")
            .await?;
        return Ok(());
    };

    if raw_name.is_empty() {
        bot.send_message(chat_id, "Tool name cannot be empty.")
            .await?;
        return Ok(());
    }

    let tool_name = normalize_tool_name(raw_name);

    let response_msg = {
        let mut data = state.lock().await;
        match op {
            '+' => {
                if data.settings.allowed_tools.iter().any(|t| t == &tool_name) {
                    format!("<code>{}</code> is already in the list.", html_escape(&tool_name))
                } else {
                    data.settings.allowed_tools.push(tool_name.clone());
                    save_bot_settings(token, &data.settings);
                    format!("✅ Added <code>{}</code>", html_escape(&tool_name))
                }
            }
            '-' => {
                let before_len = data.settings.allowed_tools.len();
                data.settings.allowed_tools.retain(|t| t != &tool_name);
                if data.settings.allowed_tools.len() < before_len {
                    save_bot_settings(token, &data.settings);
                    format!("❌ Removed <code>{}</code>", html_escape(&tool_name))
                } else {
                    format!("<code>{}</code> is not in the list.", html_escape(&tool_name))
                }
            }
            _ => unreachable!(),
        }
    };

    bot.send_message(chat_id, &response_msg)
        .parse_mode(ParseMode::Html)
        .await?;

    Ok(())
}

/// Handle regular text messages - send to Claude AI
async fn handle_text_message(
    bot: &Bot,
    chat_id: ChatId,
    user_text: &str,
    state: &SharedState,
) -> ResponseResult<()> {
    // Get session info and allowed tools (drop lock before any await)
    let (session_info, allowed_tools) = {
        let data = state.lock().await;
        let info = data.sessions.get(&chat_id).and_then(|session| {
            session.current_path.as_ref().map(|_| {
                (session.session_id.clone(), session.current_path.clone().unwrap_or_default())
            })
        });
        let tools = data.settings.allowed_tools.clone();
        (info, tools)
    };

    let (session_id, current_path) = match session_info {
        Some(info) => info,
        None => {
            bot.send_message(chat_id, "No active session. Use /start <path> first.")
                .await?;
            return Ok(());
        }
    };

    // Add user message to history
    {
        let mut data = state.lock().await;
        if let Some(session) = data.sessions.get_mut(&chat_id) {
            session.history.push(HistoryItem {
                item_type: HistoryType::User,
                content: user_text.to_string(),
            });
        }
    }

    // Send placeholder message
    let placeholder = bot.send_message(chat_id, "...").await?;
    let placeholder_msg_id = placeholder.id;

    // Sanitize input
    let sanitized_input = ai_screen::sanitize_user_input(user_text);

    // Pass user input directly
    let context_prompt = sanitized_input;

    // Build system prompt with sendfile instructions
    let system_prompt_owned = format!(
        "You are chatting with a user through Telegram.\n\
         Current working directory: {}\n\n\
         When your work produces a file the user would want (generated code, reports, images, archives, etc.),\n\
         send it by running this bash command:\n\n\
         cokacdir --sendfile <filepath> --chat {} --key {}\n\n\
         This delivers the file directly to the user's Telegram chat.\n\
         Do NOT tell the user to use /down — use the command above instead.\n\n\
         Always keep the user informed about what you are doing. \
         Briefly explain each step as you work (e.g. \"Reading the file...\", \"Creating the script...\", \"Running tests...\"). \
         The user cannot see your tool calls, so narrate your progress so they know what is happening.\n\n\
         IMPORTANT: The user is on Telegram and CANNOT interact with any interactive prompts, dialogs, or confirmation requests. \
         All tools that require user interaction (such as AskUserQuestion, EnterPlanMode, ExitPlanMode) will NOT work. \
         Never use tools that expect user interaction. If you need clarification, just ask in plain text.",
        current_path, chat_id.0, bot.token()
    );

    // Create channel for streaming
    let (tx, rx) = mpsc::channel();

    let session_id_clone = session_id.clone();
    let current_path_clone = current_path.clone();

    // Run Claude in a blocking thread
    tokio::task::spawn_blocking(move || {
        let result = claude::execute_command_streaming(
            &context_prompt,
            session_id_clone.as_deref(),
            &current_path_clone,
            tx.clone(),
            Some(&system_prompt_owned),
            Some(&allowed_tools),
        );

        if let Err(e) = result {
            let _ = tx.send(StreamMessage::Error { message: e });
        }
    });

    // Poll for streaming responses and update message
    let mut full_response = String::new();
    let mut last_edit_text = String::from("...");
    let mut done = false;
    let mut new_session_id: Option<String> = None;

    while !done {
        // Send typing action (lasts ~5 seconds, so send periodically)
        let _ = bot.send_chat_action(chat_id, teloxide::types::ChatAction::Typing).await;

        tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;

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
                            let summary = format_tool_input(&name, &input);
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

        // Update placeholder message if content changed
        let current_text = if full_response.is_empty() {
            "...".to_string()
        } else {
            // Normalize empty lines to max 1 consecutive empty line
            let normalized = normalize_empty_lines(&full_response);
            // Truncate to Telegram limit for the current message
            truncate_str(&normalized, TELEGRAM_MSG_LIMIT)
        };

        if current_text != last_edit_text {
            let html_text = markdown_to_telegram_html(&current_text);
            let _ = bot.edit_message_text(chat_id, placeholder_msg_id, &html_text)
                .parse_mode(ParseMode::Html)
                .await;
            last_edit_text = current_text;
        }
    }

    // Final response
    if full_response.is_empty() {
        full_response = "(No response)".to_string();
    }

    // Normalize empty lines and convert markdown to Telegram HTML for formatted display
    let full_response = normalize_empty_lines(&full_response);
    let html_response = markdown_to_telegram_html(&full_response);

    // Send final message(s) with HTML formatting
    if html_response.len() <= TELEGRAM_MSG_LIMIT {
        let _ = bot.edit_message_text(chat_id, placeholder_msg_id, &html_response)
            .parse_mode(ParseMode::Html)
            .await;
    } else {
        // Delete placeholder and send split messages
        let _ = bot.delete_message(chat_id, placeholder_msg_id).await;
        send_long_message(bot, chat_id, &html_response, Some(ParseMode::Html)).await?;
    }

    // Update session state
    {
        let mut data = state.lock().await;
        if let Some(session) = data.sessions.get_mut(&chat_id) {
            if let Some(sid) = new_session_id {
                session.session_id = Some(sid);
            }
            session.history.push(HistoryItem {
                item_type: HistoryType::Assistant,
                content: full_response,
            });

            // Save session to file
            save_session_to_file(session, &current_path);
        }
    }

    Ok(())
}

/// Load existing session from ai_sessions directory matching the given path
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
fn save_session_to_file(session: &ChatSession, current_path: &str) {
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

    // Filter out system messages
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

    // Security: Verify the path is within sessions directory
    if let Some(parent) = file_path.parent() {
        if parent != sessions_dir {
            return;
        }
    }

    if let Ok(json) = serde_json::to_string_pretty(&session_data) {
        let _ = fs::write(file_path, json);
    }
}

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

/// Send a message that may exceed Telegram's 4096 character limit
/// by splitting it into multiple messages, handling UTF-8 boundaries
/// and unclosed HTML tags (e.g. <pre>) across split points
async fn send_long_message(
    bot: &Bot,
    chat_id: ChatId,
    text: &str,
    parse_mode: Option<ParseMode>,
) -> ResponseResult<()> {
    if text.len() <= TELEGRAM_MSG_LIMIT {
        let mut req = bot.send_message(chat_id, text);
        if let Some(mode) = parse_mode {
            req = req.parse_mode(mode);
        }
        req.await?;
        return Ok(());
    }

    let is_html = parse_mode.is_some();
    let mut remaining = text;
    let mut in_pre = false;

    while !remaining.is_empty() {
        // Reserve space for tags we may need to add (<pre> + </pre> = 11 bytes)
        let tag_overhead = if is_html && in_pre { 11 } else { 0 };
        let effective_limit = TELEGRAM_MSG_LIMIT.saturating_sub(tag_overhead);

        if remaining.len() <= effective_limit {
            let mut chunk = String::new();
            if is_html && in_pre {
                chunk.push_str("<pre>");
            }
            chunk.push_str(remaining);

            let mut req = bot.send_message(chat_id, &chunk);
            if let Some(mode) = parse_mode {
                req = req.parse_mode(mode);
            }
            req.await?;
            break;
        }

        // Find a safe UTF-8 char boundary, then find a newline before it
        let safe_end = floor_char_boundary(remaining, effective_limit);
        let split_at = remaining[..safe_end]
            .rfind('\n')
            .unwrap_or(safe_end);

        let (raw_chunk, rest) = remaining.split_at(split_at);

        let mut chunk = String::new();
        if is_html && in_pre {
            chunk.push_str("<pre>");
        }
        chunk.push_str(raw_chunk);

        // Track unclosed <pre> tags to close/reopen across chunks
        if is_html {
            let last_open = raw_chunk.rfind("<pre>");
            let last_close = raw_chunk.rfind("</pre>");
            in_pre = match (last_open, last_close) {
                (Some(o), Some(c)) => o > c,
                (Some(_), None) => true,
                (None, Some(_)) => false,
                (None, None) => in_pre,
            };
            if in_pre {
                chunk.push_str("</pre>");
            }
        }

        let mut req = bot.send_message(chat_id, &chunk);
        if let Some(mode) = parse_mode {
            req = req.parse_mode(mode);
        }
        req.await?;

        // Skip the newline character at the split point
        remaining = rest.strip_prefix('\n').unwrap_or(rest);
    }

    Ok(())
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

/// Escape special HTML characters for Telegram HTML parse mode
fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// Truncate a string to max_len bytes, cutting at a safe UTF-8 char and line boundary
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

/// Convert standard markdown to Telegram-compatible HTML
fn markdown_to_telegram_html(md: &str) -> String {
    let lines: Vec<&str> = md.lines().collect();
    let mut result = String::new();
    let mut i = 0;

    while i < lines.len() {
        let trimmed = lines[i].trim_start();

        // Fenced code block
        if trimmed.starts_with("```") {
            let mut code_lines = Vec::new();
            i += 1; // skip opening ```
            while i < lines.len() {
                if lines[i].trim_start().starts_with("```") {
                    break;
                }
                code_lines.push(lines[i]);
                i += 1;
            }
            let code = code_lines.join("\n");
            if !code.is_empty() {
                result.push_str(&format!("<pre>{}</pre>", html_escape(code.trim_end())));
            }
            result.push('\n');
            i += 1; // skip closing ```
            continue;
        }

        // Heading (# ~ ######)
        if let Some(rest) = strip_heading(trimmed) {
            result.push_str(&format!("<b>{}</b>", convert_inline(&html_escape(rest))));
            result.push('\n');
            i += 1;
            continue;
        }

        // Unordered list (- or *)
        if trimmed.starts_with("- ") {
            result.push_str(&format!("• {}", convert_inline(&html_escape(&trimmed[2..]))));
            result.push('\n');
            i += 1;
            continue;
        }
        if trimmed.starts_with("* ") && !trimmed.starts_with("**") {
            result.push_str(&format!("• {}", convert_inline(&html_escape(&trimmed[2..]))));
            result.push('\n');
            i += 1;
            continue;
        }

        // Regular line
        result.push_str(&convert_inline(&html_escape(lines[i])));
        result.push('\n');
        i += 1;
    }

    result.trim_end().to_string()
}

/// Strip markdown heading prefix (# ~ ######), return remaining text
fn strip_heading(line: &str) -> Option<&str> {
    let trimmed = line.trim_start_matches('#');
    // Must have consumed at least one # and be followed by a space
    if trimmed.len() < line.len() && trimmed.starts_with(' ') {
        let hashes = line.len() - trimmed.len();
        if hashes <= 6 {
            return Some(trimmed.trim_start());
        }
    }
    None
}

/// Convert inline markdown elements (bold, italic, code) in already HTML-escaped text
fn convert_inline(text: &str) -> String {
    // Process inline code first to protect content from further conversion
    let mut result = String::new();
    let mut remaining = text;

    // Split by inline code spans: `...`
    loop {
        if let Some(start) = remaining.find('`') {
            let after_start = &remaining[start + 1..];
            if let Some(end) = after_start.find('`') {
                // Found a complete inline code span
                let before = &remaining[..start];
                let code_content = &after_start[..end];
                result.push_str(&convert_bold_italic(before));
                result.push_str(&format!("<code>{}</code>", code_content));
                remaining = &after_start[end + 1..];
                continue;
            }
        }
        // No more inline code spans
        result.push_str(&convert_bold_italic(remaining));
        break;
    }

    result
}

/// Convert bold (**...**) and italic (*...*) in text
fn convert_bold_italic(text: &str) -> String {
    let mut result = String::new();
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // Bold: **...**
        if i + 1 < len && chars[i] == '*' && chars[i + 1] == '*' {
            if let Some(end) = find_closing_marker(&chars, i + 2, &['*', '*']) {
                let inner: String = chars[i + 2..end].iter().collect();
                result.push_str(&format!("<b>{}</b>", inner));
                i = end + 2;
                continue;
            }
        }
        // Italic: *...*
        if chars[i] == '*' {
            if let Some(end) = find_closing_single(&chars, i + 1, '*') {
                let inner: String = chars[i + 1..end].iter().collect();
                result.push_str(&format!("<i>{}</i>", inner));
                i = end + 1;
                continue;
            }
        }
        result.push(chars[i]);
        i += 1;
    }

    result
}

/// Find closing double marker (e.g., **) starting from pos
fn find_closing_marker(chars: &[char], start: usize, marker: &[char; 2]) -> Option<usize> {
    let len = chars.len();
    let mut i = start;
    while i + 1 < len {
        if chars[i] == marker[0] && chars[i + 1] == marker[1] {
            // Don't match empty content
            if i > start {
                return Some(i);
            }
        }
        i += 1;
    }
    None
}

/// Find closing single marker (e.g., *) starting from pos
fn find_closing_single(chars: &[char], start: usize, marker: char) -> Option<usize> {
    let len = chars.len();
    let mut i = start;
    while i < len {
        if chars[i] == marker {
            // Don't match empty or double marker
            if i > start && (i + 1 >= len || chars[i + 1] != marker) {
                return Some(i);
            }
        }
        i += 1;
    }
    None
}

/// Format tool input JSON into a human-readable summary
fn format_tool_input(name: &str, input: &str) -> String {
    let Ok(v) = serde_json::from_str::<serde_json::Value>(input) else {
        return format!("{} {}", name, truncate_str(input, 200));
    };

    match name {
        "Bash" => {
            let desc = v.get("description").and_then(|v| v.as_str()).unwrap_or("");
            let cmd = v.get("command").and_then(|v| v.as_str()).unwrap_or("");
            if !desc.is_empty() {
                format!("{}: `{}`", desc, truncate_str(cmd, 150))
            } else {
                format!("`{}`", truncate_str(cmd, 200))
            }
        }
        "Read" => {
            let fp = v.get("file_path").and_then(|v| v.as_str()).unwrap_or("");
            format!("Read {}", fp)
        }
        "Write" => {
            let fp = v.get("file_path").and_then(|v| v.as_str()).unwrap_or("");
            let content = v.get("content").and_then(|v| v.as_str()).unwrap_or("");
            let lines = content.lines().count();
            if lines > 0 {
                format!("Write {} ({} lines)", fp, lines)
            } else {
                format!("Write {}", fp)
            }
        }
        "Edit" => {
            let fp = v.get("file_path").and_then(|v| v.as_str()).unwrap_or("");
            let replace_all = v.get("replace_all").and_then(|v| v.as_bool()).unwrap_or(false);
            if replace_all {
                format!("Edit {} (replace all)", fp)
            } else {
                format!("Edit {}", fp)
            }
        }
        "Glob" => {
            let pattern = v.get("pattern").and_then(|v| v.as_str()).unwrap_or("");
            let path = v.get("path").and_then(|v| v.as_str()).unwrap_or("");
            if !path.is_empty() {
                format!("Glob {} in {}", pattern, path)
            } else {
                format!("Glob {}", pattern)
            }
        }
        "Grep" => {
            let pattern = v.get("pattern").and_then(|v| v.as_str()).unwrap_or("");
            let path = v.get("path").and_then(|v| v.as_str()).unwrap_or("");
            let output_mode = v.get("output_mode").and_then(|v| v.as_str()).unwrap_or("");
            if !path.is_empty() {
                if !output_mode.is_empty() {
                    format!("Grep \"{}\" in {} ({})", pattern, path, output_mode)
                } else {
                    format!("Grep \"{}\" in {}", pattern, path)
                }
            } else {
                format!("Grep \"{}\"", pattern)
            }
        }
        "NotebookEdit" => {
            let nb_path = v.get("notebook_path").and_then(|v| v.as_str()).unwrap_or("");
            let cell_id = v.get("cell_id").and_then(|v| v.as_str()).unwrap_or("");
            if !cell_id.is_empty() {
                format!("Notebook {} ({})", nb_path, cell_id)
            } else {
                format!("Notebook {}", nb_path)
            }
        }
        "WebSearch" => {
            let query = v.get("query").and_then(|v| v.as_str()).unwrap_or("");
            format!("Search: {}", query)
        }
        "WebFetch" => {
            let url = v.get("url").and_then(|v| v.as_str()).unwrap_or("");
            format!("Fetch {}", url)
        }
        "Task" => {
            let desc = v.get("description").and_then(|v| v.as_str()).unwrap_or("");
            let subagent_type = v.get("subagent_type").and_then(|v| v.as_str()).unwrap_or("");
            if !subagent_type.is_empty() {
                format!("Task [{}]: {}", subagent_type, desc)
            } else {
                format!("Task: {}", desc)
            }
        }
        "TaskOutput" => {
            let task_id = v.get("task_id").and_then(|v| v.as_str()).unwrap_or("");
            format!("Get task output: {}", task_id)
        }
        "TaskStop" => {
            let task_id = v.get("task_id").and_then(|v| v.as_str()).unwrap_or("");
            format!("Stop task: {}", task_id)
        }
        "TodoWrite" => {
            if let Some(todos) = v.get("todos").and_then(|v| v.as_array()) {
                let pending = todos.iter().filter(|t| {
                    t.get("status").and_then(|s| s.as_str()) == Some("pending")
                }).count();
                let in_progress = todos.iter().filter(|t| {
                    t.get("status").and_then(|s| s.as_str()) == Some("in_progress")
                }).count();
                let completed = todos.iter().filter(|t| {
                    t.get("status").and_then(|s| s.as_str()) == Some("completed")
                }).count();
                format!("Todo: {} pending, {} in progress, {} completed", pending, in_progress, completed)
            } else {
                "Update todos".to_string()
            }
        }
        "Skill" => {
            let skill = v.get("skill").and_then(|v| v.as_str()).unwrap_or("");
            format!("Skill: {}", skill)
        }
        "AskUserQuestion" => {
            if let Some(questions) = v.get("questions").and_then(|v| v.as_array()) {
                if let Some(q) = questions.first() {
                    let question = q.get("question").and_then(|v| v.as_str()).unwrap_or("");
                    truncate_str(question, 200)
                } else {
                    "Ask user question".to_string()
                }
            } else {
                "Ask user question".to_string()
            }
        }
        "ExitPlanMode" => {
            "Exit plan mode".to_string()
        }
        "EnterPlanMode" => {
            "Enter plan mode".to_string()
        }
        "TaskCreate" => {
            let subject = v.get("subject").and_then(|v| v.as_str()).unwrap_or("");
            format!("Create task: {}", subject)
        }
        "TaskUpdate" => {
            let task_id = v.get("taskId").and_then(|v| v.as_str()).unwrap_or("");
            let status = v.get("status").and_then(|v| v.as_str()).unwrap_or("");
            if !status.is_empty() {
                format!("Update task {}: {}", task_id, status)
            } else {
                format!("Update task {}", task_id)
            }
        }
        "TaskGet" => {
            let task_id = v.get("taskId").and_then(|v| v.as_str()).unwrap_or("");
            format!("Get task: {}", task_id)
        }
        "TaskList" => {
            "List tasks".to_string()
        }
        _ => {
            format!("{} {}", name, truncate_str(input, 200))
        }
    }
}

