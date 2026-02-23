/// WebSocket bridge replacing VS Code's acquireVsCodeApi().
/// Sends messages to the cokacdir server and dispatches incoming messages
/// as native MessageEvents so the rest of the app works unchanged.

let ws: WebSocket | null = null;
let wsReady = false;
const sendQueue: unknown[] = [];

// Buffer incoming messages until the React listener is registered.
// useExtensionMessages sends { type: 'webviewReady' } once its listener is up.
let listenerReady = false;
const incomingBuffer: unknown[] = [];

function connect() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}/ws`);

  ws.onopen = () => {
    wsReady = true;
    for (const msg of sendQueue) {
      ws!.send(JSON.stringify(msg));
    }
    sendQueue.length = 0;
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (listenerReady) {
        window.dispatchEvent(new MessageEvent('message', { data }));
      } else {
        // Buffer until React event listener is registered
        incomingBuffer.push(data);
      }
    } catch {
      // ignore parse errors
    }
  };

  ws.onclose = () => {
    wsReady = false;
    setTimeout(connect, 3000);
  };
}

connect();

export const vscode = {
  postMessage(msg: unknown): void {
    // When React sends 'webviewReady', flush buffered incoming messages
    if (msg && typeof msg === 'object' && (msg as Record<string, unknown>).type === 'webviewReady') {
      listenerReady = true;
      for (const data of incomingBuffer) {
        window.dispatchEvent(new MessageEvent('message', { data }));
      }
      incomingBuffer.length = 0;
    }

    if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      sendQueue.push(msg);
    }
  },
};
