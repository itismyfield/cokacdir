export interface FileOpResult {
    success: boolean;
    error?: string;
}
/**
 * Copy a file or directory
 */
export declare function copyFile(src: string, dest: string): FileOpResult;
/**
 * Move a file or directory
 */
export declare function moveFile(src: string, dest: string): FileOpResult;
/**
 * Delete a file or directory
 */
export declare function deleteFile(filePath: string): FileOpResult;
/**
 * Create a new directory with path validation
 */
export declare function createDirectory(dirPath: string): FileOpResult;
/**
 * Rename a file or directory
 */
export declare function renameFile(oldPath: string, newPath: string): FileOpResult;
/**
 * Check if path exists
 */
export declare function exists(filePath: string): boolean;
/**
 * Validate filename for dangerous characters
 */
export declare function isValidFilename(name: string): {
    valid: boolean;
    error?: string;
};
//# sourceMappingURL=fileOps.d.ts.map