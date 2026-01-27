import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'fs';
import path from 'path';
import { defaultTheme } from '../themes/classic-blue.js';
export default function FileViewer({ filePath, onClose }) {
    const theme = defaultTheme;
    const { stdout } = useStdout();
    const [lines, setLines] = useState([]);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [matchLines, setMatchLines] = useState([]);
    const [currentMatch, setCurrentMatch] = useState(0);
    const termHeight = stdout?.rows || 24;
    // 터미널 높이에서 border(2) + header(1) + status bar(1) + search bar(1) 제외
    const visibleLines = Math.max(5, termHeight - 5);
    const fileName = path.basename(filePath);
    useEffect(() => {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            setLines(content.split('\n'));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [filePath]);
    // Update search matches when search term changes
    useEffect(() => {
        if (searchTerm) {
            const matches = [];
            lines.forEach((line, idx) => {
                if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
                    matches.push(idx);
                }
            });
            setMatchLines(matches);
            setCurrentMatch(0);
            if (matches.length > 0) {
                setScrollOffset(Math.max(0, matches[0] - 5));
            }
        }
        else {
            setMatchLines([]);
        }
    }, [searchTerm, lines]);
    useInput((input, key) => {
        if (searchMode) {
            if (key.escape) {
                setSearchMode(false);
                setSearchInput('');
            }
            else if (key.return) {
                setSearchTerm(searchInput);
                setSearchMode(false);
            }
            else if (key.backspace || key.delete) {
                setSearchInput(prev => prev.slice(0, -1));
            }
            else if (input && !key.ctrl && !key.meta) {
                setSearchInput(prev => prev + input);
            }
            return;
        }
        if (key.escape || input === 'q' || input === 'Q') {
            onClose();
        }
        else if (key.upArrow || input === 'k') {
            setScrollOffset(prev => Math.max(0, prev - 1));
        }
        else if (key.downArrow || input === 'j') {
            setScrollOffset(prev => Math.min(lines.length - visibleLines, prev + 1));
        }
        else if (key.pageUp) {
            setScrollOffset(prev => Math.max(0, prev - visibleLines));
        }
        else if (key.pageDown) {
            setScrollOffset(prev => Math.min(lines.length - visibleLines, prev + visibleLines));
        }
        else if (key.home || input === 'g') {
            setScrollOffset(0);
        }
        else if (key.end || input === 'G') {
            setScrollOffset(Math.max(0, lines.length - visibleLines));
        }
        else if (input === '/') {
            setSearchMode(true);
            setSearchInput('');
        }
        else if (input === 'n' && matchLines.length > 0) {
            // Next match
            const next = (currentMatch + 1) % matchLines.length;
            setCurrentMatch(next);
            setScrollOffset(Math.max(0, matchLines[next] - 5));
        }
        else if (input === 'N' && matchLines.length > 0) {
            // Previous match
            const prev = (currentMatch - 1 + matchLines.length) % matchLines.length;
            setCurrentMatch(prev);
            setScrollOffset(Math.max(0, matchLines[prev] - 5));
        }
    });
    if (error) {
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.error, padding: 1, marginX: 2, children: [_jsxs(Text, { color: theme.colors.error, children: ["Error: ", error] }), _jsx(Text, { color: theme.colors.textDim, children: "Press any key to close" })] }));
    }
    const visibleContent = lines.slice(scrollOffset, scrollOffset + visibleLines);
    const totalLines = lines.length;
    const percentage = totalLines > 0 ? Math.round(((scrollOffset + visibleLines) / totalLines) * 100) : 100;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.borderActive, marginX: 1, children: [_jsxs(Box, { justifyContent: "space-between", paddingX: 1, backgroundColor: theme.colors.bgHeader, children: [_jsx(Text, { color: theme.colors.textHeader, bold: true, children: fileName }), _jsxs(Text, { color: theme.colors.textHeader, children: [scrollOffset + 1, "-", Math.min(scrollOffset + visibleLines, totalLines), "/", totalLines, " (", percentage, "%)"] })] }), _jsx(Box, { flexDirection: "column", paddingX: 1, children: visibleContent.map((line, idx) => {
                    const lineNum = scrollOffset + idx;
                    const isMatch = matchLines.includes(lineNum);
                    const isCurrentMatch = matchLines[currentMatch] === lineNum;
                    return (_jsxs(Box, { children: [_jsxs(Text, { color: theme.colors.textDim, children: [String(lineNum + 1).padStart(4), " "] }), _jsx(Text, { color: isCurrentMatch ? theme.colors.textSelected : isMatch ? theme.colors.warning : theme.colors.text, backgroundColor: isCurrentMatch ? theme.colors.bgSelected : undefined, children: highlightSearch(line, searchTerm, theme) })] }, lineNum));
                }) }), searchMode && (_jsx(Box, { paddingX: 1, backgroundColor: theme.colors.bgStatusBar, children: _jsxs(Text, { color: theme.colors.textHeader, children: ["Search: ", searchInput, "_"] }) })), _jsxs(Box, { justifyContent: "space-between", paddingX: 1, backgroundColor: theme.colors.bgStatusBar, children: [_jsxs(Text, { color: theme.colors.textHeader, children: [searchTerm && `"${searchTerm}" ${matchLines.length} matches `, matchLines.length > 0 && `(${currentMatch + 1}/${matchLines.length})`] }), _jsx(Text, { color: theme.colors.textHeader, children: "[q]Quit [/]Search [n/N]Next/Prev" })] })] }));
}
function highlightSearch(line, term, theme) {
    if (!term)
        return line;
    const parts = [];
    let lastIndex = 0;
    const lowerLine = line.toLowerCase();
    const lowerTerm = term.toLowerCase();
    let index = lowerLine.indexOf(lowerTerm);
    let partKey = 0;
    while (index !== -1) {
        if (index > lastIndex) {
            parts.push(_jsx(Text, { children: line.slice(lastIndex, index) }, partKey++));
        }
        parts.push(_jsx(Text, { backgroundColor: theme.colors.warning, color: "black", children: line.slice(index, index + term.length) }, partKey++));
        lastIndex = index + term.length;
        index = lowerLine.indexOf(lowerTerm, lastIndex);
    }
    if (lastIndex < line.length) {
        parts.push(_jsx(Text, { children: line.slice(lastIndex) }, partKey++));
    }
    return parts.length > 0 ? _jsx(_Fragment, { children: parts }) : line;
}
//# sourceMappingURL=FileViewer.js.map