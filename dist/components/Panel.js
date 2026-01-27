import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import fs from 'fs';
import path from 'path';
import { defaultTheme } from '../themes/classic-blue.js';
import { formatSize, formatPermissionsShort } from '../utils/format.js';
export default function Panel({ currentPath, isActive, selectedIndex, selectedFiles, width, height, onFilesLoad, }) {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const theme = defaultTheme;
    // Load files when path changes
    useEffect(() => {
        try {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            const fileItems = entries.map((entry) => {
                const fullPath = path.join(currentPath, entry.name);
                let size = 0;
                let mtime = new Date();
                let permissions = '';
                try {
                    const stats = fs.statSync(fullPath);
                    size = stats.size;
                    mtime = stats.mtime;
                    permissions = formatPermissionsShort(stats.mode);
                }
                catch {
                    // ignore
                }
                return {
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    size,
                    modified: mtime,
                    permissions,
                };
            });
            // Sort: directories first
            fileItems.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory)
                    return -1;
                if (!a.isDirectory && b.isDirectory)
                    return 1;
                return a.name.localeCompare(b.name);
            });
            // Add parent
            if (currentPath !== '/') {
                fileItems.unshift({
                    name: '..',
                    isDirectory: true,
                    size: 0,
                    modified: new Date(),
                });
            }
            setFiles(fileItems);
            setError(null);
            onFilesLoad?.(fileItems);
        }
        catch (err) {
            setError(`Error: ${err}`);
            setFiles([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPath]);
    // Calculate visible rows: height minus borders (2), header (1), column header (1), footer (1) = 5
    const visibleCount = height ? Math.max(5, height - 5) : 15;
    const startIndex = Math.max(0, selectedIndex - Math.floor(visibleCount / 2));
    const visibleFiles = files.slice(startIndex, startIndex + visibleCount);
    const displayPath = currentPath.length > width - 4
        ? '...' + currentPath.slice(-(width - 7))
        : currentPath;
    return (_jsxs(Box, { flexDirection: "column", width: width, height: height, borderStyle: "single", borderColor: isActive ? theme.colors.borderActive : theme.colors.border, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { color: isActive ? theme.colors.borderActive : theme.colors.text, bold: true, children: displayPath }) }), _jsxs(Box, { width: width - 2, children: [_jsx(Text, { color: theme.colors.textHeader, children: ' Name'.padEnd(width - 24) }), _jsx(Text, { color: theme.colors.textHeader, children: 'Perm'.padEnd(10) }), _jsx(Text, { color: theme.colors.textHeader, children: 'Size'.padStart(8) })] }), error ? (_jsx(Text, { color: theme.colors.error, children: error })) : (visibleFiles.map((file, index) => {
                const actualIndex = startIndex + index;
                const isCursor = actualIndex === selectedIndex;
                const isMarked = selectedFiles.has(file.name);
                return (_jsxs(Box, { width: width - 2, children: [_jsxs(Text, { color: isCursor && isActive ? theme.colors.textSelected :
                                isMarked ? theme.colors.warning :
                                    file.isDirectory ? theme.colors.textDirectory : theme.colors.text, backgroundColor: isCursor && isActive ? theme.colors.bgSelected : undefined, bold: file.isDirectory, children: [isMarked ? '*' : ' ', file.isDirectory ? theme.chars.folder : theme.chars.file, (file.name.slice(0, width - 28) + ' '.repeat(width - 28)).slice(0, width - 28)] }), _jsx(Text, { color: isCursor && isActive ? theme.colors.textSelected : theme.colors.textDim, backgroundColor: isCursor && isActive ? theme.colors.bgSelected : undefined, children: (file.permissions || '---------').padEnd(10) }), _jsx(Text, { color: isCursor && isActive ? theme.colors.textSelected : theme.colors.textDim, backgroundColor: isCursor && isActive ? theme.colors.bgSelected : undefined, children: (file.isDirectory ? '<DIR>' : formatSize(file.size)).padStart(8) })] }, `${currentPath}-${actualIndex}-${file.name}`));
            })), Array.from({ length: Math.max(0, visibleCount - visibleFiles.length) }).map((_, i) => (_jsx(Box, { children: _jsx(Text, { children: " " }) }, `empty-${i}`))), _jsx(Box, { justifyContent: "center", children: _jsxs(Text, { color: theme.colors.textDim, children: [files.filter(f => f.name !== '..').length, " files"] }) })] }));
}
//# sourceMappingURL=Panel.js.map