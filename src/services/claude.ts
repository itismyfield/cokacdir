import { spawn } from 'child_process';
import { isUnixLike, checkClaudeCLI } from '../utils/platform.js';

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
 * Validate session ID format (alphanumeric, dashes, underscores only)
 */
function isValidSessionId(sessionId: string): boolean {
  // Allow alphanumeric characters, dashes, and underscores only
  // Typical Claude session IDs follow this pattern
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(sessionId) && sessionId.length > 0 && sessionId.length < 256;
}

/**
 * Execute a command using Claude CLI
 */
export async function executeCommand(
  prompt: string,
  sessionId: string | null = null,
  workingDir: string = process.cwd()
): Promise<ClaudeResponse> {
  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (response: ClaudeResponse) => {
      if (!resolved) {
        resolved = true;
        resolve(response);
      }
    };

    const args = [
      '-p',
      '--output-format', 'json',
      '--append-system-prompt',
      `You are a terminal file manager assistant. Be concise. Focus on file operations. Suggest safe commands only. Respond in the same language as the user.

IMPORTANT: Format your responses using Markdown for better readability:
- Use **bold** for important terms or commands
- Use \`code\` for file paths, commands, and technical terms
- Use bullet lists (- item) for multiple items
- Use numbered lists (1. item) for sequential steps
- Use code blocks (\`\`\`language) for multi-line code or command examples
- Use headers (## Title) to organize longer responses
- Keep formatting minimal and terminal-friendly`,
      // NOTE: Removed --dangerously-skip-permissions for security
      // Claude will now ask for permission before executing commands
    ];

    // Resume session if available
    if (sessionId) {
      // Validate sessionId format to prevent injection
      if (!isValidSessionId(sessionId)) {
        return Promise.resolve({
          success: false,
          error: 'Invalid session ID format',
        });
      }
      args.push('--resume', sessionId);
    }

    let stdout = '';
    let stderr = '';

    const proc = spawn('claude', args, {
      cwd: workingDir,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdin.write(prompt);
    proc.stdin.end();

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        safeResolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
        });
        return;
      }

      try {
        const response = parseClaudeOutput(stdout);
        safeResolve(response);
      } catch (err: any) {
        safeResolve({
          success: false,
          error: `Failed to parse response: ${err.message}`,
        });
      }
    });

    proc.on('error', (err) => {
      safeResolve({
        success: false,
        error: `Failed to start Claude: ${err.message}. Is Claude CLI installed?`,
      });
    });
  });
}

/**
 * Parse Claude CLI JSON output
 */
function parseClaudeOutput(output: string): ClaudeResponse {
  // Try to find JSON in output
  const lines = output.trim().split('\n');

  let sessionId: string | undefined;
  let responseText = '';

  for (const line of lines) {
    try {
      const json = JSON.parse(line);

      // Extract session ID
      if (json.session_id) {
        sessionId = json.session_id;
      }

      // Extract response text
      if (json.result) {
        responseText = json.result;
      } else if (json.message) {
        responseText = json.message;
      } else if (json.content) {
        responseText = json.content;
      } else if (typeof json === 'string') {
        responseText = json;
      }
    } catch {
      // Not JSON, might be plain text response
      if (line.trim() && !line.startsWith('{')) {
        responseText += line + '\n';
      }
    }
  }

  // If no structured response, use raw output
  if (!responseText) {
    responseText = output.trim();
  }

  return {
    success: true,
    response: responseText.trim(),
    sessionId,
  };
}

/**
 * Check if Claude CLI is available
 * First checks platform compatibility (Unix-like only),
 * then uses 'which claude' to verify CLI exists
 */
export async function isClaudeAvailable(): Promise<boolean> {
  if (!isUnixLike) {
    return false;
  }

  if (!checkClaudeCLI()) {
    return false;
  }

  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (value: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };

    const proc = spawn('claude', ['--version'], { shell: false });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      safeResolve(code === 0);
    });

    proc.on('error', () => {
      clearTimeout(timeoutId);
      safeResolve(false);
    });

    const timeoutId = setTimeout(() => {
      proc.kill('SIGKILL');
      safeResolve(false);
    }, 5000);
  });
}

/**
 * Create a new session
 */
export function createSession(): ClaudeSession {
  return {
    sessionId: null,
    history: [],
  };
}

/**
 * Add message to session history
 */
export function addToHistory(
  session: ClaudeSession,
  role: 'user' | 'assistant',
  content: string
): ClaudeSession {
  return {
    ...session,
    history: [
      ...session.history,
      { role, content, timestamp: new Date() },
    ],
  };
}
