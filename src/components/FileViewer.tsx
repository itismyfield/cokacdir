import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'fs';
import path from 'path';
import { defaultTheme } from '../themes/classic-blue.js';

interface FileViewerProps {
  filePath: string;
  onClose: () => void;
}

export default function FileViewer({ filePath, onClose }: FileViewerProps) {
  const theme = defaultTheme;
  const { stdout } = useStdout();
  const [lines, setLines] = useState<string[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [matchLines, setMatchLines] = useState<number[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);

  const termHeight = stdout?.rows || 24;
  // 터미널 높이에서 border(2) + header(1) + status bar(1) + search bar(1) 제외
  const visibleLines = Math.max(5, termHeight - 5);
  const fileName = path.basename(filePath);

  useEffect(() => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      setLines(content.split('\n'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [filePath]);

  // Update search matches when search term changes
  useEffect(() => {
    if (searchTerm) {
      const matches: number[] = [];
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches.push(idx);
        }
      });
      setMatchLines(matches);
      setCurrentMatch(0);
      if (matches.length > 0) {
        setScrollOffset(Math.max(0, matches[0] - 5));
      }
    } else {
      setMatchLines([]);
    }
  }, [searchTerm, lines]);

  useInput((input, key) => {
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setSearchInput('');
      } else if (key.return) {
        setSearchTerm(searchInput);
        setSearchMode(false);
      } else if (key.backspace || key.delete) {
        setSearchInput(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setSearchInput(prev => prev + input);
      }
      return;
    }

    if (key.escape || input === 'q' || input === 'Q') {
      onClose();
    } else if (key.upArrow || input === 'k') {
      setScrollOffset(prev => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setScrollOffset(prev => Math.min(lines.length - visibleLines, prev + 1));
    } else if (key.pageUp) {
      setScrollOffset(prev => Math.max(0, prev - visibleLines));
    } else if (key.pageDown) {
      setScrollOffset(prev => Math.min(lines.length - visibleLines, prev + visibleLines));
    } else if (key.home || input === 'g') {
      setScrollOffset(0);
    } else if (key.end || input === 'G') {
      setScrollOffset(Math.max(0, lines.length - visibleLines));
    } else if (input === '/') {
      setSearchMode(true);
      setSearchInput('');
    } else if (input === 'n' && matchLines.length > 0) {
      // Next match
      const next = (currentMatch + 1) % matchLines.length;
      setCurrentMatch(next);
      setScrollOffset(Math.max(0, matchLines[next] - 5));
    } else if (input === 'N' && matchLines.length > 0) {
      // Previous match
      const prev = (currentMatch - 1 + matchLines.length) % matchLines.length;
      setCurrentMatch(prev);
      setScrollOffset(Math.max(0, matchLines[prev] - 5));
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor={theme.colors.error} padding={1} marginX={2}>
        <Text color={theme.colors.error}>Error: {error}</Text>
        <Text color={theme.colors.textDim}>Press any key to close</Text>
      </Box>
    );
  }

  const visibleContent = lines.slice(scrollOffset, scrollOffset + visibleLines);
  const totalLines = lines.length;
  const percentage = totalLines > 0 ? Math.round(((scrollOffset + visibleLines) / totalLines) * 100) : 100;

  return (
    <Box flexDirection="column" borderStyle="double" borderColor={theme.colors.borderActive} marginX={1}>
      {/* Header */}
      <Box justifyContent="space-between" paddingX={1} backgroundColor={theme.colors.bgHeader}>
        <Text color={theme.colors.textHeader} bold>{fileName}</Text>
        <Text color={theme.colors.textHeader}>
          {scrollOffset + 1}-{Math.min(scrollOffset + visibleLines, totalLines)}/{totalLines} ({percentage}%)
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" paddingX={1}>
        {visibleContent.map((line, idx) => {
          const lineNum = scrollOffset + idx;
          const isMatch = matchLines.includes(lineNum);
          const isCurrentMatch = matchLines[currentMatch] === lineNum;

          return (
            <Box key={lineNum}>
              <Text color={theme.colors.textDim}>{String(lineNum + 1).padStart(4)} </Text>
              <Text
                color={isCurrentMatch ? theme.colors.textSelected : isMatch ? theme.colors.warning : theme.colors.text}
                backgroundColor={isCurrentMatch ? theme.colors.bgSelected : undefined}
              >
                {highlightSearch(line, searchTerm, theme)}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Search bar */}
      {searchMode && (
        <Box paddingX={1} backgroundColor={theme.colors.bgStatusBar}>
          <Text color={theme.colors.textHeader}>Search: {searchInput}_</Text>
        </Box>
      )}

      {/* Status bar */}
      <Box justifyContent="space-between" paddingX={1} backgroundColor={theme.colors.bgStatusBar}>
        <Text color={theme.colors.textHeader}>
          {searchTerm && `"${searchTerm}" ${matchLines.length} matches `}
          {matchLines.length > 0 && `(${currentMatch + 1}/${matchLines.length})`}
        </Text>
        <Text color={theme.colors.textHeader}>
          [q]Quit [/]Search [n/N]Next/Prev
        </Text>
      </Box>
    </Box>
  );
}

function highlightSearch(line: string, term: string, theme: { colors: { warning: string } }): React.ReactNode {
  if (!term) return line;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const lowerLine = line.toLowerCase();
  const lowerTerm = term.toLowerCase();

  let index = lowerLine.indexOf(lowerTerm);
  let partKey = 0;

  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(<Text key={partKey++}>{line.slice(lastIndex, index)}</Text>);
    }
    parts.push(
      <Text key={partKey++} backgroundColor={theme.colors.warning} color="black">
        {line.slice(index, index + term.length)}
      </Text>
    );
    lastIndex = index + term.length;
    index = lowerLine.indexOf(lowerTerm, lastIndex);
  }

  if (lastIndex < line.length) {
    parts.push(<Text key={partKey++}>{line.slice(lastIndex)}</Text>);
  }

  return parts.length > 0 ? <>{parts}</> : line;
}
