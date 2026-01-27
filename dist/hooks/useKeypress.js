/**
 * Keypress hook for handling keyboard input
 * Ported from aiexecode
 */
import { useInput } from 'ink';
export function useKeypress(handler, options = {}) {
    const { isActive = true } = options;
    useInput((input, key) => {
        if (!isActive)
            return;
        // Fix backspace detection - Ink has serious bugs
        let actualBackspace = false;
        let actualDelete = false;
        // Check key.name first (most reliable when present)
        if (key.name === 'backspace') {
            actualBackspace = true;
        }
        else if (key.name === 'delete') {
            actualDelete = true;
        }
        // If key.name is undefined, check the original flags
        else if (key.backspace === true) {
            if (input && input.length > 0) {
                actualBackspace = true;
            }
            else {
                return;
            }
        }
        else if (key.delete === true) {
            if (!input || input.length === 0) {
                actualBackspace = true;
            }
            else {
                actualDelete = true;
            }
        }
        // Last resort: check input sequence
        else if (input && input.length > 0) {
            const charCode = input.charCodeAt(0);
            if (charCode === 127 || charCode === 8) {
                actualBackspace = true;
            }
            else if (input === '\x1B[3~' || input.startsWith('\x1B[3')) {
                actualDelete = true;
            }
        }
        // Count multiple backspaces/deletes in the sequence
        let repeatCount = 1;
        if ((actualBackspace || actualDelete) && input && input.length > 1) {
            if (actualBackspace) {
                repeatCount = Array.from(input).filter(c => c.charCodeAt(0) === 127 || c.charCodeAt(0) === 8).length;
            }
        }
        // Detect Ctrl+C/D when name is undefined
        let detectedName = key.name;
        if (key.ctrl && !detectedName && input) {
            if (input.toLowerCase() === 'c') {
                detectedName = 'c';
            }
            else if (input.toLowerCase() === 'd') {
                detectedName = 'd';
            }
            else {
                const charCode = input.charCodeAt(0);
                if (charCode === 3) {
                    detectedName = 'c';
                }
                else if (charCode === 4) {
                    detectedName = 'd';
                }
            }
        }
        const normalizedKey = {
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
            home: key.home ?? false,
            end: key.end ?? false,
            pageUp: key.pageUp ?? false,
            pageDown: key.pageDown ?? false,
            paste: key.paste ?? false,
        };
        handler(normalizedKey);
    }, { isActive });
}
/**
 * Key matcher functions
 */
export const keyMatchers = {
    SUBMIT: (key) => key.return && !key.shift && !key.ctrl && !key.meta,
    NEWLINE: (key) => key.return && key.shift,
    ESCAPE: (key) => key.escape,
    NAVIGATION_UP: (key) => key.upArrow && !key.ctrl,
    NAVIGATION_DOWN: (key) => key.downArrow && !key.ctrl,
    ACCEPT_SUGGESTION: (key) => key.tab,
    HOME: (key) => (key.name === 'a' && key.ctrl) || key.home,
    END: (key) => (key.name === 'e' && key.ctrl) || key.end,
    CLEAR_INPUT: (key) => key.name === 'c' && key.ctrl && !key.meta,
    CLEAR_SCREEN: (key) => key.name === 'l' && key.ctrl,
    KILL_LINE_RIGHT: (key) => key.name === 'k' && key.ctrl,
    KILL_LINE_LEFT: (key) => key.name === 'u' && key.ctrl,
    DELETE_WORD_BACKWARD: (key) => key.name === 'w' && key.ctrl,
    QUIT: (key) => key.name === 'c' && key.ctrl,
    EXIT: (key) => key.name === 'd' && key.ctrl,
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
};
//# sourceMappingURL=useKeypress.js.map