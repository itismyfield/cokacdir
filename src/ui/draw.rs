use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Clear, Paragraph},
    Frame,
};

use super::{
    app::{App, PanelSide, Screen},
    dialogs,
    file_editor,
    file_info,
    file_viewer,
    panel,
    process_manager,
    ai_screen,
    system_info,
    advanced_search,
    image_viewer,
    search_result,
    help,
    theme::Theme,
};

const APP_TITLE: &str = concat!("COKACDIR v", env!("CARGO_PKG_VERSION"));

pub fn draw(frame: &mut Frame, app: &mut App) {
    // Clone theme to avoid borrow conflict with mutable app
    let theme = app.theme.clone();
    let area = frame.area();

    // Check if terminal is too large for ratatui buffer
    let frame_area = frame.area();
    if (frame_area.width as u32 * frame_area.height as u32) > 65534 {
        // Terminal too large, show warning message only
        let msg = Paragraph::new("Terminal too large. Please resize smaller.")
            .style(Style::default().fg(theme.message.text).add_modifier(Modifier::BOLD));
        let safe_rect = Rect::new(0, 0, frame_area.width.min(80), 1);
        frame.render_widget(msg, safe_rect);
        return;
    }

    // Fill entire screen with background color first
    let background = Block::default().style(Style::default().bg(theme.palette.bg));
    frame.render_widget(background, area);

    // Clear the entire screen first for full-screen views
    match app.current_screen {
        Screen::AIScreen | Screen::SystemInfo => {
            frame.render_widget(Clear, area);
        }
        _ => {}
    }

    match app.current_screen {
        Screen::DualPanel => draw_dual_panel(frame, app, area, &theme),
        Screen::FileViewer => {
            if let Some(ref mut state) = app.viewer_state {
                file_viewer::draw(frame, state, area, &theme);
            }
        }
        Screen::FileEditor => {
            if let Some(ref mut state) = app.editor_state {
                file_editor::draw(frame, state, area, &theme);
            }
        }
        Screen::FileInfo => file_info::draw(frame, app, area, &theme),
        Screen::ProcessManager => process_manager::draw(frame, app, area, &theme),
        Screen::Help => help::draw(frame, app, area, &theme),
        Screen::AIScreen => {
            if let Some(ref mut state) = app.ai_state {
                ai_screen::draw(frame, state, area, &theme);
            }
        }
        Screen::SystemInfo => {
            system_info::draw(frame, &app.system_info_state, area, &theme);
        }
        Screen::ImageViewer => {
            image_viewer::draw(frame, app, area, &theme);
        }
        Screen::SearchResult => {
            search_result::draw(frame, &mut app.search_result_state, area, &theme);
        }
    }

    // Draw advanced search dialog overlay if active
    if app.advanced_search_state.active && app.current_screen == Screen::DualPanel {
        advanced_search::draw(frame, &app.advanced_search_state, area, &theme);
    }

    // Update message timer
    if app.message_timer > 0 {
        app.message_timer -= 1;
        if app.message_timer == 0 {
            app.message = None;
        }
    }
}

fn draw_dual_panel(frame: &mut Frame, app: &mut App, area: Rect, theme: &Theme) {
    // Layout: Panels, Status Bar, Function Bar (no header - saves 1 line)
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(5),    // Panels
            Constraint::Length(1), // Status bar
            Constraint::Length(1), // Function bar / message
        ])
        .split(area);

    // Dual panels
    let panel_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
        .split(chunks[0]);

    let left_path_str = app.left_panel.path.display().to_string();
    let right_path_str = app.right_panel.path.display().to_string();
    let left_bookmarked = app.settings.bookmarked_path.contains(&left_path_str);
    let right_bookmarked = app.settings.bookmarked_path.contains(&right_path_str);

    panel::draw(
        frame,
        &mut app.left_panel,
        panel_chunks[0],
        app.active_panel == PanelSide::Left && app.dialog.is_none(),
        left_bookmarked,
        theme,
    );
    panel::draw(
        frame,
        &mut app.right_panel,
        panel_chunks[1],
        app.active_panel == PanelSide::Right && app.dialog.is_none(),
        right_bookmarked,
        theme,
    );

    // Status bar
    draw_status_bar(frame, app, chunks[1], theme);

    // Function bar or message
    draw_function_bar(frame, app, chunks[2], theme);

    // Dialog overlay
    if let Some(ref dialog) = app.dialog {
        dialogs::draw_dialog(frame, app, dialog, area, theme);
    }
}

/// Public function for drawing dual panel background (used by overlay screens)
pub fn draw_dual_panel_background(frame: &mut Frame, app: &mut App, area: Rect, theme: &Theme) {
    draw_dual_panel(frame, app, area, theme);
}

fn draw_status_bar(frame: &mut Frame, app: &App, area: Rect, theme: &Theme) {
    let panel = app.active_panel();
    let current_file = panel.current_file();

    let left_text = if let Some(file) = current_file {
        if file.name != ".." {
            format!(
                "{} ({})",
                file.name,
                crate::utils::format::format_size(file.size)
            )
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let selected_count = panel.selected_files.len();
    let total_size: u64 = panel
        .files
        .iter()
        .filter(|f| !f.is_directory)
        .map(|f| f.size)
        .sum();

    let right_text = if selected_count > 0 {
        format!(
            "{} selected, Total: {}",
            selected_count,
            crate::utils::format::format_size(total_size)
        )
    } else {
        format!("Total: {}", crate::utils::format::format_size(total_size))
    };

    let status = Line::from(vec![
        Span::styled(format!(" {} ", left_text), theme.status_bar_style()),
        Span::styled(
            " ".repeat(area.width.saturating_sub(left_text.len() as u16 + right_text.len() as u16 + 4) as usize),
            theme.status_bar_style(),
        ),
        Span::styled(format!(" {} ", right_text), theme.status_bar_style()),
    ]);

    frame.render_widget(Paragraph::new(status).style(theme.status_bar_style()), area);
}

fn draw_function_bar(frame: &mut Frame, app: &App, area: Rect, theme: &Theme) {
    // Show message if present
    if let Some(ref msg) = app.message {
        let message = Paragraph::new(Span::styled(
            format!(" {} ", msg),
            Style::default().fg(theme.message.text).add_modifier(Modifier::BOLD),
        ));
        frame.render_widget(message, area);
        return;
    }

    // 단축키: 첫 글자 강조 스타일
    let mut shortcuts: Vec<(&str, &str)> = vec![
        ("h", "elp "),
        ("i", "nfo "),
        ("e", "dit "),
        ("k", "mkdir "),
        ("x", "del "),
        ("r", "en "),
        ("t", "ar "),
        ("f", "ind "),
        (".", "AI "),
        ("p", "roc "),
        ("1", "home "),
        ("2", "ref "),
        ("'", "mark "),
    ];

    // macOS only: open in Finder, open in VS Code
    #[cfg(target_os = "macos")]
    {
        shortcuts.push(("o", "pen "));
        shortcuts.push(("c", "ode "));
    }

    shortcuts.push(("`", "set "));
    shortcuts.push(("q", "uit"));

    let mut spans = Vec::new();
    for (key, rest) in &shortcuts {
        spans.push(Span::styled(*key, Style::default().fg(theme.function_bar.key)));
        spans.push(Span::styled(*rest, Style::default().fg(theme.function_bar.label)));
    }

    // Calculate shortcuts width and add padding + version
    let shortcuts_width: usize = shortcuts.iter().map(|(k, r)| k.len() + r.len()).sum();
    let version_text = format!(" {}", APP_TITLE);
    let padding_width = (area.width as usize).saturating_sub(shortcuts_width + version_text.len());

    spans.push(Span::styled(" ".repeat(padding_width), theme.dim_style()));
    spans.push(Span::styled(version_text, theme.dim_style()));

    frame.render_widget(Paragraph::new(Line::from(spans)), area);
}

