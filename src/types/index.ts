/**
 * Centralized type definitions for cokacdir
 */

/**
 * Basic file item representation for file listings
 */
export interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
  permissions?: string;
}

/**
 * Detailed file information for file info modal
 */
export interface FileDetails {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isSymlink: boolean;
  permissions: string;
  owner: number;
  group: number;
  created: Date;
  modified: Date;
  accessed: Date;
  inode: number;
  links: number;
  itemCount?: number;
  totalSize?: number;
}

/**
 * File operation types
 */
export type FileOperation = 'copy' | 'move' | 'delete' | 'mkdir' | 'rename';

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Sort order for file listings
 */
export type SortBy = 'name' | 'size' | 'modified';

/**
 * Sort direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Panel side identifier
 */
export type PanelSide = 'left' | 'right';

/**
 * Process information for process manager
 */
export interface ProcessInfo {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  vsz: number;
  rss: number;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

/**
 * Theme configuration
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
