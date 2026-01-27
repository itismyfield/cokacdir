import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import os from 'os';
export default function SystemInfo() {
    const [data, setData] = useState(null);
    useEffect(() => {
        const loadData = () => {
            setData({
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                uptime: os.uptime(),
                totalMem: os.totalmem(),
                freeMem: os.freemem(),
                cpus: os.cpus(),
                loadavg: os.loadavg(),
                userInfo: os.userInfo(),
            });
        };
        loadData();
        const interval = setInterval(loadData, 2000);
        return () => clearInterval(interval);
    }, []);
    const formatBytes = (bytes) => {
        const gb = bytes / 1024 / 1024 / 1024;
        return `${gb.toFixed(2)} GB`;
    };
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };
    if (!data) {
        return _jsx(Text, { children: "Loading..." });
    }
    const memUsed = data.totalMem - data.freeMem;
    const memPercent = ((memUsed / data.totalMem) * 100).toFixed(1);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "green", bold: true, children: "System Information" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Hostname:" }) }), _jsx(Text, { children: data.hostname })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "User:" }) }), _jsx(Text, { children: data.userInfo.username })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Platform:" }) }), _jsxs(Text, { children: [data.platform, " (", data.arch, ")"] })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Kernel:" }) }), _jsx(Text, { children: data.release })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Uptime:" }) }), _jsx(Text, { children: formatUptime(data.uptime) })] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "green", bold: true, children: "Memory" }) }), _jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Total:" }) }), _jsx(Text, { children: formatBytes(data.totalMem) })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Used:" }) }), _jsxs(Text, { children: [formatBytes(memUsed), " (", memPercent, "%)"] })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Free:" }) }), _jsx(Text, { children: formatBytes(data.freeMem) })] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { color: "cyan", children: "[" }), _jsx(Text, { color: "green", children: '█'.repeat(Math.round(parseFloat(memPercent) / 5)) }), _jsx(Text, { color: "gray", children: '░'.repeat(20 - Math.round(parseFloat(memPercent) / 5)) }), _jsx(Text, { color: "cyan", children: "]" })] })] }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "green", bold: true, children: ["CPU (", data.cpus.length, " cores)"] }) }), _jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Model:" }) }), _jsx(Text, { children: data.cpus[0]?.model || 'Unknown' })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Speed:" }) }), _jsxs(Text, { children: [data.cpus[0]?.speed || 0, " MHz"] })] }), _jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { color: "cyan", children: "Load (1/5/15m):" }) }), _jsx(Text, { children: data.loadavg.map(l => l.toFixed(2)).join(' / ') })] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Data refreshes every 2s" }) })] }));
}
//# sourceMappingURL=SystemInfo.js.map