/**
 * Process management service for cokacdir
 * Provides functions to list and manage system processes
 */
import { execSync } from 'child_process';
/**
 * Protected PIDs that should never be killed
 */
const PROTECTED_PIDS = [
    1, // init/systemd
    2, // kthreadd (kernel thread parent)
];
/**
 * Minimum PID threshold - PIDs below this are likely kernel threads
 */
const MIN_SAFE_PID = 300;
/**
 * Validate PID is a safe positive integer
 */
function isValidPid(pid) {
    return Number.isInteger(pid) && pid > 0 && pid <= 4194304; // Max PID on Linux
}
/**
 * Check if a process is a kernel thread (command starts with [)
 */
function isKernelThread(command) {
    return command.startsWith('[') && command.endsWith(']');
}
/**
 * Check if PID is protected from being killed
 */
function isProtectedPid(pid, command) {
    // Check if it's our own process
    if (pid === process.pid) {
        return { protected: true, reason: 'Cannot kill the file manager itself' };
    }
    // Check if it's the parent process
    if (pid === process.ppid) {
        return { protected: true, reason: 'Cannot kill the parent process' };
    }
    // Check protected system PIDs
    if (PROTECTED_PIDS.includes(pid)) {
        return { protected: true, reason: `Cannot kill system process (PID ${pid})` };
    }
    // Warn about low PIDs (likely kernel threads)
    if (pid < MIN_SAFE_PID) {
        return { protected: true, reason: `Cannot kill low PID (${pid}) - likely a kernel thread` };
    }
    // Check if command indicates kernel thread
    if (command && isKernelThread(command)) {
        return { protected: true, reason: 'Cannot kill kernel threads' };
    }
    return { protected: false };
}
/**
 * Get list of running processes
 */
export function getProcessList() {
    try {
        // Use ps command to get process list
        const output = execSync('ps aux --no-headers', {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large process lists
        });
        const lines = output.trim().split('\n');
        const processes = [];
        for (const line of lines) {
            // Split by whitespace, but command can have spaces
            const parts = line.trim().split(/\s+/);
            if (parts.length < 11)
                continue;
            const [user, pid, cpu, mem, vsz, rss, tty, stat, start, time, ...cmdParts] = parts;
            processes.push({
                pid: parseInt(pid, 10),
                user,
                cpu: parseFloat(cpu),
                mem: parseFloat(mem),
                vsz: parseInt(vsz, 10),
                rss: parseInt(rss, 10),
                tty,
                stat,
                start,
                time,
                command: cmdParts.join(' '),
            });
        }
        // Sort by CPU usage descending by default
        processes.sort((a, b) => b.cpu - a.cpu);
        return processes;
    }
    catch (error) {
        console.error('Failed to get process list:', error);
        return [];
    }
}
/**
 * Kill a process by PID using Node.js process.kill() API
 * This is safer than execSync as it doesn't allow command injection
 */
export function killProcess(pid, signal = 15) {
    // Validate PID
    if (!isValidPid(pid)) {
        return { success: false, error: 'Invalid PID' };
    }
    // Get process info to check if it's a kernel thread
    const procInfo = getProcessDetails(pid);
    const command = procInfo?.command;
    // Check if PID is protected
    const protection = isProtectedPid(pid, command);
    if (protection.protected) {
        return { success: false, error: protection.reason };
    }
    try {
        // Use Node.js process.kill() instead of execSync to prevent command injection
        process.kill(pid, signal);
        return { success: true };
    }
    catch (error) {
        if (error.code === 'ESRCH') {
            return { success: false, error: 'Process not found' };
        }
        if (error.code === 'EPERM') {
            return { success: false, error: 'Permission denied' };
        }
        return {
            success: false,
            error: error.message || 'Failed to kill process'
        };
    }
}
/**
 * Force kill a process by PID (SIGKILL)
 */
export function forceKillProcess(pid) {
    return killProcess(pid, 9);
}
/**
 * Get process details by PID
 */
export function getProcessDetails(pid) {
    // Validate PID to prevent command injection
    if (!isValidPid(pid)) {
        return null;
    }
    try {
        // PID is validated as a safe integer, so this is safe
        const output = execSync(`ps -p ${pid} -o user,pid,%cpu,%mem,vsz,rss,tty,stat,start,time,command --no-headers`, {
            encoding: 'utf-8'
        });
        const line = output.trim();
        if (!line)
            return null;
        const parts = line.split(/\s+/);
        if (parts.length < 11)
            return null;
        const [user, pidStr, cpu, mem, vsz, rss, tty, stat, start, time, ...cmdParts] = parts;
        return {
            pid: parseInt(pidStr, 10),
            user,
            cpu: parseFloat(cpu),
            mem: parseFloat(mem),
            vsz: parseInt(vsz, 10),
            rss: parseInt(rss, 10),
            tty,
            stat,
            start,
            time,
            command: cmdParts.join(' '),
        };
    }
    catch {
        return null;
    }
}
/**
 * Check if a process can be killed (for UI display)
 */
export function canKillProcess(pid, command) {
    if (!isValidPid(pid)) {
        return { canKill: false, reason: 'Invalid PID' };
    }
    const protection = isProtectedPid(pid, command);
    return { canKill: !protection.protected, reason: protection.reason };
}
//# sourceMappingURL=process.js.map