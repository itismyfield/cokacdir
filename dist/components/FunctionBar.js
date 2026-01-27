import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
import { features } from '../utils/platform.js';
const allFunctionKeys = [
    { key: '1', label: 'Help' },
    { key: '2', label: 'Info' },
    { key: '3', label: 'View' },
    { key: '4', label: 'Edit' },
    { key: '5', label: 'Copy' },
    { key: '6', label: 'Move' },
    { key: '7', label: 'MkDir' },
    { key: '8', label: 'Del' },
    { key: 'R', label: 'Ren' },
    { key: '9', label: 'Proc', requiresFeature: 'processManager' },
    { key: '0', label: 'Quit' },
];
// Filter function keys based on platform features
const functionKeys = allFunctionKeys.filter(fk => !fk.requiresFeature || features[fk.requiresFeature]);
export default function FunctionBar({ message, width = 80 }) {
    const theme = defaultTheme;
    const itemWidth = Math.floor(width / functionKeys.length);
    // Show message if present
    if (message) {
        return (_jsx(Box, { width: width, justifyContent: "center", children: _jsx(Text, { color: theme.colors.warning, bold: true, children: message }) }));
    }
    return (_jsx(Box, { width: width, children: functionKeys.map((fk) => (_jsxs(Box, { width: itemWidth, justifyContent: "center", children: [_jsx(Text, { color: theme.colors.textDim, children: fk.key }), _jsxs(Text, { color: theme.colors.text, children: [' ', fk.label] })] }, fk.key))) }));
}
//# sourceMappingURL=FunctionBar.js.map