# COKACDIR

Dual-panel terminal file manager with AI-powered natural language commands.

**Terminal File Manager for Vibe Coders** - An easy terminal explorer for vibe coders who are scared of the terminal.

## Features

- **Blazing Fast**: Written in Rust for maximum performance. ~10ms startup, ~5MB memory usage, ~4MB static binary with zero runtime dependencies.
- **AI-Powered Commands**: Natural language file operations powered by Claude AI. Press `.` and describe what you want.
- **Dual-Panel Navigation**: Classic dual-panel interface for efficient file management
- **Keyboard Driven**: Full keyboard navigation designed for power users
- **Built-in Viewer & Editor**: View and edit files with syntax highlighting for 20+ languages
- **Image Viewer**: View images directly in terminal with zoom and pan support
- **Process Manager**: Monitor and manage system processes. Sort by CPU, memory, or PID.
- **File Search**: Find files by name pattern with recursive search
- **Customizable Themes**: Light/Dark themes with full color customization

## Installation

### Quick Install (Recommended)

```bash
/bin/bash -c "$(curl -fsSL https://cokacdir.cokac.com/install.sh)"
```

Then run:

```bash
cokacdir
```

### From Source

```bash
# Clone the repository
git clone https://github.com/kstost/cokacdir.git
cd cokacdir

# Build release version
cargo build --release

# Run
./target/release/cokacdir
```

### Cross-Platform Build

Build for multiple platforms using the included build system:

```bash
# Build for current platform
python3 build.py

# Build for macOS (arm64 + x86_64)
python3 build.py --macos

# Build for all platforms
python3 build.py --all

# Check build tools status
python3 build.py --status
```

See [build_manual.md](build_manual.md) for detailed build instructions.

## Enable AI Commands (Optional)

Install Claude Code to unlock natural language file operations:

```bash
npm install -g @anthropic-ai/claude-code
```

Learn more at [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)

## Custom File Handlers (Extension Handler)

You can define custom programs to open files based on their extension. When you press `Enter` on a file, the configured handler will be executed instead of the built-in viewer/editor.

### Configuration File

Edit `~/.cokacdir/settings.json` and add the `extension_handler` section:

```json
{
  "extension_handler": {
    "jpg|jpeg|png|gif|webp": ["feh {{FILEPATH}}", "eog {{FILEPATH}}"],
    "mp4|avi|mkv|webm": ["vlc {{FILEPATH}}", "mpv {{FILEPATH}}"],
    "pdf": ["evince {{FILEPATH}}", "xdg-open {{FILEPATH}}"],
    "rs|py|js|ts": ["@vim {{FILEPATH}}", "@nano {{FILEPATH}}"],
    "md": ["@vim {{FILEPATH}}"]
  }
}
```

### Syntax

| Element | Description |
|---------|-------------|
| `extension_handler` | Main configuration key |
| `"jpg\|jpeg\|png"` | Pipe-separated extensions (case-insensitive) |
| `["cmd1", "cmd2"]` | Array of commands (fallback order) |
| `{{FILEPATH}}` | Placeholder replaced with actual file path |
| `@` prefix | Terminal mode for TUI apps (vim, nano, etc.) |

### Execution Modes

| Mode | Prefix | Behavior | Use Case |
|------|--------|----------|----------|
| Background | (none) | Launches program and returns immediately | GUI apps (feh, vlc, evince) |
| Terminal | `@` | Suspends COKACDIR, runs program, restores on exit | TUI apps (vim, nano, less) |

### Fallback Mechanism

Commands are tried in order. If the first command fails, the next one is attempted:

```json
{
  "extension_handler": {
    "jpg": ["feh {{FILEPATH}}", "eog {{FILEPATH}}", "xdg-open {{FILEPATH}}"]
  }
}
```

1. Try `feh` first
2. If `feh` fails → try `eog`
3. If `eog` fails → try `xdg-open`
4. If all fail → show error dialog

### Examples

#### Image Viewer

```json
{
  "extension_handler": {
    "jpg|jpeg|png|gif|bmp|webp|ico|tiff": ["feh {{FILEPATH}}"]
  }
}
```

#### Video Player

```json
{
  "extension_handler": {
    "mp4|avi|mkv|webm|mov|flv": ["vlc {{FILEPATH}}", "mpv {{FILEPATH}}"]
  }
}
```

#### PDF Reader

```json
{
  "extension_handler": {
    "pdf": ["evince {{FILEPATH}}", "okular {{FILEPATH}}", "xdg-open {{FILEPATH}}"]
  }
}
```

#### Text Editor (Terminal Mode)

```json
{
  "extension_handler": {
    "txt|md|rst": ["@vim {{FILEPATH}}"],
    "rs|py|js|ts|go|c|cpp|h": ["@vim {{FILEPATH}}", "code {{FILEPATH}}"]
  }
}
```

#### Open with VS Code

```json
{
  "extension_handler": {
    "rs|py|js|ts|json|yaml|toml": ["code {{FILEPATH}}"]
  }
}
```

### Complete Example

```json
{
  "left_panel": {
    "sort_by": "name",
    "sort_order": "asc"
  },
  "right_panel": {
    "sort_by": "name",
    "sort_order": "asc"
  },
  "active_panel": "left",
  "theme": {
    "name": "dark"
  },
  "extension_handler": {
    "jpg|jpeg|png|gif|webp|bmp": ["feh {{FILEPATH}}", "eog {{FILEPATH}}"],
    "mp4|avi|mkv|webm|mov": ["vlc {{FILEPATH}}"],
    "pdf": ["evince {{FILEPATH}}"],
    "txt|md": ["@vim {{FILEPATH}}"],
    "rs|py|js|ts": ["@vim {{FILEPATH}}", "code {{FILEPATH}}"],
    "html": ["firefox {{FILEPATH}}", "xdg-open {{FILEPATH}}"]
  }
}
```

### Notes

- **Case-insensitive**: `JPG`, `jpg`, `Jpg` are all matched
- **Spaces in paths**: File paths with spaces are automatically escaped
- **Undefined extensions**: Files without a handler use the built-in viewer/editor
- **Hot-reload**: Edit settings.json in COKACDIR's editor and save (`Ctrl+S`) to apply changes immediately
- **Error handling**: If all handlers fail, an error dialog shows the last error message

## Keyboard Shortcuts

### Navigation

| Key | Action |
|-----|--------|
| `↑`/`↓` | Navigate files |
| `Enter` | Open directory |
| `Esc` | Parent directory |
| `Tab` | Switch panels |
| `←`/`→` | Switch panels (keep position) |
| `Home`/`End` | First / Last item |
| `PgUp`/`PgDn` | Move 10 lines |
| `/` | Go to path |
| `'` | Toggle bookmark |
| `1` | Go to home directory |
| `2` | Refresh file list |

### Bookmarks

Quickly navigate to frequently used directories.

| Key | Action |
|-----|--------|
| `'` | Toggle bookmark for current directory |
| `/` | Open Go to path (type to search bookmarks) |

- **Add bookmark**: Press `'` in any directory to bookmark it
- **Remove bookmark**: Press `'` again in a bookmarked directory
- **Bookmark indicator**: Bookmarked directories show `✻` marker in panel title
- **Quick access**: Press `/` and type to fuzzy-search your bookmarks (e.g., "thse" matches "/path/to/base")
- **Path mode**: In Go to path dialog, type `/` or `~` to switch to path input mode

### File Operations

| Key | Action |
|-----|--------|
| `k` | Create directory |
| `x` | Delete |
| `r` | Rename |
| `t` | Create tar archive |
| `f` | Find/Search files |

### Clipboard Operations

| Key | Action |
|-----|--------|
| `Ctrl+C` | Copy to clipboard |
| `Ctrl+X` | Cut to clipboard |
| `Ctrl+V` | Paste from clipboard |

### View & Tools

| Key | Action |
|-----|--------|
| `h` | Help |
| `i` | File info |
| `e` | Edit file |
| `p` | Process manager |
| `` ` `` | Settings |

### macOS Only

| Key | Action |
|-----|--------|
| `o` | Open current folder in Finder |
| `c` | Open current folder in VS Code |

#### `o` - Open in Finder

Opens the current panel's directory in macOS Finder. Uses the native `open` command.

```
# Equivalent terminal command
open /path/to/current/folder
```

#### `c` - Open in VS Code

Opens the current panel's directory in Visual Studio Code. Automatically detects which VS Code variant is installed:

1. First tries `code` (VS Code stable)
2. Falls back to `code-insiders` (VS Code Insiders)
3. Shows error if neither is found

```
# Equivalent terminal command
code /path/to/current/folder
# or
code-insiders /path/to/current/folder
```

**Note**: VS Code CLI (`code` command) must be installed. In VS Code, press `Cmd+Shift+P` and run "Shell Command: Install 'code' command in PATH".

### Selection & AI

| Key | Action |
|-----|--------|
| `Space` | Select file |
| `*` | Select all |
| `;` | Select by extension |
| `n` / `s` / `d` / `y` | Sort by name / size / date / type |
| `.` | AI command |
| `q` | Quit |

### File Viewer

| Key | Action |
|-----|--------|
| `↑`/`↓`/`j`/`k` | Scroll |
| `PgUp`/`PgDn` | Page scroll |
| `Home`/`End`/`G` | Go to start/end |
| `Ctrl+F`/`/` | Search |
| `Ctrl+G` | Go to line |
| `b` | Toggle bookmark |
| `[`/`]` | Prev/Next bookmark |
| `H` | Toggle hex mode |
| `W` | Toggle word wrap |
| `E` | Open in editor |
| `Esc`/`Q` | Close viewer |

### File Editor

| Key | Action |
|-----|--------|
| `Ctrl+S` | Save |
| `Ctrl+Z/Y` | Undo/Redo |
| `Ctrl+C/X/V` | Copy/Cut/Paste |
| `Ctrl+A` | Select all |
| `Ctrl+D` | Select word |
| `Ctrl+L` | Select line |
| `Ctrl+K` | Delete line |
| `Ctrl+J` | Duplicate line |
| `Ctrl+/` | Toggle comment |
| `Ctrl+F` | Find |
| `Ctrl+H` | Find & Replace |
| `Ctrl+G` | Go to line |
| `Alt+↑/↓` | Move line up/down |
| `Esc` | Close editor |

### Process Manager

| Key | Action |
|-----|--------|
| `↑`/`↓` | Navigate processes |
| `PgUp`/`PgDn` | Page scroll |
| `k` | Kill process (SIGTERM) |
| `K` | Force kill (SIGKILL) |
| `r` | Refresh list |
| `p` | Sort by PID |
| `c` | Sort by CPU |
| `m` | Sort by memory |
| `n` | Sort by command name |
| `Esc`/`q` | Close |

### Image Viewer

| Key | Action |
|-----|--------|
| `+`/`-` | Zoom in/out |
| `r` | Reset zoom |
| `↑`/`↓`/`←`/`→` | Pan image |
| `PgUp`/`PgDn` | Previous/Next image |
| `Esc`/`q` | Close viewer |

## Theme Customization

COKACDIR supports fully customizable themes. You can modify the built-in themes or create your own.

### Theme File Location

```
~/.cokacdir/themes/
├── light.json    # Light theme (default)
└── dark.json     # Dark theme
```

Theme files are automatically created on first launch. To switch themes, edit `~/.cokacdir/settings.json`:

```json
{
  "theme": {
    "name": "dark"
  }
}
```

### Understanding Indexed Colors

COKACDIR uses **256 Indexed Colors** for maximum terminal compatibility. Instead of RGB values, colors are specified as numbers from 0 to 255.

#### Color Ranges

| Range | Description |
|-------|-------------|
| 0-7 | Standard colors (black, red, green, yellow, blue, magenta, cyan, white) |
| 8-15 | Bright/bold versions of standard colors |
| 16-231 | 216-color cube (6×6×6 RGB combinations) |
| 232-255 | 24-step grayscale (dark to light) |

#### Common Color Values

| Value | Color | Value | Color |
|-------|-------|-------|-------|
| 0 | Black | 15 | Bright White |
| 1 | Red | 21 | Blue |
| 2 | Green | 34 | Green |
| 3 | Yellow | 81 | Cyan |
| 4 | Blue | 196 | Bright Red |
| 5 | Magenta | 226 | Yellow |
| 7 | White | 255 | White |

#### Grayscale (232-255)

```
232 ████ (darkest)
238 ████
243 ████
248 ████
253 ████
255 ████ (brightest/white)
```

### Theme File Structure

Theme files are JSON with the following main sections:

```json
{
  "name": "mytheme",
  "palette": {
    "bg": 235,           // Main background
    "bg_alt": 236,       // Header/status bar background
    "fg": 252,           // Main text
    "fg_dim": 245,       // Secondary text
    "fg_strong": 255,    // Emphasized text (directories, titles)
    "fg_inverse": 235,   // Text on selected items
    "accent": 81,        // Accent color (headers, prompts)
    "shortcut": 117,     // Shortcut key display
    "positive": 114,     // Success/progress indicators
    "highlight": 204     // Warnings, errors, markers
  },
  "panel": {
    "bg": 235,
    "border": 240,
    "border_active": 81,
    "file_text": 252,
    "directory_text": 81,
    "selected_bg": 240,
    "selected_text": 255,
    "marked_text": 204
    // ... more fields
  },
  "editor": { /* ... */ },
  "viewer": { /* ... */ },
  "dialog": { /* ... */ }
  // ... 19 UI component sections total
}
```

### Adding New Themes

You can add unlimited custom themes by creating new JSON files in the themes folder. The filename (without `.json`) becomes the theme name.

```
~/.cokacdir/themes/
├── light.json       # Built-in: "light"
├── dark.json        # Built-in: "dark"
├── mytheme.json     # Custom: "mytheme"
└── solarized.json   # Custom: "solarized"
```

### Creating a Custom Theme

1. **Create a new theme file** (copy from existing or start fresh):
   ```bash
   cp ~/.cokacdir/themes/dark.json ~/.cokacdir/themes/mytheme.json
   ```

2. **Edit the theme file**:
   ```bash
   # Using COKACDIR's built-in editor
   cokacdir
   # Navigate to ~/.cokacdir/themes/mytheme.json and press Enter
   ```

3. **Change the theme name** and **modify color values** (0-255):
   ```json
   {
     "name": "mytheme",
     "palette": {
       "bg": 234,        // Darker background
       "accent": 39,     // Different accent color
       // ...
     }
   }
   ```

4. **Apply the theme** in `~/.cokacdir/settings.json`:
   ```json
   {
     "theme": {
       "name": "mytheme"
     }
   }
   ```

5. **Restart COKACDIR** or save settings.json within the app to apply.

### UI Components Reference

| Section | Description | Key Fields |
|---------|-------------|------------|
| `palette` | Base colors | bg, fg, accent, highlight |
| `panel` | File panels | file_text, directory_text, selected_bg |
| `header` | App header | bg, text, title |
| `status_bar` | Bottom status | bg, text, text_dim |
| `dialog` | Dialogs | input_text, button_selected_bg |
| `editor` | File editor | text, line_number, cursor |
| `viewer` | File viewer | text, search_match_bg |
| `syntax` | Code highlighting | keyword, string, comment |
| `process_manager` | Process list | cpu_high, mem_high |
| `ai_screen` | AI interface | user_prefix, assistant_prefix |

### Tips

- **Test colors**: Use a 256-color chart to find values. Search "256 color terminal chart" online.
- **Grayscale tip**: Values 232-255 are pure grayscale, useful for backgrounds and subtle UI.
- **Hot-reload**: Edit theme files within COKACDIR and save — changes apply immediately in design mode (`--design` flag).
- **Backup**: Keep a copy of your custom themes before updating COKACDIR.

### Example: High Contrast Dark Theme

```json
{
  "name": "high-contrast",
  "palette": {
    "bg": 16,            // Pure black
    "bg_alt": 233,       // Very dark gray
    "fg": 255,           // Pure white
    "fg_dim": 250,       // Light gray
    "fg_strong": 231,    // Bright white
    "fg_inverse": 16,    // Black (for selections)
    "accent": 51,        // Bright cyan
    "shortcut": 226,     // Bright yellow
    "positive": 46,      // Bright green
    "highlight": 196     // Bright red
  }
}
```

## Supported Platforms

- macOS (Apple Silicon & Intel)
- Linux (x86_64 & ARM64)

## License

MIT License

## Author

cokac <monogatree@gmail.com>

Homepage: https://cokacdir.cokac.com

## Disclaimer

THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

IN NO EVENT SHALL THE AUTHORS, COPYRIGHT HOLDERS, OR CONTRIBUTORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This includes, without limitation:

- Data loss or corruption
- System damage or malfunction
- Security breaches or vulnerabilities
- Financial losses
- Any direct, indirect, incidental, special, exemplary, or consequential damages

The user assumes full responsibility for all consequences arising from the use of this software, regardless of whether such use was intended, authorized, or anticipated.

**USE AT YOUR OWN RISK.**
