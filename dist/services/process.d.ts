/**
 * Process management service for cokacdir
 * Provides functions to list and manage system processes
 */
import type { ProcessInfo } from '../types/index.js';
/**
 * Get list of running processes
 */
export declare function getProcessList(): ProcessInfo[];
/**
 * Kill a process by PID using Node.js process.kill() API
 * This is safer than execSync as it doesn't allow command injection
 */
export declare function killProcess(pid: number, signal?: number): {
    success: boolean;
    error?: string;
};
/**
 * Force kill a process by PID (SIGKILL)
 */
export declare function forceKillProcess(pid: number): {
    success: boolean;
    error?: string;
};
/**
 * Get process details by PID
 */
export declare function getProcessDetails(pid: number): ProcessInfo | null;
/**
 * Check if a process can be killed (for UI display)
 */
export declare function canKillProcess(pid: number, command?: string): {
    canKill: boolean;
    reason?: string;
};
//# sourceMappingURL=process.d.ts.map