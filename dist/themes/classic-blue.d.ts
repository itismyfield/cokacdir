/**
 * Classic Blue Theme - Norton Commander Style
 * Inspired by DOS-era file managers
 */
export interface Theme {
    name: string;
    colors: {
        bg: string;
        bgPanel: string;
        bgSelected: string;
        bgHeader: string;
        bgStatusBar: string;
        bgFunctionBar: string;
        text: string;
        textDim: string;
        textBold: string;
        textSelected: string;
        textHeader: string;
        textDirectory: string;
        textExecutable: string;
        textArchive: string;
        textHidden: string;
        border: string;
        borderActive: string;
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    chars: {
        topLeft: string;
        topRight: string;
        bottomLeft: string;
        bottomRight: string;
        horizontal: string;
        vertical: string;
        teeLeft: string;
        teeRight: string;
        teeUp: string;
        teeDown: string;
        cross: string;
        folder: string;
        file: string;
        folderOpen: string;
        parent: string;
    };
}
export declare const classicBlue: Theme;
/**
 * Dracula Theme - Popular dark theme
 * https://draculatheme.com/
 */
export declare const dracula: Theme;
export declare const defaultTheme: Theme;
//# sourceMappingURL=classic-blue.d.ts.map