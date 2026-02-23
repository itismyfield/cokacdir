use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader, Write};
use std::sync::mpsc::Sender;
use std::sync::OnceLock;
use std::fs::OpenOptions;
use regex::Regex;
use serde_json::Value;

/// Cached path to the claude binary.
/// Once resolved, reused for all subsequent calls.
static CLAUDE_PATH: OnceLock<Option<String>> = OnceLock::new();

/// Resolve the path to the claude binary.
/// First tries `which claude`, then falls back to `bash -lc "which claude"`
/// (for non-interactive SSH sessions where ~/.profile isn't loaded).
fn resolve_claude_path() -> Option<String> {
    // Try direct `which claude` first
    if let Ok(output) = Command::new("which").arg("claude").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Some(path);
            }
        }
    }

    // Fallback: use login shell to resolve PATH
    if let Ok(output) = Command::new("bash")
        .args(["-lc", "which claude"])
        .output()
    {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Some(path);
            }
        }
    }

    None
}

/// Get the cached claude binary path, resolving it on first call.
fn get_claude_path() -> Option<&'static str> {
    CLAUDE_PATH.get_or_init(|| resolve_claude_path()).as_deref()
}

/// Debug logging helper (only active when COKACDIR_DEBUG=1)
fn debug_log(msg: &str) {
    static ENABLED: OnceLock<bool> = OnceLock::new();
    let enabled = ENABLED.get_or_init(|| {
        std::env::var("COKACDIR_DEBUG").map(|v| v == "1").unwrap_or(false)
    });
    if !*enabled { return; }
    if let Some(home) = dirs::home_dir() {
        let debug_dir = home.join(".cokacdir").join("debug");
        let _ = std::fs::create_dir_all(&debug_dir);
        let log_path = debug_dir.join("claude.log");
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_path)
        {
            let timestamp = chrono::Local::now().format("%H:%M:%S%.3f");
            let _ = writeln!(file, "[{}] {}", timestamp, msg);
        }
    }
}

#[derive(Debug, Clone)]
pub struct ClaudeResponse {
    pub success: bool,
    pub response: Option<String>,
    pub session_id: Option<String>,
    pub error: Option<String>,
}

/// Streaming message types for real-time Claude responses
#[derive(Debug, Clone)]
pub enum StreamMessage {
    /// Initialization - contains session_id
    Init { session_id: String },
    /// Text response chunk
    Text { content: String },
    /// Tool use started
    ToolUse { name: String, input: String },
    /// Tool execution result
    ToolResult { content: String, is_error: bool },
    /// Background task notification
    TaskNotification { task_id: String, status: String, summary: String },
    /// Completion
    Done { result: String, session_id: Option<String> },
    /// Error
    Error { message: String, stdout: String, stderr: String, exit_code: Option<i32> },
}

/// Token for cooperative cancellation of streaming requests.
/// Holds a flag and the child process PID so the caller can kill it externally.
pub struct CancelToken {
    pub cancelled: std::sync::atomic::AtomicBool,
    pub child_pid: std::sync::Mutex<Option<u32>>,
}

impl CancelToken {
    pub fn new() -> Self {
        Self {
            cancelled: std::sync::atomic::AtomicBool::new(false),
            child_pid: std::sync::Mutex::new(None),
        }
    }
}

/// Cached regex pattern for session ID validation
fn session_id_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| Regex::new(r"^[a-zA-Z0-9_-]+$").expect("Invalid session ID regex pattern"))
}

/// Validate session ID format (alphanumeric, dashes, underscores only)
/// Max length reduced to 64 characters for security
fn is_valid_session_id(session_id: &str) -> bool {
    !session_id.is_empty() && session_id.len() <= 64 && session_id_regex().is_match(session_id)
}

/// Default allowed tools for Claude CLI
pub const DEFAULT_ALLOWED_TOOLS: &[&str] = &[
    "Bash", "Read", "Edit", "Write", "Glob", "Grep", "Task", "TaskOutput",
    "TaskStop", "WebFetch", "WebSearch", "NotebookEdit", "Skill",
    "TaskCreate", "TaskGet", "TaskUpdate", "TaskList",
];

/// Execute a command using Claude CLI
pub fn execute_command(
    prompt: &str,
    session_id: Option<&str>,
    working_dir: &str,
    allowed_tools: Option<&[String]>,
) -> ClaudeResponse {
    let tools_str = match allowed_tools {
        Some(tools) => tools.join(","),
        None => DEFAULT_ALLOWED_TOOLS.join(","),
    };
    let mut args = vec![
        "-p".to_string(),
        "--dangerously-skip-permissions".to_string(),
        "--tools".to_string(),
        tools_str,
        "--output-format".to_string(),
        "json".to_string(),
        "--append-system-prompt".to_string(),
        r#"You are a terminal file manager assistant. Be concise. Focus on file operations. Respond in the same language as the user.

SECURITY RULES (MUST FOLLOW):
- NEVER execute destructive commands like rm -rf, format, mkfs, dd, etc.
- NEVER modify system files in /etc, /sys, /proc, /boot
- NEVER access or modify files outside the current working directory without explicit user path
- NEVER execute commands that could harm the system or compromise security
- ONLY suggest safe file operations: copy, move, rename, create directory, view, edit
- If a request seems dangerous, explain the risk and suggest a safer alternative

BASH EXECUTION RULES (MUST FOLLOW):
- All commands MUST run non-interactively without user input
- Use -y, --yes, or --non-interactive flags (e.g., apt install -y, npm init -y)
- Use -m flag for commit messages (e.g., git commit -m "message")
- Disable pagers with --no-pager or pipe to cat (e.g., git --no-pager log)
- NEVER use commands that open editors (vim, nano, etc.)
- NEVER use commands that wait for stdin without arguments
- NEVER use interactive flags like -i

IMPORTANT: Format your responses using Markdown for better readability:
- Use **bold** for important terms or commands
- Use `code` for file paths, commands, and technical terms
- Use bullet lists (- item) for multiple items
- Use numbered lists (1. item) for sequential steps
- Use code blocks (```language) for multi-line code or command examples
- Use headers (## Title) to organize longer responses
- Keep formatting minimal and terminal-friendly"#.to_string(),
    ];

    // Resume session if available
    if let Some(sid) = session_id {
        if !is_valid_session_id(sid) {
            return ClaudeResponse {
                success: false,
                response: None,
                session_id: None,
                error: Some("Invalid session ID format".to_string()),
            };
        }
        args.push("--resume".to_string());
        args.push(sid.to_string());
    }

    let claude_bin = match get_claude_path() {
        Some(path) => path,
        None => {
            return ClaudeResponse {
                success: false,
                response: None,
                session_id: None,
                error: Some("Claude CLI not found. Is Claude CLI installed?".to_string()),
            };
        }
    };

    let mut child = match Command::new(claude_bin)
        .args(&args)
        .current_dir(working_dir)
        .env("CLAUDE_CODE_MAX_OUTPUT_TOKENS", "64000")
        .env("BASH_DEFAULT_TIMEOUT_MS", "86400000")  // 24 hours (no practical timeout)
        .env("BASH_MAX_TIMEOUT_MS", "86400000")      // 24 hours (no practical timeout)
        .env_remove("CLAUDECODE")  // Allow running from within Claude Code sessions
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(e) => {
            return ClaudeResponse {
                success: false,
                response: None,
                session_id: None,
                error: Some(format!("Failed to start Claude: {}. Is Claude CLI installed?", e)),
            };
        }
    };

    // Write prompt to stdin
    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(prompt.as_bytes());
    }

    // Wait for output
    match child.wait_with_output() {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                parse_claude_output(&stdout)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                ClaudeResponse {
                    success: false,
                    response: None,
                    session_id: None,
                    error: Some(if stderr.is_empty() {
                        format!("Process exited with code {:?}", output.status.code())
                    } else {
                        stderr
                    }),
                }
            }
        }
        Err(e) => ClaudeResponse {
            success: false,
            response: None,
            session_id: None,
            error: Some(format!("Failed to read output: {}", e)),
        },
    }
}

/// Parse Claude CLI JSON output
fn parse_claude_output(output: &str) -> ClaudeResponse {
    let mut session_id: Option<String> = None;
    let mut response_text = String::new();

    for line in output.trim().lines() {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
            // Extract session ID
            if let Some(sid) = json.get("session_id").and_then(|v| v.as_str()) {
                session_id = Some(sid.to_string());
            }

            // Extract response text
            if let Some(result) = json.get("result").and_then(|v| v.as_str()) {
                response_text = result.to_string();
            } else if let Some(message) = json.get("message").and_then(|v| v.as_str()) {
                response_text = message.to_string();
            } else if let Some(content) = json.get("content").and_then(|v| v.as_str()) {
                response_text = content.to_string();
            }
        } else if !line.trim().is_empty() && !line.starts_with('{') {
            response_text.push_str(line);
            response_text.push('\n');
        }
    }

    // If no structured response, use raw output
    if response_text.is_empty() {
        response_text = output.trim().to_string();
    }

    ClaudeResponse {
        success: true,
        response: Some(response_text.trim().to_string()),
        session_id,
        error: None,
    }
}

/// Check if Claude CLI is available
pub fn is_claude_available() -> bool {
    #[cfg(not(unix))]
    {
        false
    }

    #[cfg(unix)]
    {
        get_claude_path().is_some()
    }
}

/// Check if platform supports AI features
pub fn is_ai_supported() -> bool {
    cfg!(unix)
}

/// Execute a command using Claude CLI with streaming output
/// If `system_prompt` is None, uses the default file manager system prompt.
/// If `system_prompt` is Some(""), no system prompt is appended.
pub fn execute_command_streaming(
    prompt: &str,
    session_id: Option<&str>,
    working_dir: &str,
    sender: Sender<StreamMessage>,
    system_prompt: Option<&str>,
    allowed_tools: Option<&[String]>,
    cancel_token: Option<std::sync::Arc<CancelToken>>,
) -> Result<(), String> {
    debug_log("========================================");
    debug_log("=== execute_command_streaming START ===");
    debug_log("========================================");
    debug_log(&format!("prompt_len: {} chars", prompt.len()));
    let prompt_preview: String = prompt.chars().take(200).collect();
    debug_log(&format!("prompt_preview: {:?}", prompt_preview));
    debug_log(&format!("session_id: {:?}", session_id));
    debug_log(&format!("working_dir: {}", working_dir));
    debug_log(&format!("timestamp: {:?}", std::time::SystemTime::now()));

    let default_system_prompt = r#"You are a terminal file manager assistant. Be concise. Focus on file operations. Respond in the same language as the user.

SECURITY RULES (MUST FOLLOW):
- NEVER execute destructive commands like rm -rf, format, mkfs, dd, etc.
- NEVER modify system files in /etc, /sys, /proc, /boot
- NEVER access or modify files outside the current working directory without explicit user path
- NEVER execute commands that could harm the system or compromise security
- ONLY suggest safe file operations: copy, move, rename, create directory, view, edit
- If a request seems dangerous, explain the risk and suggest a safer alternative

BASH EXECUTION RULES (MUST FOLLOW):
- All commands MUST run non-interactively without user input
- Use -y, --yes, or --non-interactive flags (e.g., apt install -y, npm init -y)
- Use -m flag for commit messages (e.g., git commit -m "message")
- Disable pagers with --no-pager or pipe to cat (e.g., git --no-pager log)
- NEVER use commands that open editors (vim, nano, etc.)
- NEVER use commands that wait for stdin without arguments
- NEVER use interactive flags like -i

IMPORTANT: Format your responses using Markdown for better readability:
- Use **bold** for important terms or commands
- Use `code` for file paths, commands, and technical terms
- Use bullet lists (- item) for multiple items
- Use numbered lists (1. item) for sequential steps
- Use code blocks (```language) for multi-line code or command examples
- Use headers (## Title) to organize longer responses
- Keep formatting minimal and terminal-friendly"#;

    let tools_str = match allowed_tools {
        Some(tools) => tools.join(","),
        None => DEFAULT_ALLOWED_TOOLS.join(","),
    };
    let mut args = vec![
        "-p".to_string(),
        "--dangerously-skip-permissions".to_string(),
        "--tools".to_string(),
        tools_str,
        "--verbose".to_string(),
        "--output-format".to_string(),
        "stream-json".to_string(),
    ];

    // Append system prompt based on parameter
    let effective_prompt = match system_prompt {
        None => Some(default_system_prompt),
        Some("") => None,
        Some(p) => Some(p),
    };
    if let Some(sp) = effective_prompt {
        args.push("--append-system-prompt".to_string());
        args.push(sp.to_string());
    }

    // Resume session if available
    if let Some(sid) = session_id {
        if !is_valid_session_id(sid) {
            debug_log("ERROR: Invalid session ID format");
            return Err("Invalid session ID format".to_string());
        }
        args.push("--resume".to_string());
        args.push(sid.to_string());
    }

    let claude_bin = get_claude_path()
        .ok_or_else(|| {
            debug_log("ERROR: Claude CLI not found");
            "Claude CLI not found. Is Claude CLI installed?".to_string()
        })?;

    debug_log("--- Spawning claude process ---");
    debug_log(&format!("Command: {}", claude_bin));
    debug_log(&format!("Args count: {}", args.len()));
    for (i, arg) in args.iter().enumerate() {
        if arg.len() > 100 {
            debug_log(&format!("  arg[{}]: {}... (truncated, {} chars total)", i, &arg[..100], arg.len()));
        } else {
            debug_log(&format!("  arg[{}]: {}", i, arg));
        }
    }
    debug_log("Env: CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000");
    debug_log("Env: BASH_DEFAULT_TIMEOUT_MS=86400000");
    debug_log("Env: BASH_MAX_TIMEOUT_MS=86400000");

    let spawn_start = std::time::Instant::now();
    let mut child = Command::new(claude_bin)
        .args(&args)
        .current_dir(working_dir)
        .env("CLAUDE_CODE_MAX_OUTPUT_TOKENS", "64000")
        .env("BASH_DEFAULT_TIMEOUT_MS", "86400000")  // 24 hours (no practical timeout)
        .env("BASH_MAX_TIMEOUT_MS", "86400000")      // 24 hours (no practical timeout)
        .env_remove("CLAUDECODE")  // Allow running from within Claude Code sessions
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            debug_log(&format!("ERROR: Failed to spawn after {:?}: {}", spawn_start.elapsed(), e));
            format!("Failed to start Claude: {}. Is Claude CLI installed?", e)
        })?;
    debug_log(&format!("Claude process spawned successfully in {:?}, pid={:?}", spawn_start.elapsed(), child.id()));

    // Store child PID in cancel token so the caller can kill it externally
    if let Some(ref token) = cancel_token {
        *token.child_pid.lock().unwrap() = Some(child.id());
    }

    // Write prompt to stdin
    if let Some(mut stdin) = child.stdin.take() {
        debug_log(&format!("Writing prompt to stdin ({} bytes)...", prompt.len()));
        let write_start = std::time::Instant::now();
        let write_result = stdin.write_all(prompt.as_bytes());
        debug_log(&format!("stdin.write_all completed in {:?}, result={:?}", write_start.elapsed(), write_result.is_ok()));
        // stdin is dropped here, which closes it - this signals end of input to claude
        debug_log("stdin handle dropped (closed)");
    } else {
        debug_log("WARNING: Could not get stdin handle!");
    }

    // Read stdout line by line for streaming
    debug_log("Taking stdout handle...");
    let stdout = child.stdout.take()
        .ok_or_else(|| {
            debug_log("ERROR: Failed to capture stdout");
            "Failed to capture stdout".to_string()
        })?;
    let reader = BufReader::new(stdout);
    debug_log("BufReader created, ready to read lines...");

    let mut last_session_id: Option<String> = None;
    let mut final_result: Option<String> = None;
    let mut stdout_error: Option<(String, String)> = None; // (message, raw_line)
    let mut line_count = 0;

    debug_log("Entering lines loop - will block until first line arrives...");
    for line in reader.lines() {
        // Check cancel token before processing each line
        if let Some(ref token) = cancel_token {
            if token.cancelled.load(std::sync::atomic::Ordering::Relaxed) {
                debug_log("Cancel detected — killing child process");
                let _ = child.kill();
                let _ = child.wait();
                return Ok(());
            }
        }

        debug_log(&format!("Line {} - read started", line_count + 1));
        let line = match line {
            Ok(l) => {
                debug_log(&format!("Line {} - read completed: {} chars", line_count + 1, l.len()));
                l
            },
            Err(e) => {
                debug_log(&format!("ERROR: Failed to read line: {}", e));
                let _ = sender.send(StreamMessage::Error {
                    message: format!("Failed to read output: {}", e),
                    stdout: String::new(), stderr: String::new(), exit_code: None,
                });
                break;
            }
        };

        line_count += 1;
        debug_log(&format!("Line {}: {} chars", line_count, line.len()));

        if line.trim().is_empty() {
            debug_log("  (empty line, skipping)");
            continue;
        }

        let line_preview: String = line.chars().take(200).collect();
        debug_log(&format!("  Raw line preview: {}", line_preview));

        if let Ok(json) = serde_json::from_str::<Value>(&line) {
            let msg_type = json.get("type").and_then(|v| v.as_str()).unwrap_or("unknown");
            let msg_subtype = json.get("subtype").and_then(|v| v.as_str()).unwrap_or("-");
            debug_log(&format!("  JSON parsed: type={}, subtype={}", msg_type, msg_subtype));

            // Log more details for specific message types
            if msg_type == "assistant" {
                if let Some(content) = json.get("message").and_then(|m| m.get("content")) {
                    debug_log(&format!("  Assistant content array: {}", content));
                }
            }

            debug_log("  Calling parse_stream_message...");
            if let Some(msg) = parse_stream_message(&json) {
                debug_log(&format!("  Parsed message variant: {:?}", std::mem::discriminant(&msg)));

                // Track session_id and final result for Done message
                match &msg {
                    StreamMessage::Init { session_id } => {
                        debug_log(&format!("  >>> Init: session_id={}", session_id));
                        last_session_id = Some(session_id.clone());
                    }
                    StreamMessage::Text { content } => {
                        let preview: String = content.chars().take(100).collect();
                        debug_log(&format!("  >>> Text: {} chars, preview: {:?}", content.len(), preview));
                    }
                    StreamMessage::ToolUse { name, input } => {
                        let input_preview: String = input.chars().take(200).collect();
                        debug_log(&format!("  >>> ToolUse: name={}, input_preview={:?}", name, input_preview));
                    }
                    StreamMessage::ToolResult { content, is_error } => {
                        let content_preview: String = content.chars().take(200).collect();
                        debug_log(&format!("  >>> ToolResult: is_error={}, content_len={}, preview={:?}",
                            is_error, content.len(), content_preview));
                    }
                    StreamMessage::Done { result, session_id } => {
                        let result_preview: String = result.chars().take(100).collect();
                        debug_log(&format!("  >>> Done: result_len={}, session_id={:?}, preview={:?}",
                            result.len(), session_id, result_preview));
                        final_result = Some(result.clone());
                        if session_id.is_some() {
                            last_session_id = session_id.clone();
                        }
                    }
                    StreamMessage::Error { ref message, .. } => {
                        debug_log(&format!("  >>> Error: {}", message));
                        stdout_error = Some((message.clone(), line.clone()));
                        continue; // don't send yet; will combine with stderr after process exits
                    }
                    StreamMessage::TaskNotification { task_id, status, summary } => {
                        debug_log(&format!("  >>> TaskNotification: task_id={}, status={}, summary={}", task_id, status, summary));
                    }
                }

                // Send message to channel
                debug_log("  Sending message to channel...");
                let send_result = sender.send(msg);
                if send_result.is_err() {
                    debug_log("  ERROR: Channel send failed (receiver dropped)");
                    break;
                }
                debug_log("  Message sent to channel successfully");
            } else {
                debug_log(&format!("  parse_stream_message returned None for type={}", msg_type));
            }
        } else {
            let invalid_preview: String = line.chars().take(200).collect();
            debug_log(&format!("  NOT valid JSON: {}", invalid_preview));
        }
    }

    debug_log("--- Exited lines loop ---");
    debug_log(&format!("Total lines read: {}", line_count));
    debug_log(&format!("final_result present: {}", final_result.is_some()));
    debug_log(&format!("last_session_id: {:?}", last_session_id));

    // Check cancel token after exiting the loop
    if let Some(ref token) = cancel_token {
        if token.cancelled.load(std::sync::atomic::Ordering::Relaxed) {
            debug_log("Cancel detected after loop — killing child process");
            let _ = child.kill();
            let _ = child.wait();
            return Ok(());
        }
    }

    // Wait for process to finish
    debug_log("Waiting for child process to finish (child.wait())...");
    let wait_start = std::time::Instant::now();
    let status = child.wait().map_err(|e| {
        debug_log(&format!("ERROR: Process wait failed after {:?}: {}", wait_start.elapsed(), e));
        format!("Process error: {}", e)
    })?;
    debug_log(&format!("Process finished in {:?}, status: {:?}, exit_code: {:?}",
        wait_start.elapsed(), status, status.code()));

    // Handle stdout error or non-zero exit code
    if stdout_error.is_some() || !status.success() {
        let stderr_msg = child.stderr.take()
            .and_then(|s| std::io::read_to_string(s).ok())
            .unwrap_or_default();

        let (message, stdout_raw) = if let Some((msg, raw)) = stdout_error {
            (msg, raw)
        } else {
            (format!("Process exited with code {:?}", status.code()), String::new())
        };

        debug_log(&format!("Sending error: message={}, exit_code={:?}", message, status.code()));
        let _ = sender.send(StreamMessage::Error {
            message,
            stdout: stdout_raw,
            stderr: stderr_msg,
            exit_code: status.code(),
        });
        return Ok(());
    }

    // If we didn't get a proper Done message, send one now
    if final_result.is_none() {
        debug_log("No Done message received, sending synthetic Done message...");
        let send_result = sender.send(StreamMessage::Done {
            result: String::new(),
            session_id: last_session_id.clone(),
        });
        debug_log(&format!("Synthetic Done message sent, result={:?}", send_result.is_ok()));
    } else {
        debug_log("Done message was already received, not sending synthetic one");
    }

    debug_log("========================================");
    debug_log("=== execute_command_streaming END (success) ===");
    debug_log("========================================");
    Ok(())
}

/// Parse a stream-json line into a StreamMessage
fn parse_stream_message(json: &Value) -> Option<StreamMessage> {
    let msg_type = json.get("type")?.as_str()?;

    match msg_type {
        "system" => {
            // {"type":"system","subtype":"init","session_id":"..."}
            // {"type":"system","subtype":"task_notification","task_id":"...","status":"...","summary":"..."}
            let subtype = json.get("subtype").and_then(|v| v.as_str())?;
            match subtype {
                "init" => {
                    let session_id = json.get("session_id")?.as_str()?.to_string();
                    Some(StreamMessage::Init { session_id })
                }
                "task_notification" => {
                    let task_id = json.get("task_id")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let status = json.get("status")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let summary = json.get("summary")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    Some(StreamMessage::TaskNotification { task_id, status, summary })
                }
                _ => None
            }
        }
        "assistant" => {
            // {"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
            // or {"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{...}}]}}
            let content = json.get("message")?.get("content")?.as_array()?;

            for item in content {
                let item_type = item.get("type")?.as_str()?;
                match item_type {
                    "text" => {
                        let text = item.get("text")?.as_str()?.to_string();
                        return Some(StreamMessage::Text { content: text });
                    }
                    "tool_use" => {
                        let name = item.get("name")?.as_str()?.to_string();
                        let input = item.get("input")
                            .map(|v| serde_json::to_string_pretty(v).unwrap_or_default())
                            .unwrap_or_default();
                        return Some(StreamMessage::ToolUse { name, input });
                    }
                    _ => {}
                }
            }
            None
        }
        "user" => {
            // {"type":"user","message":{"content":[{"type":"tool_result","content":"..." or [array]}]}}
            let content = json.get("message")?.get("content")?.as_array()?;

            for item in content {
                let item_type = item.get("type")?.as_str()?;
                if item_type == "tool_result" {
                    // content can be a string or an array of text items
                    let content_text = if let Some(s) = item.get("content").and_then(|v| v.as_str()) {
                        s.to_string()
                    } else if let Some(arr) = item.get("content").and_then(|v| v.as_array()) {
                        // Extract text from array: [{"type":"text","text":"..."},...]
                        arr.iter()
                            .filter_map(|v| v.get("text").and_then(|t| t.as_str()))
                            .collect::<Vec<_>>()
                            .join("\n")
                    } else {
                        String::new()
                    };
                    let is_error = item.get("is_error")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    return Some(StreamMessage::ToolResult { content: content_text, is_error });
                }
            }
            None
        }
        "result" => {
            // {"type":"result","subtype":"error_during_execution","is_error":true,"errors":["..."]}
            // {"type":"result","subtype":"success","result":"...","session_id":"..."}
            let is_error = json.get("is_error")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            if is_error {
                let errors_raw = json.get("errors");
                let result_raw = json.get("result").and_then(|v| v.as_str());
                // Try "errors" array first, then fall back to "result" field
                let error_msg = errors_raw
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str())
                            .collect::<Vec<_>>()
                            .join("; ")
                    })
                    .or_else(|| result_raw.map(|s| s.to_string()))
                    .unwrap_or_else(|| "Unknown error".to_string());
                return Some(StreamMessage::Error { message: error_msg, stdout: String::new(), stderr: String::new(), exit_code: None });
            }
            let result = json.get("result")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let session_id = json.get("session_id")
                .and_then(|v| v.as_str())
                .map(String::from);
            Some(StreamMessage::Done { result, session_id })
        }
        _ => None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========== is_valid_session_id tests ==========

    #[test]
    fn test_session_id_valid() {
        assert!(is_valid_session_id("abc123"));
        assert!(is_valid_session_id("session-1"));
        assert!(is_valid_session_id("session_2"));
        assert!(is_valid_session_id("ABC-XYZ_123"));
        assert!(is_valid_session_id("a")); // Single char
    }

    #[test]
    fn test_session_id_empty_rejected() {
        assert!(!is_valid_session_id(""));
    }

    #[test]
    fn test_session_id_too_long_rejected() {
        // 64 characters should be valid
        let max_len = "a".repeat(64);
        assert!(is_valid_session_id(&max_len));

        // 65 characters should be rejected
        let too_long = "a".repeat(65);
        assert!(!is_valid_session_id(&too_long));
    }

    #[test]
    fn test_session_id_special_chars_rejected() {
        assert!(!is_valid_session_id("session;rm -rf"));
        assert!(!is_valid_session_id("session'OR'1=1"));
        assert!(!is_valid_session_id("session`cmd`"));
        assert!(!is_valid_session_id("session$(cmd)"));
        assert!(!is_valid_session_id("session\nline2"));
        assert!(!is_valid_session_id("session\0null"));
        assert!(!is_valid_session_id("path/traversal"));
        assert!(!is_valid_session_id("session with space"));
        assert!(!is_valid_session_id("session.dot"));
        assert!(!is_valid_session_id("session@email"));
    }

    #[test]
    fn test_session_id_unicode_rejected() {
        assert!(!is_valid_session_id("세션아이디"));
        assert!(!is_valid_session_id("session_日本語"));
        assert!(!is_valid_session_id("émoji🎉"));
    }

    // ========== ClaudeResponse tests ==========

    #[test]
    fn test_claude_response_struct() {
        let response = ClaudeResponse {
            success: true,
            response: Some("Hello".to_string()),
            session_id: Some("abc123".to_string()),
            error: None,
        };

        assert!(response.success);
        assert_eq!(response.response, Some("Hello".to_string()));
        assert_eq!(response.session_id, Some("abc123".to_string()));
        assert!(response.error.is_none());
    }

    #[test]
    fn test_claude_response_error() {
        let response = ClaudeResponse {
            success: false,
            response: None,
            session_id: None,
            error: Some("Connection failed".to_string()),
        };

        assert!(!response.success);
        assert!(response.response.is_none());
        assert_eq!(response.error, Some("Connection failed".to_string()));
    }

    // ========== parse_claude_output tests ==========

    #[test]
    fn test_parse_claude_output_json_result() {
        let output = r#"{"session_id": "test-123", "result": "Hello, world!"}"#;
        let response = parse_claude_output(output);

        assert!(response.success);
        assert_eq!(response.response, Some("Hello, world!".to_string()));
        assert_eq!(response.session_id, Some("test-123".to_string()));
    }

    #[test]
    fn test_parse_claude_output_json_message() {
        let output = r#"{"session_id": "sess-456", "message": "This is a message"}"#;
        let response = parse_claude_output(output);

        assert!(response.success);
        assert_eq!(response.response, Some("This is a message".to_string()));
    }

    #[test]
    fn test_parse_claude_output_plain_text() {
        let output = "Just plain text response";
        let response = parse_claude_output(output);

        assert!(response.success);
        assert_eq!(response.response, Some("Just plain text response".to_string()));
    }

    #[test]
    fn test_parse_claude_output_multiline() {
        let output = r#"{"session_id": "s1"}
{"result": "Final result"}"#;
        let response = parse_claude_output(output);

        assert!(response.success);
        assert_eq!(response.session_id, Some("s1".to_string()));
        assert_eq!(response.response, Some("Final result".to_string()));
    }

    #[test]
    fn test_parse_claude_output_empty() {
        let output = "";
        let response = parse_claude_output(output);

        assert!(response.success);
        // Empty output should return empty response
        assert_eq!(response.response, Some("".to_string()));
    }

    // ========== is_ai_supported tests ==========

    #[test]
    fn test_is_ai_supported() {
        #[cfg(unix)]
        assert!(is_ai_supported());

        #[cfg(not(unix))]
        assert!(!is_ai_supported());
    }

    // ========== session_id_regex tests ==========

    #[test]
    fn test_session_id_regex_caching() {
        // Multiple calls should return the same cached regex
        let regex1 = session_id_regex();
        let regex2 = session_id_regex();

        // Both should point to the same static instance
        assert!(std::ptr::eq(regex1, regex2));
    }

    // ========== parse_stream_message tests ==========

    #[test]
    fn test_parse_stream_message_init() {
        let json: Value = serde_json::from_str(
            r#"{"type":"system","subtype":"init","session_id":"test-123"}"#
        ).unwrap();

        match parse_stream_message(&json) {
            Some(StreamMessage::Init { session_id }) => {
                assert_eq!(session_id, "test-123");
            }
            _ => panic!("Expected Init message"),
        }
    }

    #[test]
    fn test_parse_stream_message_text() {
        let json: Value = serde_json::from_str(
            r#"{"type":"assistant","message":{"content":[{"type":"text","text":"Hello world"}]}}"#
        ).unwrap();

        match parse_stream_message(&json) {
            Some(StreamMessage::Text { content }) => {
                assert_eq!(content, "Hello world");
            }
            _ => panic!("Expected Text message"),
        }
    }

    #[test]
    fn test_parse_stream_message_tool_use() {
        let json: Value = serde_json::from_str(
            r#"{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"ls"}}]}}"#
        ).unwrap();

        match parse_stream_message(&json) {
            Some(StreamMessage::ToolUse { name, input }) => {
                assert_eq!(name, "Bash");
                assert!(input.contains("ls"));
            }
            _ => panic!("Expected ToolUse message"),
        }
    }

    #[test]
    fn test_parse_stream_message_tool_result() {
        let json: Value = serde_json::from_str(
            r#"{"type":"user","message":{"content":[{"type":"tool_result","content":"file.txt","is_error":false}]}}"#
        ).unwrap();

        match parse_stream_message(&json) {
            Some(StreamMessage::ToolResult { content, is_error }) => {
                assert_eq!(content, "file.txt");
                assert!(!is_error);
            }
            _ => panic!("Expected ToolResult message"),
        }
    }

    #[test]
    fn test_parse_stream_message_tool_result_error() {
        let json: Value = serde_json::from_str(
            r#"{"type":"user","message":{"content":[{"type":"tool_result","content":"Error: not found","is_error":true}]}}"#
        ).unwrap();

        match parse_stream_message(&json) {
            Some(StreamMessage::ToolResult { content, is_error }) => {
                assert_eq!(content, "Error: not found");
                assert!(is_error);
            }
            _ => panic!("Expected ToolResult message with error"),
        }
    }

    #[test]
    fn test_parse_stream_message_result() {
        let json: Value = serde_json::from_str(
            r#"{"type":"result","subtype":"success","result":"Done!","session_id":"sess-456"}"#
        ).unwrap();

        match parse_stream_message(&json) {
            Some(StreamMessage::Done { result, session_id }) => {
                assert_eq!(result, "Done!");
                assert_eq!(session_id, Some("sess-456".to_string()));
            }
            _ => panic!("Expected Done message"),
        }
    }

    #[test]
    fn test_parse_stream_message_unknown_type() {
        let json: Value = serde_json::from_str(
            r#"{"type":"unknown","data":"something"}"#
        ).unwrap();

        let msg = parse_stream_message(&json);
        assert!(msg.is_none());
    }
}
