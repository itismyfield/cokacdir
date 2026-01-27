/**
 * AICommandModal - AI 대화 화면
 * aiexecode의 App.js 구조를 그대로 따름
 */
interface AICommandModalProps {
    currentPath: string;
    terminalWidth: number;
    terminalHeight: number;
    onClose: () => void;
    onExecuteFileOp?: (op: string, args: string[]) => void;
}
export default function AICommandModal({ currentPath, terminalWidth, terminalHeight, onClose, onExecuteFileOp }: AICommandModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AICommandModal.d.ts.map