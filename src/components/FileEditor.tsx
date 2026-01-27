import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'fs';
import path from 'path';
import { defaultTheme } from '../themes/classic-blue.js';

interface FileEditorProps {
  filePath: string;
  onClose: () => void;
  onSave?: () => void;
}

export default function FileEditor({ filePath, onClose, onSave }: FileEditorProps) {
  const theme = defaultTheme;
  const { stdout } = useStdout();
  const [lines, setLines] = useState<string[]>(['']);
  const [cursorLine, setCursorLine] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [modified, setModified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const termHeight = stdout?.rows || 24;
  // 터미널 높이에서 border(2) + header(1) + status bar(1) + message bar(1) 제외
  const visibleLines = Math.max(5, termHeight - 5);
  const fileName = path.basename(filePath);
  const isNewFile = !fs.existsSync(filePath);

  useEffect(() => {
    if (!isNewFile) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileLines = content.split('\n');
        setLines(fileLines.length > 0 ? fileLines : ['']);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [filePath, isNewFile]);

  // Keep cursor in view
  useEffect(() => {
    if (cursorLine < scrollOffset) {
      setScrollOffset(cursorLine);
    } else if (cursorLine >= scrollOffset + visibleLines) {
      setScrollOffset(cursorLine - visibleLines + 1);
    }
  }, [cursorLine, scrollOffset]);

  // Cleanup message timer on unmount
  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const showMessage = (msg: string) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    setMessage(msg);
    messageTimerRef.current = setTimeout(() => setMessage(''), 2000);
  };

  const saveFile = () => {
    try {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      setModified(false);
      showMessage('File saved!');
      onSave?.();
    } catch (err: unknown) {
      showMessage(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useInput((input, key) => {
    // Ctrl+S - Save
    if (key.ctrl && input === 's') {
      saveFile();
      return;
    }

    // Ctrl+Q - Quit
    if (key.ctrl && input === 'q') {
      if (modified) {
        showMessage('Unsaved changes! Ctrl+S to save, Ctrl+X to discard');
      } else {
        onClose();
      }
      return;
    }

    // Ctrl+X - Force quit without saving
    if (key.ctrl && input === 'x') {
      onClose();
      return;
    }

    // Escape - Try to close (warn if modified)
    if (key.escape) {
      if (modified) {
        showMessage('Unsaved changes! Ctrl+S to save, Ctrl+X to discard');
      } else {
        onClose();
      }
      return;
    }

    // Navigation
    if (key.upArrow) {
      setCursorLine(prev => Math.max(0, prev - 1));
      setCursorCol(prev => Math.min(prev, lines[Math.max(0, cursorLine - 1)]?.length || 0));
      return;
    }
    if (key.downArrow) {
      setCursorLine(prev => Math.min(lines.length - 1, prev + 1));
      setCursorCol(prev => Math.min(prev, lines[Math.min(lines.length - 1, cursorLine + 1)]?.length || 0));
      return;
    }
    if (key.leftArrow) {
      if (cursorCol > 0) {
        setCursorCol(prev => prev - 1);
      } else if (cursorLine > 0) {
        setCursorLine(prev => prev - 1);
        setCursorCol(lines[cursorLine - 1]?.length || 0);
      }
      return;
    }
    if (key.rightArrow) {
      const lineLen = lines[cursorLine]?.length || 0;
      if (cursorCol < lineLen) {
        setCursorCol(prev => prev + 1);
      } else if (cursorLine < lines.length - 1) {
        setCursorLine(prev => prev + 1);
        setCursorCol(0);
      }
      return;
    }
    if (key.home) {
      setCursorCol(0);
      return;
    }
    if (key.end) {
      setCursorCol(lines[cursorLine]?.length || 0);
      return;
    }
    if (key.pageUp) {
      setCursorLine(prev => Math.max(0, prev - visibleLines));
      return;
    }
    if (key.pageDown) {
      setCursorLine(prev => Math.min(lines.length - 1, prev + visibleLines));
      return;
    }

    // Backspace
    if (key.backspace || key.delete) {
      if (cursorCol > 0) {
        // Delete character before cursor
        setLines(prev => {
          const newLines = [...prev];
          const line = newLines[cursorLine];
          newLines[cursorLine] = line.slice(0, cursorCol - 1) + line.slice(cursorCol);
          return newLines;
        });
        setCursorCol(prev => prev - 1);
      } else if (cursorLine > 0) {
        // Merge with previous line
        const prevLineLen = lines[cursorLine - 1].length;
        setLines(prev => {
          const newLines = [...prev];
          newLines[cursorLine - 1] += newLines[cursorLine];
          newLines.splice(cursorLine, 1);
          return newLines;
        });
        setCursorLine(prev => prev - 1);
        setCursorCol(prevLineLen);
      }
      setModified(true);
      return;
    }

    // Enter - new line
    if (key.return) {
      setLines(prev => {
        const newLines = [...prev];
        const line = newLines[cursorLine];
        newLines[cursorLine] = line.slice(0, cursorCol);
        newLines.splice(cursorLine + 1, 0, line.slice(cursorCol));
        return newLines;
      });
      setCursorLine(prev => prev + 1);
      setCursorCol(0);
      setModified(true);
      return;
    }

    // Tab
    if (key.tab) {
      const spaces = '  ';
      setLines(prev => {
        const newLines = [...prev];
        const line = newLines[cursorLine];
        newLines[cursorLine] = line.slice(0, cursorCol) + spaces + line.slice(cursorCol);
        return newLines;
      });
      setCursorCol(prev => prev + spaces.length);
      setModified(true);
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      setLines(prev => {
        const newLines = [...prev];
        const line = newLines[cursorLine] || '';
        newLines[cursorLine] = line.slice(0, cursorCol) + input + line.slice(cursorCol);
        return newLines;
      });
      setCursorCol(prev => prev + input.length);
      setModified(true);
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor={theme.colors.error} padding={1} marginX={2}>
        <Text color={theme.colors.error}>Error: {error}</Text>
        <Text color={theme.colors.textDim}>Press Escape to close</Text>
      </Box>
    );
  }

  const visibleContent = lines.slice(scrollOffset, scrollOffset + visibleLines);

  return (
    <Box flexDirection="column" borderStyle="double" borderColor={modified ? theme.colors.warning : theme.colors.borderActive} marginX={1}>
      {/* Header */}
      <Box justifyContent="space-between" paddingX={1} backgroundColor={theme.colors.bgHeader}>
        <Text color={theme.colors.textHeader} bold>
          {modified ? '*' : ''}{fileName} {isNewFile ? '(new)' : ''}
        </Text>
        <Text color={theme.colors.textHeader}>
          Ln {cursorLine + 1}, Col {cursorCol + 1}
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" paddingX={1}>
        {visibleContent.map((line, idx) => {
          const lineNum = scrollOffset + idx;
          const isCursorLine = lineNum === cursorLine;

          return (
            <Box key={lineNum}>
              <Text color={theme.colors.textDim}>{String(lineNum + 1).padStart(4)} </Text>
              <Text color={isCursorLine ? theme.colors.textBold : theme.colors.text}>
                {renderLineWithCursor(line, isCursorLine ? cursorCol : -1, theme)}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Message */}
      {message && (
        <Box paddingX={1} backgroundColor={theme.colors.bgStatusBar}>
          <Text color={theme.colors.warning}>{message}</Text>
        </Box>
      )}

      {/* Status bar */}
      <Box justifyContent="space-between" paddingX={1} backgroundColor={theme.colors.bgStatusBar}>
        <Text color={theme.colors.textHeader}>
          {modified ? '[Modified] ' : ''}
        </Text>
        <Text color={theme.colors.textHeader}>
          ^S Save  ^Q Quit  ^X Discard
        </Text>
      </Box>
    </Box>
  );
}

function renderLineWithCursor(line: string, cursorPos: number, theme: { colors: { bgSelected: string; textSelected: string } }): React.ReactNode {
  if (cursorPos < 0) return line || ' ';

  const before = line.slice(0, cursorPos);
  const cursor = line[cursorPos] || ' ';
  const after = line.slice(cursorPos + 1);

  return (
    <>
      <Text>{before}</Text>
      <Text backgroundColor={theme.colors.bgSelected} color={theme.colors.textSelected}>{cursor}</Text>
      <Text>{after}</Text>
    </>
  );
}
