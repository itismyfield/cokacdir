import type { PanelSide } from './types/index.js';
interface PanelState {
    leftPath: string;
    rightPath: string;
    activePanel: PanelSide;
    leftIndex: number;
    rightIndex: number;
}
interface AppProps {
    onEnterAI?: (currentPath: string) => void;
    initialLeftPath?: string;
    initialRightPath?: string;
    initialActivePanel?: PanelSide;
    initialLeftIndex?: number;
    initialRightIndex?: number;
    onSavePanelState?: (state: PanelState) => void;
}
export default function App({ onEnterAI, initialLeftPath, initialRightPath, initialActivePanel, initialLeftIndex, initialRightIndex, onSavePanelState, }: AppProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=App.d.ts.map