use ratatui::{
    layout::Rect,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Scrollbar, ScrollbarOrientation, ScrollbarState},
    Frame,
};
use unicode_width::UnicodeWidthStr;

use super::{app::{PanelState, SortBy, SortOrder}, theme::Theme};
use crate::utils::format::format_size;

pub fn draw(frame: &mut Frame, panel: &mut PanelState, area: Rect, is_active: bool, is_bookmarked: bool, theme: &Theme) {
    let inner_width = area.width.saturating_sub(2) as usize;

    // Build path display (truncate if too long)
    let path_str = panel.path.display().to_string();
    let bookmark_marker = if is_bookmarked { "✻" } else { "" };
    let display_path = if inner_width > 4 && path_str.len() > inner_width.saturating_sub(4) {
        let suffix_len = inner_width.saturating_sub(7);
        let start = path_str.len().saturating_sub(suffix_len);
        // Ensure we don't slice in the middle of a UTF-8 character
        let safe_start = path_str.char_indices()
            .map(|(i, _)| i)
            .find(|&i| i >= start)
            .unwrap_or(path_str.len());
        format!("{}...{}", bookmark_marker, &path_str[safe_start..])
    } else {
        format!("{}{}", bookmark_marker, path_str)
    };

    let block = Block::default()
        .title(format!(" {} ", display_path))
        .title_style(if is_active {
            Style::default()
                .fg(theme.panel.border_active)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::default().fg(theme.panel.file_text)
        })
        .borders(Borders::ALL)
        .border_style(Style::default().fg(if is_active { theme.panel.border_active } else { theme.panel.border }));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Minimum dimensions check
    if inner.height < 3 || inner.width < 10 {
        return;
    }

    // Column widths - adapt to available space
    let min_columns: u16 = 10 + 12 + 4; // size + date + padding
    let type_col_total: usize = 10; // 2 + 6 + 2 (padding + type + padding)

    // Calculate max file name width (including marker and icon = 2 chars)
    let max_name_display_width = panel.files.iter()
        .map(|f| f.name.width() + 2) // +2 for marker and icon
        .max()
        .unwrap_or(0);

    let (name_col, type_col, size_col, date_col) = if inner.width > min_columns {
        let available_for_name = (inner.width - min_columns) as usize;

        // Check if we can show Type column:
        // All file names must fit without truncation AND
        // there must be at least type_col_total (10) extra chars of space
        let show_type = available_for_name >= max_name_display_width + type_col_total;

        if show_type {
            let name_width = available_for_name - type_col_total;
            (name_width, 6_usize, 10_usize, 12_usize)
        } else {
            (available_for_name, 0_usize, 10_usize, 12_usize)
        }
    } else {
        // Very narrow: use all available width for name only, hide size/date/type
        let name_width = inner.width.saturating_sub(2) as usize;
        (name_width, 0_usize, 0_usize, 0_usize)
    };

    // Header row
    let header = create_header_line(panel, name_col, type_col, size_col, date_col, is_active, theme);
    let header_bg = if is_active {
        theme.panel.header_bg_active
    } else {
        theme.panel.header_bg
    };
    frame.render_widget(
        Paragraph::new(header).style(Style::default().bg(header_bg)),
        Rect::new(inner.x, inner.y, inner.width, 1),
    );

    // File list (visible area)
    let visible_height = (inner.height - 2) as usize; // -2 for header and footer
    let total_files = panel.files.len();

    // 스크롤 오프셋 계산: 커서가 보이는 범위 내에 있으면 스크롤 유지
    let current_scroll = panel.scroll_offset;
    let start_index = if total_files <= visible_height {
        // 파일 개수가 화면보다 적으면 스크롤 없음
        0
    } else if panel.selected_index >= current_scroll &&
              panel.selected_index < current_scroll + visible_height {
        // 커서가 현재 보이는 범위 내에 있으면 스크롤 유지
        // 단, 스크롤이 유효한 범위인지 확인
        if current_scroll + visible_height > total_files {
            total_files - visible_height
        } else {
            current_scroll
        }
    } else {
        // 커서가 범위 밖이면 center-locked로 조정
        let half_visible = visible_height / 2;
        let mut new_start = panel.selected_index.saturating_sub(half_visible);
        if new_start + visible_height > total_files {
            new_start = total_files - visible_height;
        }
        new_start
    };

    // scroll_offset 업데이트 (패널 전환 시 사용)
    panel.scroll_offset = start_index;

    let visible_files = panel.files.iter().skip(start_index).take(visible_height);

    for (i, file) in visible_files.enumerate() {
        let actual_index = start_index + i;
        let is_cursor = actual_index == panel.selected_index;
        let is_marked = panel.selected_files.contains(&file.name);
        let show_cursor = is_cursor && is_active;

        let line = create_file_line(
            file,
            show_cursor,
            is_marked,
            name_col,
            type_col,
            size_col,
            date_col,
            theme,
        );

        let paragraph = if show_cursor {
            Paragraph::new(line).style(theme.selected_style())
        } else {
            Paragraph::new(line)
        };

        frame.render_widget(
            paragraph,
            Rect::new(inner.x, inner.y + 1 + i as u16, inner.width, 1),
        );
    }

    // 스크롤바 (파일이 화면보다 많을 때)
    if total_files > visible_height {
        let scrollbar = Scrollbar::default()
            .orientation(ScrollbarOrientation::VerticalRight)
            .begin_symbol(Some("▲"))
            .end_symbol(Some("▼"));

        let mut scrollbar_state = ScrollbarState::new(total_files)
            .position(panel.selected_index);

        let scrollbar_area = Rect::new(
            inner.x + inner.width - 1,
            inner.y + 1,
            1,
            visible_height as u16,
        );

        frame.render_stateful_widget(scrollbar, scrollbar_area, &mut scrollbar_state);
    }

    // Footer (폴더 정보 + 디스크 용량)
    let dir_count = panel.files.iter().filter(|f| f.name != ".." && f.is_directory).count();
    let file_count = panel.files.iter().filter(|f| !f.is_directory).count();
    let total_size: u64 = panel.files.iter().filter(|f| !f.is_directory).map(|f| f.size).sum();

    // 선택된 파일 정보 계산
    let selected_count = panel.selected_files.len();
    let selected_size: u64 = panel.files.iter()
        .filter(|f| panel.selected_files.contains(&f.name))
        .map(|f| f.size)
        .sum();

    let number_style = Style::default().fg(theme.panel.directory_text);
    let label_style = theme.dim_style();
    let selected_style = Style::default().fg(theme.panel.marked_text);

    let mut spans = vec![
        Span::styled(format!("{}", dir_count), number_style),
        Span::styled("d ", label_style),
        Span::styled(format!("{}", file_count), number_style),
        Span::styled("f ", label_style),
        Span::styled(format_size(total_size), number_style),
    ];

    // 선택된 파일이 있으면 선택 정보 표시
    if selected_count > 0 {
        spans.push(Span::styled(" | ", label_style));
        spans.push(Span::styled(format!("{}", selected_count), selected_style));
        spans.push(Span::styled("sel ", label_style));
        spans.push(Span::styled(format_size(selected_size), selected_style));
    }

    if panel.disk_total > 0 {
        let disk_free = format_size(panel.disk_available);
        let disk_total = format_size(panel.disk_total);
        spans.push(Span::styled(" | ", label_style));
        spans.push(Span::styled(disk_free, number_style));
        spans.push(Span::styled("/", label_style));
        spans.push(Span::styled(disk_total, number_style));
    }

    frame.render_widget(
        Paragraph::new(Line::from(spans)).alignment(ratatui::layout::Alignment::Center),
        Rect::new(inner.x, inner.y + inner.height - 1, inner.width, 1),
    );
}

fn create_header_line(panel: &PanelState, name_width: usize, type_width: usize, size_width: usize, date_width: usize, is_active: bool, theme: &Theme) -> Line<'static> {
    let header_style = if is_active {
        Style::default().fg(theme.panel.header_text_active).add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(theme.panel.header_text)
    };

    // Handle very narrow width
    if name_width == 0 {
        return Line::from(Span::styled("", header_style));
    }

    let name_indicator = match (panel.sort_by, panel.sort_order) {
        (SortBy::Name, SortOrder::Asc) => "Name\u{25B2}",
        (SortBy::Name, SortOrder::Desc) => "Name\u{25BC}",
        _ => "Name",
    };

    let type_indicator = match (panel.sort_by, panel.sort_order) {
        (SortBy::Type, SortOrder::Asc) => "Type\u{25B2}",
        (SortBy::Type, SortOrder::Desc) => "Type\u{25BC}",
        _ => "Type",
    };

    let size_indicator = match (panel.sort_by, panel.sort_order) {
        (SortBy::Size, SortOrder::Asc) => "Size\u{25B2}",
        (SortBy::Size, SortOrder::Desc) => "Size\u{25BC}",
        _ => "Size",
    };

    let date_indicator = match (panel.sort_by, panel.sort_order) {
        (SortBy::Modified, SortOrder::Asc) => "Modified\u{25B2}",
        (SortBy::Modified, SortOrder::Desc) => "Modified\u{25BC}",
        _ => "Modified",
    };

    // Use saturating_sub to prevent underflow in format width
    let name_col = format!(" {:width$}", name_indicator, width = name_width.saturating_sub(1));
    let type_col_str = if type_width > 0 {
        format!("  {:^width$}  ", type_indicator, width = type_width)
    } else {
        String::new()
    };
    let size_col = if size_width > 2 {
        format!("{:>width$}  ", size_indicator, width = size_width.saturating_sub(2))
    } else {
        String::new()
    };
    let date_col = if date_width > 2 {
        format!("{:>width$}  ", date_indicator, width = date_width.saturating_sub(2))
    } else {
        String::new()
    };

    Line::from(vec![
        Span::styled(name_col, header_style),
        Span::styled(type_col_str, header_style),
        Span::styled(size_col, header_style),
        Span::styled(date_col, header_style),
    ])
}

/// Truncate string to fit within display width, accounting for wide characters
fn truncate_to_width(s: &str, max_width: usize) -> String {
    let mut result = String::new();
    let mut current_width = 0;

    for c in s.chars() {
        let char_width = unicode_width::UnicodeWidthChar::width(c).unwrap_or(0);
        if current_width + char_width > max_width {
            break;
        }
        result.push(c);
        current_width += char_width;
    }
    result
}

/// Pad string to exact display width with spaces
fn pad_to_width(s: &str, target_width: usize) -> String {
    let current_width = s.width();
    if current_width >= target_width {
        s.to_string()
    } else {
        format!("{}{}", s, " ".repeat(target_width - current_width))
    }
}

fn create_file_line(
    file: &super::app::FileItem,
    is_cursor: bool,
    is_marked: bool,
    name_width: usize,
    type_width: usize,
    size_width: usize,
    date_width: usize,
    theme: &Theme,
) -> Line<'static> {
    let marker = if is_marked { "✻" } else { " " };
    let icon = if file.is_directory {
        theme.chars.folder.to_string()
    } else {
        theme.chars.file.to_string()
    };

    // Truncate name if needed using unicode display width
    let effective_name_width = name_width.saturating_sub(2);
    let display_name = if effective_name_width < 4 {
        String::new()
    } else {
        let name_display_width = file.name.width();
        if name_display_width > effective_name_width {
            let truncate_width = effective_name_width.saturating_sub(3);
            if truncate_width > 0 {
                let truncated = truncate_to_width(&file.name, truncate_width);
                format!("{}...", truncated)
            } else {
                "...".to_string()
            }
        } else {
            file.name.clone()
        }
    };

    // Pad name column to exact width using unicode-aware padding
    let name_with_prefix = format!("{}{}{}", marker, &icon, display_name);
    let name_col = pad_to_width(&name_with_prefix, name_width);

    // Type column: show file extension (max 6 chars, center aligned)
    let type_col_str = if type_width > 0 {
        let type_str = if file.is_directory || file.name == ".." {
            String::new()
        } else {
            std::path::Path::new(&file.name)
                .extension()
                .and_then(|e| e.to_str())
                .map(|e| {
                    let lower = e.to_lowercase();
                    if lower.len() > type_width {
                        // Truncate with ".." suffix
                        format!("{}..", &lower[..type_width.saturating_sub(2)])
                    } else {
                        lower
                    }
                })
                .unwrap_or_default()
        };
        // Center align the type string
        format!("  {:^width$}  ", type_str, width = type_width)
    } else {
        String::new()
    };

    let size_str = if file.is_directory {
        "<DIR>".to_string()
    } else {
        format_size(file.size)
    };
    let size_col = if size_width > 2 {
        format!("{:>width$}  ", size_str, width = size_width.saturating_sub(2))
    } else {
        String::new()
    };

    let date_str = if file.name == ".." {
        String::new()
    } else {
        file.modified.format("%m-%d %H:%M").to_string()
    };
    let date_col = if date_width > 2 {
        format!("{:>width$}  ", date_str, width = date_width.saturating_sub(2))
    } else {
        String::new()
    };

    // Cursor style is applied at Paragraph level, not here
    let name_style = if is_cursor {
        theme.selected_style()
    } else if is_marked {
        theme.marked_style()
    } else if file.is_directory {
        theme.directory_style()
    } else {
        theme.normal_style()
    };

    let other_style = if is_cursor {
        theme.selected_style()
    } else {
        theme.dim_style()
    };

    Line::from(vec![
        Span::styled(name_col, name_style),
        Span::styled(type_col_str, other_style),
        Span::styled(size_col, other_style),
        Span::styled(date_col, other_style),
    ])
}
