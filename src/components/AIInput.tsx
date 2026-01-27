/**
 * AIInput - Advanced Input component with multi-line support
 * Ported from aiexecode
 */

import React, { useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import { useKeypress, keyMatchers, NormalizedKey } from '../hooks/useKeypress.js';
import { useTextBuffer, cpLen, cpSlice, TextBuffer } from '../hooks/useTextBuffer.js';

// Placeholder 메시지
const PLACEHOLDER_MESSAGES = [
    '  Ask me about file operations...',
    '  What would you like me to help with?',
    '  Type your question or command...',
    '  How can I assist you today?',
    '  What files should I work with?',
];

function getRandomPlaceholder(): string {
    return PLACEHOLDER_MESSAGES[Math.floor(Math.random() * PLACEHOLDER_MESSAGES.length)];
}

interface AIInputProps {
    onSubmit: (value: string) => void;
    onExit?: () => void;
    placeholder?: string;
    focus?: boolean;
    isProcessing?: boolean;
    terminalWidth?: number;
}

export function AIInput({
    onSubmit,
    onExit,
    placeholder,
    focus = true,
    isProcessing = false,
    terminalWidth = 80
}: AIInputProps) {
    const defaultPlaceholder = useMemo(() => placeholder || getRandomPlaceholder(), []);

    const buffer = useTextBuffer({
        viewport: { width: terminalWidth - 6, height: 10 }
    });

    const handleSubmitAndClear = useCallback((submittedValue: string) => {
        buffer.setText('');
        onSubmit(submittedValue);
    }, [onSubmit, buffer]);

    const handleInput = useCallback((key: NormalizedKey) => {
        if (!focus || isProcessing) return;

        // PRIORITY 1: Handle paste events
        if (key.paste) {
            buffer.handleInput(key);
            return;
        }

        // PRIORITY 2: Escape handling
        if (keyMatchers.ESCAPE(key)) {
            if (buffer.text !== '') {
                buffer.setText('');
                return;
            }
            if (onExit) {
                onExit();
            }
            return;
        }

        // PRIORITY 3: Submit handling
        if (keyMatchers.SUBMIT(key)) {
            if (buffer.text.trim()) {
                const [row, col] = buffer.cursor;
                const line = buffer.lines[row];
                const charBefore = col > 0 ? cpSlice(line, col - 1, col) : '';

                if (charBefore === '\\') {
                    buffer.backspace();
                    buffer.newline();
                } else {
                    handleSubmitAndClear(buffer.text);
                }
            }
            return;
        }

        // PRIORITY 4: Newline (Shift+Enter)
        if (keyMatchers.NEWLINE(key)) {
            buffer.newline();
            return;
        }

        // PRIORITY 5: Navigation commands
        if (keyMatchers.HOME(key)) {
            buffer.move('home');
            return;
        }

        if (keyMatchers.END(key)) {
            buffer.move('end');
            return;
        }

        if (keyMatchers.KILL_LINE_LEFT(key)) {
            buffer.killLineLeft();
            return;
        }

        if (keyMatchers.KILL_LINE_RIGHT(key)) {
            buffer.killLineRight();
            return;
        }

        if (keyMatchers.DELETE_WORD_BACKWARD(key)) {
            buffer.deleteWordLeft();
            return;
        }

        // PRIORITY 6: Arrow keys
        if (key.upArrow) {
            buffer.move('up');
            return;
        }
        if (key.downArrow) {
            buffer.move('down');
            return;
        }
        if (key.leftArrow) {
            buffer.move('left');
            return;
        }
        if (key.rightArrow) {
            buffer.move('right');
            return;
        }

        // PRIORITY 7: Backspace and Delete
        if (key.backspace) {
            const count = key.repeatCount || 1;
            for (let i = 0; i < count; i++) {
                buffer.backspace();
            }
            return;
        }

        if (key.delete) {
            const count = key.repeatCount || 1;
            for (let i = 0; i < count; i++) {
                buffer.delete();
            }
            return;
        }

        // PRIORITY 8: Default input handling
        buffer.handleInput(key);
    }, [focus, buffer, handleSubmitAndClear, onExit, isProcessing]);

    useKeypress(handleInput, { isActive: focus && !isProcessing });

    const linesToRender = useMemo(() => buffer.viewportVisualLines, [buffer.viewportVisualLines]);
    const [cursorVisualRowAbsolute, cursorVisualColAbsolute] = useMemo(() => buffer.visualCursor, [buffer.visualCursor]);
    const scrollVisualRow = useMemo(() => buffer.visualScrollRow, [buffer.visualScrollRow]);
    const cursorVisualRow = cursorVisualRowAbsolute - scrollVisualRow;
    const bufferTextLength = useMemo(() => buffer.text.length, [buffer.text]);

    // Theme colors
    const brandLight = '#47c9a0';
    const textPrimary = '#E0E0E0';
    const textSecondary = '#888888';

    return (
        <Box flexDirection="column" flexGrow={1}>
            <Box
                borderStyle="round"
                borderColor={brandLight}
                paddingX={1}
                flexDirection="row"
                alignItems="flex-start"
                minHeight={3}
                flexShrink={0}
            >
                <Text color={brandLight}>{'> '}</Text>
                <Box flexGrow={1} flexDirection="column">
                    {bufferTextLength === 0 && defaultPlaceholder
                        ? (focus && !isProcessing
                            ? (
                                <Text>
                                    {chalk.inverse(defaultPlaceholder.slice(0, 1))}
                                    <Text color={textSecondary}>{defaultPlaceholder.slice(1)}</Text>
                                </Text>
                            )
                            : <Text color={textSecondary}>{defaultPlaceholder}</Text>
                        )
                        : linesToRender.map((lineText, visualIdxInRenderedSet) => {
                            const isOnCursorLine = focus && !isProcessing && visualIdxInRenderedSet === cursorVisualRow;
                            let display = lineText;

                            // Render cursor inline
                            if (isOnCursorLine && cursorVisualColAbsolute < cpLen(lineText)) {
                                const charToHighlight = cpSlice(lineText, cursorVisualColAbsolute, cursorVisualColAbsolute + 1);
                                const highlighted = chalk.inverse(charToHighlight);
                                display =
                                    cpSlice(lineText, 0, cursorVisualColAbsolute) +
                                    highlighted +
                                    cpSlice(lineText, cursorVisualColAbsolute + 1);
                            } else if (isOnCursorLine && cursorVisualColAbsolute === cpLen(lineText)) {
                                display = lineText + chalk.inverse(' ');
                            }

                            return (
                                <Box key={`line-${visualIdxInRenderedSet}`} height={1}>
                                    <Text color={textPrimary}>{display}</Text>
                                </Box>
                            );
                        })
                    }
                </Box>
            </Box>
        </Box>
    );
}
