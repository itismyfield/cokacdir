/**
 * Keypress hook for handling keyboard input
 * Ported from aiexecode
 */
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
export declare function useKeypress(handler: (key: NormalizedKey) => void, options?: {
    isActive?: boolean;
}): void;
/**
 * Key matcher functions
 */
export declare const keyMatchers: {
    SUBMIT: (key: NormalizedKey) => boolean;
    NEWLINE: (key: NormalizedKey) => boolean;
    ESCAPE: (key: NormalizedKey) => boolean;
    NAVIGATION_UP: (key: NormalizedKey) => boolean;
    NAVIGATION_DOWN: (key: NormalizedKey) => boolean;
    ACCEPT_SUGGESTION: (key: NormalizedKey) => boolean;
    HOME: (key: NormalizedKey) => boolean;
    END: (key: NormalizedKey) => boolean;
    CLEAR_INPUT: (key: NormalizedKey) => boolean;
    CLEAR_SCREEN: (key: NormalizedKey) => boolean;
    KILL_LINE_RIGHT: (key: NormalizedKey) => boolean;
    KILL_LINE_LEFT: (key: NormalizedKey) => boolean;
    DELETE_WORD_BACKWARD: (key: NormalizedKey) => boolean;
    QUIT: (key: NormalizedKey) => boolean;
    EXIT: (key: NormalizedKey) => boolean;
};
export declare const Command: {
    readonly SUBMIT: "SUBMIT";
    readonly NEWLINE: "NEWLINE";
    readonly ESCAPE: "ESCAPE";
    readonly NAVIGATION_UP: "NAVIGATION_UP";
    readonly NAVIGATION_DOWN: "NAVIGATION_DOWN";
    readonly ACCEPT_SUGGESTION: "ACCEPT_SUGGESTION";
    readonly HOME: "HOME";
    readonly END: "END";
    readonly CLEAR_INPUT: "CLEAR_INPUT";
    readonly CLEAR_SCREEN: "CLEAR_SCREEN";
    readonly KILL_LINE_RIGHT: "KILL_LINE_RIGHT";
    readonly KILL_LINE_LEFT: "KILL_LINE_LEFT";
    readonly DELETE_WORD_BACKWARD: "DELETE_WORD_BACKWARD";
    readonly QUIT: "QUIT";
    readonly EXIT: "EXIT";
};
//# sourceMappingURL=useKeypress.d.ts.map