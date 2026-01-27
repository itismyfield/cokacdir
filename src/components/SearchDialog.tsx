import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { defaultTheme } from '../themes/classic-blue.js';

export interface SearchCriteria {
  name: string;
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
}

interface SearchDialogProps {
  onSubmit: (criteria: SearchCriteria) => void;
  onCancel: () => void;
}

type SearchField = 'name' | 'minSize' | 'maxSize' | 'modifiedAfter' | 'modifiedBefore';

const FIELDS: { key: SearchField; label: string; hint: string }[] = [
  { key: 'name', label: 'Name', hint: 'Pattern to match' },
  { key: 'minSize', label: 'Min Size', hint: 'e.g., 1K, 1M' },
  { key: 'maxSize', label: 'Max Size', hint: 'e.g., 1K, 1M' },
  { key: 'modifiedAfter', label: 'After', hint: 'YYYY-MM-DD' },
  { key: 'modifiedBefore', label: 'Before', hint: 'YYYY-MM-DD' },
];

function parseSize(str: string): number | undefined {
  if (!str.trim()) return undefined;
  const match = str.trim().match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)$/i);
  if (!match) return undefined;

  const num = parseFloat(match[1]);
  const unit = (match[2] || '').toUpperCase();

  const multipliers: Record<string, number> = {
    '': 1,
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024,
    'T': 1024 * 1024 * 1024 * 1024,
  };

  return Math.floor(num * (multipliers[unit] || 1));
}

function parseDate(str: string): Date | undefined {
  if (!str.trim()) return undefined;
  const date = new Date(str.trim());
  return isNaN(date.getTime()) ? undefined : date;
}

export default function SearchDialog({ onSubmit, onCancel }: SearchDialogProps) {
  const theme = defaultTheme;
  const [activeField, setActiveField] = useState(0);
  const [values, setValues] = useState<Record<SearchField, string>>({
    name: '',
    minSize: '',
    maxSize: '',
    modifiedAfter: '',
    modifiedBefore: '',
  });
  const bgColor = '#000000';

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return) {
      const criteria: SearchCriteria = {
        name: values.name,
        minSize: parseSize(values.minSize),
        maxSize: parseSize(values.maxSize),
        modifiedAfter: parseDate(values.modifiedAfter),
        modifiedBefore: parseDate(values.modifiedBefore),
      };
      onSubmit(criteria);
      return;
    }

    if (key.upArrow) {
      setActiveField(prev => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow || key.tab) {
      setActiveField(prev => Math.min(FIELDS.length - 1, prev + 1));
      return;
    }

    if (key.backspace || key.delete) {
      const field = FIELDS[activeField].key;
      setValues(prev => ({ ...prev, [field]: prev[field].slice(0, -1) }));
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      const field = FIELDS[activeField].key;
      setValues(prev => ({ ...prev, [field]: prev[field] + input }));
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.colors.borderActive}
      backgroundColor={bgColor}
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text color={theme.colors.borderActive} bold>Advanced Search</Text>
      </Box>

      {FIELDS.map((field, idx) => {
        const isActive = idx === activeField;
        return (
          <Box key={field.key}>
            <Text color={isActive ? theme.colors.borderActive : theme.colors.text}>
              {isActive ? '> ' : '  '}{field.label.padEnd(10)}
            </Text>
            <Text color={theme.colors.info}>[</Text>
            <Text
              color={theme.colors.text}
              backgroundColor={isActive ? theme.colors.bgSelected : undefined}
            >
              {(values[field.key] || '').padEnd(12)}
            </Text>
            <Text color={theme.colors.info}>]</Text>
            {isActive && (
              <Text color={theme.colors.textDim}> {field.hint}</Text>
            )}
          </Box>
        );
      })}

      <Text> </Text>
      <Text color={theme.colors.textDim}>
        [↑↓/Tab] Navigate  [Enter] Search  [Esc] Cancel
      </Text>
    </Box>
  );
}
