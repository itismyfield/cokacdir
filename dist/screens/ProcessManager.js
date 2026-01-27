import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
import { getProcessList, killProcess, forceKillProcess } from '../services/process.js';
export default function ProcessManager({ onClose }) {
    const theme = defaultTheme;
    const { stdout } = useStdout();
    const messageTimerRef = useRef(null);
    const [processes, setProcesses] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedPid, setSelectedPid] = useState(null);
    const [sortField, setSortField] = useState('cpu');
    const [sortAsc, setSortAsc] = useState(false);
    const [message, setMessage] = useState('');
    const [confirmKill, setConfirmKill] = useState(null);
    const [forceKill, setForceKill] = useState(false);
    const termWidth = stdout?.columns || 80;
    const termHeight = stdout?.rows || 24;
    const visibleCount = Math.max(5, termHeight - 8);
    const loadProcesses = useCallback(() => {
        const procs = getProcessList();
        // Sort processes
        procs.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'pid':
                    cmp = a.pid - b.pid;
                    break;
                case 'cpu':
                    cmp = a.cpu - b.cpu;
                    break;
                case 'mem':
                    cmp = a.mem - b.mem;
                    break;
                case 'command':
                    cmp = a.command.localeCompare(b.command);
                    break;
            }
            return sortAsc ? cmp : -cmp;
        });
        setProcesses(prevProcesses => {
            // Find the currently selected PID
            const currentPid = selectedPid ?? (prevProcesses[selectedIndex]?.pid);
            if (currentPid !== null && currentPid !== undefined) {
                // Find the new index of the selected PID
                const newIndex = procs.findIndex(p => p.pid === currentPid);
                if (newIndex >= 0) {
                    setSelectedIndex(newIndex);
                }
                else if (procs.length > 0) {
                    // PID no longer exists, keep index in bounds
                    setSelectedIndex(prev => Math.min(prev, procs.length - 1));
                }
            }
            return procs;
        });
    }, [sortField, sortAsc, selectedPid, selectedIndex]);
    useEffect(() => {
        loadProcesses();
        const interval = setInterval(loadProcesses, 3000);
        return () => clearInterval(interval);
    }, [loadProcesses]);
    // Cleanup message timer on unmount
    useEffect(() => {
        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, []);
    const showMessage = (msg) => {
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }
        setMessage(msg);
        messageTimerRef.current = setTimeout(() => setMessage(''), 2000);
    };
    const handleKill = (force) => {
        const proc = processes[selectedIndex];
        if (!proc)
            return;
        const result = force ? forceKillProcess(proc.pid) : killProcess(proc.pid);
        if (result.success) {
            showMessage(`Process ${proc.pid} killed`);
            setTimeout(loadProcesses, 500);
        }
        else {
            showMessage(`Error: ${result.error}`);
        }
        setConfirmKill(null);
        setForceKill(false);
    };
    useInput((input, key) => {
        // Handle confirm dialog
        if (confirmKill !== null) {
            if (input.toLowerCase() === 'y') {
                handleKill(forceKill);
            }
            else if (input.toLowerCase() === 'n' || key.escape) {
                setConfirmKill(null);
                setForceKill(false);
            }
            return;
        }
        if (key.escape) {
            onClose();
            return;
        }
        // Navigation - update both index and PID
        const updateSelection = (newIndex) => {
            const clampedIndex = Math.max(0, Math.min(processes.length - 1, newIndex));
            setSelectedIndex(clampedIndex);
            if (processes[clampedIndex]) {
                setSelectedPid(processes[clampedIndex].pid);
            }
        };
        if (key.upArrow) {
            updateSelection(selectedIndex - 1);
        }
        else if (key.downArrow) {
            updateSelection(selectedIndex + 1);
        }
        else if (key.pageUp) {
            updateSelection(selectedIndex - 10);
        }
        else if (key.pageDown) {
            updateSelection(selectedIndex + 10);
        }
        else if (key.home) {
            updateSelection(0);
        }
        else if (key.end) {
            updateSelection(processes.length - 1);
        }
        // Sort controls
        if (input === 'p' || input === 'P') {
            setSortField('pid');
            setSortAsc(prev => sortField === 'pid' ? !prev : true);
        }
        else if (input === 'c' || input === 'C') {
            setSortField('cpu');
            setSortAsc(prev => sortField === 'cpu' ? !prev : false);
        }
        else if (input === 'm' || input === 'M') {
            setSortField('mem');
            setSortAsc(prev => sortField === 'mem' ? !prev : false);
        }
        else if (input === 'n' || input === 'N') {
            setSortField('command');
            setSortAsc(prev => sortField === 'command' ? !prev : true);
        }
        // Kill process
        if (input === 'k' || input === 'K') {
            const proc = processes[selectedIndex];
            if (proc) {
                setConfirmKill(proc.pid);
                setForceKill(false);
            }
        }
        // Force kill
        if (input === '9') {
            const proc = processes[selectedIndex];
            if (proc) {
                setConfirmKill(proc.pid);
                setForceKill(true);
            }
        }
        // Refresh
        if (input === 'r' || input === 'R') {
            loadProcesses();
            showMessage('Refreshed');
        }
    });
    const startIndex = Math.max(0, selectedIndex - Math.floor(visibleCount / 2));
    const visibleProcesses = processes.slice(startIndex, startIndex + visibleCount);
    const currentProc = processes[selectedIndex];
    // Column widths
    const pidWidth = 7;
    const userWidth = 10;
    const cpuWidth = 6;
    const memWidth = 6;
    const commandWidth = termWidth - pidWidth - userWidth - cpuWidth - memWidth - 10;
    const getSortIndicator = (field) => {
        if (sortField !== field)
            return ' ';
        return sortAsc ? '↑' : '↓';
    };
    return (_jsxs(Box, { flexDirection: "column", height: termHeight, children: [_jsxs(Box, { justifyContent: "center", children: [_jsx(Text, { bold: true, color: theme.colors.borderActive, children: "Process Manager" }), _jsxs(Text, { color: theme.colors.textDim, children: ["  [", processes.length, " processes]"] })] }), _jsx(Box, { children: _jsxs(Text, { color: theme.colors.textHeader, children: [`PID${getSortIndicator('pid')}`.padEnd(pidWidth), 'USER'.padEnd(userWidth), `CPU${getSortIndicator('cpu')}`.padStart(cpuWidth), `MEM${getSortIndicator('mem')}`.padStart(memWidth), `  COMMAND${getSortIndicator('command')}`] }) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, children: visibleProcesses.map((proc, index) => {
                    const actualIndex = startIndex + index;
                    const isCursor = actualIndex === selectedIndex;
                    return (_jsx(Box, { children: _jsxs(Text, { color: isCursor ? theme.colors.textSelected : theme.colors.text, backgroundColor: isCursor ? theme.colors.bgSelected : undefined, children: [String(proc.pid).padEnd(pidWidth), proc.user.slice(0, userWidth - 1).padEnd(userWidth), proc.cpu.toFixed(1).padStart(cpuWidth), proc.mem.toFixed(1).padStart(memWidth), '  ', proc.command.slice(0, commandWidth)] }) }, proc.pid));
                }) }), confirmKill !== null && (_jsx(Box, { justifyContent: "center", marginY: 1, children: _jsxs(Text, { color: theme.colors.warning, bold: true, children: [forceKill ? 'Force kill' : 'Kill', " process ", confirmKill, "? (y/n)"] }) })), message && (_jsx(Box, { justifyContent: "center", children: _jsx(Text, { color: theme.colors.warning, bold: true, children: message }) })), _jsxs(Box, { justifyContent: "space-between", marginTop: 1, children: [_jsx(Text, { color: theme.colors.textDim, children: "[k] Kill  [9] Force Kill  [r] Refresh" }), _jsx(Text, { color: theme.colors.textDim, children: "Sort: [p]ID [c]PU [m]EM [n]ame" })] }), _jsx(Box, { justifyContent: "center", children: _jsx(Text, { color: theme.colors.textDim, children: "[Esc] Close" }) })] }));
}
//# sourceMappingURL=ProcessManager.js.map