/**
 * Platform detection and feature availability utilities
 */
/**
 * Current platform
 */
export declare const platform: NodeJS.Platform;
/**
 * Check if running on Windows
 */
export declare const isWindows: boolean;
/**
 * Check if running on macOS
 */
export declare const isMacOS: boolean;
/**
 * Check if running on Linux
 */
export declare const isLinux: boolean;
/**
 * Check if platform supports Unix commands (ps, df, du, etc.)
 */
export declare const isUnixLike: boolean;
/**
 * Feature flags based on platform
 */
export declare const features: {
    /** Process manager (requires ps command) */
    processManager: boolean;
    /** Disk utilities (requires df, du commands) */
    diskUtils: boolean;
    /** AI features (only on Unix-like systems with claude CLI) */
    ai: boolean;
};
/**
 * Check if Claude CLI is available using 'which' command
 * Only works on Unix-like systems (Linux, macOS)
 */
export declare function isClaudeCLIAvailable(): boolean;
/**
 * Check if Claude CLI is available (cached)
 */
export declare function checkClaudeCLI(): boolean;
/**
 * Reset Claude CLI availability cache (for testing)
 */
export declare function resetClaudeCLICache(): void;
//# sourceMappingURL=platform.d.ts.map