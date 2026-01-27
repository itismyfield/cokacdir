import type { SortBy } from '../types/index.js';
interface FileManagerProps {
    currentPath: string;
    selectedIndex: number;
    showHidden: boolean;
    sortBy: SortBy;
    refreshTrigger: number;
    onNavigate: (path: string) => void;
    onFileCountChange: (count: number) => void;
    onRegisterEnterHandler: (handler: () => void) => void;
}
export default function FileManager({ currentPath, selectedIndex, showHidden, sortBy, refreshTrigger, onNavigate, onFileCountChange, onRegisterEnterHandler, }: FileManagerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FileManager.d.ts.map