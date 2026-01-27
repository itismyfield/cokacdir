/**
 * AIInput - Advanced Input component with multi-line support
 * Ported from aiexecode
 */
interface AIInputProps {
    onSubmit: (value: string) => void;
    onExit?: () => void;
    placeholder?: string;
    focus?: boolean;
    isProcessing?: boolean;
    terminalWidth?: number;
}
export declare function AIInput({ onSubmit, onExit, placeholder, focus, isProcessing, terminalWidth }: AIInputProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AIInput.d.ts.map