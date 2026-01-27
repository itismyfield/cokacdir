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
import type { FileItem, PanelSide } from '../types/index.js';
import { features } from '../utils/platform.js';
import { APP_TITLE } from '../utils/version.js';
type ModalType = 'none' | 'help' | 'mkdir' | 'delete' | 'copy' | 'move' | 'view' | 'edit' | 'rename' | 'search' | 'advSearch' | 'info' | 'process';

interface DualPanelProps {
  onEnterAI?: (currentPath: string) => void;
}

export default function DualPanel({ onEnterAI }: DualPanelProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const theme = defaultTheme;
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Panel paths
  const [leftPath, setLeftPath] = useState(process.cwd());
  const [rightPath, setRightPath] = useState(os.homedir());

  // Active panel
  const [activePanel, setActivePanel] = useState<PanelSide>('left');

  // Selection indices
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(0);

  // Selected files (marked with Space)
  const [leftSelected, setLeftSelected] = useState<Set<string>>(new Set());
  const [rightSelected, setRightSelected] = useState<Set<string>>(new Set());

  // File lists
  const [leftFiles, setLeftFiles] = useState<FileItem[]>([]);
  const [rightFiles, setRightFiles] = useState<FileItem[]>([]);

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

  useInput((input, key) => {
    // Close modal on Escape
    if (key.escape) {
      if (modal !== 'none') {
        setModal('none');
        return;
      }
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
        const newPath = currentFile.name === '..'
          ? path.dirname(currentPath)
          : path.join(currentPath, currentFile.name);
        setCurrentPath(newPath);
        setCurrentIndex(0);
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

    // / - AI Command (Unix-like systems only)
    if (input === '/') {
      if (features.ai && onEnterAI) {
        onEnterAI(currentPath);
      } else if (!features.ai) {
        showMessage('AI command not available on this platform');
      }
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

  return (
    <Box flexDirection="column" height={termHeight} key={refreshKey}>
      {/* Header */}
      <Box justifyContent="center" marginBottom={0}>
        <Text bold color={theme.colors.borderActive}>
          {APP_TITLE}
        </Text>
        <Text color={theme.colors.textDim}>  {features.ai ? '[/] AI  ' : ''}[Tab] Switch  [f] Find  [1-9,0] Fn</Text>
      </Box>


      {/* Help Modal */}
      {modal === 'help' && (
        <Box flexDirection="column" borderStyle="double" borderColor={theme.colors.borderActive} paddingX={2} marginX={4}>
          <Text bold color={theme.colors.borderActive}>Help - Keyboard Shortcuts</Text>
          <Text> </Text>
          <Text><Text bold>Navigation:</Text></Text>
          <Text>  ↑↓        Move cursor</Text>
          <Text>  PgUp/PgDn Move 10 lines</Text>
          <Text>  Home/End  Go to start/end</Text>
          <Text>  Enter     Open directory</Text>
          <Text>  Tab       Switch panel</Text>
          <Text> </Text>
          <Text><Text bold>Selection:</Text></Text>
          <Text>  Space     Select/deselect file</Text>
          <Text>  *         Select/deselect all</Text>
          <Text>  f         Quick find by name</Text>
          <Text>  F         Advanced search (size/date)</Text>
          <Text> </Text>
          <Text><Text bold>Functions (number keys):</Text></Text>
          <Text>  1=Help  2=Info  3=View  4=Edit  5=Copy</Text>
          <Text>  6=Move  7=MkDir 8=Del   {features.processManager ? '9=Proc  ' : '        '}0=Quit</Text>
          <Text> </Text>
          <Text><Text bold>Special:</Text></Text>
          {features.ai && <Text>  /         AI Command (natural language)</Text>}
          <Text>  r/R       Rename file</Text>
          <Text> </Text>
          <Text dimColor>Press any key to close</Text>
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

      {/* File Viewer */}
      {modal === 'view' && currentFile && (
        <FileViewer
          filePath={path.join(currentPath, currentFile.name)}
          onClose={() => setModal('none')}
        />
      )}

      {/* File Editor */}
      {modal === 'edit' && currentFile && (
        <FileEditor
          filePath={path.join(currentPath, currentFile.name)}
          onClose={() => setModal('none')}
          onSave={refresh}
        />
      )}

      {/* File Info */}
      {modal === 'info' && currentFile && (
        <FileInfo
          filePath={path.join(currentPath, currentFile.name)}
          onClose={() => setModal('none')}
        />
      )}

      {/* Process Manager */}
      {modal === 'process' && (
        <ProcessManager onClose={() => setModal('none')} />
      )}

      {/* Dual Panels */}
      {modal === 'none' && (
        <>
          <Box flexGrow={1}>
            <Panel
              currentPath={leftPath}
              isActive={activePanel === 'left'}
              selectedIndex={leftIndex}
              selectedFiles={leftSelected}
              width={panelWidth}
              height={panelHeight}
              onFilesLoad={setLeftFiles}
            />
            <Panel
              currentPath={rightPath}
              isActive={activePanel === 'right'}
              selectedIndex={rightIndex}
              selectedFiles={rightSelected}
              width={panelWidth}
              height={panelHeight}
              onFilesLoad={setRightFiles}
            />
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
        </>
      )}
    </Box>
  );
}
