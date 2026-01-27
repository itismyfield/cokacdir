import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
export default function ConfirmDialog({ title, message, onConfirm, onCancel, }) {
    const theme = defaultTheme;
    useInput((input, key) => {
        if (input === 'y' || input === 'Y') {
            onConfirm();
        }
        else if (input === 'n' || input === 'N' || key.escape) {
            onCancel();
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.warning, paddingX: 2, paddingY: 1, marginX: 10, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { bold: true, color: theme.colors.warning, children: title }) }), _jsx(Text, { children: " " }), _jsx(Text, { children: message }), _jsx(Text, { children: " " }), _jsxs(Box, { justifyContent: "center", children: [_jsx(Text, { color: theme.colors.success, children: "[Y]" }), _jsx(Text, { children: " Yes  " }), _jsx(Text, { color: theme.colors.error, children: "[N]" }), _jsx(Text, { children: " No" })] })] }));
}
//# sourceMappingURL=ConfirmDialog.js.map