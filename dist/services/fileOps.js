import fs from 'fs';
import path from 'path';
/**
 * Copy a file or directory
 */
export function copyFile(src, dest) {
    try {
        // Check if source and destination are the same
        const resolvedSrc = path.resolve(src);
        const resolvedDest = path.resolve(dest);
        if (resolvedSrc === resolvedDest) {
            return { success: false, error: 'Source and destination are the same file' };
        }
        // Check if destination already exists
        if (fs.existsSync(dest)) {
            return { success: false, error: 'Target already exists. Delete it first or choose a different name.' };
        }
        const srcStat = fs.statSync(src);
        if (srcStat.isDirectory()) {
            copyDirRecursive(src, dest);
        }
        else {
            fs.copyFileSync(src, dest);
        }
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * Copy directory recursively
 */
function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
/**
 * Move a file or directory
 */
export function moveFile(src, dest) {
    try {
        // Check if source and destination are the same
        const resolvedSrc = path.resolve(src);
        const resolvedDest = path.resolve(dest);
        if (resolvedSrc === resolvedDest) {
            return { success: false, error: 'Source and destination are the same' };
        }
        // Check if destination already exists
        if (fs.existsSync(dest)) {
            return { success: false, error: 'Target already exists. Delete it first or choose a different name.' };
        }
        fs.renameSync(src, dest);
        return { success: true };
    }
    catch (err) {
        // If rename fails (cross-device), copy then delete
        if (err.code === 'EXDEV') {
            const copyResult = copyFile(src, dest);
            if (copyResult.success) {
                return deleteFile(src);
            }
            return copyResult;
        }
        return { success: false, error: err.message };
    }
}
/**
 * Delete a file or directory
 */
export function deleteFile(filePath) {
    try {
        const stat = fs.lstatSync(filePath); // Use lstat to not follow symlinks
        if (stat.isSymbolicLink()) {
            // Just remove the symlink itself, don't follow it
            fs.unlinkSync(filePath);
        }
        else if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
        }
        else {
            fs.unlinkSync(filePath);
        }
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * Create a new directory with path validation
 */
export function createDirectory(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            return { success: false, error: 'Directory already exists' };
        }
        fs.mkdirSync(dirPath, { recursive: true });
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * Rename a file or directory
 */
export function renameFile(oldPath, newPath) {
    try {
        if (fs.existsSync(newPath)) {
            return { success: false, error: 'Target already exists' };
        }
        fs.renameSync(oldPath, newPath);
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * Check if path exists
 */
export function exists(filePath) {
    return fs.existsSync(filePath);
}
/**
 * Validate filename for dangerous characters
 */
export function isValidFilename(name) {
    if (!name || name.trim() === '') {
        return { valid: false, error: 'Filename cannot be empty' };
    }
    // Check for path separators
    if (name.includes('/') || name.includes('\\')) {
        return { valid: false, error: 'Filename cannot contain path separators' };
    }
    // Check for null bytes
    if (name.includes('\0')) {
        return { valid: false, error: 'Filename cannot contain null bytes' };
    }
    // Check for reserved names
    if (name === '.' || name === '..') {
        return { valid: false, error: 'Invalid filename' };
    }
    return { valid: true };
}
//# sourceMappingURL=fileOps.js.map