import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const menuItems = [
    { label: '📁 File Manager', value: 'file-manager' },
    { label: '💾 Disk Utilities', value: 'disk-utils' },
    { label: 'ℹ️  System Info', value: 'system-info' },
];
export default function MainMenu({ selectedIndex }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "green", bold: true, children: "Main Menu" }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: menuItems.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (_jsx(Box, { children: _jsxs(Text, { color: isSelected ? 'cyan' : 'white', bold: isSelected, children: [isSelected ? '❯ ' : '  ', item.label] }) }, item.value));
                }) })] }));
}
//# sourceMappingURL=MainMenu.js.map