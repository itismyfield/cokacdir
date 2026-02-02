//! Help screen with scrolling support
//!
//! Provides a comprehensive help dialog showing all keyboard shortcuts
//! and features of the application.

use crossterm::event::KeyCode;
use ratatui::{
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Paragraph, Scrollbar, ScrollbarOrientation, ScrollbarState},
    Frame,
};

use super::{
    app::App,
    draw::draw_dual_panel_background,
    theme::Theme,
};

/// Draw the help screen
pub fn draw(frame: &mut Frame, app: &mut App, area: Rect, theme: &Theme) {
    // First draw the dual panel in background
    draw_dual_panel_background(frame, app, area, theme);

    // Build help content
    let lines = build_help_content(theme);
    let total_lines = lines.len();

    // Calculate dialog size (max 80% of screen, within bounds)
    let width = ((area.width as u32 * 80 / 100) as u16).min(70).max(50);
    let height = ((area.height as u32 * 80 / 100) as u16).min(45).max(20);

    // Need minimum size to display anything useful
    if width < 30 || height < 10 {
        return;
    }

    // Calculate visible height (excluding borders)
    let visible_height = (height.saturating_sub(2)) as usize;
    let max_scroll = total_lines.saturating_sub(visible_height);

    // Update state
    app.help_state.visible_height = visible_height;
    app.help_state.max_scroll = max_scroll;
    app.help_state.scroll_offset = app.help_state.scroll_offset.min(max_scroll);

    // Calculate dialog position (centered)
    let x = area.x + (area.width.saturating_sub(width)) / 2;
    let y = area.y + (area.height.saturating_sub(height)) / 2;
    let dialog_area = Rect::new(x, y, width, height);

    // Clear the area
    frame.render_widget(Clear, dialog_area);

    // Create block
    let block = Block::default()
        .title(" Help ")
        .title_style(Style::default().fg(theme.help.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.help.border))
        .style(Style::default().bg(theme.help.bg));

    // Render paragraph with scroll
    let paragraph = Paragraph::new(lines)
        .block(block)
        .scroll((app.help_state.scroll_offset as u16, 0));

    frame.render_widget(paragraph, dialog_area);

    // Render scrollbar if content exceeds visible height
    if total_lines > visible_height {
        let scrollbar_area = Rect::new(
            dialog_area.x + dialog_area.width - 1,
            dialog_area.y + 1,
            1,
            dialog_area.height.saturating_sub(2),
        );

        let scrollbar = Scrollbar::default()
            .orientation(ScrollbarOrientation::VerticalRight)
            .begin_symbol(Some("^"))
            .end_symbol(Some("v"));

        let mut scrollbar_state = ScrollbarState::new(max_scroll + 1)
            .position(app.help_state.scroll_offset);

        frame.render_stateful_widget(scrollbar, scrollbar_area, &mut scrollbar_state);
    }
}

/// Handle keyboard input for help screen
/// Returns true if the screen should be closed
pub fn handle_input(app: &mut App, code: KeyCode) -> bool {
    let state = &mut app.help_state;

    match code {
        // Scroll up
        KeyCode::Up | KeyCode::Char('k') | KeyCode::Char('K') => {
            state.scroll_offset = state.scroll_offset.saturating_sub(1);
            false
        }
        // Scroll down
        KeyCode::Down | KeyCode::Char('j') | KeyCode::Char('J') => {
            if state.scroll_offset < state.max_scroll {
                state.scroll_offset += 1;
            }
            false
        }
        // Page up
        KeyCode::PageUp => {
            let amount = state.visible_height.saturating_sub(1).max(1);
            state.scroll_offset = state.scroll_offset.saturating_sub(amount);
            false
        }
        // Page down
        KeyCode::PageDown => {
            let amount = state.visible_height.saturating_sub(1).max(1);
            state.scroll_offset = (state.scroll_offset + amount).min(state.max_scroll);
            false
        }
        // Go to top
        KeyCode::Home | KeyCode::Char('g') => {
            state.scroll_offset = 0;
            false
        }
        // Go to bottom
        KeyCode::End | KeyCode::Char('G') => {
            state.scroll_offset = state.max_scroll;
            false
        }
        // Close help screen
        KeyCode::Esc | KeyCode::Char('q') | KeyCode::Char('Q') | KeyCode::Char('h') | KeyCode::Char('H') => {
            state.scroll_offset = 0; // Reset scroll for next time
            true
        }
        _ => false,
    }
}

/// Build the help content as styled lines
fn build_help_content(theme: &Theme) -> Vec<Line<'static>> {
    let section_title_style = Style::default()
        .fg(theme.help.section_title)
        .add_modifier(Modifier::BOLD);
    let section_decorator_style = Style::default().fg(theme.help.section_decorator);
    let key_style = Style::default().fg(theme.help.key);
    let key_highlight_style = Style::default().fg(theme.help.key_highlight);
    let desc_style = Style::default().fg(theme.help.description);
    let hint_style = Style::default().fg(theme.help.hint_text);

    let mut lines: Vec<Line> = Vec::new();

    // Helper to create section header
    let section = |title: &str| -> Line<'static> {
        Line::from(vec![
            Span::styled("── ".to_string(), section_decorator_style),
            Span::styled(title.to_string(), section_title_style),
            Span::styled(" ──".to_string(), section_decorator_style),
        ])
    };

    // Helper to create key-description line
    let key_line = |key: &str, desc: &str| -> Line<'static> {
        Line::from(vec![
            Span::styled(format!("  {:16}", key), key_style),
            Span::styled(desc.to_string(), desc_style),
        ])
    };

    // ═══════════════════════════════════════════════════════════════════════
    // Section 1: Navigation
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Navigation"));
    lines.push(key_line("Up/Down", "Move cursor up/down"));
    lines.push(key_line("PgUp/PgDn", "Move page up/down"));
    lines.push(key_line("Home/End", "Go to first/last item"));
    lines.push(key_line("Enter", "Open directory or file"));
    lines.push(key_line("Esc", "Go to parent directory"));
    lines.push(key_line("Tab", "Switch panel"));
    lines.push(key_line("Left/Right", "Switch panel (keep position)"));
    lines.push(key_line("1", "Go to home directory"));
    lines.push(key_line("2", "Refresh file list"));
    lines.push(key_line("/", "Go to path dialog"));
    lines.push(key_line("'", "Toggle bookmark"));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 2: Selection & Marking
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Selection & Marking"));
    lines.push(key_line("Space", "Select/deselect file"));
    lines.push(key_line("*", "Select/deselect all"));
    lines.push(key_line(";", "Select by extension"));
    lines.push(Line::from(vec![
        Span::styled("  ".to_string(), desc_style),
        Span::styled("Selected files are marked with ".to_string(), hint_style),
        Span::styled("*".to_string(), Style::default().fg(theme.panel.marked_text)),
    ]));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 3: Sorting
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Sorting"));
    lines.push(key_line("N", "Sort by name"));
    lines.push(key_line("S", "Sort by size"));
    lines.push(key_line("D", "Sort by date"));
    lines.push(key_line("Y", "Sort by type (extension)"));
    lines.push(Line::from(vec![
        Span::styled("  ".to_string(), desc_style),
        Span::styled("Press again to toggle Asc/Desc".to_string(), hint_style),
    ]));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 4: File Operations
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("File Operations"));
    lines.push(key_line("E", "Edit file"));
    lines.push(key_line("I", "File info (properties)"));
    lines.push(key_line("K", "Create new directory"));
    lines.push(key_line("R", "Rename file/directory"));
    lines.push(key_line("T", "Create tar archive"));
    lines.push(key_line("X / Delete", "Delete file(s)"));
    lines.push(key_line("F", "Find/search files"));
    #[cfg(target_os = "macos")]
    {
        lines.push(key_line("O", "Open folder in Finder"));
        lines.push(key_line("C", "Open folder in VS Code"));
    }
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 5: Clipboard
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Clipboard"));
    lines.push(key_line("Ctrl+C", "Copy to clipboard"));
    lines.push(key_line("Ctrl+X", "Cut to clipboard"));
    lines.push(key_line("Ctrl+V", "Paste from clipboard"));
    lines.push(Line::from(vec![
        Span::styled("  ".to_string(), desc_style),
        Span::styled("Conflict resolution: Overwrite/Skip/All".to_string(), hint_style),
    ]));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 6: File Editor
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("File Editor"));
    lines.push(key_line("Arrows", "Move cursor"));
    lines.push(key_line("Home/End", "Go to line start/end"));
    lines.push(key_line("Ctrl+Home/End", "Go to file start/end"));
    lines.push(key_line("Shift+Arrows", "Select text"));
    lines.push(key_line("Ctrl+A", "Select all"));
    lines.push(key_line("Ctrl+C", "Copy (line if no selection)"));
    lines.push(key_line("Ctrl+X", "Cut (line if no selection)"));
    lines.push(key_line("Ctrl+V", "Paste"));
    lines.push(key_line("Ctrl+D", "Select word"));
    lines.push(key_line("Ctrl+L", "Select line"));
    lines.push(key_line("Ctrl+K", "Delete line"));
    lines.push(key_line("Ctrl+J", "Duplicate line"));
    lines.push(key_line("Ctrl+/", "Toggle comment"));
    lines.push(key_line("Alt+Up/Down", "Move line up/down"));
    lines.push(key_line("Ctrl+Z/Y", "Undo/redo"));
    lines.push(key_line("Ctrl+F", "Find text"));
    lines.push(key_line("Ctrl+H", "Find and replace"));
    lines.push(key_line("Ctrl+G", "Go to line"));
    lines.push(key_line("Ctrl+S", "Save file"));
    lines.push(key_line("Esc", "Close editor"));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 8: Image Viewer
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Image Viewer"));
    lines.push(key_line("+/-", "Zoom in/out"));
    lines.push(key_line("R", "Reset zoom"));
    lines.push(key_line("Arrows", "Pan image"));
    lines.push(key_line("PgUp/PgDn", "Previous/next image"));
    lines.push(key_line("Esc/Q", "Close viewer"));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 9: Process Manager
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Process Manager"));
    lines.push(key_line("Up/Down", "Navigate processes"));
    lines.push(key_line("PgUp/PgDn", "Page through list"));
    lines.push(key_line("P", "Sort by PID"));
    lines.push(key_line("C", "Sort by CPU usage"));
    lines.push(key_line("M", "Sort by memory usage"));
    lines.push(key_line("N", "Sort by name"));
    lines.push(key_line("K", "Kill process (SIGTERM)"));
    lines.push(key_line("Shift+K", "Force kill (SIGKILL)"));
    lines.push(key_line("R", "Refresh list"));
    lines.push(key_line("Esc/Q", "Close manager"));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 10: AI Assistant
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("AI Assistant"));
    lines.push(key_line(".", "Open AI assistant"));
    lines.push(key_line("Ctrl+A", "Open AI assistant"));
    lines.push(key_line("Enter", "Send message"));
    lines.push(key_line("Shift+Enter", "New line in input"));
    lines.push(key_line("Ctrl+Up/Down", "Scroll response"));
    lines.push(key_line("PgUp/PgDn", "Page scroll response"));
    lines.push(key_line("/clear", "Clear conversation"));
    lines.push(key_line("Esc", "Close assistant"));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 11: Search
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Search"));
    lines.push(key_line("F", "Open search dialog"));
    lines.push(key_line("Up/Down", "Navigate results"));
    lines.push(key_line("Enter", "Go to selected result"));
    lines.push(key_line("Esc", "Close search"));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 12: Settings
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Settings"));
    lines.push(key_line("` (backtick)", "Open settings dialog"));
    lines.push(key_line("Left/Right", "Change theme"));
    lines.push(key_line("Enter", "Save settings"));
    lines.push(key_line("Esc", "Cancel"));
    lines.push(Line::from(vec![
        Span::styled("  ".to_string(), desc_style),
        Span::styled("Config: ~/.cokacdir/settings.json".to_string(), hint_style),
    ]));
    lines.push(Line::from(vec![
        Span::styled("  ".to_string(), desc_style),
        Span::styled("Themes: ~/.cokacdir/themes/".to_string(), hint_style),
    ]));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section 13: Quick Reference
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Quick Reference"));
    lines.push(Line::from(vec![
        Span::styled("  h", key_highlight_style),
        Span::styled("elp ", desc_style),
        Span::styled("i", key_highlight_style),
        Span::styled("nfo ", desc_style),
        Span::styled("e", key_highlight_style),
        Span::styled("dit ", desc_style),
        Span::styled("k", key_highlight_style),
        Span::styled("mkdir ", desc_style),
        Span::styled("x", key_highlight_style),
        Span::styled("del ", desc_style),
        Span::styled("r", key_highlight_style),
        Span::styled("en", desc_style),
    ]));
    lines.push(Line::from(vec![
        Span::styled("  t", key_highlight_style),
        Span::styled("ar ", desc_style),
        Span::styled("f", key_highlight_style),
        Span::styled("ind ", desc_style),
        Span::styled(".", key_highlight_style),
        Span::styled("AI ", desc_style),
        Span::styled("p", key_highlight_style),
        Span::styled("roc ", desc_style),
        Span::styled("1", key_highlight_style),
        Span::styled("home ", desc_style),
        Span::styled("2", key_highlight_style),
        Span::styled("ref", desc_style),
    ]));
    #[cfg(target_os = "macos")]
    lines.push(Line::from(vec![
        Span::styled("  o", key_highlight_style),
        Span::styled("pen ", desc_style),
        Span::styled("c", key_highlight_style),
        Span::styled("ode ", desc_style),
        Span::styled("`", key_highlight_style),
        Span::styled("set ", desc_style),
        Span::styled("q", key_highlight_style),
        Span::styled("uit", desc_style),
    ]));
    #[cfg(not(target_os = "macos"))]
    lines.push(Line::from(vec![
        Span::styled("  `", key_highlight_style),
        Span::styled("set ", desc_style),
        Span::styled("q", key_highlight_style),
        Span::styled("uit", desc_style),
    ]));
    lines.push(Line::from(""));

    // ═══════════════════════════════════════════════════════════════════════
    // Section: Developer Info
    // ═══════════════════════════════════════════════════════════════════════
    lines.push(section("Developer"));
    lines.push(Line::from(vec![
        Span::styled("  Developer        ", key_style),
        Span::styled("cokac (코드깎는노인)", desc_style),
    ]));
    lines.push(Line::from(vec![
        Span::styled("  Email            ", key_style),
        Span::styled("monogatree@gmail.com", desc_style),
    ]));
    lines.push(Line::from(vec![
        Span::styled("  Website          ", key_style),
        Span::styled("https://cokacdir.cokac.com", desc_style),
    ]));
    lines.push(Line::from(vec![
        Span::styled("  YouTube          ", key_style),
        Span::styled("https://www.youtube.com/@코드깎는노인", desc_style),
    ]));
    lines.push(Line::from(vec![
        Span::styled("  코깎노클래스     ", key_style),
        Span::styled("https://cokac.com/", desc_style),
    ]));
    lines.push(Line::from(""));

    // Footer
    lines.push(Line::from(Span::styled(
        "  Use Up/Down/PgUp/PgDn to scroll. Press Esc or Q to close.",
        hint_style,
    )));

    lines
}
