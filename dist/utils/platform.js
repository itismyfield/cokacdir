/**
 * Platform detection and feature availability utilities
 */
import os from 'os';
import { spawnSync } from 'child_process';
/**
 * Current platform
 */
export const platform = os.platform();
/**
 * Check if running on Windows
 */
export const isWindows = platform === 'win32';
/**
 * Check if running on macOS
 */
export const isMacOS = platform === 'darwin';
/**
 * Check if running on Linux
 */
export const isLinux = platform === 'linux';
/**
 * Check if platform supports Unix commands (ps, df, du, etc.)
 */
export const isUnixLike = isMacOS || isLinux;
/**
 * Feature flags based on platform
 */
export const features = {
    /** Process manager (requires ps command) */
    processManager: isUnixLike,
    /** Disk utilities (requires df, du commands) */
    diskUtils: isUnixLike,
    /** AI features (only on Unix-like systems with claude CLI) */
    ai: isUnixLike,
};
/**
 * Check if Claude CLI is available using 'which' command
 * Only works on Unix-like systems (Linux, macOS)
 */
export function isClaudeCLIAvailable() {
    // AI features are only available on Unix-like systems
    if (!isUnixLike) {
        return false;
    }
    try {
        const result = spawnSync('which', ['claude'], {
            encoding: 'utf-8',
            timeout: 5000,
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        return result.status === 0 && !!result.stdout?.trim();
    }
    catch {
        return false;
    }
}
/**
 * Cache for Claude CLI availability check
 */
let claudeAvailableCache = null;
/**
 * Check if Claude CLI is available (cached)
 */
export function checkClaudeCLI() {
    if (claudeAvailableCache === null) {
        claudeAvailableCache = isClaudeCLIAvailable();
    }
    return claudeAvailableCache;
}
/**
 * Reset Claude CLI availability cache (for testing)
 */
export function resetClaudeCLICache() {
    claudeAvailableCache = null;
}
//# sourceMappingURL=platform.js.map