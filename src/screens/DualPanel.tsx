import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import os from 'os';
import path from 'path';
import Panel from '../components/Panel.js';
import FunctionBar from '../components/FunctionBar.js';
import StatusBar from '../components/StatusBar.js';
import ConfirmDialog from '../components/ConfirmDialog.js';
import InputDialog from '../components/InputDialog.js';
import SearchDialog, { SearchCriteria } from '../components/SearchDialog.js';
import FileViewer from '../components/FileViewer.js';
import FileEditor from '../components/FileEditor.js';
import FileInfo from '../components/FileInfo.js';
import ProcessManager from './ProcessManager.js';
import { defaultTheme } from '../themes/classic-blue.js';
import * as fileOps from '../services/fileOps.js';
import { isValidFilename } from '../services/fileOps.js';
import type { FileItem, PanelSide, SortBy, SortOrder } from '../types/index.js';
import { features } from '../utils/platform.js';
import { APP_TITLE } from '../utils/version.js';
import fs from 'fs';
type ModalType = 'none' | 'help' | 'mkdir' | 'delete' | 'copy' | 'move' | 'view' | 'edit' | 'rename' | 'search' | 'advSearch' | 'info' | 'process' | 'goto';

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

export default function DualPanel({
  onEnterAI,
  initialLeftPath,
  initialRightPath,
  initialActivePanel,
  initialLeftIndex,
  initialRightIndex,
  onSavePanelState,
}: DualPanelProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const theme = defaultTheme;
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Panel paths (초기값은 props에서 받거나 기본값 사용)
  const [leftPath, setLeftPath] = useState(initialLeftPath ?? process.cwd());
  const [rightPath, setRightPath] = useState(initialRightPath ?? os.homedir());

  // Active panel
  const [activePanel, setActivePanel] = useState<PanelSide>(initialActivePanel ?? 'left');

  // Selection indices
  const [leftIndex, setLeftIndex] = useState(initialLeftIndex ?? 0);
  const [rightIndex, setRightIndex] = useState(initialRightIndex ?? 0);

  // Selected files (marked with Space)
  const [leftSelected, setLeftSelected] = useState<Set<string>>(new Set());
  const [rightSelected, setRightSelected] = useState<Set<string>>(new Set());

  // File lists
  const [leftFiles, setLeftFiles] = useState<FileItem[]>([]);
  const [rightFiles, setRightFiles] = useState<FileItem[]>([]);

  // 상위 폴더 이동 시 포커스할 디렉토리 이름 (좌/우 각각)
  const [leftPendingFocus, setLeftPendingFocus] = useState<string | null>(null);
  const [rightPendingFocus, setRightPendingFocus] = useState<string | null>(null);

  // 정렬 상태 (좌/우 각각)
  const [leftSortBy, setLeftSortBy] = useState<SortBy>('name');
  const [leftSortOrder, setLeftSortOrder] = useState<SortOrder>('asc');
  const [rightSortBy, setRightSortBy] = useState<SortBy>('name');
  const [rightSortOrder, setRightSortOrder] = useState<SortOrder>('asc');

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [modal, setModal] = useState<ModalType>('none');
  const [message, setMessage] = useState<string>('');

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
  const getOperationFiles = (): string[] => {
    if (currentSelected.size > 0) {
      return Array.from(currentSelected);
    }
    if (currentFile && currentFile.name !== '..') {
      return [currentFile.name];
    }
    return [];
  };

  // Calculate totals
  const calculateTotal = (files: FileItem[]) =>
    files.reduce((sum, f) => sum + (f.isDirectory ? 0 : f.size), 0);

  // Refresh panels
  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLeftSelected(new Set());
    setRightSelected(new Set());
  }, []);

  // 파일 목록 로드 핸들러 (상위 이동 시 이전 폴더에 포커스)
  const handleLeftFilesLoad = useCallback((files: FileItem[]) => {
    setLeftFiles(files);
    if (leftPendingFocus) {
      const idx = files.findIndex(f => f.name === leftPendingFocus);
      if (idx >= 0) {
        setLeftIndex(idx);
      }
      setLeftPendingFocus(null);
    }
  }, [leftPendingFocus]);

  const handleRightFilesLoad = useCallback((files: FileItem[]) => {
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
  const toggleSort = useCallback((sortType: SortBy) => {
    if (currentSortBy === sortType) {
      // 같은 타입이면 방향 토글
      setCurrentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
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
  const showMessage = (msg: string, duration = 2000) => {
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
      } else {
        errorMsg = result.error || 'Unknown error';
      }
    }

    if (successCount === files.length) {
      showMessage(`Copied ${successCount} file(s)`);
    } else {
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
      } else {
        errorMsg = result.error || 'Unknown error';
      }
    }

    if (successCount === files.length) {
      showMessage(`Moved ${successCount} file(s)`);
    } else {
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
      } else {
        errorMsg = result.error || 'Unknown error';
      }
    }

    if (successCount === files.length) {
      showMessage(`Deleted ${successCount} file(s)`);
    } else {
      showMessage(`Deleted ${successCount}/${files.length}. Error: ${errorMsg}`);
    }

    setModal('none');
    refresh();
  };

  const handleMkdir = (name: string) => {
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
    } else {
      showMessage(`Error: ${result.error}`);
    }

    setModal('none');
    refresh();
  };

  const handleRename = (newName: string) => {
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
    } else {
      showMessage(`Error: ${result.error}`);
    }

    setModal('none');
    refresh();
  };

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      setModal('none');
      return;
    }

    const lowerTerm = term.toLowerCase();
    const matchIndex = currentFiles.findIndex(f =>
      f.name.toLowerCase().includes(lowerTerm)
    );

    if (matchIndex >= 0) {
      setCurrentIndex(matchIndex);
      showMessage(`Found: ${currentFiles[matchIndex].name}`);
    } else {
      showMessage(`No match for "${term}"`);
    }

    setModal('none');
  };

  const handleAdvancedSearch = (criteria: SearchCriteria) => {
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
    } else {
      showMessage('No matches found');
    }

    setModal('none');
  };

  const handleGoto = (targetPath: string) => {
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
      } else {
        showMessage('Error: Not a directory');
      }
    } catch {
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
    if (modal !== 'none' && modal !== 'help') return;

    // Help modal - close on any key
    if (modal === 'help') {
      setModal('none');
      return;
    }

    // Navigation
    if (key.upArrow) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setCurrentIndex(prev => Math.min(currentFiles.length - 1, prev + 1));
    } else if (key.pageUp) {
      setCurrentIndex(prev => Math.max(0, prev - 10));
    } else if (key.pageDown) {
      setCurrentIndex(prev => Math.min(currentFiles.length - 1, prev + 10));
    } else if (key.home) {
      setCurrentIndex(0);
    } else if (key.end) {
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
        } else {
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
        } else {
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
        } else {
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
      } else if (!features.ai) {
        showMessage('AI command not available on this platform');
      }
    }

    // / - Go to path
    if (input === '/') {
      setModal('goto');
    }

    // Function keys
    if (input === '1') setModal('help');
    if (input === '2') {
      if (currentFile && currentFile.name !== '..') {
        setModal('info');
      } else {
        showMessage('Select a file for info');
      }
    }
    if (input === '3') {
      if (currentFile && !currentFile.isDirectory) {
        setModal('view');
      } else {
        showMessage('Select a file to view');
      }
    }
    if (input === '4') {
      if (currentFile && !currentFile.isDirectory) {
        setModal('edit');
      } else {
        showMessage('Select a file to edit');
      }
    }
    if (input === '5') setModal('copy');
    if (input === '6') setModal('move');
    if (input === '7') setModal('mkdir');
    if (input === 'r' || input === 'R') {
      if (currentFile && currentFile.name !== '..') {
        setModal('rename');
      } else {
        showMessage('Select a file to rename');
      }
    }
    if (input === '9') {
      if (features.processManager) {
        setModal('process');
      } else {
        showMessage('Process manager not available on this platform');
      }
    }
    if (input === 'f') setModal('search');
    if (input === 'F') setModal('advSearch');
    if (input === '8') setModal('delete');
    if (input === '0' || input === 'q' || input === 'Q') exit();
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

  return (
    <Box flexDirection="column" height={termHeight} key={refreshKey}>
      {/* Header */}
      <Box justifyContent="center" marginBottom={0}>
        <Text bold color={theme.colors.borderActive}>
          {APP_TITLE}
        </Text>
        <Text color={theme.colors.textDim}>  {features.ai ? '[.] AI  ' : ''}[Tab] Switch  [f] Find  [1-9,0] Fn</Text>
      </Box>

      {/* Full Screen Modals */}
      {modal === 'view' && currentFile && (
        <FileViewer
          filePath={path.join(currentPath, currentFile.name)}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'edit' && currentFile && (
        <FileEditor
          filePath={path.join(currentPath, currentFile.name)}
          onClose={() => setModal('none')}
          onSave={refresh}
        />
      )}

      {modal === 'info' && currentFile && (
        <FileInfo
          filePath={path.join(currentPath, currentFile.name)}
          onClose={() => setModal('none')}
        />
      )}

      {modal === 'process' && (
        <ProcessManager onClose={() => setModal('none')} />
      )}

      {/* Dual Panels (always visible unless full screen modal) */}
      {!isFullScreenModal && (
        <Box flexDirection="column" flexGrow={1}>
          <Box flexGrow={1} position="relative">
            {/* Panels */}
            <Panel
              currentPath={leftPath}
              isActive={activePanel === 'left' && !isOverlayDialog}
              selectedIndex={leftIndex}
              selectedFiles={leftSelected}
              width={panelWidth}
              height={panelHeight}
              sortBy={leftSortBy}
              sortOrder={leftSortOrder}
              onFilesLoad={handleLeftFilesLoad}
            />
            <Panel
              currentPath={rightPath}
              isActive={activePanel === 'right' && !isOverlayDialog}
              selectedIndex={rightIndex}
              selectedFiles={rightSelected}
              width={panelWidth}
              height={panelHeight}
              sortBy={rightSortBy}
              sortOrder={rightSortOrder}
              onFilesLoad={handleRightFilesLoad}
            />

            {/* Overlay Dialogs */}
            {isOverlayDialog && (
              <Box
                position="absolute"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                width={termWidth}
                height={panelHeight}
              >
                {/* Help Modal */}
                {modal === 'help' && (
                  <Box
                    flexDirection="column"
                    borderStyle="double"
                    borderColor={theme.colors.borderActive}
                    backgroundColor="#000000"
                    paddingX={2}
                    paddingY={1}
                  >
                    <Box justifyContent="center">
                      <Text bold color={theme.colors.borderActive}>Help - Keyboard Shortcuts</Text>
                    </Box>
                    <Text> </Text>
                    <Text bold>Navigation:</Text>
                    <Text>  ↑↓        Move cursor</Text>
                    <Text>  PgUp/PgDn Move 10 lines</Text>
                    <Text>  Home/End  Go to start/end</Text>
                    <Text>  Enter     Open directory</Text>
                    <Text>  ESC       Go to parent dir</Text>
                    <Text>  Tab       Switch panel</Text>
                    <Text> </Text>
                    <Text bold>Selection:</Text>
                    <Text>  Space     Select/deselect file</Text>
                    <Text>  *         Select/deselect all</Text>
                    <Text>  f         Quick find by name</Text>
                    <Text>  F         Advanced search</Text>
                    <Text> </Text>
                    <Text bold>Sorting (toggle asc/desc):</Text>
                    <Text>  n         Sort by name</Text>
                    <Text>  s         Sort by size</Text>
                    <Text>  d         Sort by date</Text>
                    <Text> </Text>
                    <Text bold>Functions (number keys):</Text>
                    <Text>  1=Help  2=Info  3=View  4=Edit  5=Copy</Text>
                    <Text>  6=Move  7=MkDir 8=Del   {features.processManager ? '9=Proc  ' : '        '}0=Quit</Text>
                    <Text> </Text>
                    <Text bold>Special:</Text>
                    {features.ai && <Text>  .         AI Command</Text>}
                    <Text>  /         Go to path</Text>
                    <Text>  r/R       Rename file</Text>
                    <Text> </Text>
                    <Text color={theme.colors.textDim}>Press any key to close</Text>
                  </Box>
                )}

                {/* Copy Confirm */}
                {modal === 'copy' && (
                  <ConfirmDialog
                    title="Copy Files"
                    message={`Copy ${fileListStr} to ${targetPath}?`}
                    onConfirm={handleCopy}
                    onCancel={() => setModal('none')}
                  />
                )}

                {/* Move Confirm */}
                {modal === 'move' && (
                  <ConfirmDialog
                    title="Move Files"
                    message={`Move ${fileListStr} to ${targetPath}?`}
                    onConfirm={handleMove}
                    onCancel={() => setModal('none')}
                  />
                )}

                {/* Delete Confirm */}
                {modal === 'delete' && (
                  <ConfirmDialog
                    title="Delete Files"
                    message={`Delete ${fileListStr}? This cannot be undone!`}
                    onConfirm={handleDelete}
                    onCancel={() => setModal('none')}
                  />
                )}

                {/* MkDir Input */}
                {modal === 'mkdir' && (
                  <InputDialog
                    title="Create Directory"
                    prompt="Enter directory name:"
                    onSubmit={handleMkdir}
                    onCancel={() => setModal('none')}
                  />
                )}

                {/* Rename Input */}
                {modal === 'rename' && currentFile && (
                  <InputDialog
                    title="Rename File"
                    prompt={`Rename "${currentFile.name}" to:`}
                    defaultValue={currentFile.name}
                    onSubmit={handleRename}
                    onCancel={() => setModal('none')}
                  />
                )}

                {/* Search Input */}
                {modal === 'search' && (
                  <InputDialog
                    title="Find File"
                    prompt="Search for:"
                    onSubmit={handleSearch}
                    onCancel={() => setModal('none')}
                  />
                )}

                {/* Advanced Search */}
                {modal === 'advSearch' && (
                  <SearchDialog
                    onSubmit={handleAdvancedSearch}
                    onCancel={() => setModal('none')}
                  />
                )}

                {/* Go to Path */}
                {modal === 'goto' && (
                  <InputDialog
                    title="Go to Path"
                    prompt="Enter path:"
                    defaultValue={currentPath}
                    onSubmit={handleGoto}
                    onCancel={() => setModal('none')}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Status Bar */}
          <StatusBar
            selectedFile={currentFile?.name}
            selectedSize={currentFile?.size}
            selectedCount={currentSelected.size}
            totalSize={calculateTotal(currentFiles)}
          />

          {/* Function Bar */}
          <FunctionBar message={message} width={termWidth} />
        </Box>
      )}
    </Box>
  );
}
