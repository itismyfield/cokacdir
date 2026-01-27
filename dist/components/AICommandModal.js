import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AICommandModal - AI 대화 화면
 * aiexecode의 App.js 구조를 그대로 따름
 */
import { useState, useEffect } from 'react';
import { Box, Text, useInput, Static } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
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
// Counter for unique IDs
let historyIdCounter = 0;
export default function AICommandModal({ currentPath, terminalWidth, terminalHeight, onClose, onExecuteFileOp }) {
    const theme = defaultTheme;
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([
        { type: 'system', content: `AI Command Ready. Working directory: ${currentPath}`, id: historyIdCounter++ },
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [claudeAvailable, setClaudeAvailable] = useState(true);
    // Check Claude availability on mount
    useEffect(() => {
        if (!features.ai) {
            setClaudeAvailable(false);
            setHistory([{
                    type: 'error',
                    content: 'AI features are only available on Linux and macOS.',
                    id: historyIdCounter++
                }]);
            return;
        }
        isClaudeAvailable().then(available => {
            if (!available) {
                setClaudeAvailable(false);
                setHistory([{
                        type: 'error',
                        content: 'Claude CLI not found. Run "which claude" to verify installation.',
                        id: historyIdCounter++
                    }]);
            }
        });
    }, []);
    useInput((char, key) => {
        if (key.escape) {
            if (isProcessing) {
                setIsProcessing(false);
                setHistory(prev => [...prev, { type: 'system', content: 'Cancelled.', id: historyIdCounter++ }]);
            }
            else {
                onClose();
            }
        }
    });
    const handleSubmit = async (value) => {
        if (!value.trim() || isProcessing || !claudeAvailable)
            return;
        const userInput = value.trim();
        setInput('');
        setIsProcessing(true);
        setHistory(prev => [...prev, { type: 'user', content: userInput, id: historyIdCounter++ }]);
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
                        id: historyIdCounter++
                    }]);
            }
            else {
                setHistory(prev => [...prev, {
                        type: 'error',
                        content: response.error || 'Unknown error',
                        id: historyIdCounter++
                    }]);
            }
        }
        catch (err) {
            setHistory(prev => [...prev, {
                    type: 'error',
                    content: `Error: ${err instanceof Error ? err.message : String(err)}`,
                    id: historyIdCounter++
                }]);
        }
        setIsProcessing(false);
    };
    // 히스토리 아이템 렌더링 함수
    const renderHistoryItem = (item) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
        if (item.type === 'assistant') {
            return (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: config.color, bold: config.bold, children: config.icon }), _jsx(Box, { flexDirection: "column", flexGrow: 1, children: renderMarkdown(item.content, { terminalWidth: terminalWidth - 4 }) })] }) }, `history-${item.id}`));
        }
        return (_jsxs(Box, { flexDirection: "row", marginBottom: 1, children: [_jsx(Text, { color: config.color, bold: config.bold, children: config.icon }), _jsx(Text, { color: item.type === 'error' ? 'red' : undefined, children: item.content })] }, `history-${item.id}`));
    };
    // aiexecode의 App.js 렌더링 구조를 그대로 따름
    return (_jsxs(Box, { flexDirection: "column", padding: 0, width: terminalWidth, height: terminalHeight, children: [_jsxs(Box, { flexDirection: "column", flexGrow: 1, flexShrink: 1, overflow: "hidden", width: "100%", children: [_jsxs(Box, { justifyContent: "center", marginBottom: 1, children: [_jsxs(Text, { bold: true, color: theme.colors.borderActive, children: ["AI Command ", sessionId ? `(Session: ${sessionId.slice(0, 8)}...)` : '(New Session)'] }), _jsxs(Text, { color: theme.colors.textDim, children: ["  Path: ", currentPath] })] }), _jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "yellow", bold: true, children: "\u26A0 WARNING: AI may execute actions without asking for confirmation." }) }), _jsx(Static, { items: history, children: (item) => renderHistoryItem(item) })] }), _jsxs(Box, { flexDirection: "column", flexShrink: 0, children: [_jsx(Box, { children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: "yellow", children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { color: "gray", children: " Processing... (Esc to cancel)" })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { color: "yellow", children: '> ' }), claudeAvailable && (_jsx(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit, placeholder: "Type a command or question..." }))] })) }), _jsx(Box, { children: _jsxs(Text, { color: "gray", children: ["[Enter] Send  [Esc] Close  ", sessionId && '[Session persists]'] }) })] })] }));
}
//# sourceMappingURL=AICommandModal.js.map