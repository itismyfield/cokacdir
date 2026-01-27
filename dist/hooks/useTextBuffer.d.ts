/**
 * Input Buffer - Advanced text buffer for multi-line input with cursor management
 * Ported from aiexecode
 */
/**
 * Get length in code points
 */
export declare function cpLen(str: string): number;
/**
 * Slice string by code points
 */
export declare function cpSlice(str: string, start: number, end?: number): string;
export interface TextBuffer {
    lines: string[];
    cursor: [number, number];
    text: string;
    allVisualLines: string[];
    viewportVisualLines: string[];
    visualCursor: [number, number];
    visualScrollRow: number;
    viewport: {
        width: number;
        height: number;
    };
    setText: (text: string) => void;
    insertText: (text: string) => void;
    move: (direction: string) => void;
    backspace: () => void;
    delete: () => void;
    newline: () => void;
    killLineRight: () => void;
    killLineLeft: () => void;
    deleteWordLeft: () => void;
    handleInput: (key: {
        sequence: string;
        ctrl?: boolean;
        meta?: boolean;
    }) => void;
}
interface UseTextBufferOptions {
    initialText?: string;
    viewport?: {
        width: number;
        height: number;
    };
}
export declare function useTextBuffer(options?: UseTextBufferOptions): TextBuffer;
export {};
//# sourceMappingURL=useTextBuffer.d.ts.map