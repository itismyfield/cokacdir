/// WebSocket bridge replacing VS Code's acquireVsCodeApi().
/// Sends messages to the cokacdir server and dispatches incoming messages
/// as native MessageEvents so the rest of the app works unchanged.

let ws: WebSocket | null = null;
let ready = false;
const queue: unknown[] = [];

function connect() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}/ws`);

  ws.onopen = () => {
    ready = true;
    // Flush queued messages
    for (const msg of queue) {
      ws!.send(JSON.stringify(msg));
    }
    queue.length = 0;
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      // Dispatch as a MessageEvent so useExtensionMessages.ts picks it up
      window.dispatchEvent(new MessageEvent('message', { data: { data } }));
    } catch {
      // ignore parse errors
    }
  };

  ws.onclose = () => {
    ready = false;
    // Auto-reconnect after 3 seconds
    setTimeout(connect, 3000);
  };
}

connect();

export const vscode = {
  postMessage(msg: unknown): void {
    if (ready && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      queue.push(msg);
    }
  },
};
