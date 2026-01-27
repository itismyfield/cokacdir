import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import DualPanel from './screens/DualPanel.js';
import SystemInfo from './screens/SystemInfo.js';
import DiskUtils from './screens/DiskUtils.js';
import { defaultTheme } from './themes/classic-blue.js';
import { features } from './utils/platform.js';
import { APP_TITLE } from './utils/version.js';
export default function App({ onEnterAI }) {
    const [currentScreen, setCurrentScreen] = useState('dual-panel');
    useInput((input, key) => {
        // ESC from sub-screens
        if (key.escape && currentScreen !== 'dual-panel') {
            setCurrentScreen('dual-panel');
        }
    });
    if (currentScreen === 'dual-panel') {
        return (_jsx(DualPanel, { onEnterAI: onEnterAI }));
    }
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { justifyContent: "center", marginBottom: 1, children: _jsx(Text, { bold: true, color: defaultTheme.colors.borderActive, children: APP_TITLE }) }), currentScreen === 'system-info' && _jsx(SystemInfo, {}), currentScreen === 'disk-utils' && features.diskUtils && _jsx(DiskUtils, {}), currentScreen === 'disk-utils' && !features.diskUtils && (_jsx(Box, { flexDirection: "column", children: _jsx(Text, { color: "yellow", children: "Disk Utilities is not available on this platform." }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Press ESC to return to file manager" }) })] }));
}
//# sourceMappingURL=App.js.map