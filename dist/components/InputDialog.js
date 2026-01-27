import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
export default function InputDialog({ title, prompt, defaultValue = '', onSubmit, onCancel, }) {
    const theme = defaultTheme;
    const [value, setValue] = useState(defaultValue);
    const bgColor = '#000000';
    const dialogWidth = 60;
    const inputMaxWidth = dialogWidth - 8; // border, padding, "> " prefix, cursor
    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        }
        else if (key.return) {
            if (value.trim()) {
                onSubmit(value.trim());
            }
        }
        else if (key.backspace || key.delete) {
            setValue(prev => prev.slice(0, -1));
        }
        else if (input && !key.ctrl && !key.meta) {
            setValue(prev => prev + input);
        }
    });
    // 표시할 값 (너비 초과 시 뒷부분만 표시)
    const displayValue = value.length > inputMaxWidth
        ? '…' + value.slice(-(inputMaxWidth - 1))
        : value;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.borderActive, backgroundColor: bgColor, paddingX: 2, paddingY: 1, width: dialogWidth, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { color: theme.colors.borderActive, bold: true, children: title }) }), _jsx(Text, { children: " " }), _jsx(Text, { color: theme.colors.text, children: prompt }), _jsxs(Box, { children: [_jsx(Text, { color: theme.colors.info, children: "> " }), _jsx(Text, { color: theme.colors.text, children: displayValue }), _jsx(Text, { color: theme.colors.borderActive, children: "_" })] }), _jsx(Text, { children: " " }), _jsx(Text, { color: theme.colors.textDim, children: "[Enter] Confirm  [Esc] Cancel" })] }));
}
//# sourceMappingURL=InputDialog.js.map