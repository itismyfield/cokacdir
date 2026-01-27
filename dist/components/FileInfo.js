import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import fs from 'fs';
import path from 'path';
import { defaultTheme } from '../themes/classic-blue.js';
import { formatSize, formatDate, formatPermissions } from '../utils/format.js';
export default function FileInfo({ filePath, onClose }) {
    const theme = defaultTheme;
    const [info, setInfo] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        try {
            const stats = fs.statSync(filePath);
            const details = {
                name: path.basename(filePath),
                path: filePath,
                size: stats.size,
                isDirectory: stats.isDirectory(),
                isSymlink: stats.isSymbolicLink(),
                permissions: formatPermissions(stats.mode),
                owner: stats.uid,
                group: stats.gid,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                inode: stats.ino,
                links: stats.nlink,
            };
            if (stats.isDirectory()) {
                try {
                    const entries = fs.readdirSync(filePath);
                    details.itemCount = entries.length;
                    details.totalSize = calculateDirSize(filePath);
                }
                catch {
                    details.itemCount = 0;
                }
            }
            setInfo(details);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [filePath]);
    useInput((input, key) => {
        if (key.escape || input === 'q' || input === 'Q' || key.return) {
            onClose();
        }
    });
    if (error) {
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.error, padding: 1, marginX: 4, children: [_jsxs(Text, { color: theme.colors.error, children: ["Error: ", error] }), _jsx(Text, { color: theme.colors.textDim, children: "Press any key to close" })] }));
    }
    if (!info) {
        return (_jsx(Box, { borderStyle: "double", borderColor: theme.colors.borderActive, padding: 1, marginX: 4, children: _jsx(Text, { children: "Loading..." }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.borderActive, paddingX: 2, paddingY: 1, marginX: 4, children: [_jsx(Box, { justifyContent: "center", marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.colors.borderActive, children: "File Information" }) }), _jsx(InfoRow, { label: "Name", value: info.name, theme: theme }), _jsx(InfoRow, { label: "Path", value: info.path, theme: theme }), _jsx(InfoRow, { label: "Type", value: info.isDirectory ? 'Directory' : info.isSymlink ? 'Symbolic Link' : 'File', theme: theme }), _jsx(InfoRow, { label: "Size", value: formatSize(info.size), theme: theme }), info.isDirectory && info.totalSize !== undefined && (_jsx(InfoRow, { label: "Total Size", value: formatSize(info.totalSize), theme: theme })), info.isDirectory && info.itemCount !== undefined && (_jsx(InfoRow, { label: "Items", value: String(info.itemCount), theme: theme })), _jsx(Text, { children: " " }), _jsx(InfoRow, { label: "Permissions", value: info.permissions, theme: theme }), _jsx(InfoRow, { label: "Owner/Group", value: `${info.owner}/${info.group}`, theme: theme }), _jsx(InfoRow, { label: "Links", value: String(info.links), theme: theme }), _jsx(InfoRow, { label: "Inode", value: String(info.inode), theme: theme }), _jsx(Text, { children: " " }), _jsx(InfoRow, { label: "Created", value: formatDate(info.created), theme: theme }), _jsx(InfoRow, { label: "Modified", value: formatDate(info.modified), theme: theme }), _jsx(InfoRow, { label: "Accessed", value: formatDate(info.accessed), theme: theme }), _jsx(Text, { children: " " }), _jsx(Text, { dimColor: true, children: "Press any key to close" })] }));
}
function InfoRow({ label, value, theme }) {
    return (_jsxs(Box, { children: [_jsx(Text, { color: theme.colors.textDim, children: label.padEnd(12) }), _jsx(Text, { color: theme.colors.text, children: value })] }));
}
function calculateDirSize(dirPath, depth = 0, visitedPaths = new Set()) {
    // SECURITY FIX: Prevent stack overflow with depth limit
    const MAX_DEPTH = 10;
    if (depth > MAX_DEPTH) {
        return 0;
    }
    // SECURITY FIX: Prevent infinite loops from circular symlinks
    try {
        const realPath = fs.realpathSync(dirPath);
        if (visitedPaths.has(realPath)) {
            return 0;
        }
        visitedPaths.add(realPath);
    }
    catch {
        return 0;
    }
    let size = 0;
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            try {
                if (entry.isDirectory()) {
                    size += calculateDirSize(fullPath, depth + 1, visitedPaths);
                }
                else {
                    size += fs.statSync(fullPath).size;
                }
            }
            catch {
                // Skip inaccessible files
            }
        }
    }
    catch {
        // Skip inaccessible directories
    }
    return size;
}
//# sourceMappingURL=FileInfo.js.map