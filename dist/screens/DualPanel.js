import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import os from 'os';
import path from 'path';
import Panel from '../components/Panel.js';
import FunctionBar from '../components/FunctionBar.js';
import StatusBar from '../components/StatusBar.js';
import ConfirmDialog from '../components/ConfirmDialog.js';
import InputDialog from '../components/InputDialog.js';
import SearchDialog from '../components/SearchDialog.js';
import FileViewer from '../components/FileViewer.js';
import FileEditor from '../components/FileEditor.js';
import FileInfo from '../components/FileInfo.js';
import ProcessManager from './ProcessManager.js';
import { defaultTheme } from '../themes/classic-blue.js';
import * as fileOps from '../services/fileOps.js';
import { isValidFilename } from '../services/fileOps.js';
import { features } from '../utils/platform.js';
import { APP_TITLE } from '../utils/version.js';
import fs from 'fs';
export default function DualPanel({ onEnterAI, initialLeftPath, initialRightPath, initialActivePanel, initialLeftIndex, initialRightIndex, onSavePanelState, }) {
    const { exit } = useApp();
    const { stdout } = useStdout();
    const theme = defaultTheme;
    const messageTimerRef = useRef(null);
    // Panel paths (초기값은 props에서 받거나 기본값 사용)
    const [leftPath, setLeftPath] = useState(initialLeftPath ?? process.cwd());
    const [rightPath, setRightPath] = useState(initialRightPath ?? os.homedir());
    // Active panel
    const [activePanel, setActivePanel] = useState(initialActivePanel ?? 'left');
    // Selection indices
    const [leftIndex, setLeftIndex] = useState(initialLeftIndex ?? 0);
    const [rightIndex, setRightIndex] = useState(initialRightIndex ?? 0);
    // Selected files (marked with Space)
    const [leftSelected, setLeftSelected] = useState(new Set());
    const [rightSelected, setRightSelected] = useState(new Set());
    // File lists
    const [leftFiles, setLeftFiles] = useState([]);
    const [rightFiles, setRightFiles] = useState([]);
    // 상위 폴더 이동 시 포커스할 디렉토리 이름 (좌/우 각각)
    const [leftPendingFocus, setLeftPendingFocus] = useState(null);
    const [rightPendingFocus, setRightPendingFocus] = useState(null);
    // 정렬 상태 (좌/우 각각)
    const [leftSortBy, setLeftSortBy] = useState('name');
    const [leftSortOrder, setLeftSortOrder] = useState('asc');
    const [rightSortBy, setRightSortBy] = useState('name');
    const [rightSortOrder, setRightSortOrder] = useState('asc');
    // Refresh trigger
    const [refreshKey, setRefreshKey] = useState(0);
    // Modal state
    const [modal, setModal] = useState('none');
    const [message, setMessage] = useState('');
    // Calculate panel dimensions
    const termWidth = stdout?.columns || 80;
    const termHeight = stdout?.rows || 24;
    const panelWidth = Math.floor((termWidth - 2) / 2);
    // Panel height: terminal height minus header (1), message (1), status bar (1), function bar (1)
    const panelHeight = Math.max(10, termHeight - 4);
    // Get current state based on active panel
    const currentPath = activePanel === 'left' ? leftPath : rightPath;
    const targetPath = activePanel === 'left' ? rightPath : leftPath;
    const currentIndex = activePanel === 'left' ? leftIndex : rightIndex;
    const setCurrentIndex = activePanel === 'left' ? setLeftIndex : setRightIndex;
    const currentFiles = activePanel === 'left' ? leftFiles : rightFiles;
    const setCurrentPath = activePanel === 'left' ? setLeftPath : setRightPath;
    const currentSelected = activePanel === 'left' ? leftSelected : rightSelected;
    const setCurrentSelected = activePanel === 'left' ? setLeftSelected : setRightSelected;
    const setPendingFocus = activePanel === 'left' ? setLeftPendingFocus : setRightPendingFocus;
    const currentSortBy = activePanel === 'left' ? leftSortBy : rightSortBy;
    const setCurrentSortBy = activePanel === 'left' ? setLeftSortBy : setRightSortBy;
    const currentSortOrder = activePanel === 'left' ? leftSortOrder : rightSortOrder;
    const setCurrentSortOrder = activePanel === 'left' ? setLeftSortOrder : setRightSortOrder;
    // Get current file
    const currentFile = currentFiles[currentIndex];
    // Get files to operate on (selected or current)
    const getOperationFiles = () => {
        if (currentSelected.size > 0) {
            return Array.from(currentSelected);
        }
        if (currentFile && currentFile.name !== '..') {
            return [currentFile.name];
        }
        return [];
    };
    // Calculate totals
    const calculateTotal = (files) => files.reduce((sum, f) => sum + (f.isDirectory ? 0 : f.size), 0);
    // Refresh panels
    const refresh = useCallback(() => {
        setRefreshKey(k => k + 1);
        setLeftSelected(new Set());
        setRightSelected(new Set());
    }, []);
    // 파일 목록 로드 핸들러 (상위 이동 시 이전 폴더에 포커스)
    const handleLeftFilesLoad = useCallback((files) => {
        setLeftFiles(files);
        if (leftPendingFocus) {
            const idx = files.findIndex(f => f.name === leftPendingFocus);
            if (idx >= 0) {
                setLeftIndex(idx);
            }
            setLeftPendingFocus(null);
        }
    }, [leftPendingFocus]);
    const handleRightFilesLoad = useCallback((files) => {
        setRightFiles(files);
        if (rightPendingFocus) {
            const idx = files.findIndex(f => f.name === rightPendingFocus);
            if (idx >= 0) {
                setRightIndex(idx);
            }
            setRightPendingFocus(null);
        }
    }, [rightPendingFocus]);
    // 정렬 토글 함수
    const toggleSort = useCallback((sortType) => {
        if (currentSortBy === sortType) {
            // 같은 타입이면 방향 토글
            setCurrentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        }
        else {
            // 다른 타입이면 해당 타입으로 변경하고 asc로 시작
            setCurrentSortBy(sortType);
            setCurrentSortOrder('asc');
        }
        setCurrentIndex(0);
    }, [currentSortBy, setCurrentSortBy, setCurrentSortOrder, setCurrentIndex]);
    // Cleanup message timer on unmount
    useEffect(() => {
        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, []);
    // Show temporary message
    const showMessage = (msg, duration = 2000) => {
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }
        setMessage(msg);
        messageTimerRef.current = setTimeout(() => setMessage(''), duration);
    };
    // File operations
    const handleCopy = () => {
        const files = getOperationFiles();
        if (files.length === 0) {
            showMessage('No files selected');
            return;
        }
        let successCount = 0;
        let errorMsg = '';
        for (const fileName of files) {
            const src = path.join(currentPath, fileName);
            const dest = path.join(targetPath, fileName);
            const result = fileOps.copyFile(src, dest);
            if (result.success) {
                successCount++;
            }
            else {
                errorMsg = result.error || 'Unknown error';
            }
        }
        if (successCount === files.length) {
            showMessage(`Copied ${successCount} file(s)`);
        }
        else {
            showMessage(`Copied ${successCount}/${files.length}. Error: ${errorMsg}`);
        }
        setModal('none');
        refresh();
    };
    const handleMove = () => {
        const files = getOperationFiles();
        if (files.length === 0) {
            showMessage('No files selected');
            return;
        }
        let successCount = 0;
        let errorMsg = '';
        for (const fileName of files) {
            const src = path.join(currentPath, fileName);
            const dest = path.join(targetPath, fileName);
            const result = fileOps.moveFile(src, dest);
            if (result.success) {
                successCount++;
            }
            else {
                errorMsg = result.error || 'Unknown error';
            }
        }
        if (successCount === files.length) {
            showMessage(`Moved ${successCount} file(s)`);
        }
        else {
            showMessage(`Moved ${successCount}/${files.length}. Error: ${errorMsg}`);
        }
        setModal('none');
        refresh();
    };
    const handleDelete = () => {
        const files = getOperationFiles();
        if (files.length === 0) {
            showMessage('No files selected');
            return;
        }
        let successCount = 0;
        let errorMsg = '';
        for (const fileName of files) {
            const filePath = path.join(currentPath, fileName);
            const result = fileOps.deleteFile(filePath);
            if (result.success) {
                successCount++;
            }
            else {
                errorMsg = result.error || 'Unknown error';
            }
        }
        if (successCount === files.length) {
            showMessage(`Deleted ${successCount} file(s)`);
        }
        else {
            showMessage(`Deleted ${successCount}/${files.length}. Error: ${errorMsg}`);
        }
        setModal('none');
        refresh();
    };
    const handleMkdir = (name) => {
        // Validate filename
        const validation = isValidFilename(name);
        if (!validation.valid) {
            showMessage(`Error: ${validation.error}`);
            setModal('none');
            return;
        }
        const dirPath = path.join(currentPath, name);
        const result = fileOps.createDirectory(dirPath);
        if (result.success) {
            showMessage(`Created directory: ${name}`);
        }
        else {
            showMessage(`Error: ${result.error}`);
        }
        setModal('none');
        refresh();
    };
    const handleRename = (newName) => {
        if (!currentFile || currentFile.name === '..') {
            showMessage('No file selected');
            setModal('none');
            return;
        }
        // Validate filename
        const validation = isValidFilename(newName);
        if (!validation.valid) {
            showMessage(`Error: ${validation.error}`);
            setModal('none');
            return;
        }
        const oldPath = path.join(currentPath, currentFile.name);
        const newPath = path.join(currentPath, newName);
        const result = fileOps.renameFile(oldPath, newPath);
        if (result.success) {
            showMessage(`Renamed to: ${newName}`);
        }
        else {
            showMessage(`Error: ${result.error}`);
        }
        setModal('none');
        refresh();
    };
    const handleSearch = (term) => {
        if (!term.trim()) {
            setModal('none');
            return;
        }
        const lowerTerm = term.toLowerCase();
        const matchIndex = currentFiles.findIndex(f => f.name.toLowerCase().includes(lowerTerm));
        if (matchIndex >= 0) {
            setCurrentIndex(matchIndex);
            showMessage(`Found: ${currentFiles[matchIndex].name}`);
        }
        else {
            showMessage(`No match for "${term}"`);
        }
        setModal('none');
    };
    const handleAdvancedSearch = (criteria) => {
        const matches = currentFiles.filter(f => {
            // Name filter
            if (criteria.name && !f.name.toLowerCase().includes(criteria.name.toLowerCase())) {
                return false;
            }
            // Size filters
            if (criteria.minSize !== undefined && f.size < criteria.minSize) {
                return false;
            }
            if (criteria.maxSize !== undefined && f.size > criteria.maxSize) {
                return false;
            }
            // Date filters
            if (criteria.modifiedAfter && f.modified < criteria.modifiedAfter) {
                return false;
            }
            if (criteria.modifiedBefore && f.modified > criteria.modifiedBefore) {
                return false;
            }
            return true;
        });
        if (matches.length > 0) {
            const firstMatchIndex = currentFiles.indexOf(matches[0]);
            setCurrentIndex(firstMatchIndex);
            showMessage(`Found ${matches.length} match(es)`);
            // Select all matches
            setCurrentSelected(new Set(matches.map(f => f.name)));
        }
        else {
            showMessage('No matches found');
        }
        setModal('none');
    };
    const handleGoto = (targetPath) => {
        if (!targetPath.trim()) {
            setModal('none');
            return;
        }
        // 경로 확장 (~ -> 홈 디렉토리)
        let resolvedPath = targetPath.trim();
        if (resolvedPath.startsWith('~')) {
            resolvedPath = resolvedPath.replace('~', os.homedir());
        }
        // 상대 경로를 절대 경로로 변환
        if (!path.isAbsolute(resolvedPath)) {
            resolvedPath = path.resolve(currentPath, resolvedPath);
        }
        // 경로 유효성 검사
        try {
            const stat = fs.statSync(resolvedPath);
            if (stat.isDirectory()) {
                setCurrentPath(resolvedPath);
                setCurrentIndex(0);
                setCurrentSelected(new Set());
                showMessage(`Moved to: ${resolvedPath}`);
            }
            else {
                showMessage('Error: Not a directory');
            }
        }
        catch {
            showMessage(`Error: Path not found`);
        }
        setModal('none');
    };
    useInput((input, key) => {
        // Close modal on Escape, or go to parent directory
        if (key.escape) {
            if (modal !== 'none') {
                setModal('none');
                return;
            }
            // Go to parent directory
            if (currentPath !== '/') {
                const currentDirName = path.basename(currentPath);
                setPendingFocus(currentDirName);
                setCurrentPath(path.dirname(currentPath));
                setCurrentSelected(new Set());
            }
            return;
        }
        // Don't process navigation when modal is open (dialogs handle their own input)
        if (modal !== 'none' && modal !== 'help')
            return;
        // Help modal - close on any key
        if (modal === 'help') {
            setModal('none');
            return;
        }
        // Navigation
        if (key.upArrow) {
            setCurrentIndex(prev => Math.max(0, prev - 1));
        }
        else if (key.downArrow) {
            setCurrentIndex(prev => Math.min(currentFiles.length - 1, prev + 1));
        }
        else if (key.pageUp) {
            setCurrentIndex(prev => Math.max(0, prev - 10));
        }
        else if (key.pageDown) {
            setCurrentIndex(prev => Math.min(currentFiles.length - 1, prev + 10));
        }
        else if (key.home) {
            setCurrentIndex(0);
        }
        else if (key.end) {
            setCurrentIndex(currentFiles.length - 1);
        }
        // Tab - switch panels
        if (key.tab) {
            setActivePanel(prev => prev === 'left' ? 'right' : 'left');
        }
        // Enter - open directory
        if (key.return && currentFile) {
            if (currentFile.isDirectory) {
                if (currentFile.name === '..') {
                    // 상위 폴더 이동: 현재 폴더 이름 기억
                    const currentDirName = path.basename(currentPath);
                    setPendingFocus(currentDirName);
                    setCurrentPath(path.dirname(currentPath));
                }
                else {
                    // 하위 폴더 이동
                    setCurrentPath(path.join(currentPath, currentFile.name));
                    setCurrentIndex(0);
                }
                setCurrentSelected(new Set());
            }
        }
        // Space - select/deselect file
        if (input === ' ' && currentFile && currentFile.name !== '..') {
            setCurrentSelected(prev => {
                const next = new Set(prev);
                if (next.has(currentFile.name)) {
                    next.delete(currentFile.name);
                }
                else {
                    next.add(currentFile.name);
                }
                return next;
            });
            setCurrentIndex(prev => Math.min(currentFiles.length - 1, prev + 1));
        }
        // * - select/deselect all
        if (input === '*') {
            setCurrentSelected(prev => {
                if (prev.size > 0) {
                    return new Set();
                }
                else {
                    return new Set(currentFiles.filter(f => f.name !== '..').map(f => f.name));
                }
            });
        }
        // n - sort by name (toggle asc/desc)
        if (input === 'n' || input === 'N') {
            toggleSort('name');
        }
        // s - sort by size (toggle asc/desc)
        if (input === 's' || input === 'S') {
            toggleSort('size');
        }
        // d - sort by date (toggle asc/desc)
        if (input === 'd' || input === 'D') {
            toggleSort('modified');
        }
        // . - AI Command (Unix-like systems only)
        if (input === '.') {
            if (features.ai && onEnterAI) {
                // AI 진입 전 현재 패널 상태 저장
                if (onSavePanelState) {
                    onSavePanelState({
                        leftPath,
                        rightPath,
                        activePanel,
                        leftIndex,
                        rightIndex,
                    });
                }
                onEnterAI(currentPath);
            }
            else if (!features.ai) {
                showMessage('AI command not available on this platform');
            }
        }
        // / - Go to path
        if (input === '/') {
            setModal('goto');
        }
        // Function keys
        if (input === '1')
            setModal('help');
        if (input === '2') {
            if (currentFile && currentFile.name !== '..') {
                setModal('info');
            }
            else {
                showMessage('Select a file for info');
            }
        }
        if (input === '3') {
            if (currentFile && !currentFile.isDirectory) {
                setModal('view');
            }
            else {
                showMessage('Select a file to view');
            }
        }
        if (input === '4') {
            if (currentFile && !currentFile.isDirectory) {
                setModal('edit');
            }
            else {
                showMessage('Select a file to edit');
            }
        }
        if (input === '5')
            setModal('copy');
        if (input === '6')
            setModal('move');
        if (input === '7')
            setModal('mkdir');
        if (input === 'r' || input === 'R') {
            if (currentFile && currentFile.name !== '..') {
                setModal('rename');
            }
            else {
                showMessage('Select a file to rename');
            }
        }
        if (input === '9') {
            if (features.processManager) {
                setModal('process');
            }
            else {
                showMessage('Process manager not available on this platform');
            }
        }
        if (input === 'f')
            setModal('search');
        if (input === 'F')
            setModal('advSearch');
        if (input === '8')
            setModal('delete');
        if (input === '0' || input === 'q' || input === 'Q')
            exit();
    });
    const operationFiles = getOperationFiles();
    const fileListStr = operationFiles.length <= 3
        ? operationFiles.join(', ')
        : `${operationFiles.slice(0, 2).join(', ')} and ${operationFiles.length - 2} more`;
    // 전체 화면 모달 여부 (view, edit, info, process)
    const isFullScreenModal = modal === 'view' || modal === 'edit' || modal === 'info' || modal === 'process';
    // 오버레이 다이얼로그 여부
    const isOverlayDialog = modal === 'help' || modal === 'copy' || modal === 'move' || modal === 'delete' ||
        modal === 'mkdir' || modal === 'rename' || modal === 'search' || modal === 'advSearch' ||
        modal === 'goto';
    return (_jsxs(Box, { flexDirection: "column", height: termHeight, children: [_jsxs(Box, { justifyContent: "center", marginBottom: 0, children: [_jsx(Text, { bold: true, color: theme.colors.borderActive, children: APP_TITLE }), _jsxs(Text, { color: theme.colors.textDim, children: ["  ", features.ai ? '[.] AI  ' : '', "[Tab] Switch  [f] Find  [1-9,0] Fn"] })] }), modal === 'view' && currentFile && (_jsx(FileViewer, { filePath: path.join(currentPath, currentFile.name), onClose: () => setModal('none') })), modal === 'edit' && currentFile && (_jsx(FileEditor, { filePath: path.join(currentPath, currentFile.name), onClose: () => setModal('none'), onSave: refresh })), modal === 'info' && currentFile && (_jsx(FileInfo, { filePath: path.join(currentPath, currentFile.name), onClose: () => setModal('none') })), modal === 'process' && (_jsx(ProcessManager, { onClose: () => setModal('none') })), !isFullScreenModal && (_jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsxs(Box, { flexGrow: 1, position: "relative", children: [_jsx(Panel, { currentPath: leftPath, isActive: activePanel === 'left' && !isOverlayDialog, selectedIndex: leftIndex, selectedFiles: leftSelected, width: panelWidth, height: panelHeight, sortBy: leftSortBy, sortOrder: leftSortOrder, onFilesLoad: handleLeftFilesLoad }), _jsx(Panel, { currentPath: rightPath, isActive: activePanel === 'right' && !isOverlayDialog, selectedIndex: rightIndex, selectedFiles: rightSelected, width: panelWidth, height: panelHeight, sortBy: rightSortBy, sortOrder: rightSortOrder, onFilesLoad: handleRightFilesLoad }), isOverlayDialog && (_jsxs(Box, { position: "absolute", flexDirection: "column", alignItems: "center", justifyContent: "center", width: termWidth, height: panelHeight, children: [modal === 'help' && (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: theme.colors.borderActive, backgroundColor: "#000000", paddingX: 2, paddingY: 1, children: [_jsx(Box, { justifyContent: "center", children: _jsx(Text, { bold: true, color: theme.colors.borderActive, children: "Help - Keyboard Shortcuts" }) }), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Navigation:" }), _jsx(Text, { children: "  \u2191\u2193        Move cursor" }), _jsx(Text, { children: "  PgUp/PgDn Move 10 lines" }), _jsx(Text, { children: "  Home/End  Go to start/end" }), _jsx(Text, { children: "  Enter     Open directory" }), _jsx(Text, { children: "  ESC       Go to parent dir" }), _jsx(Text, { children: "  Tab       Switch panel" }), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Selection:" }), _jsx(Text, { children: "  Space     Select/deselect file" }), _jsx(Text, { children: "  *         Select/deselect all" }), _jsx(Text, { children: "  f         Quick find by name" }), _jsx(Text, { children: "  F         Advanced search" }), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Sorting (toggle asc/desc):" }), _jsx(Text, { children: "  n         Sort by name" }), _jsx(Text, { children: "  s         Sort by size" }), _jsx(Text, { children: "  d         Sort by date" }), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Functions (number keys):" }), _jsx(Text, { children: "  1=Help  2=Info  3=View  4=Edit  5=Copy" }), _jsxs(Text, { children: ["  6=Move  7=MkDir 8=Del   ", features.processManager ? '9=Proc  ' : '        ', "0=Quit"] }), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Special:" }), features.ai && _jsx(Text, { children: "  .         AI Command" }), _jsx(Text, { children: "  /         Go to path" }), _jsx(Text, { children: "  r/R       Rename file" }), _jsx(Text, { children: " " }), _jsx(Text, { color: theme.colors.textDim, children: "Press any key to close" })] })), modal === 'copy' && (_jsx(ConfirmDialog, { title: "Copy Files", message: `Copy ${fileListStr} to ${targetPath}?`, onConfirm: handleCopy, onCancel: () => setModal('none') })), modal === 'move' && (_jsx(ConfirmDialog, { title: "Move Files", message: `Move ${fileListStr} to ${targetPath}?`, onConfirm: handleMove, onCancel: () => setModal('none') })), modal === 'delete' && (_jsx(ConfirmDialog, { title: "Delete Files", message: `Delete ${fileListStr}? This cannot be undone!`, onConfirm: handleDelete, onCancel: () => setModal('none') })), modal === 'mkdir' && (_jsx(InputDialog, { title: "Create Directory", prompt: "Enter directory name:", onSubmit: handleMkdir, onCancel: () => setModal('none') })), modal === 'rename' && currentFile && (_jsx(InputDialog, { title: "Rename File", prompt: `Rename "${currentFile.name}" to:`, defaultValue: currentFile.name, onSubmit: handleRename, onCancel: () => setModal('none') })), modal === 'search' && (_jsx(InputDialog, { title: "Find File", prompt: "Search for:", onSubmit: handleSearch, onCancel: () => setModal('none') })), modal === 'advSearch' && (_jsx(SearchDialog, { onSubmit: handleAdvancedSearch, onCancel: () => setModal('none') })), modal === 'goto' && (_jsx(InputDialog, { title: "Go to Path", prompt: "Enter path:", defaultValue: currentPath, onSubmit: handleGoto, onCancel: () => setModal('none') }))] }))] }), _jsx(StatusBar, { selectedFile: currentFile?.name, selectedSize: currentFile?.size, selectedCount: currentSelected.size, totalSize: calculateTotal(currentFiles) }), _jsx(FunctionBar, { message: message, width: termWidth })] }))] }, refreshKey));
}
//# sourceMappingURL=DualPanel.js.map