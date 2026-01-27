import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
export default function ConfirmDialog({ title, message, onConfirm, onCancel, }) {
    const theme = defaultTheme;
    const bgColor = '#000000';
    useInput((input, key) => {
        if (input === 'y' || input === 'Y') {
            onConfirm();
        }
        else if (input === 'n' || input === 'N' || key.escape) {
            onCancel();
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.warning, backgroundColor: bgColor, paddingX: 2, paddingY: 1, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { color: theme.colors.warning, bold: true, children: title }) }), _jsx(Text, { children: " " }), _jsx(Text, { color: theme.colors.text, children: message }), _jsx(Text, { children: " " }), _jsxs(Box, { justifyContent: "center", children: [_jsx(Text, { color: theme.colors.success, children: "[Y]" }), _jsx(Text, { children: " Yes    " }), _jsx(Text, { color: theme.colors.error, children: "[N]" }), _jsx(Text, { children: " No" })] })] }));
}
//# sourceMappingURL=ConfirmDialog.js.map