import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { spawnSync } from 'child_process';
import os from 'os';
import path from 'path';
export default function DiskUtils() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState('disks');
    const [analyzePath, setAnalyzePath] = useState(null);
    const [analyzeResult, setAnalyzeResult] = useState('');
    const [analyzeLoading, setAnalyzeLoading] = useState(false);
    // Load disk info
    const disks = useMemo(() => {
        try {
            const platform = os.platform();
            if (platform === 'darwin' || platform === 'linux') {
                // Use spawnSync for better error handling and no shell injection risk
                const result = spawnSync('df', ['-h'], {
                    encoding: 'utf-8',
                    timeout: 5000,
                    stdio: ['ignore', 'pipe', 'ignore']
                });
                if (result.status !== 0 || !result.stdout) {
                    console.error('Failed to get disk info');
                    return [];
                }
                const lines = result.stdout.trim().split('\n').slice(1);
                const diskInfos = lines
                    .map(line => {
                    const parts = line.split(/\s+/);
                    if (parts.length >= 6) {
                        const usePercentStr = parts[4]?.replace('%', '') || '0';
                        return {
                            filesystem: parts[0] || '',
                            size: parts[1] || '',
                            used: parts[2] || '',
                            available: parts[3] || '',
                            usePercent: parseInt(usePercentStr, 10) || 0,
                            mountpoint: parts[5] || '',
                        };
                    }
                    return null;
                })
                    .filter((d) => d !== null)
                    .filter(d => !d.filesystem.startsWith('tmpfs') && !d.filesystem.startsWith('devtmpfs'));
                return diskInfos;
            }
            return [];
        }
        catch (error) {
            console.error('Error loading disk info:', error);
            return [];
        }
    }, []);
    const selectedDisk = disks[selectedIndex];
    // Handle input
    useInput((input, key) => {
        if (mode === 'disks') {
            if (key.upArrow) {
                setSelectedIndex(prev => Math.max(0, prev - 1));
            }
            else if (key.downArrow) {
                setSelectedIndex(prev => Math.min(disks.length - 1, prev + 1));
            }
            else if (key.return && selectedDisk) {
                setAnalyzePath(selectedDisk.mountpoint);
                setMode('analyze');
            }
        }
        else if (mode === 'analyze' && key.escape) {
            setMode('disks');
            setAnalyzePath(null);
        }
    });
    // Validate path to prevent command injection
    const isValidPath = (pathToCheck) => {
        try {
            // Resolve to absolute path and check if it exists
            const resolved = path.resolve(pathToCheck);
            // Check for null bytes and other dangerous characters
            if (resolved.includes('\0') || resolved.includes('\n')) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    };
    // Analyze directory when analyzePath changes
    useEffect(() => {
        if (analyzePath && mode === 'analyze') {
            setAnalyzeLoading(true);
            setAnalyzeResult('');
            setTimeout(() => {
                try {
                    // Validate path before using
                    if (!isValidPath(analyzePath)) {
                        setAnalyzeResult('Invalid path');
                        setAnalyzeLoading(false);
                        return;
                    }
                    // Use spawnSync with array args instead of shell interpolation
                    const result = spawnSync('du', ['-sh', analyzePath], {
                        encoding: 'utf-8',
                        timeout: 30000,
                        stdio: ['ignore', 'pipe', 'ignore']
                    });
                    if (result.status === 0 && result.stdout) {
                        const size = result.stdout.split('\t')[0] || 'Unknown';
                        setAnalyzeResult(size);
                    }
                    else {
                        setAnalyzeResult('Error calculating size');
                    }
                }
                catch {
                    setAnalyzeResult('Error calculating size');
                }
                setAnalyzeLoading(false);
            }, 100);
        }
    }, [analyzePath, mode]);
    const getUsageColor = (percent) => {
        if (percent >= 90)
            return 'red';
        if (percent >= 70)
            return 'yellow';
        return 'green';
    };
    if (mode === 'analyze' && analyzePath) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "green", bold: true, children: "Directory Analysis" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Box, { width: 15, children: _jsx(Text, { color: "cyan", children: "Path:" }) }), _jsx(Text, { children: analyzePath })] }), _jsxs(Box, { children: [_jsx(Box, { width: 15, children: _jsx(Text, { color: "cyan", children: "Total Size:" }) }), analyzeLoading ? (_jsx(Text, { color: "yellow", children: "Calculating..." })) : (_jsx(Text, { bold: true, children: analyzeResult }))] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Press ESC to go back" }) })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "green", bold: true, children: "Disk Utilities" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { bold: true, color: "cyan", children: "Filesystem" }) }), _jsx(Box, { width: 10, children: _jsx(Text, { bold: true, color: "cyan", children: "Size" }) }), _jsx(Box, { width: 10, children: _jsx(Text, { bold: true, color: "cyan", children: "Used" }) }), _jsx(Box, { width: 10, children: _jsx(Text, { bold: true, color: "cyan", children: "Avail" }) }), _jsx(Box, { width: 8, children: _jsx(Text, { bold: true, color: "cyan", children: "Use%" }) }), _jsx(Box, { children: _jsx(Text, { bold: true, color: "cyan", children: "Mount" }) })] }), disks.map((disk, index) => {
                        const isSelected = index === selectedIndex;
                        const barLength = Math.round(disk.usePercent / 10);
                        return (_jsxs(Box, { children: [_jsx(Box, { width: 20, children: _jsx(Text, { inverse: isSelected, bold: isSelected, children: disk.filesystem.length > 18 ? disk.filesystem.substring(0, 15) + '...' : disk.filesystem }) }), _jsx(Box, { width: 10, children: _jsx(Text, { children: disk.size }) }), _jsx(Box, { width: 10, children: _jsx(Text, { children: disk.used }) }), _jsx(Box, { width: 10, children: _jsx(Text, { children: disk.available }) }), _jsx(Box, { width: 8, children: _jsxs(Text, { color: getUsageColor(disk.usePercent), children: [disk.usePercent, "%"] }) }), _jsxs(Box, { children: [_jsxs(Text, { color: getUsageColor(disk.usePercent), children: ['█'.repeat(barLength), '░'.repeat(10 - barLength)] }), _jsxs(Text, { children: [" ", disk.mountpoint] })] })] }, disk.mountpoint));
                    })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "\u2191\u2193 Navigate | Enter: Analyze | ESC: Back" }) })] }));
}
//# sourceMappingURL=DiskUtils.js.map