import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import DualPanel from './screens/DualPanel.js';
import SystemInfo from './screens/SystemInfo.js';
import DiskUtils from './screens/DiskUtils.js';
import { defaultTheme } from './themes/classic-blue.js';
import { features } from './utils/platform.js';
import { APP_TITLE } from './utils/version.js';
import type { PanelSide } from './types/index.js';

type Screen = 'dual-panel' | 'system-info' | 'disk-utils';

interface PanelState {
  leftPath: string;
  rightPath: string;
  activePanel: PanelSide;
  leftIndex: number;
  rightIndex: number;
}

interface AppProps {
  onEnterAI?: (currentPath: string) => void;
  initialLeftPath?: string;
  initialRightPath?: string;
  initialActivePanel?: PanelSide;
  initialLeftIndex?: number;
  initialRightIndex?: number;
  onSavePanelState?: (state: PanelState) => void;
}

export default function App({
  onEnterAI,
  initialLeftPath,
  initialRightPath,
  initialActivePanel,
  initialLeftIndex,
  initialRightIndex,
  onSavePanelState,
}: AppProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dual-panel');

  useInput((input, key) => {
    // ESC from sub-screens
    if (key.escape && currentScreen !== 'dual-panel') {
      setCurrentScreen('dual-panel');
    }
  });

  if (currentScreen === 'dual-panel') {
    return (
      <DualPanel
        onEnterAI={onEnterAI}
        initialLeftPath={initialLeftPath}
        initialRightPath={initialRightPath}
        initialActivePanel={initialActivePanel}
        initialLeftIndex={initialLeftIndex}
        initialRightIndex={initialRightIndex}
        onSavePanelState={onSavePanelState}
      />
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color={defaultTheme.colors.borderActive}>
          {APP_TITLE}
        </Text>
      </Box>

      {currentScreen === 'system-info' && <SystemInfo />}
      {currentScreen === 'disk-utils' && features.diskUtils && <DiskUtils />}
      {currentScreen === 'disk-utils' && !features.diskUtils && (
        <Box flexDirection="column">
          <Text color="yellow">Disk Utilities is not available on this platform.</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press ESC to return to file manager</Text>
      </Box>
    </Box>
  );
}
