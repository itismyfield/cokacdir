use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::fs;

use axum::{
    Router,
    extract::{State, WebSocketUpgrade, ws},
    response::{Html, IntoResponse, Response},
    routing::get,
};
use tokio::sync::{Mutex, broadcast};

use crate::ui::ai_screen;

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
}

struct AppState {
    tx: broadcast::Sender<String>,
    agents: Mutex<HashMap<String, AgentSnapshot>>,
    sessions_dir: PathBuf,
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

    let (tx, _) = broadcast::channel::<String>(256);

    let state = Arc::new(AppState {
        tx: tx.clone(),
        agents: Mutex::new(HashMap::new()),
        sessions_dir: sessions_dir.clone(),
    });

    // Initial session scan
    scan_sessions(&state).await;

    // Spawn file watcher
    let state_clone = state.clone();
    tokio::spawn(async move {
        watch_sessions(state_clone).await;
    });

    let app = Router::new()
        .route("/", get(serve_index))
        .route("/ws", get(ws_handler))
        .with_state(state);

    let addr = format!("0.0.0.0:{port}");
    println!("  ▸ Web UI : http://localhost:{port}");
    println!();

    let listener = tokio::net::TcpListener::bind(&addr).await
        .expect("Failed to bind web UI address");
    axum::serve(listener, app).await.expect("Web UI server failed");
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
    })
}

// ─── File watcher ───────────────────────────────────────────────────────────

/// Watch the sessions directory for changes and broadcast updates.
/// Uses polling fallback instead of native fs events to avoid Tokio runtime issues.
async fn watch_sessions(state: Arc<AppState>) {
    let sessions_dir = state.sessions_dir.clone();

    // Ensure directory exists
    if !sessions_dir.exists() {
        let _ = fs::create_dir_all(&sessions_dir);
    }

    // Poll-based watcher: check for changes every 2 seconds
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

        // Detect changes and broadcast
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

        for (sid, new_agent) in new_agents.iter() {
            if let Some(old_agent) = old_agents.get(sid) {
                if old_agent.status != new_agent.status {
                    broadcast_msg(&state.tx, &WsOutMessage::AgentStatus {
                        id: new_agent.id,
                        status: new_agent.status.clone(),
                    });
                }
            }
        }

        // Send full state update
        let snapshots: Vec<AgentSnapshot> = new_agents.values().cloned().collect();
        broadcast_msg(&state.tx, &WsOutMessage::ExistingAgents { agents: snapshots });
    }
}

fn broadcast_msg(tx: &broadcast::Sender<String>, msg: &WsOutMessage) {
    if let Ok(json) = serde_json::to_string(msg) {
        let _ = tx.send(json);
    }
}

// ─── HTTP handlers ──────────────────────────────────────────────────────────

/// Serve the embedded web UI index page
async fn serve_index() -> Html<&'static str> {
    Html(include_str!("../../webui-dist/index.html"))
}

/// WebSocket upgrade handler
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_ws(socket, state))
}

/// Handle a WebSocket connection
async fn handle_ws(mut socket: ws::WebSocket, state: Arc<AppState>) {
    // Send current state
    let agents: Vec<AgentSnapshot> = {
        state.agents.lock().await.values().cloned().collect()
    };
    let init_msg = WsOutMessage::ExistingAgents { agents };
    if let Ok(json) = serde_json::to_string(&init_msg) {
        let _ = socket.send(ws::Message::Text(json.into())).await;
    }

    // Subscribe to broadcast
    let mut rx = state.tx.subscribe();

    // Forward broadcast messages to this client
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
            // Handle incoming messages from client (e.g. focusAgent)
            msg = socket.recv() => {
                match msg {
                    Some(Ok(ws::Message::Close(_))) | None => break,
                    _ => {} // Ignore other messages for now
                }
            }
        }
    }
}
