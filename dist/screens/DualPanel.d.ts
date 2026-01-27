import type { PanelSide } from '../types/index.js';
interface PanelState {
    leftPath: string;
    rightPath: string;
    activePanel: PanelSide;
    leftIndex: number;
    rightIndex: number;
}
interface DualPanelProps {
    onEnterAI?: (currentPath: string) => void;
    initialLeftPath?: string;
    initialRightPath?: string;
    initialActivePanel?: PanelSide;
    initialLeftIndex?: number;
    initialRightIndex?: number;
    onSavePanelState?: (state: PanelState) => void;
}
export default function DualPanel({ onEnterAI, initialLeftPath, initialRightPath, initialActivePanel, initialLeftIndex, initialRightIndex, onSavePanelState, }: DualPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DualPanel.d.ts.map