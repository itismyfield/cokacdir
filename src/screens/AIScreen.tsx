/**
 * AIScreen - AI 대화 전체 화면
 * aiexecode의 App.js 구조를 그대로 따름
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useStdout, Static, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { AIInput } from '../components/AIInput.js';
import { defaultTheme } from '../themes/classic-blue.js';
import { executeCommand, isClaudeAvailable } from '../services/claude.js';
import { features } from '../utils/platform.js';
import { renderMarkdown } from '../utils/markdownRenderer.js';

// HistoryItem을 export하여 App.tsx에서 사용 가능하게 함
export interface HistoryItem {
  type: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  id: number;
}

interface AIScreenProps {
  currentPath: string;
  onClose: () => void;
  // 세션 유지를 위한 props
  initialHistory?: HistoryItem[];
  initialSessionId?: string | null;
  onSessionUpdate?: (history: HistoryItem[], sessionId: string | null) => void;
}

// 타입별 설정 (aiexecode의 TYPE_CONFIG 참조)
const TYPE_CONFIG: Record<string, { icon: string; color: string; bold: boolean }> = {
  user: { icon: '> ', color: 'cyan', bold: true },
  assistant: { icon: '< ', color: 'yellow', bold: true },
  system: { icon: '* ', color: 'gray', bold: false },
  error: { icon: '✗ ', color: 'red', bold: true },
};

export default function AIScreen({
  currentPath,
  onClose,
  initialHistory = [],
  initialSessionId = null,
  onSessionUpdate
}: AIScreenProps) {
  const theme = defaultTheme;
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;

  // 인스턴스별 고유 ID 카운터 - 기존 히스토리의 최대 ID부터 시작
  const idCounterRef = useRef(
    initialHistory.length > 0
      ? Math.max(...initialHistory.map(h => h.id)) + 1
      : 0
  );
  const getNextId = () => idCounterRef.current++;

  // 히스토리를 initialHistory로 초기화하여 대화 내용 복원
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [claudeAvailable, setClaudeAvailable] = useState<boolean>(true);

  // 히스토리 아이템 렌더링 함수
  const renderHistoryItem = useCallback((item: HistoryItem): React.ReactElement => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;

    if (item.type === 'assistant') {
      return (
        <Box key={`history-${item.id}`} flexDirection="column" marginBottom={1}>
          <Box flexDirection="row">
            <Text color={config.color} bold={config.bold}>{config.icon}</Text>
            <Box flexDirection="column" flexGrow={1}>
              {renderMarkdown(item.content, { terminalWidth: terminalWidth - 4 })}
            </Box>
          </Box>
        </Box>
      );
    }

    return (
      <Box key={`history-${item.id}`} flexDirection="row" marginBottom={1}>
        <Text color={config.color} bold={config.bold}>{config.icon}</Text>
        <Text color={item.type === 'error' ? 'red' : undefined}>{item.content}</Text>
      </Box>
    );
  }, [terminalWidth]);

  // 세션 상태가 변경되면 부모 컴포넌트에 알림 (화면 전환 시 유지용)
  useEffect(() => {
    if (onSessionUpdate) {
      onSessionUpdate(history, sessionId);
    }
  }, [history, sessionId, onSessionUpdate]);

  // Check Claude availability on mount
  useEffect(() => {
    // 이미 히스토리가 있으면 (세션 복원) Claude 체크 건너뜀
    if (initialHistory.length > 0) {
      return;
    }

    if (!features.ai) {
      setClaudeAvailable(false);
      setHistory([{
        type: 'error',
        content: 'AI features are only available on Linux and macOS.',
        id: getNextId()
      }]);
      return;
    }

    isClaudeAvailable().then(available => {
      if (!available) {
        setClaudeAvailable(false);
        setHistory([{
          type: 'error',
          content: 'Claude CLI not found. Run "which claude" to verify installation.',
          id: getNextId()
        }]);
      }
    });
  }, []);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isProcessing || !claudeAvailable) return;

    const userInput = value.trim();

    // /clear 명령어: 세션 초기화 (재진입 효과)
    if (userInput.toLowerCase() === '/clear') {
      // 터미널 클리어
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
      // 상태 초기화
      setHistory([]);
      setSessionId(null);
      idCounterRef.current = 0;
      return;
    }

    setIsProcessing(true);

    // 사용자 메시지 추가
    setHistory(prev => [...prev, { type: 'user', content: userInput, id: getNextId() }]);

    try {
      const contextPrompt = `You are an AI assistant helping with file management in a Norton Commander-style file manager.
Current working directory: ${currentPath}

User request: ${userInput}

If the user asks to perform file operations, provide clear instructions.
Keep responses concise and terminal-friendly.`;

      const response = await executeCommand(contextPrompt, sessionId, currentPath);

      if (response.success) {
        if (response.sessionId) {
          setSessionId(response.sessionId);
        }
        setHistory(prev => [...prev, {
          type: 'assistant',
          content: response.response || 'Command executed.',
          id: getNextId()
        }]);
      } else {
        setHistory(prev => [...prev, {
          type: 'error',
          content: response.error || 'Unknown error',
          id: getNextId()
        }]);
      }
    } catch (err: unknown) {
      setHistory(prev => [...prev, {
        type: 'error',
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        id: getNextId()
      }]);
    }

    setIsProcessing(false);
  };

  const handleExit = useCallback(() => {
    if (isProcessing) {
      setIsProcessing(false);
      setHistory(prev => [...prev, { type: 'system', content: 'Cancelled.', id: getNextId() }]);
    } else {
      onClose();
    }
  }, [isProcessing, onClose, stdout]);

  // Processing 중 ESC 키 처리
  useInput((input, key) => {
    if (key.escape && isProcessing) {
      handleExit();
    }
  });

  // aiexecode의 App.js 렌더링 구조를 그대로 따름
  return (
    <Box flexDirection="column" padding={0} width="100%">
      {/* History area (grows to fill available space, shrinks when needed) */}
      <Box
        flexDirection="column"
        flexGrow={1}
        flexShrink={1}
        overflow="hidden"
        width="100%"
      >
        {/* Static 영역 - history를 직접 렌더링 */}
        <Static items={history}>
          {(item: HistoryItem) => renderHistoryItem(item)}
        </Static>
      </Box>

      {/* Fixed input/control area (does not shrink, stays at bottom) */}
      <Box flexDirection="column" flexShrink={0} marginTop={0}>
        {/* Session info */}
        <Box marginBottom={0}>
          <Text color={theme.colors.borderActive} bold>
            AI Command {sessionId ? `(Session: ${sessionId.slice(0, 8)}...)` : '(New Session)'}
          </Text>
          <Text color={theme.colors.textDim}>  Path: {currentPath}</Text>
        </Box>

        {/* Processing indicator or Input */}
        {isProcessing ? (
          <Box
            borderStyle="round"
            borderColor="#47c9a0"
            paddingX={1}
            minHeight={3}
          >
            <Text color="yellow">
              <Spinner type="dots" />
            </Text>
            <Text color="gray"> Processing... (Esc to cancel)</Text>
          </Box>
        ) : (
          claudeAvailable && (
            <AIInput
              onSubmit={handleSubmit}
              onExit={handleExit}
              focus={true}
              isProcessing={isProcessing}
              terminalWidth={terminalWidth}
            />
          )
        )}

        {/* Help */}
        <Box>
          <Text color="gray">
            [Enter] Send  [Shift+Enter] Newline  [Esc] {isProcessing ? 'Cancel' : 'Close'}  [/clear] Reset session
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
