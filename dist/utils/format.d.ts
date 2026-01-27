/**
 * Format utilities for displaying file information
 */
/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 KB", "2.3 MB")
 */
export declare function formatSize(bytes: number): string;
/**
 * Format date in localized string
 * @param date - Date object
 * @returns Formatted date string
 */
export declare function formatDate(date: Date): string;
/**
 * Format file permissions from Unix mode
 * @param mode - Unix file mode
 * @returns Formatted permission string (e.g., "drwxr-xr-x (755)")
 */
export declare function formatPermissions(mode: number): string;
/**
 * Format file permissions in short format (rwxrwxrwx)
 * @param mode - Unix file mode
 * @returns Short permission string (e.g., "rwxr-xr-x")
 */
export declare function formatPermissionsShort(mode: number): string;
//# sourceMappingURL=format.d.ts.map