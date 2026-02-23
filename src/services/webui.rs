use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, OnceLock};
use std::fs;

use axum::{
    Router,
    extract::{State, WebSocketUpgrade, ws},
    response::{IntoResponse, Response},
    routing::get,
};
use tower_http::services::ServeDir;
use tokio::sync::{Mutex, broadcast};

use crate::ui::ai_screen;

// ─── Global bridge: discord.rs → webui.rs real-time status updates ──────────

static WEBUI_TX: OnceLock<broadcast::Sender<String>> = OnceLock::new();
static WEBUI_AGENTS: OnceLock<Arc<Mutex<HashMap<String, AgentSnapshot>>>> = OnceLock::new();

/// Push a real-time status update to all connected WebSocket clients.
/// Called from discord.rs when agent status changes.
pub fn push_status_by_session(session_id: &str, status: &str) {
    let (Some(tx), Some(agents)) = (WEBUI_TX.get(), WEBUI_AGENTS.get()) else {
        return;
    };
    // Look up the numeric agent ID from session_id
    let agent_id = {
        let Ok(map) = agents.try_lock() else { return };
        match map.get(session_id) {
            Some(agent) => agent.id,
            None => return,
        }
    };
    let msg = serde_json::json!({
        "type": "agentStatus",
        "id": agent_id,
        "status": status,
    });
    if let Ok(json) = serde_json::to_string(&msg) {
        let _ = tx.send(json);
    }
}

/// Push statusline info (model, cost, tokens) to all WebSocket clients.
pub fn push_statusline_by_session(
    session_id: &str,
    model: Option<&str>,
    cost_usd: Option<f64>,
    total_cost_usd: Option<f64>,
    duration_ms: Option<u64>,
    num_turns: Option<u32>,
    input_tokens: Option<u64>,
    output_tokens: Option<u64>,
) {
    let (Some(tx), Some(agents)) = (WEBUI_TX.get(), WEBUI_AGENTS.get()) else {
        return;
    };
    let agent_id = {
        let Ok(map) = agents.try_lock() else { return };
        match map.get(session_id) {
            Some(agent) => agent.id,
            None => return,
        }
    };
    let msg = serde_json::json!({
        "type": "agentStatusline",
        "id": agent_id,
        "model": model,
        "costUsd": cost_usd,
        "totalCostUsd": total_cost_usd,
        "durationMs": duration_ms,
        "numTurns": num_turns,
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
    });
    if let Ok(json) = serde_json::to_string(&msg) {
        let _ = tx.send(json);
    }
}

// ─── Types ──────────────────────────────────────────────────────────────────

/// Lightweight snapshot of a Claude Code session for the web UI
#[derive(Clone, serde::Serialize)]
struct AgentSnapshot {
    id: usize,
    session_id: String,
    current_path: String,
    status: String, // "active" or "waiting"
    last_tool: Option<String>,
    last_activity: String,
    channel_name: Option<String>,
    category_name: Option<String>,
}

/// Messages sent to all connected WebSocket clients
#[derive(Clone, serde::Serialize)]
#[serde(tag = "type")]
enum WsOutMessage {
    #[serde(rename = "existingAgents")]
    ExistingAgents { agents: Vec<AgentSnapshot> },
    #[serde(rename = "agentStatus")]
    AgentStatus { id: usize, status: String },
    #[serde(rename = "agentToolStart")]
    AgentToolStart { id: usize, tool_id: String, status: String },
    #[serde(rename = "agentToolDone")]
    AgentToolDone { id: usize, tool_id: String },
    #[serde(rename = "agentToolsClear")]
    AgentToolsClear { id: usize },
    #[serde(rename = "agentCreated")]
    AgentCreated { id: usize },
    #[serde(rename = "agentClosed")]
    AgentClosed { id: usize },
    #[serde(rename = "layoutLoaded")]
    LayoutLoaded { layout: serde_json::Value },
    #[serde(rename = "settingsLoaded")]
    SettingsLoaded { #[serde(rename = "soundEnabled")] sound_enabled: bool },
}

struct AppState {
    tx: broadcast::Sender<String>,
    agents: Arc<Mutex<HashMap<String, AgentSnapshot>>>,
    sessions_dir: PathBuf,
    webui_dir: PathBuf,
}

// ─── Entry point ────────────────────────────────────────────────────────────

/// Start the web UI server
pub async fn run_webui(port: u16) {
    let sessions_dir = match ai_screen::ai_sessions_dir() {
        Some(d) => d,
        None => {
            eprintln!("Error: cannot determine ai_sessions directory");
            return;
        }
    };

    // Determine webui-dist path relative to the binary
    let webui_dir = find_webui_dir();
    if !webui_dir.join("index.html").exists() {
        eprintln!("  ⚠ Web UI files not found at: {}", webui_dir.display());
        eprintln!("  ⚠ Build webui-src first: cd webui-src && npm run build");
        return;
    }

    let (tx, _) = broadcast::channel::<String>(256);

    // Register the broadcast sender globally so discord.rs can push real-time updates
    let _ = WEBUI_TX.set(tx.clone());

    let agents_map = Arc::new(Mutex::new(HashMap::new()));
    let _ = WEBUI_AGENTS.set(agents_map.clone());

    let state = Arc::new(AppState {
        tx: tx.clone(),
        agents: agents_map,
        sessions_dir: sessions_dir.clone(),
        webui_dir: webui_dir.clone(),
    });

    // Initial session scan
    scan_sessions(&state).await;

    // Spawn file watcher
    let state_clone = state.clone();
    tokio::spawn(async move {
        watch_sessions(state_clone).await;
    });

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .fallback_service(ServeDir::new(&webui_dir))
        .with_state(state);

    let addr = format!("0.0.0.0:{port}");
    println!("  ▸ Web UI : http://localhost:{port}");
    println!("  ▸ Assets : {}", webui_dir.display());
    println!();

    let listener = tokio::net::TcpListener::bind(&addr).await
        .expect("Failed to bind web UI address");
    axum::serve(listener, app).await.expect("Web UI server failed");
}

/// Find the webui-dist directory
fn find_webui_dir() -> PathBuf {
    // 1. Check next to the binary
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            let candidate = parent.join("webui-dist");
            if candidate.exists() {
                return candidate;
            }
            // Also check parent of parent (for development: target/release/../webui-dist)
            if let Some(grandparent) = parent.parent() {
                let candidate = grandparent.join("webui-dist");
                if candidate.exists() {
                    return candidate;
                }
                // target/release/../../webui-dist
                if let Some(ggparent) = grandparent.parent() {
                    let candidate = ggparent.join("webui-dist");
                    if candidate.exists() {
                        return candidate;
                    }
                }
            }
        }
    }
    // 2. Check ~/.cokacdir/webui-dist
    if let Some(home) = dirs::home_dir() {
        let candidate = home.join(".cokacdir").join("webui-dist");
        if candidate.exists() {
            return candidate;
        }
    }
    // 3. Fallback: current dir
    PathBuf::from("webui-dist")
}

// ─── Session scanning ───────────────────────────────────────────────────────

/// Scan all session files and update state
async fn scan_sessions(state: &Arc<AppState>) {
    let dir = &state.sessions_dir;
    if !dir.exists() {
        return;
    }

    let Ok(entries) = fs::read_dir(dir) else { return };

    let mut agents = state.agents.lock().await;
    let mut seen = std::collections::HashSet::new();

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().map(|e| e == "json").unwrap_or(false) {
            if let Some(snapshot) = load_session_file(&path, agents.len()) {
                seen.insert(snapshot.session_id.clone());
                if !agents.contains_key(&snapshot.session_id) {
                    agents.insert(snapshot.session_id.clone(), snapshot);
                }
            }
        }
    }

    // Remove sessions that no longer have files
    agents.retain(|sid, _| seen.contains(sid));
}

/// Load a single session file into an AgentSnapshot
fn load_session_file(path: &Path, next_id: usize) -> Option<AgentSnapshot> {
    let content = fs::read_to_string(path).ok()?;
    let data: ai_screen::SessionData = serde_json::from_str(&content).ok()?;

    if data.history.is_empty() {
        return None;
    }

    // Determine status from last history item
    let last = data.history.last()?;
    let status = match last.item_type {
        ai_screen::HistoryType::User => "active",
        ai_screen::HistoryType::Assistant => "waiting",
        _ => "waiting",
    };

    // Extract last tool use if present
    let last_tool = data.history.iter().rev()
        .find(|h| matches!(h.item_type, ai_screen::HistoryType::ToolUse))
        .map(|h| h.content.clone());

    Some(AgentSnapshot {
        id: next_id,
        session_id: data.session_id,
        current_path: data.current_path,
        status: status.to_string(),
        last_tool,
        last_activity: data.created_at,
        channel_name: data.discord_channel_name,
        category_name: data.discord_category_name,
    })
}

// ─── File watcher ───────────────────────────────────────────────────────────

/// Watch the sessions directory for changes and broadcast updates.
async fn watch_sessions(state: Arc<AppState>) {
    let sessions_dir = state.sessions_dir.clone();

    if !sessions_dir.exists() {
        let _ = fs::create_dir_all(&sessions_dir);
    }

    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

        let old_agents: HashMap<String, AgentSnapshot> = {
            state.agents.lock().await.clone()
        };

        scan_sessions(&state).await;

        let new_agents = state.agents.lock().await;

        // Skip if nothing changed
        if old_agents.len() == new_agents.len() {
            let mut changed = false;
            for (sid, new_agent) in new_agents.iter() {
                match old_agents.get(sid) {
                    Some(old_agent) if old_agent.status == new_agent.status
                        && old_agent.last_tool == new_agent.last_tool => {}
                    _ => { changed = true; break; }
                }
            }
            if !changed { continue; }
        }

        for (sid, agent) in new_agents.iter() {
            if !old_agents.contains_key(sid) {
                broadcast_msg(&state.tx, &WsOutMessage::AgentCreated { id: agent.id });
            }
        }

        for (sid, agent) in &old_agents {
            if !new_agents.contains_key(sid) {
                broadcast_msg(&state.tx, &WsOutMessage::AgentClosed { id: agent.id });
            }
        }

        // Note: we do NOT broadcast file-based AgentStatus here,
        // because it would overwrite real-time status pushed by discord.rs.
        // Individual AgentCreated/AgentClosed messages above are sufficient
        // for tracking agent membership changes.
    }
}

fn broadcast_msg(tx: &broadcast::Sender<String>, msg: &WsOutMessage) {
    if let Ok(json) = serde_json::to_string(msg) {
        let _ = tx.send(json);
    }
}

// ─── HTTP handlers ──────────────────────────────────────────────────────────

/// WebSocket upgrade handler
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_ws(socket, state))
}

/// Handle a WebSocket connection
async fn handle_ws(mut socket: ws::WebSocket, state: Arc<AppState>) {
    // Send settings first
    let settings_msg = WsOutMessage::SettingsLoaded { sound_enabled: false };
    if let Ok(json) = serde_json::to_string(&settings_msg) {
        let _ = socket.send(ws::Message::Text(json.into())).await;
    }

    // Send existingAgents BEFORE layoutLoaded — the frontend buffers agents
    // in pendingAgents and only flushes them when layoutLoaded arrives.
    let agents: Vec<AgentSnapshot> = {
        state.agents.lock().await.values().cloned().collect()
    };
    let agent_ids: Vec<usize> = agents.iter().map(|a| a.id).collect();

    // Build agentMeta with category info for each agent
    let mut agent_meta = serde_json::Map::new();
    for agent in &agents {
        let mut meta = serde_json::Map::new();
        if let Some(ref name) = agent.channel_name {
            meta.insert("channelName".to_string(), serde_json::Value::String(name.clone()));
        }
        if let Some(ref cat) = agent.category_name {
            meta.insert("categoryName".to_string(), serde_json::Value::String(cat.clone()));
        }
        agent_meta.insert(agent.id.to_string(), serde_json::Value::Object(meta));
    }

    let init_json = serde_json::json!({
        "type": "existingAgents",
        "agents": agent_ids,
        "agentMeta": agent_meta,
    });
    if let Ok(json) = serde_json::to_string(&init_json) {
        let _ = socket.send(ws::Message::Text(json.into())).await;
    }

    // Send layoutLoaded last — this triggers pending agent flush + layoutReady
    let layout_path = state.webui_dir.join("assets").join("default-layout.json");
    if let Ok(content) = fs::read_to_string(&layout_path) {
        if let Ok(layout) = serde_json::from_str::<serde_json::Value>(&content) {
            let msg = WsOutMessage::LayoutLoaded { layout };
            if let Ok(json) = serde_json::to_string(&msg) {
                let _ = socket.send(ws::Message::Text(json.into())).await;
            }
        }
    }

    // Send initial status for each agent
    for agent in &agents {
        let status_msg = WsOutMessage::AgentStatus {
            id: agent.id,
            status: agent.status.clone(),
        };
        if let Ok(json) = serde_json::to_string(&status_msg) {
            let _ = socket.send(ws::Message::Text(json.into())).await;
        }
    }

    // Subscribe to broadcast
    let mut rx = state.tx.subscribe();

    loop {
        tokio::select! {
            msg = rx.recv() => {
                match msg {
                    Ok(text) => {
                        if socket.send(ws::Message::Text(text.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(_) => break,
                }
            }
            msg = socket.recv() => {
                match msg {
                    Some(Ok(ws::Message::Text(text))) => {
                        // Handle client messages
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
                            if let Some(msg_type) = val.get("type").and_then(|v| v.as_str()) {
                                match msg_type {
                                    "webviewReady" => {
                                        // Re-send agents (already sent above, but handle reconnect)
                                    }
                                    _ => {} // Ignore other client messages
                                }
                            }
                        }
                    }
                    Some(Ok(ws::Message::Close(_))) | None => break,
                    _ => {}
                }
            }
        }
    }
}
