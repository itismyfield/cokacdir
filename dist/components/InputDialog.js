import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
export default function InputDialog({ title, prompt, defaultValue = '', onSubmit, onCancel, }) {
    const theme = defaultTheme;
    const [value, setValue] = useState(defaultValue);
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
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.borderActive, paddingX: 2, paddingY: 1, marginX: 10, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { bold: true, color: theme.colors.borderActive, children: title }) }), _jsx(Text, { children: " " }), _jsx(Text, { children: prompt }), _jsxs(Box, { children: [_jsx(Text, { color: theme.colors.info, children: "> " }), _jsx(Text, { children: value }), _jsx(Text, { color: theme.colors.borderActive, children: "_" })] }), _jsx(Text, { children: " " }), _jsx(Text, { dimColor: true, children: "[Enter] Confirm  [Esc] Cancel" })] }));
}
//# sourceMappingURL=InputDialog.js.map