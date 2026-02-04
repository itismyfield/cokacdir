mod ui;
mod services;
mod utils;
mod config;

use std::io;
use std::env;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyModifiers},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use std::time::Duration;
use ratatui::{
    backend::CrosstermBackend,
    Terminal,
};

use crate::ui::app::{App, Screen};
use crate::services::claude;
use crate::utils::markdown::{render_markdown, MarkdownTheme, is_line_empty};

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn print_help() {
    println!("cokacdir {} - Dual-panel terminal file manager", VERSION);
    println!();
    println!("USAGE:");
    println!("    cokacdir [OPTIONS]");
    println!();
    println!("OPTIONS:");
    println!("    -h, --help              Print help information");
    println!("    -v, --version           Print version information");
    println!("    --prompt <TEXT>         Send prompt to AI and print rendered response");
    println!("    --design                Enable theme hot-reload (for theme development)");
    println!();
    println!("HOMEPAGE: https://cokacdir.cokac.com");
}

fn print_version() {
    println!("cokacdir {}", VERSION);
}

fn handle_prompt(prompt: &str) {
    use crate::ui::theme::Theme;

    // Check if Claude is available
    if !claude::is_claude_available() {
        eprintln!("Error: Claude CLI is not available.");
        eprintln!("Please install Claude CLI: https://claude.ai/cli");
        return;
    }

    // Execute Claude command
    let current_dir = std::env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| ".".to_string());
    let response = claude::execute_command(prompt, None, &current_dir);

    if !response.success {
        eprintln!("Error: {}", response.error.unwrap_or_else(|| "Unknown error".to_string()));
        return;
    }

    let content = response.response.unwrap_or_default();

    // Normalize empty lines first
    let normalized = normalize_consecutive_empty_lines(&content);

    // Render markdown
    let theme = Theme::default();
    let md_theme = MarkdownTheme::from_theme(&theme);
    let lines = render_markdown(&normalized, md_theme);

    // Remove consecutive empty lines from rendered output
    let mut prev_was_empty = false;
    for line in lines {
        let is_empty = is_line_empty(&line);
        if is_empty {
            if !prev_was_empty {
                println!();
            }
            prev_was_empty = true;
        } else {
            let content: String = line.spans.iter()
                .map(|s| s.content.as_ref())
                .collect();
            println!("{}", content);
            prev_was_empty = false;
        }
    }
}

/// Normalize consecutive empty lines to maximum of one
fn normalize_consecutive_empty_lines(text: &str) -> String {
    let lines: Vec<&str> = text.lines().collect();
    let mut result_lines: Vec<&str> = Vec::new();
    let mut prev_was_empty = false;

    for line in lines {
        let is_empty = line.chars().all(|c| c.is_whitespace());
        if is_empty {
            if !prev_was_empty {
                result_lines.push("");
            }
            prev_was_empty = true;
        } else {
            result_lines.push(line);
            prev_was_empty = false;
        }
    }

    result_lines.join("\n")
}

fn main() -> io::Result<()> {
    // Handle command line arguments
    let args: Vec<String> = env::args().collect();
    let mut design_mode = false;

    if args.len() > 1 {
        match args[1].as_str() {
            "-h" | "--help" => {
                print_help();
                return Ok(());
            }
            "-v" | "--version" => {
                print_version();
                return Ok(());
            }
            "--prompt" => {
                if args.len() < 3 {
                    eprintln!("Error: --prompt requires a text argument");
                    eprintln!("Usage: cokacdir --prompt \"your question\"");
                    return Ok(());
                }
                handle_prompt(&args[2]);
                return Ok(());
            }
            "--design" => {
                design_mode = true;
            }
            _ => {
                eprintln!("Unknown option: {}", args[1]);
                eprintln!("Use --help for usage information");
                return Ok(());
            }
        }
    }

    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    // Clear screen before entering alternate screen
    execute!(
        stdout,
        crossterm::terminal::Clear(crossterm::terminal::ClearType::All),
        crossterm::cursor::MoveTo(0, 0),
        EnterAlternateScreen,
        EnableMouseCapture
    )?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;
    terminal.clear()?;

    // Load settings and create app state
    let (settings, settings_error) = match config::Settings::load_with_error() {
        Ok(s) => (s, None),
        Err(e) => (config::Settings::default(), Some(e)),
    };
    let mut app = App::with_settings(settings);
    app.design_mode = design_mode;

    // Show settings load error if any
    if let Some(err) = settings_error {
        app.show_message(&format!("Settings error: {} (using defaults)", err));
    }

    // Show design mode message if active
    if design_mode {
        app.show_message("Design mode: theme hot-reload enabled");
    }

    // Run app
    let result = run_app(&mut terminal, &mut app);

    // Save settings before exit
    app.save_settings();

    // Save last directory for shell cd
    let last_dir = app.active_panel().path.display().to_string();
    if let Some(config_dir) = config::Settings::config_dir() {
        let lastdir_path = config_dir.join("lastdir");
        let _ = std::fs::write(&lastdir_path, &last_dir);
    }

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture,
        crossterm::terminal::Clear(crossterm::terminal::ClearType::All),
        crossterm::cursor::MoveTo(0, 0),
        crossterm::cursor::Show
    )?;

    if let Err(err) = result {
        eprintln!("Error: {}", err);
    }

    // Print goodbye message
    print_goodbye_message();

    Ok(())
}

fn print_goodbye_message() {
    // Check for updates
    check_for_updates();

    println!("Thank you for using COKACDIR! 🙏");
    println!();
    println!("If you found this useful, consider checking out my other content:");
    println!("  📺 YouTube: https://www.youtube.com/@코드깎는노인");
    println!("  📚 Classes: https://cokac.com/");
    println!();
    println!("Happy coding!");
}

fn check_for_updates() {
    let current_version = env!("CARGO_PKG_VERSION");

    // Fetch latest version from GitHub (with timeout)
    let output = std::process::Command::new("curl")
        .args([
            "-fsSL",
            "--max-time", "3",
            "https://raw.githubusercontent.com/kstost/cokacdir/refs/heads/main/Cargo.toml"
        ])
        .output();

    let latest_version = match output {
        Ok(output) if output.status.success() => {
            let content = String::from_utf8_lossy(&output.stdout);
            parse_version_from_cargo_toml(&content)
        }
        _ => None,
    };

    if let Some(latest) = latest_version {
        if is_newer_version(&latest, current_version) {
            println!("┌──────────────────────────────────────────────────────────────────────────┐");
            println!("│  🚀 New version available: v{} (current: v{})                            ", latest, current_version);
            println!("│                                                                          │");
            println!("│  Update with:                                                            │");
            println!("│  /bin/bash -c \"$(curl -fsSL https://cokacdir.cokac.com/install.sh)\"      │");
            println!("└──────────────────────────────────────────────────────────────────────────┘");
            println!();
        }
    }
}

fn parse_version_from_cargo_toml(content: &str) -> Option<String> {
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("version") {
            // Parse: version = "x.x.x"
            if let Some(start) = line.find('"') {
                if let Some(end) = line.rfind('"') {
                    if start < end {
                        return Some(line[start + 1..end].to_string());
                    }
                }
            }
        }
    }
    None
}

fn is_newer_version(latest: &str, current: &str) -> bool {
    let parse = |v: &str| -> Vec<u32> {
        v.split('.')
            .filter_map(|s| s.parse().ok())
            .collect()
    };

    let latest_parts = parse(latest);
    let current_parts = parse(current);

    for i in 0..latest_parts.len().max(current_parts.len()) {
        let l = latest_parts.get(i).copied().unwrap_or(0);
        let c = current_parts.get(i).copied().unwrap_or(0);
        if l > c {
            return true;
        } else if l < c {
            return false;
        }
    }
    false
}

fn run_app<B: ratatui::backend::Backend>(
    terminal: &mut Terminal<B>,
    app: &mut App,
) -> io::Result<()> {
    loop {
        // Check if full redraw is needed (after terminal mode command like vim)
        if app.needs_full_redraw {
            terminal.clear()?;
            app.needs_full_redraw = false;
        }

        terminal.draw(|f| ui::draw::draw(f, app))?;

        // For AI screen, FileInfo with calculation, ImageViewer loading, or file operation progress, use fast polling
        let is_file_info_calculating = app.current_screen == Screen::FileInfo
            && app.file_info_state.as_ref().map(|s| s.is_calculating).unwrap_or(false);
        let is_image_loading = app.current_screen == Screen::ImageViewer
            && app.image_viewer_state.as_ref().map(|s| s.is_loading).unwrap_or(false);
        let is_progress_active = app.file_operation_progress
            .as_ref()
            .map(|p| p.is_active)
            .unwrap_or(false);

        let poll_timeout = if app.current_screen == Screen::AIScreen || app.is_ai_mode() || is_file_info_calculating || is_image_loading || is_progress_active {
            Duration::from_millis(100) // Fast polling for spinner animation / progress updates
        } else {
            Duration::from_millis(250)
        };

        // Poll for AI responses if on AI screen or AI mode (panel)
        let mut ai_response_completed = false;
        if app.current_screen == Screen::AIScreen || app.is_ai_mode() {
            if let Some(ref mut state) = app.ai_state {
                let was_processing = state.is_processing;
                state.poll_response();
                // AI 응답 완료 감지
                if was_processing && !state.is_processing {
                    ai_response_completed = true;
                }
            }
        }
        // AI 응답 완료 시 패널 새로고침 (파일 변경 반영)
        if ai_response_completed {
            app.refresh_panels();
        }

        // Poll for file info calculation if on FileInfo screen
        if app.current_screen == Screen::FileInfo {
            if let Some(ref mut state) = app.file_info_state {
                state.poll();
            }
        }

        // Poll for image loading if on ImageViewer screen
        if app.current_screen == Screen::ImageViewer {
            if let Some(ref mut state) = app.image_viewer_state {
                state.poll();
            }
        }

        // Check for theme file changes (hot-reload, only in design mode)
        if app.design_mode && app.theme_watch_state.check_for_changes() {
            app.reload_theme();
        }

        // Poll for file operation progress
        let progress_message: Option<String> = if let Some(ref mut progress) = app.file_operation_progress {
            let still_active = progress.poll();
            if !still_active {
                // Operation completed - extract result info before releasing borrow
                let msg = if let Some(ref result) = progress.result {
                    // Special handling for Tar - show archive name
                    if progress.operation_type == crate::services::file_ops::FileOperationType::Tar {
                        if result.failure_count == 0 {
                            if let Some(ref archive_name) = app.pending_tar_archive {
                                Some(format!("Created: {}", archive_name))
                            } else {
                                Some(format!("Archived {} file(s)", result.success_count))
                            }
                        } else {
                            Some(format!("Error: {}", result.last_error.as_deref().unwrap_or("Archive failed")))
                        }
                    } else if progress.operation_type == crate::services::file_ops::FileOperationType::Untar {
                        if result.failure_count == 0 {
                            if let Some(ref extract_dir) = app.pending_extract_dir {
                                Some(format!("Extracted to: {}", extract_dir))
                            } else {
                                Some(format!("Extracted {} file(s)", result.success_count))
                            }
                        } else {
                            Some(format!("Error: {}", result.last_error.as_deref().unwrap_or("Extract failed")))
                        }
                    } else {
                        let op_name = match progress.operation_type {
                            crate::services::file_ops::FileOperationType::Copy => "Copied",
                            crate::services::file_ops::FileOperationType::Move => "Moved",
                            crate::services::file_ops::FileOperationType::Tar => "Archived",
                            crate::services::file_ops::FileOperationType::Untar => "Extracted",
                        };
                        let total = result.success_count + result.failure_count;
                        if result.failure_count == 0 {
                            Some(format!("{} {} file(s)", op_name, result.success_count))
                        } else {
                            Some(format!("{} {}/{}. Error: {}",
                                op_name,
                                result.success_count,
                                total,
                                result.last_error.as_deref().unwrap_or("Unknown error")
                            ))
                        }
                    }
                } else {
                    None
                };
                msg
            } else {
                None
            }
        } else {
            None
        };

        // Handle progress completion (outside of borrow)
        if progress_message.is_some() {
            if let Some(msg) = progress_message {
                app.show_message(&msg);
            }
            // Focus on created tar archive if applicable
            if let Some(archive_name) = app.pending_tar_archive.take() {
                app.refresh_panels();
                if let Some(idx) = app.active_panel().files.iter().position(|f| f.name == archive_name) {
                    app.active_panel_mut().selected_index = idx;
                }
            // Focus on extracted directory if applicable
            } else if let Some(extract_dir) = app.pending_extract_dir.take() {
                app.refresh_panels();
                if let Some(idx) = app.active_panel().files.iter().position(|f| f.name == extract_dir) {
                    app.active_panel_mut().selected_index = idx;
                }
            } else {
                app.refresh_panels();
            }
            app.file_operation_progress = None;
            app.dialog = None;
        }

        // Check for key events with timeout
        if event::poll(poll_timeout)? {
            if let Event::Key(key) = event::read()? {
                match app.current_screen {
                    Screen::DualPanel => {
                        if handle_dual_panel_input(app, key.code, key.modifiers) {
                            return Ok(());
                        }
                    }
                    Screen::FileViewer => {
                        ui::file_viewer::handle_input(app, key.code, key.modifiers);
                    }
                    Screen::FileEditor => {
                        ui::file_editor::handle_input(app, key.code, key.modifiers);
                    }
                    Screen::FileInfo => {
                        ui::file_info::handle_input(app, key.code);
                    }
                    Screen::ProcessManager => {
                        ui::process_manager::handle_input(app, key.code);
                    }
                    Screen::Help => {
                        if ui::help::handle_input(app, key.code) {
                            app.current_screen = Screen::DualPanel;
                        }
                    }
                    Screen::AIScreen => {
                        if let Some(ref mut state) = app.ai_state {
                            if ui::ai_screen::handle_input(state, key.code, key.modifiers) {
                                // Save session to file before leaving
                                state.save_session_to_file();
                                app.current_screen = Screen::DualPanel;
                                app.ai_state = None;
                                // Refresh panels in case AI modified files
                                app.refresh_panels();
                            }
                        }
                    }
                    Screen::SystemInfo => {
                        if ui::system_info::handle_input(&mut app.system_info_state, key.code) {
                            app.current_screen = Screen::DualPanel;
                        }
                    }
                    Screen::ImageViewer => {
                        // 다이얼로그가 열려있으면 다이얼로그 입력 처리
                        if app.dialog.is_some() {
                            ui::dialogs::handle_dialog_input(app, key.code, key.modifiers);
                        } else {
                            ui::image_viewer::handle_input(app, key.code);
                        }
                    }
                    Screen::SearchResult => {
                        let should_close = ui::search_result::handle_input(
                            &mut app.search_result_state,
                            key.code,
                        );
                        if should_close {
                            if key.code == KeyCode::Enter {
                                // Enter: 선택한 경로로 이동
                                app.goto_search_result();
                            } else {
                                // Esc: 검색 결과 화면 닫기
                                app.search_result_state.active = false;
                                app.current_screen = Screen::DualPanel;
                            }
                        }
                    }
                }
            }
        }
    }
}

fn handle_dual_panel_input(app: &mut App, code: KeyCode, modifiers: KeyModifiers) -> bool {
    // AI 모드일 때: active_panel이 AI 패널 쪽이면 AI로 입력 전달, 아니면 파일 패널 조작
    if app.is_ai_mode() {
        let ai_has_focus = app.ai_panel_side == Some(app.active_panel);
        if code == KeyCode::Tab {
            app.switch_panel();
            return false;
        }
        if ai_has_focus {
            if let Some(ref mut state) = app.ai_state {
                if ui::ai_screen::handle_input(state, code, modifiers) {
                    // AI 화면 종료 요청
                    app.close_ai_screen();
                }
            }
            return false;
        }
        // ai_has_focus가 false면 아래 파일 패널 로직으로 진행
    }

    // Handle advanced search dialog first
    if app.advanced_search_state.active {
        if let Some(criteria) = ui::advanced_search::handle_input(&mut app.advanced_search_state, code) {
            app.execute_advanced_search(&criteria);
        }
        return false;
    }

    // Handle dialog input first
    if app.dialog.is_some() {
        return ui::dialogs::handle_dialog_input(app, code, modifiers);
    }


    // Handle Ctrl key combinations first
    if modifiers.contains(KeyModifiers::CONTROL) {
        match code {
            // Clipboard operations
            KeyCode::Char('c') => {
                app.clipboard_copy();
                return false;
            }
            KeyCode::Char('x') => {
                app.clipboard_cut();
                return false;
            }
            KeyCode::Char('v') => {
                app.clipboard_paste();
                return false;
            }
            // Select all - Ctrl+A
            KeyCode::Char('a') => {
                app.toggle_all_selection();
                return false;
            }
            _ => {}
        }
    }

    // Shift+방향키: 선택하면서 이동
    if modifiers.contains(KeyModifiers::SHIFT) {
        match code {
            KeyCode::Up => {
                app.move_cursor_with_selection(-1);
                return false;
            }
            KeyCode::Down => {
                app.move_cursor_with_selection(1);
                return false;
            }
            _ => {}
        }
    }

    match code {
        // Quit
        KeyCode::Char('q') | KeyCode::Char('Q') => return true,

        // Navigation
        KeyCode::Up => app.move_cursor(-1),
        KeyCode::Down => app.move_cursor(1),
        KeyCode::PageUp => app.move_cursor(-10),
        KeyCode::PageDown => app.move_cursor(10),
        KeyCode::Home => app.cursor_to_start(),
        KeyCode::End => app.cursor_to_end(),

        // Tab - switch panels
        KeyCode::Tab => app.switch_panel(),

        // Left/Right - switch panels (keep same index position)
        KeyCode::Left | KeyCode::Right => app.switch_panel_keep_index(),

        // Enter - open directory or file
        KeyCode::Enter => app.enter_selected(),

        // Escape - go to parent directory
        KeyCode::Esc => app.go_to_parent(),

        // Space - select/deselect file
        KeyCode::Char(' ') => app.toggle_selection(),

        // * - select/deselect all
        KeyCode::Char('*') => app.toggle_all_selection(),

        // ; - select files by extension
        KeyCode::Char(';') => app.select_by_extension(),

        // Sort keys
        KeyCode::Char('n') | KeyCode::Char('N') => app.toggle_sort_by_name(),
        KeyCode::Char('y') | KeyCode::Char('Y') => app.toggle_sort_by_type(),
        KeyCode::Char('s') | KeyCode::Char('S') => app.toggle_sort_by_size(),
        KeyCode::Char('d') | KeyCode::Char('D') => app.toggle_sort_by_date(),

        // Function keys (alphabet)
        KeyCode::Char('h') | KeyCode::Char('H') => app.show_help(),
        KeyCode::Char('i') | KeyCode::Char('I') => app.show_file_info(),
        KeyCode::Char('e') | KeyCode::Char('E') => app.edit_file(),
        KeyCode::Char('k') | KeyCode::Char('K') => app.show_mkdir_dialog(),
        KeyCode::Char('x') | KeyCode::Char('X') | KeyCode::Delete | KeyCode::Backspace => app.show_delete_dialog(),
        KeyCode::Char('p') | KeyCode::Char('P') => app.show_process_manager(),
        KeyCode::Char('r') | KeyCode::Char('R') => app.show_rename_dialog(),
        KeyCode::Char('t') | KeyCode::Char('T') => app.show_tar_dialog(),
        KeyCode::Char('f') => app.show_search_dialog(),
        KeyCode::Char('/') => app.show_goto_dialog(),
        KeyCode::Char('1') => app.goto_home(),
        KeyCode::Char('2') => app.refresh_panels(),

        // AI screen - '.'
        KeyCode::Char('.') => app.show_ai_screen(),

        // Settings dialog - '`'
        KeyCode::Char('`') => app.show_settings_dialog(),

        // Bookmark toggle - '\''
        KeyCode::Char('\'') => app.toggle_bookmark(),

        // Handler setup - 'u'
        KeyCode::Char('u') | KeyCode::Char('U') => app.show_handler_dialog(),

        // macOS: Open current folder in Finder
        #[cfg(target_os = "macos")]
        KeyCode::Char('o') | KeyCode::Char('O') => app.open_in_finder(),

        // macOS: Open current folder in VS Code
        #[cfg(target_os = "macos")]
        KeyCode::Char('c') => app.open_in_vscode(),

        _ => {}
    }
    false
}
