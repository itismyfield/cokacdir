# COKACDIR

Multi-panel terminal file manager with AI-powered natural language commands.

**Terminal File Manager for Vibe Coders** - An easy terminal explorer for vibe coders who are scared of the terminal.

## Features

- **Blazing Fast**: Written in Rust for maximum performance. ~10ms startup, ~5MB memory usage, ~4MB static binary with zero runtime dependencies.
- **AI-Powered Commands**: Natural language file operations powered by Claude AI. Press `.` and describe what you want.
- **Multi-Panel Navigation**: Dynamic multi-panel interface for efficient file management
- **Keyboard Driven**: Full keyboard navigation designed for power users
- **Built-in Editor**: Edit files with syntax highlighting for 20+ languages
- **Image Viewer**: View images directly in terminal with zoom and pan support
- **Process Manager**: Monitor and manage system processes
- **File Search**: Find files by name pattern with recursive search
- **Diff Compare**: Side-by-side folder and file comparison
- **Git Integration**: Built-in git status, commit, log, branch management and inter-commit diff
- **Remote SSH/SFTP**: Browse remote servers via SSH/SFTP with saved profiles
- **Customizable Themes**: Light/Dark themes with full color customization

## Installation

### Quick Install (Recommended)

```bash
/bin/bash -c "$(curl -fsSL https://cokacdir.cokac.com/install.sh)"
```

Then run:

```bash
cokacdir [PATH...]
```

You can open multiple panels by passing paths:

```bash
cokacdir ~/projects ~/downloads ~/documents
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

See [build_manual.md](build_manual.md) for detailed build instructions.

## Enable AI Commands (Optional)

Install Claude Code to unlock natural language file operations:

```bash
npm install -g @anthropic-ai/claude-code
```

Learn more at [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)

## Documentation

For detailed usage guide, keyboard shortcuts, and tutorials:

**[https://cokacdir.cokac.com/#/tutorial](https://cokacdir.cokac.com/#/tutorial)**

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
