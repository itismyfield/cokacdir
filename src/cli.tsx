#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';
import App from './App.js';
import AIScreen, { HistoryItem } from './screens/AIScreen.js';
import { setInkInstance } from './utils/inkInstance.js';
import type { PanelSide } from './types/index.js';

// AI 세션 상태 (전역)
let aiSessionId: string | null = null;
let aiHistory: HistoryItem[] = [];

// 패널 상태 (전역) - AI에서 복귀 시 복원용
let savedLeftPath: string = process.cwd();
let savedRightPath: string = os.homedir();
let savedActivePanel: PanelSide = 'left';
let savedLeftIndex: number = 0;
let savedRightIndex: number = 0;

// 현재 Ink 인스턴스
let currentInstance: ReturnType<typeof render> | null = null;

// 경로 유효성 검사 및 유효한 경로 반환
// 유효하지 않으면 상위 경로를 재귀적으로 확인
function getValidPath(targetPath: string, fallback: string): string {
  let currentPath = targetPath;

  while (currentPath) {
    try {
      const stat = fs.statSync(currentPath);
      if (stat.isDirectory()) {
        // 유효한 디렉토리 찾음
        return currentPath;
      }
    } catch {
      // 경로가 존재하지 않거나 접근 불가
    }

    // 상위 경로로 이동
    const parentPath = path.dirname(currentPath);

    // 루트에 도달한 경우 (더 이상 상위가 없음)
    if (parentPath === currentPath) {
      break;
    }

    currentPath = parentPath;
  }

  // 유효한 경로를 찾지 못하면 fallback 반환
  return fallback;
}

// 패널 상태 저장 핸들러
interface PanelState {
  leftPath: string;
  rightPath: string;
  activePanel: PanelSide;
  leftIndex: number;
  rightIndex: number;
}

function handleSavePanelState(state: PanelState) {
  savedLeftPath = state.leftPath;
  savedRightPath = state.rightPath;
  savedActivePanel = state.activePanel;
  savedLeftIndex = state.leftIndex;
  savedRightIndex = state.rightIndex;
}

// DualPanel 렌더링
function renderDualPanel() {
  // 터미널 클리어
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');

  // 저장된 경로 유효성 검사 및 복원
  const validLeftPath = getValidPath(savedLeftPath, process.cwd());
  const validRightPath = getValidPath(savedRightPath, os.homedir());

  // 경로가 변경되었으면 인덱스 초기화
  const leftIndex = validLeftPath === savedLeftPath ? savedLeftIndex : 0;
  const rightIndex = validRightPath === savedRightPath ? savedRightIndex : 0;

  currentInstance = render(
    <App
      onEnterAI={renderAIScreen}
      initialLeftPath={validLeftPath}
      initialRightPath={validRightPath}
      initialActivePanel={savedActivePanel}
      initialLeftIndex={leftIndex}
      initialRightIndex={rightIndex}
      onSavePanelState={handleSavePanelState}
    />,
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
