import type { FileItem } from '../types/index.js';
interface PanelProps {
    currentPath: string;
    isActive: boolean;
    selectedIndex: number;
    selectedFiles: Set<string>;
    width: number;
    height?: number;
    onFilesLoad?: (files: FileItem[]) => void;
}
export default function Panel({ currentPath, isActive, selectedIndex, selectedFiles, width, height, onFilesLoad, }: PanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Panel.d.ts.map