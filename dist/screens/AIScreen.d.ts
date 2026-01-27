/**
 * AIScreen - AI 대화 전체 화면
 * aiexecode의 App.js 구조를 그대로 따름
 */
export interface HistoryItem {
    type: 'user' | 'assistant' | 'error' | 'system';
    content: string;
    id: number;
}
interface AIScreenProps {
    currentPath: string;
    onClose: () => void;
    initialHistory?: HistoryItem[];
    initialSessionId?: string | null;
    onSessionUpdate?: (history: HistoryItem[], sessionId: string | null) => void;
}
export default function AIScreen({ currentPath, onClose, initialHistory, initialSessionId, onSessionUpdate }: AIScreenProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AIScreen.d.ts.map