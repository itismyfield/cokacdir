/**
 * Format utilities for displaying file information
 */
/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
/**
 * Format date in localized string
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDate(date) {
    return date.toLocaleString();
}
/**
 * Format file permissions from Unix mode
 * @param mode - Unix file mode
 * @returns Formatted permission string (e.g., "drwxr-xr-x (755)")
 */
export function formatPermissions(mode) {
    const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = perms[(mode >> 6) & 7];
    const group = perms[(mode >> 3) & 7];
    const other = perms[mode & 7];
    let type = '-';
    if ((mode & 0o170000) === 0o040000)
        type = 'd';
    else if ((mode & 0o170000) === 0o120000)
        type = 'l';
    return `${type}${owner}${group}${other} (${(mode & 0o777).toString(8)})`;
}
/**
 * Format file permissions in short format (rwxrwxrwx)
 * @param mode - Unix file mode
 * @returns Short permission string (e.g., "rwxr-xr-x")
 */
export function formatPermissionsShort(mode) {
    const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = perms[(mode >> 6) & 7];
    const group = perms[(mode >> 3) & 7];
    const other = perms[mode & 7];
    return `${owner}${group}${other}`;
}
//# sourceMappingURL=format.js.map