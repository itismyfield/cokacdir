import React from 'react';
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = defaultTheme;
  const bgColor = '#000000';

  useInput((input, key) => {
    if (input === 'y' || input === 'Y') {
      onConfirm();
    } else if (input === 'n' || input === 'N' || key.escape) {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.colors.warning}
      backgroundColor={bgColor}
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center">
        <Text color={theme.colors.warning} bold>{title}</Text>
      </Box>
      <Text> </Text>
      <Text color={theme.colors.text}>{message}</Text>
      <Text> </Text>
      <Box justifyContent="center">
        <Text color={theme.colors.success}>[Y]</Text>
        <Text> Yes    </Text>
        <Text color={theme.colors.error}>[N]</Text>
        <Text> No</Text>
      </Box>
    </Box>
  );
}
