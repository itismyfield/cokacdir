/**
 * Classic Blue Theme - Norton Commander Style
 * Inspired by DOS-era file managers
 */
export const classicBlue = {
    name: 'Classic Blue',
    colors: {
        // Background colors (NC style blue)
        bg: 'blue',
        bgPanel: 'blue',
        bgSelected: 'cyan',
        bgHeader: 'cyan',
        bgStatusBar: 'cyan',
        bgFunctionBar: 'black',
        // Text colors
        text: 'white',
        textDim: 'gray',
        textBold: 'whiteBright',
        textSelected: 'black',
        textHeader: 'black',
        textDirectory: 'whiteBright',
        textExecutable: 'green',
        textArchive: 'magenta',
        textHidden: 'gray',
        // Border colors
        border: 'cyan',
        borderActive: 'yellow',
        // Status colors
        success: 'green',
        warning: 'yellow',
        error: 'red',
        info: 'cyan',
    },
    chars: {
        // Single-line box drawing
        topLeft: '┌',
        topRight: '┐',
        bottomLeft: '└',
        bottomRight: '┘',
        horizontal: '─',
        vertical: '│',
        teeLeft: '├',
        teeRight: '┤',
        teeUp: '┴',
        teeDown: '┬',
        cross: '┼',
        // File icons (text-based for compatibility)
        folder: '▸',
        file: ' ',
        folderOpen: '▾',
        parent: '◂',
    },
};
/**
 * Dracula Theme - Popular dark theme
 * https://draculatheme.com/
 */
export const dracula = {
    name: 'Dracula',
    colors: {
        // Background colors
        bg: '#282a36',
        bgPanel: '#282a36',
        bgSelected: '#44475a', // Current line
        bgHeader: '#20202e', // Slightly darker than cursor
        bgStatusBar: '#44475a',
        bgFunctionBar: '#21222c', // Darker background
        // Text colors
        text: '#f8f8f2', // Foreground
        textDim: '#6272a4', // Comment
        textBold: '#f8f8f2',
        textSelected: '#f8f8f2', // Keep text visible on selection
        textHeader: '#bd93f9', // Purple
        textDirectory: '#8be9fd', // Cyan
        textExecutable: '#50fa7b', // Green
        textArchive: '#ffb86c', // Orange
        textHidden: '#6272a4', // Comment
        // Border colors
        border: '#2a2d3e', // Dark border for inactive
        borderActive: '#bd93f9', // Purple
        // Status colors
        success: '#50fa7b', // Green
        warning: '#f1fa8c', // Yellow
        error: '#ff5555', // Red
        info: '#8be9fd', // Cyan
    },
    chars: {
        // Single-line box drawing
        topLeft: '┌',
        topRight: '┐',
        bottomLeft: '└',
        bottomRight: '┘',
        horizontal: '─',
        vertical: '│',
        teeLeft: '├',
        teeRight: '┤',
        teeUp: '┴',
        teeDown: '┬',
        cross: '┼',
        // File icons
        folder: ' ',
        file: ' ',
        folderOpen: ' ',
        parent: ' ',
    },
};
// Default theme - change this to switch themes
export const defaultTheme = dracula;
//# sourceMappingURL=classic-blue.js.map