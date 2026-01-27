import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';

interface InputDialogProps {
  title: string;
  prompt: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export default function InputDialog({
  title,
  prompt,
  defaultValue = '',
  onSubmit,
  onCancel,
}: InputDialogProps) {
  const theme = defaultTheme;
  const [value, setValue] = useState(defaultValue);
  const bgColor = '#000000';
  const dialogWidth = 60;
  const inputMaxWidth = dialogWidth - 8; // border, padding, "> " prefix, cursor

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      if (value.trim()) {
        onSubmit(value.trim());
      }
    } else if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setValue(prev => prev + input);
    }
  });

  // 표시할 값 (너비 초과 시 뒷부분만 표시)
  const displayValue = value.length > inputMaxWidth
    ? '…' + value.slice(-(inputMaxWidth - 1))
    : value;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.colors.borderActive}
      backgroundColor={bgColor}
      paddingX={2}
      paddingY={1}
      width={dialogWidth}
    >
      <Box justifyContent="center">
        <Text color={theme.colors.borderActive} bold>{title}</Text>
      </Box>
      <Text> </Text>
      <Text color={theme.colors.text}>{prompt}</Text>
      <Box>
        <Text color={theme.colors.info}>&gt; </Text>
        <Text color={theme.colors.text}>{displayValue}</Text>
        <Text color={theme.colors.borderActive}>_</Text>
      </Box>
      <Text> </Text>
      <Text color={theme.colors.textDim}>[Enter] Confirm  [Esc] Cancel</Text>
    </Box>
  );
}
