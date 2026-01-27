/**
 * Keypress hook for handling keyboard input
 * Ported from aiexecode
 */

import { useInput } from 'ink';

export interface NormalizedKey {
    sequence: string;
    name: string | undefined;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    escape: boolean;
    return: boolean;
    upArrow: boolean;
    downArrow: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
    backspace: boolean;
    delete: boolean;
    repeatCount: number;
    tab: boolean;
    home: boolean;
    end: boolean;
    pageUp: boolean;
    pageDown: boolean;
    paste: boolean;
}

export function useKeypress(
    handler: (key: NormalizedKey) => void,
    options: { isActive?: boolean } = {}
) {
    const { isActive = true } = options;

    useInput((input, key) => {
        if (!isActive) return;

        // Fix backspace detection - Ink has serious bugs
        let actualBackspace = false;
        let actualDelete = false;

        // Check key.name first (most reliable when present)
        if ((key as any).name === 'backspace') {
            actualBackspace = true;
        } else if ((key as any).name === 'delete') {
            actualDelete = true;
        }
        // If key.name is undefined, check the original flags
        else if ((key as any).backspace === true) {
            if (input && input.length > 0) {
                actualBackspace = true;
            } else {
                return;
            }
        } else if ((key as any).delete === true) {
            if (!input || input.length === 0) {
                actualBackspace = true;
            } else {
                actualDelete = true;
            }
        }
        // Last resort: check input sequence
        else if (input && input.length > 0) {
            const charCode = input.charCodeAt(0);
            if (charCode === 127 || charCode === 8) {
                actualBackspace = true;
            } else if (input === '\x1B[3~' || input.startsWith('\x1B[3')) {
                actualDelete = true;
            }
        }

        // Count multiple backspaces/deletes in the sequence
        let repeatCount = 1;
        if ((actualBackspace || actualDelete) && input && input.length > 1) {
            if (actualBackspace) {
                repeatCount = Array.from(input).filter(c =>
                    c.charCodeAt(0) === 127 || c.charCodeAt(0) === 8
                ).length;
            }
        }

        // Detect Ctrl+C/D when name is undefined
        let detectedName = (key as any).name;
        if (key.ctrl && !detectedName && input) {
            if (input.toLowerCase() === 'c') {
                detectedName = 'c';
            } else if (input.toLowerCase() === 'd') {
                detectedName = 'd';
            } else {
                const charCode = input.charCodeAt(0);
                if (charCode === 3) {
                    detectedName = 'c';
                } else if (charCode === 4) {
                    detectedName = 'd';
                }
            }
        }

        const normalizedKey: NormalizedKey = {
            sequence: input,
            name: key.return ? 'return' : detectedName,
            ctrl: key.ctrl ?? false,
            meta: key.meta ?? false,
            shift: key.shift ?? false,
            escape: key.escape ?? false,
            return: key.return ?? false,
            upArrow: key.upArrow ?? false,
            downArrow: key.downArrow ?? false,
            leftArrow: key.leftArrow ?? false,
            rightArrow: key.rightArrow ?? false,
            backspace: actualBackspace,
            delete: actualDelete,
            repeatCount: repeatCount,
            tab: key.tab ?? false,
            home: (key as any).home ?? false,
            end: (key as any).end ?? false,
            pageUp: key.pageUp ?? false,
            pageDown: key.pageDown ?? false,
            paste: (key as any).paste ?? false,
        };

        handler(normalizedKey);
    }, { isActive });
}

/**
 * Key matcher functions
 */
export const keyMatchers = {
    SUBMIT: (key: NormalizedKey) => key.return && !key.shift && !key.ctrl && !key.meta,
    NEWLINE: (key: NormalizedKey) => key.return && key.shift,
    ESCAPE: (key: NormalizedKey) => key.escape,
    NAVIGATION_UP: (key: NormalizedKey) => key.upArrow && !key.ctrl,
    NAVIGATION_DOWN: (key: NormalizedKey) => key.downArrow && !key.ctrl,
    ACCEPT_SUGGESTION: (key: NormalizedKey) => key.tab,
    HOME: (key: NormalizedKey) => (key.name === 'a' && key.ctrl) || key.home,
    END: (key: NormalizedKey) => (key.name === 'e' && key.ctrl) || key.end,
    CLEAR_INPUT: (key: NormalizedKey) => key.name === 'c' && key.ctrl && !key.meta,
    CLEAR_SCREEN: (key: NormalizedKey) => key.name === 'l' && key.ctrl,
    KILL_LINE_RIGHT: (key: NormalizedKey) => key.name === 'k' && key.ctrl,
    KILL_LINE_LEFT: (key: NormalizedKey) => key.name === 'u' && key.ctrl,
    DELETE_WORD_BACKWARD: (key: NormalizedKey) => key.name === 'w' && key.ctrl,
    QUIT: (key: NormalizedKey) => key.name === 'c' && key.ctrl,
    EXIT: (key: NormalizedKey) => key.name === 'd' && key.ctrl,
};

export const Command = {
    SUBMIT: 'SUBMIT',
    NEWLINE: 'NEWLINE',
    ESCAPE: 'ESCAPE',
    NAVIGATION_UP: 'NAVIGATION_UP',
    NAVIGATION_DOWN: 'NAVIGATION_DOWN',
    ACCEPT_SUGGESTION: 'ACCEPT_SUGGESTION',
    HOME: 'HOME',
    END: 'END',
    CLEAR_INPUT: 'CLEAR_INPUT',
    CLEAR_SCREEN: 'CLEAR_SCREEN',
    KILL_LINE_RIGHT: 'KILL_LINE_RIGHT',
    KILL_LINE_LEFT: 'KILL_LINE_LEFT',
    DELETE_WORD_BACKWARD: 'DELETE_WORD_BACKWARD',
    QUIT: 'QUIT',
    EXIT: 'EXIT',
} as const;
