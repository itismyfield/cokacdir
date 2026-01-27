import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AIScreen - AI 대화 전체 화면
 * aiexecode의 App.js 구조를 그대로 따름
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useStdout, Static, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { AIInput } from '../components/AIInput.js';
import { defaultTheme } from '../themes/classic-blue.js';
import { executeCommand, isClaudeAvailable } from '../services/claude.js';
import { features } from '../utils/platform.js';
import { renderMarkdown } from '../utils/markdownRenderer.js';
// 타입별 설정 (aiexecode의 TYPE_CONFIG 참조)
const TYPE_CONFIG = {
    user: { icon: '> ', color: 'cyan', bold: true },
    assistant: { icon: '< ', color: 'yellow', bold: true },
    system: { icon: '* ', color: 'gray', bold: false },
    error: { icon: '✗ ', color: 'red', bold: true },
};
export default function AIScreen({ currentPath, onClose, initialHistory = [], initialSessionId = null, onSessionUpdate }) {
    const theme = defaultTheme;
    const { stdout } = useStdout();
    const terminalWidth = stdout?.columns || 80;
    // 인스턴스별 고유 ID 카운터 - 기존 히스토리의 최대 ID부터 시작
    const idCounterRef = useRef(initialHistory.length > 0
        ? Math.max(...initialHistory.map(h => h.id)) + 1
        : 0);
    const getNextId = () => idCounterRef.current++;
    // 히스토리를 initialHistory로 초기화하여 대화 내용 복원
    const [history, setHistory] = useState(initialHistory);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState(initialSessionId);
    const [claudeAvailable, setClaudeAvailable] = useState(true);
    // 히스토리 아이템 렌더링 함수
    const renderHistoryItem = useCallback((item) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
        if (item.type === 'assistant') {
            return (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: config.color, bold: config.bold, children: config.icon }), _jsx(Box, { flexDirection: "column", flexGrow: 1, children: renderMarkdown(item.content, { terminalWidth: terminalWidth - 4 }) })] }) }, `history-${item.id}`));
        }
        return (_jsxs(Box, { flexDirection: "row", marginBottom: 1, children: [_jsx(Text, { color: config.color, bold: config.bold, children: config.icon }), _jsx(Text, { color: item.type === 'error' ? 'red' : undefined, children: item.content })] }, `history-${item.id}`));
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
    const handleSubmit = async (value) => {
        if (!value.trim() || isProcessing || !claudeAvailable)
            return;
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
            }
            else {
                setHistory(prev => [...prev, {
                        type: 'error',
                        content: response.error || 'Unknown error',
                        id: getNextId()
                    }]);
            }
        }
        catch (err) {
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
        }
        else {
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
    return (_jsxs(Box, { flexDirection: "column", padding: 0, width: "100%", children: [_jsx(Box, { flexDirection: "column", flexGrow: 1, flexShrink: 1, overflow: "hidden", width: "100%", children: _jsx(Static, { items: history, children: (item) => renderHistoryItem(item) }) }), _jsxs(Box, { flexDirection: "column", flexShrink: 0, marginTop: 0, children: [_jsxs(Box, { marginBottom: 0, children: [_jsxs(Text, { color: theme.colors.borderActive, bold: true, children: ["AI Command ", sessionId ? `(Session: ${sessionId.slice(0, 8)}...)` : '(New Session)'] }), _jsxs(Text, { color: theme.colors.textDim, children: ["  Path: ", currentPath] })] }), isProcessing ? (_jsxs(Box, { borderStyle: "round", borderColor: "#47c9a0", paddingX: 1, minHeight: 3, children: [_jsx(Text, { color: "yellow", children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { color: "gray", children: " Processing... (Esc to cancel)" })] })) : (claudeAvailable && (_jsx(AIInput, { onSubmit: handleSubmit, onExit: handleExit, focus: true, isProcessing: isProcessing, terminalWidth: terminalWidth }))), _jsx(Box, { children: _jsxs(Text, { color: "gray", children: ["[Enter] Send  [Shift+Enter] Newline  [Esc] ", isProcessing ? 'Cancel' : 'Close', "  [/clear] Reset session"] }) })] })] }));
}
//# sourceMappingURL=AIScreen.js.map