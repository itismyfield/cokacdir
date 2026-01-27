import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Markdown Renderer for Terminal
 * Based on aiexecode's markdown rendering approach
 * Adapted for cokacdir project (TypeScript + Ink)
 */
import React from 'react';
import { Text, Box } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';
// Theme colors for markdown rendering
const mdTheme = {
    text: {
        primary: defaultTheme.colors.text,
        secondary: defaultTheme.colors.textDim,
        link: defaultTheme.colors.info,
    },
    status: {
        warning: defaultTheme.colors.warning,
    },
};
// Marker lengths for inline formatting
const MARKER_LENGTHS = {
    BOLD: 2,
    ITALIC: 1,
    STRIKE: 2,
    CODE: 1,
    UNDERLINE_START: 3,
    UNDERLINE_END: 4,
};
// Spacing constants
const SPACING = {
    EMPTY_LINE: 1,
    CODE_PADDING: 1,
    LIST_PREFIX_PAD: 1,
    LIST_TEXT_GROW: 1,
};
/**
 * Calculate display width of text (considering multi-byte characters)
 */
function calculateTextWidth(content) {
    // Remove markdown formatting to get actual display width
    const plainText = content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/<u>(.*?)<\/u>/g, '$1')
        .replace(/.*\[(.*?)\]\(.*\)/g, '$1');
    // Simple width calculation (could use string-width for better accuracy)
    let width = 0;
    for (const char of plainText) {
        const code = char.charCodeAt(0);
        // CJK characters are typically double-width
        if (code >= 0x1100 && (code <= 0x115f || // Hangul Jamo
            code === 0x2329 || code === 0x232a ||
            (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
            (code >= 0xac00 && code <= 0xd7a3) ||
            (code >= 0xf900 && code <= 0xfaff) ||
            (code >= 0xfe10 && code <= 0xfe1f) ||
            (code >= 0xfe30 && code <= 0xfe6f) ||
            (code >= 0xff00 && code <= 0xff60) ||
            (code >= 0xffe0 && code <= 0xffe6))) {
            width += 2;
        }
        else {
            width += 1;
        }
    }
    return width;
}
const ProcessInlineTextInternal = ({ content }) => {
    // Quick check - if no markdown patterns, return plain text
    if (!/[*_~`<[https?:]/.test(content)) {
        return _jsx(Text, { color: mdTheme.text.primary, children: content });
    }
    const elements = [];
    let currentPosition = 0;
    const patternRegex = /(\*\*.*?\*\*|\*.*?\*|_.*?_|~~.*?~~|\[.*?\]\(.*?\)|`+.+?`+|<u>.*?<\/u>|https?:\/\/\S+)/g;
    let matchResult;
    while ((matchResult = patternRegex.exec(content)) !== null) {
        // Add plain text before match
        if (matchResult.index > currentPosition) {
            elements.push(_jsx(Text, { children: content.slice(currentPosition, matchResult.index) }, `plain-${currentPosition}`));
        }
        const matchedText = matchResult[0];
        let formattedElement = null;
        const elementKey = `fmt-${matchResult.index}`;
        try {
            // Bold: **text**
            if (matchedText.startsWith('**') && matchedText.endsWith('**') && matchedText.length > MARKER_LENGTHS.BOLD * 2) {
                formattedElement = (_jsx(Text, { bold: true, children: matchedText.slice(MARKER_LENGTHS.BOLD, -MARKER_LENGTHS.BOLD) }, elementKey));
            }
            // Italic: *text* or _text_
            else if (matchedText.length > MARKER_LENGTHS.ITALIC * 2 &&
                ((matchedText.startsWith('*') && matchedText.endsWith('*')) ||
                    (matchedText.startsWith('_') && matchedText.endsWith('_')))) {
                // Check context to avoid matching file paths like /path/to/file
                const prevChar = content.substring(matchResult.index - 1, matchResult.index);
                const nextChar = content.substring(patternRegex.lastIndex, patternRegex.lastIndex + 1);
                if (!/\w/.test(prevChar) && !/\w/.test(nextChar)) {
                    formattedElement = (_jsx(Text, { italic: true, children: matchedText.slice(MARKER_LENGTHS.ITALIC, -MARKER_LENGTHS.ITALIC) }, elementKey));
                }
            }
            // Strikethrough: ~~text~~
            else if (matchedText.startsWith('~~') && matchedText.endsWith('~~') && matchedText.length > MARKER_LENGTHS.STRIKE * 2) {
                formattedElement = (_jsx(Text, { strikethrough: true, children: matchedText.slice(MARKER_LENGTHS.STRIKE, -MARKER_LENGTHS.STRIKE) }, elementKey));
            }
            // Inline code: `code`
            else if (matchedText.startsWith('`') && matchedText.endsWith('`') && matchedText.length > MARKER_LENGTHS.CODE) {
                const codePattern = matchedText.match(/^(`+)(.+?)\1$/s);
                if (codePattern && codePattern[2]) {
                    formattedElement = (_jsx(Text, { color: mdTheme.status.warning, children: codePattern[2] }, elementKey));
                }
            }
            // Link: [label](url)
            else if (matchedText.startsWith('[') && matchedText.includes('](') && matchedText.endsWith(')')) {
                const linkPattern = matchedText.match(/\[(.*?)\]\((.*?)\)/);
                if (linkPattern) {
                    formattedElement = (_jsxs(Text, { children: [linkPattern[1], _jsxs(Text, { color: mdTheme.text.link, children: [" (", linkPattern[2], ")"] })] }, elementKey));
                }
            }
            // Underline: <u>text</u>
            else if (matchedText.startsWith('<u>') && matchedText.endsWith('</u>')) {
                formattedElement = (_jsx(Text, { underline: true, children: matchedText.slice(MARKER_LENGTHS.UNDERLINE_START, -MARKER_LENGTHS.UNDERLINE_END) }, elementKey));
            }
            // URL: https://...
            else if (/^https?:\/\//.test(matchedText)) {
                formattedElement = (_jsx(Text, { color: mdTheme.text.link, children: matchedText }, elementKey));
            }
        }
        catch {
            // Parsing error - ignore
            formattedElement = null;
        }
        elements.push(formattedElement ?? _jsx(Text, { children: matchedText }, elementKey));
        currentPosition = patternRegex.lastIndex;
    }
    // Add remaining text
    if (currentPosition < content.length) {
        elements.push(_jsx(Text, { children: content.slice(currentPosition) }, `plain-${currentPosition}`));
    }
    return _jsx(_Fragment, { children: elements.filter((el) => el !== null) });
};
const ProcessInlineText = React.memo(ProcessInlineTextInternal);
const BuildCodeBlockInternal = ({ lines, language, terminalWidth }) => {
    const codeContent = lines.join('\n');
    return (_jsxs(Box, { paddingLeft: SPACING.CODE_PADDING, flexDirection: "column", children: [language && (_jsx(Text, { color: mdTheme.text.secondary, dimColor: true, children: language })), _jsx(Text, { color: mdTheme.status.warning, children: codeContent })] }));
};
const BuildCodeBlock = React.memo(BuildCodeBlockInternal);
const BuildListItemInternal = ({ itemText, listType, marker, indentation = '' }) => {
    const displayPrefix = listType === 'ol' ? `${marker}. ` : `${marker} `;
    const indentAmount = indentation.length;
    return (_jsxs(Box, { paddingLeft: indentAmount + SPACING.LIST_PREFIX_PAD, flexDirection: "row", children: [_jsx(Box, { width: displayPrefix.length, children: _jsx(Text, { color: mdTheme.text.primary, children: displayPrefix }) }), _jsx(Box, { flexGrow: SPACING.LIST_TEXT_GROW, children: _jsx(Text, { wrap: "wrap", color: mdTheme.text.primary, children: _jsx(ProcessInlineText, { content: itemText }) }) })] }));
};
const BuildListItem = React.memo(BuildListItemInternal);
const BuildTableInternal = ({ columnHeaders, dataRows, maxWidth }) => {
    // Calculate column widths
    const widthPerColumn = columnHeaders.map((headerText, columnIndex) => {
        const headerDisplayWidth = calculateTextWidth(headerText);
        const maxDataWidth = Math.max(0, ...dataRows.map((rowData) => calculateTextWidth(rowData[columnIndex] || '')));
        return Math.max(headerDisplayWidth, maxDataWidth) + 2;
    });
    // Shrink if exceeds terminal width
    const totalRequiredWidth = widthPerColumn.reduce((sum, w) => sum + w + 1, 1);
    const shrinkRatio = totalRequiredWidth > maxWidth ? maxWidth / totalRequiredWidth : 1;
    const finalWidths = widthPerColumn.map((w) => Math.floor(w * shrinkRatio));
    // Build border line
    const buildBorderLine = (position) => {
        const borderStyles = {
            top: { leftCorner: '┌', junction: '┬', rightCorner: '┐', line: '─' },
            mid: { leftCorner: '├', junction: '┼', rightCorner: '┤', line: '─' },
            bottom: { leftCorner: '└', junction: '┴', rightCorner: '┘', line: '─' },
        };
        const style = borderStyles[position];
        const segments = finalWidths.map((width) => style.line.repeat(width));
        const borderText = style.leftCorner + segments.join(style.junction) + style.rightCorner;
        return _jsx(Text, { color: mdTheme.text.secondary, children: borderText });
    };
    // Build cell
    const buildCell = (cellText, cellWidth, isHeader = false) => {
        const availableWidth = Math.max(0, cellWidth - 2);
        const actualWidth = calculateTextWidth(cellText);
        let displayText = cellText;
        if (actualWidth > availableWidth) {
            displayText = cellText.substring(0, Math.max(0, availableWidth - 3)) + '...';
        }
        const paddingRequired = Math.max(0, availableWidth - calculateTextWidth(displayText));
        return (_jsxs(Text, { children: [isHeader ? (_jsx(Text, { bold: true, color: mdTheme.text.link, children: _jsx(ProcessInlineText, { content: displayText }) })) : (_jsx(ProcessInlineText, { content: displayText })), ' '.repeat(paddingRequired)] }));
    };
    // Build table row
    const buildTableRow = (rowCells, isHeader = false) => {
        return (_jsxs(Text, { color: mdTheme.text.primary, children: ['│ ', rowCells.map((cell, idx) => (_jsxs(React.Fragment, { children: [buildCell(cell || '', finalWidths[idx] || 0, isHeader), idx < rowCells.length - 1 ? ' │ ' : ''] }, idx))), ' │'] }));
    };
    return (_jsxs(Box, { flexDirection: "column", marginY: 0, children: [buildBorderLine('top'), buildTableRow(columnHeaders, true), buildBorderLine('mid'), dataRows.map((row, idx) => (_jsx(React.Fragment, { children: buildTableRow(row) }, idx))), buildBorderLine('bottom')] }));
};
const BuildTable = React.memo(BuildTableInternal);
export function renderMarkdown(text, options = {}) {
    if (!text)
        return null;
    const { terminalWidth = 80 } = options;
    const lineArray = text.split(/\r?\n/);
    // Regex patterns
    const patterns = {
        header: /^ *(#{1,4}) +(.*)/,
        codeFence: /^ *(`{3,}|~{3,}) *(\w*?) *$/,
        unorderedList: /^([ \t]*)([-*+]) +(.*)/,
        orderedList: /^([ \t]*)(\d+)\. +(.*)/,
        horizontalRule: /^ *([-*_] *){3,} *$/,
        tableRow: /^\s*\|(.+)\|\s*$/,
        tableSeparator: /^\s*\|?\s*(:?-+:?)\s*(\|\s*(:?-+:?)\s*)+\|?\s*$/,
    };
    const blocks = [];
    let previousLineWasEmpty = true;
    // State variables
    let codeBlockActive = false;
    let codeBlockLines = [];
    let codeBlockLanguage = null;
    let codeBlockFence = '';
    let tableActive = false;
    let tableHeaderCells = [];
    let tableDataRows = [];
    function appendBlock(block) {
        if (block) {
            blocks.push(block);
            previousLineWasEmpty = false;
        }
    }
    lineArray.forEach((currentLine, lineIndex) => {
        const lineKey = `ln-${lineIndex}`;
        // Inside code block
        if (codeBlockActive) {
            const fenceMatch = currentLine.match(patterns.codeFence);
            if (fenceMatch &&
                fenceMatch[1].startsWith(codeBlockFence[0]) &&
                fenceMatch[1].length >= codeBlockFence.length) {
                appendBlock(_jsx(BuildCodeBlock, { lines: codeBlockLines, language: codeBlockLanguage, terminalWidth: terminalWidth }, lineKey));
                codeBlockActive = false;
                codeBlockLines = [];
                codeBlockLanguage = null;
                codeBlockFence = '';
            }
            else {
                codeBlockLines.push(currentLine);
            }
            return;
        }
        // Pattern matching
        const fenceMatch = currentLine.match(patterns.codeFence);
        const headerMatch = currentLine.match(patterns.header);
        const ulMatch = currentLine.match(patterns.unorderedList);
        const olMatch = currentLine.match(patterns.orderedList);
        const hrMatch = currentLine.match(patterns.horizontalRule);
        const tableRowMatch = currentLine.match(patterns.tableRow);
        const tableSepMatch = currentLine.match(patterns.tableSeparator);
        // Code block start
        if (fenceMatch) {
            codeBlockActive = true;
            codeBlockFence = fenceMatch[1];
            codeBlockLanguage = fenceMatch[2] || null;
        }
        // Table start detection
        else if (tableRowMatch && !tableActive) {
            if (lineIndex + 1 < lineArray.length && lineArray[lineIndex + 1].match(patterns.tableSeparator)) {
                tableActive = true;
                tableHeaderCells = tableRowMatch[1].split('|').map((cell) => cell.trim());
                tableDataRows = [];
            }
            else {
                appendBlock(_jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: _jsx(ProcessInlineText, { content: currentLine }) }) }, lineKey));
            }
        }
        // Table separator skip
        else if (tableActive && tableSepMatch) {
            // Skip separator line
        }
        // Table data row
        else if (tableActive && tableRowMatch) {
            const cells = tableRowMatch[1].split('|').map((cell) => cell.trim());
            while (cells.length < tableHeaderCells.length)
                cells.push('');
            if (cells.length > tableHeaderCells.length)
                cells.length = tableHeaderCells.length;
            tableDataRows.push(cells);
        }
        // Table end
        else if (tableActive && !tableRowMatch) {
            if (tableHeaderCells.length > 0 && tableDataRows.length > 0) {
                appendBlock(_jsx(BuildTable, { columnHeaders: tableHeaderCells, dataRows: tableDataRows, maxWidth: terminalWidth }, `table-${blocks.length}`));
            }
            tableActive = false;
            tableDataRows = [];
            tableHeaderCells = [];
            // Process current line
            if (currentLine.trim().length > 0) {
                appendBlock(_jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: _jsx(ProcessInlineText, { content: currentLine }) }) }, lineKey));
            }
        }
        // Horizontal rule
        else if (hrMatch) {
            appendBlock(_jsx(Box, { children: _jsx(Text, { dimColor: true, children: '─'.repeat(Math.min(40, terminalWidth - 4)) }) }, lineKey));
        }
        // Headers
        else if (headerMatch) {
            const level = headerMatch[1].length;
            const headerText = headerMatch[2];
            let headerElement = null;
            switch (level) {
                case 1:
                case 2:
                    headerElement = (_jsx(Text, { bold: true, color: mdTheme.text.link, children: _jsx(ProcessInlineText, { content: headerText }) }));
                    break;
                case 3:
                    headerElement = (_jsx(Text, { bold: true, color: mdTheme.text.primary, children: _jsx(ProcessInlineText, { content: headerText }) }));
                    break;
                case 4:
                    headerElement = (_jsx(Text, { italic: true, color: mdTheme.text.secondary, children: _jsx(ProcessInlineText, { content: headerText }) }));
                    break;
                default:
                    headerElement = (_jsx(Text, { color: mdTheme.text.primary, children: _jsx(ProcessInlineText, { content: headerText }) }));
            }
            if (headerElement) {
                appendBlock(_jsx(Box, { children: headerElement }, lineKey));
            }
        }
        // Unordered list
        else if (ulMatch) {
            const [, indent, marker, content] = ulMatch;
            appendBlock(_jsx(BuildListItem, { itemText: content, listType: "ul", marker: marker, indentation: indent }, lineKey));
        }
        // Ordered list
        else if (olMatch) {
            const [, indent, marker, content] = olMatch;
            appendBlock(_jsx(BuildListItem, { itemText: content, listType: "ol", marker: marker, indentation: indent }, lineKey));
        }
        // Empty line or plain text
        else {
            if (currentLine.trim().length === 0 && !codeBlockActive) {
                if (!previousLineWasEmpty) {
                    blocks.push(_jsx(Box, { height: SPACING.EMPTY_LINE }, `space-${lineIndex}`));
                    previousLineWasEmpty = true;
                }
            }
            else {
                appendBlock(_jsx(Box, { children: _jsx(Text, { wrap: "wrap", color: mdTheme.text.primary, children: _jsx(ProcessInlineText, { content: currentLine }) }) }, lineKey));
            }
        }
    });
    // Handle unclosed code block
    if (codeBlockActive) {
        appendBlock(_jsx(BuildCodeBlock, { lines: codeBlockLines, language: codeBlockLanguage, terminalWidth: terminalWidth }, "eof-code"));
    }
    // Handle unclosed table
    if (tableActive && tableHeaderCells.length > 0 && tableDataRows.length > 0) {
        appendBlock(_jsx(BuildTable, { columnHeaders: tableHeaderCells, dataRows: tableDataRows, maxWidth: terminalWidth }, `table-${blocks.length}`));
    }
    return _jsx(_Fragment, { children: blocks });
}
export const MarkdownText = ({ children, width = 80 }) => {
    return _jsx(_Fragment, { children: renderMarkdown(children, { terminalWidth: width }) });
};
//# sourceMappingURL=markdownRenderer.js.map