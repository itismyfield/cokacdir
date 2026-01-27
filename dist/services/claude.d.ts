export interface ClaudeResponse {
    success: boolean;
    response?: string;
    sessionId?: string;
    error?: string;
}
export interface ClaudeSession {
    sessionId: string | null;
    history: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>;
}
/**
 * Execute a command using Claude CLI
 */
export declare function executeCommand(prompt: string, sessionId?: string | null, workingDir?: string): Promise<ClaudeResponse>;
/**
 * Check if Claude CLI is available
 * First checks platform compatibility (Unix-like only),
 * then uses 'which claude' to verify CLI exists
 */
export declare function isClaudeAvailable(): Promise<boolean>;
/**
 * Create a new session
 */
export declare function createSession(): ClaudeSession;
/**
 * Add message to session history
 */
export declare function addToHistory(session: ClaudeSession, role: 'user' | 'assistant', content: string): ClaudeSession;
//# sourceMappingURL=claude.d.ts.map