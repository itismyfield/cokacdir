import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import fs from 'fs';
import path from 'path';
import { formatSize, formatPermissionsShort } from '../utils/format.js';
export default function FileManager({ currentPath, selectedIndex, showHidden, sortBy, refreshTrigger, onNavigate, onFileCountChange, onRegisterEnterHandler, }) {
    // Read and process files
    const { files, error } = useMemo(() => {
        try {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            const fileItems = entries
                .filter(entry => showHidden || !entry.name.startsWith('.'))
                .map((entry) => {
                const fullPath = path.join(currentPath, entry.name);
                let stats = { size: 0, mtime: new Date(), mode: 0 };
                try {
                    stats = fs.statSync(fullPath);
                }
                catch {
                    // ignore stat errors
                }
                return {
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    size: stats.size,
                    modified: stats.mtime,
                    permissions: formatPermissionsShort(stats.mode),
                };
            });
            // Sort
            fileItems.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory)
                    return -1;
                if (!a.isDirectory && b.isDirectory)
                    return 1;
                switch (sortBy) {
                    case 'size': return b.size - a.size;
                    case 'modified': return b.modified.getTime() - a.modified.getTime();
                    default: return a.name.localeCompare(b.name);
                }
            });
            // Add parent directory
            if (currentPath !== '/') {
                fileItems.unshift({
                    name: '..',
                    isDirectory: true,
                    size: 0,
                    modified: new Date(),
                    permissions: 'drwxr-xr-x',
                });
            }
            return { files: fileItems, error: null };
        }
        catch (err) {
            return { files: [], error: `Cannot read directory: ${err}` };
        }
    }, [currentPath, showHidden, sortBy, refreshTrigger]);
    // Notify parent of file count changes
    useEffect(() => {
        onFileCountChange(files.length);
    }, [files.length, onFileCountChange]);
    // Clamp selected index
    const clampedIndex = Math.min(selectedIndex, Math.max(0, files.length - 1));
    const selectedFile = files[clampedIndex];
    // Register Enter key handler
    useEffect(() => {
        const handleEnter = () => {
            if (selectedFile?.isDirectory) {
                const newPath = selectedFile.name === '..'
                    ? path.dirname(currentPath)
                    : path.join(currentPath, selectedFile.name);
                onNavigate(newPath);
            }
        };
        onRegisterEnterHandler(handleEnter);
    }, [selectedFile, currentPath, onNavigate, onRegisterEnterHandler]);
    const visibleCount = 15;
    const startIndex = Math.max(0, Math.min(clampedIndex - Math.floor(visibleCount / 2), Math.max(0, files.length - visibleCount)));
    const visibleFiles = files.slice(startIndex, startIndex + visibleCount);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "yellow", children: "\uD83D\uDCC2 " }), _jsx(Text, { bold: true, children: currentPath }), _jsx(Text, { dimColor: true, children: " | Sort: " }), _jsx(Text, { color: sortBy === 'name' ? 'green' : 'gray', children: "[N]ame" }), _jsx(Text, { dimColor: true, children: " " }), _jsx(Text, { color: sortBy === 'size' ? 'green' : 'gray', children: "[S]ize" }), _jsx(Text, { dimColor: true, children: " " }), _jsx(Text, { color: sortBy === 'modified' ? 'green' : 'gray', children: "[M]od" }), _jsx(Text, { dimColor: true, children: " | Hidden: " }), _jsx(Text, { color: showHidden ? 'green' : 'red', children: showHidden ? 'ON' : 'OFF' })] }), error ? (_jsx(Text, { color: "red", children: error })) : (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Box, { width: 30, children: _jsx(Text, { bold: true, color: "cyan", children: "Name" }) }), _jsx(Box, { width: 12, children: _jsx(Text, { bold: true, color: "cyan", children: "Size" }) }), _jsx(Box, { width: 12, children: _jsx(Text, { bold: true, color: "cyan", children: "Perms" }) }), _jsx(Box, { width: 14, children: _jsx(Text, { bold: true, color: "cyan", children: "Modified" }) })] }), visibleFiles.map((file, index) => {
                        const actualIndex = startIndex + index;
                        const isSelected = actualIndex === clampedIndex;
                        const isHiddenFile = file.name.startsWith('.') && file.name !== '..';
                        return (_jsxs(Box, { children: [_jsx(Box, { width: 30, children: _jsxs(Text, { color: file.isDirectory ? 'blue' : isHiddenFile ? 'gray' : 'white', bold: isSelected, inverse: isSelected, children: [file.isDirectory ? '📁 ' : '📄 ', file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name] }) }), _jsx(Box, { width: 12, children: _jsx(Text, { dimColor: !isSelected, children: file.isDirectory ? '<DIR>' : formatSize(file.size) }) }), _jsx(Box, { width: 12, children: _jsx(Text, { dimColor: true, color: "gray", children: file.permissions }) }), _jsx(Box, { width: 14, children: _jsx(Text, { dimColor: !isSelected, children: file.modified.toLocaleDateString() }) })] }, `${actualIndex}-${file.name}`));
                    })] })), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["\u2191\u2193 Navigate | Enter: Open | [H]idden | [R]efresh | [~] Home | ESC: Back | ", files.length, " items"] }) })] }));
}
//# sourceMappingURL=FileManager.js.map