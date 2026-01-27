import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
import { formatSize } from '../utils/format.js';
export default function StatusBar({ selectedFile, selectedSize, selectedCount, totalSize, }) {
    const theme = defaultTheme;
    return (_jsxs(Box, { backgroundColor: theme.colors.bgStatusBar, paddingX: 1, children: [_jsx(Box, { width: "50%", children: _jsx(Text, { color: theme.colors.textHeader, children: selectedFile ? `${selectedFile} (${formatSize(selectedSize || 0)})` : ' ' }) }), _jsx(Box, { width: "50%", justifyContent: "flex-end", children: _jsxs(Text, { color: theme.colors.textHeader, children: [selectedCount > 0 ? `${selectedCount} selected, ` : '', "Total: ", formatSize(totalSize)] }) })] }));
}
//# sourceMappingURL=StatusBar.js.map