import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import fs from 'fs';
import path from 'path';
import { defaultTheme } from '../themes/classic-blue.js';
import { formatSize, formatPermissionsShort } from '../utils/format.js';
export default function Panel({ currentPath, isActive, selectedIndex, selectedFiles, width, height, sortBy = 'name', sortOrder = 'asc', onFilesLoad, }) {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const theme = defaultTheme;
    // Load files when path or sort changes
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
            // Sort: directories first, then by sortBy/sortOrder
            fileItems.sort((a, b) => {
                // Directories always first
                if (a.isDirectory && !b.isDirectory)
                    return -1;
                if (!a.isDirectory && b.isDirectory)
                    return 1;
                let result = 0;
                switch (sortBy) {
                    case 'name':
                        result = a.name.localeCompare(b.name);
                        break;
                    case 'size':
                        result = a.size - b.size;
                        break;
                    case 'modified':
                        result = a.modified.getTime() - b.modified.getTime();
                        break;
                }
                return sortOrder === 'desc' ? -result : result;
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
    }, [currentPath, sortBy, sortOrder]);
    // Calculate visible rows: height minus borders (2), header (1), column header (1), footer (1) = 5
    const visibleCount = height ? Math.max(5, height - 5) : 15;
    // Center-locked scrolling with edge release
    // Cursor stays centered, but moves to edges when reaching start/end of list
    let startIndex = selectedIndex - Math.floor(visibleCount / 2);
    // Top boundary: don't scroll above first item
    startIndex = Math.max(0, startIndex);
    // Bottom boundary: don't scroll past last item (no empty space at bottom)
    startIndex = Math.min(startIndex, Math.max(0, files.length - visibleCount));
    const visibleFiles = files.slice(startIndex, startIndex + visibleCount);
    const displayPath = currentPath.length > width - 4
        ? '...' + currentPath.slice(-(width - 7))
        : currentPath;
    // Column widths (total = width - 2 for border)
    // Each column has 2 char padding on right
    const innerWidth = width - 2;
    const sizeColWidth = 8 + 2; // 8 for content + 2 padding
    const dateColWidth = 12 + 2; // 12 for content + 2 padding
    const nameColWidth = innerWidth - sizeColWidth - dateColWidth;
    return (_jsxs(Box, { flexDirection: "column", width: width, height: height, borderStyle: "single", borderColor: isActive ? theme.colors.borderActive : theme.colors.border, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { color: isActive ? theme.colors.borderActive : theme.colors.text, bold: true, children: displayPath }) }), _jsxs(Box, { width: innerWidth, children: [_jsx(Text, { color: theme.colors.textHeader, children: (sortBy === 'name' ? (sortOrder === 'asc' ? ' Name▲' : ' Name▼') : ' Name').padEnd(nameColWidth) }), _jsx(Text, { color: theme.colors.textHeader, children: ((sortBy === 'size' ? (sortOrder === 'asc' ? 'Size▲' : 'Size▼') : 'Size').padStart(8) + '  ') }), _jsx(Text, { color: theme.colors.textHeader, children: ((sortBy === 'modified' ? (sortOrder === 'asc' ? 'Modified▲' : 'Modified▼') : 'Modified').padStart(12) + '  ') })] }), error ? (_jsx(Text, { color: theme.colors.error, children: error })) : (visibleFiles.map((file, index) => {
                const actualIndex = startIndex + index;
                const isCursor = actualIndex === selectedIndex;
                const isMarked = selectedFiles.has(file.name);
                const dateStr = file.name === '..' ? '' :
                    `${(file.modified.getMonth() + 1).toString().padStart(2, '0')}-${file.modified.getDate().toString().padStart(2, '0')} ${file.modified.getHours().toString().padStart(2, '0')}:${file.modified.getMinutes().toString().padStart(2, '0')}`;
                // Name column: 2 chars for mark + icon, rest for filename
                const nameTextWidth = nameColWidth - 2;
                return (_jsxs(Box, { width: innerWidth, children: [_jsxs(Text, { color: isCursor && isActive ? theme.colors.textSelected :
                                isMarked ? theme.colors.warning :
                                    file.isDirectory ? theme.colors.textDirectory : theme.colors.text, backgroundColor: isCursor && isActive ? theme.colors.bgSelected : undefined, bold: file.isDirectory, children: [isMarked ? '*' : ' ', file.isDirectory ? theme.chars.folder : theme.chars.file, (file.name + ' '.repeat(nameTextWidth)).slice(0, nameTextWidth)] }), _jsx(Text, { color: isCursor && isActive ? theme.colors.textSelected : theme.colors.textDim, backgroundColor: isCursor && isActive ? theme.colors.bgSelected : undefined, children: (file.isDirectory ? '<DIR>' : formatSize(file.size)).padStart(8) + '  ' }), _jsx(Text, { color: isCursor && isActive ? theme.colors.textSelected : theme.colors.textDim, backgroundColor: isCursor && isActive ? theme.colors.bgSelected : undefined, children: dateStr.padStart(12) + '  ' })] }, `${currentPath}-${actualIndex}-${file.name}`));
            })), Array.from({ length: Math.max(0, visibleCount - visibleFiles.length) }).map((_, i) => (_jsx(Box, { children: _jsx(Text, { children: " " }) }, `empty-${i}`))), _jsx(Box, { justifyContent: "center", children: _jsxs(Text, { color: theme.colors.textDim, children: [files.filter(f => f.name !== '..').length, " files"] }) })] }));
}
//# sourceMappingURL=Panel.js.map