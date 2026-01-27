#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './App.js';
import AIScreen, { HistoryItem } from './screens/AIScreen.js';
import { setInkInstance } from './utils/inkInstance.js';

// AI 세션 상태 (전역)
let aiSessionId: string | null = null;
let aiHistory: HistoryItem[] = [];

// 현재 Ink 인스턴스
let currentInstance: ReturnType<typeof render> | null = null;

// DualPanel 렌더링
function renderDualPanel() {
  // 터미널 클리어
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');

  currentInstance = render(
    <App onEnterAI={renderAIScreen} />,
    { exitOnCtrlC: true }
  );

  setInkInstance({
    clear: currentInstance.clear,
    unmount: currentInstance.unmount,
    rerender: currentInstance.rerender,
  });

  return currentInstance;
}

// AI 화면 렌더링
function renderAIScreen(currentPath: string) {
  // 현재 Ink 인스턴스 종료
  if (currentInstance) {
    currentInstance.unmount();
  }

  // 터미널 클리어
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');

  // AI 화면용 새 Ink 인스턴스
  currentInstance = render(
    <AIScreen
      currentPath={currentPath}
      onClose={() => {
        // AI 인스턴스 종료
        if (currentInstance) {
          currentInstance.unmount();
        }
        // DualPanel로 복귀
        renderDualPanel();
      }}
      initialHistory={aiHistory}
      initialSessionId={aiSessionId}
      onSessionUpdate={(history, sessionId) => {
        aiHistory = history;
        aiSessionId = sessionId;
      }}
    />,
    { exitOnCtrlC: true }
  );
}

// 앱 시작
const instance = renderDualPanel();
instance.waitUntilExit().catch(() => {
  process.exit(1);
});
