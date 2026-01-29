use std::fs;
use std::path::{Path, PathBuf};

use crossterm::event::{KeyCode, KeyModifiers};
use ratatui::{
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Paragraph},
    Frame,
};

use crate::services::file_ops::FileOperationType;

use super::{
    app::{App, ConflictResolution, ConflictState, Dialog, DialogType, PathCompletion},
    theme::Theme,
};

/// 경로 문자열을 확장 (~ 홈 경로 확장)
fn expand_path_string(input: &str) -> PathBuf {
    if input.starts_with('~') {
        if let Some(home) = dirs::home_dir() {
            let rest = input.strip_prefix('~').unwrap_or("");
            let rest = rest.strip_prefix('/').unwrap_or(rest);
            if rest.is_empty() {
                home
            } else {
                home.join(rest)
            }
        } else {
            PathBuf::from(input)
        }
    } else {
        PathBuf::from(input)
    }
}

/// 입력 경로를 (기준 디렉토리, 접두어)로 분리
/// `~` 홈 경로 확장 처리
fn parse_path_for_completion(input: &str) -> (PathBuf, String) {
    // `~` 확장
    let expanded = if input.starts_with('~') {
        if let Some(home) = dirs::home_dir() {
            let rest = input.strip_prefix('~').unwrap_or("");
            let rest = rest.strip_prefix('/').unwrap_or(rest);
            if rest.is_empty() {
                home.display().to_string()
            } else {
                home.join(rest).display().to_string()
            }
        } else {
            input.to_string()
        }
    } else {
        input.to_string()
    };

    let path = PathBuf::from(&expanded);

    // 입력이 /로 끝나면 해당 디렉토리 내부 검색
    if expanded.ends_with('/') || expanded.ends_with(std::path::MAIN_SEPARATOR) {
        return (path, String::new());
    }

    // Special handling: "/." 로 끝나면 (but not "/..") "."를 prefix로 처리
    // PathBuf::file_name()은 "."를 None으로 반환하므로 수동 처리 필요
    if expanded.ends_with("/.") && !expanded.ends_with("/..") {
        let parent_str = &expanded[..expanded.len() - 2]; // "/." 제거
        let parent_path = if parent_str.is_empty() {
            PathBuf::from("/")
        } else {
            PathBuf::from(parent_str)
        };
        return (parent_path, ".".to_string());
    }
    // 단독 "." 입력
    if expanded == "." {
        return (PathBuf::from("."), ".".to_string());
    }

    // 파일명 부분과 디렉토리 부분 분리
    if let Some(parent) = path.parent() {
        let prefix = path
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        (parent.to_path_buf(), prefix)
    } else {
        // 루트 경로인 경우
        (PathBuf::from("/"), String::new())
    }
}

/// 순차 매칭 (subsequence matching)
/// pattern의 문자들이 text에 순서대로 존재하는지 확인 (연속일 필요 없음)
/// 예: "lade"는 "cLAuDE"에 매칭 (l-a-d-e 순서로 존재)
fn matches_subsequence(text: &str, pattern: &str) -> bool {
    let mut pattern_chars = pattern.chars().peekable();
    for text_char in text.chars() {
        if let Some(&pattern_char) = pattern_chars.peek() {
            if text_char == pattern_char {
                pattern_chars.next();
            }
        } else {
            break;
        }
    }
    pattern_chars.peek().is_none()
}

/// 디렉토리 읽기 및 순차 매칭
/// 대소문자 무시 검색, 디렉토리 우선 정렬
/// Security: Filters out . and .. entries to prevent path traversal
fn get_path_suggestions(base_dir: &PathBuf, prefix: &str) -> Vec<String> {
    let mut suggestions: Vec<(String, bool)> = Vec::new();
    let lower_prefix = prefix.to_lowercase();

    if let Ok(entries) = fs::read_dir(base_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let name = entry.file_name().to_string_lossy().to_string();

            // Security: Skip . and .. entries to prevent path traversal
            if name == "." || name == ".." {
                continue;
            }

            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);

            // 순차 매칭 (대소문자 무시)
            if prefix.is_empty() || matches_subsequence(&name.to_lowercase(), &lower_prefix) {
                let display_name = if is_dir {
                    format!("{}/", name)
                } else {
                    name
                };
                suggestions.push((display_name, is_dir));
            }
        }
    }

    // 디렉토리 우선, 그 다음 이름순 정렬
    suggestions.sort_by(|a, b| {
        match (a.1, b.1) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.0.to_lowercase().cmp(&b.0.to_lowercase()),
        }
    });

    suggestions.into_iter().map(|(name, _)| name).collect()
}

/// 자동완성 목록 업데이트 (입력할 때마다 호출)
/// 매칭되는 항목들을 목록에 표시
fn update_path_suggestions(dialog: &mut Dialog) {
    let (base_dir, prefix) = parse_path_for_completion(&dialog.input);
    let suggestions = get_path_suggestions(&base_dir, &prefix);

    if let Some(ref mut completion) = dialog.completion {
        if suggestions.is_empty() {
            completion.suggestions.clear();
            completion.visible = false;
        } else {
            completion.suggestions = suggestions;
            completion.selected_index = 0;
            completion.visible = true;
        }
    }
}

/// Tab 키로 자동완성 트리거
/// 유일 매칭: 바로 적용, 복수 매칭: 공통 접두어 적용
fn trigger_path_completion(dialog: &mut Dialog) {
    let (base_dir, prefix) = parse_path_for_completion(&dialog.input);
    let suggestions = get_path_suggestions(&base_dir, &prefix);

    if let Some(ref mut completion) = dialog.completion {
        if suggestions.is_empty() {
            completion.suggestions.clear();
            completion.visible = false;
        } else if suggestions.len() == 1 {
            // 유일 매칭 - 바로 적용
            apply_completion(dialog, &base_dir, &suggestions[0]);
            // 적용 후 새로운 suggestions 업데이트
            update_path_suggestions(dialog);
        } else {
            // 복수 매칭 - 공통 접두어 적용 후 목록 표시
            let common = find_common_prefix(&suggestions);
            if common.len() > prefix.len() {
                let new_path = base_dir.join(&common);
                dialog.input = new_path.display().to_string();
            }
            // 적용 후 새로운 suggestions 업데이트
            update_path_suggestions(dialog);
        }
    }
}

/// 공통 접두어 찾기
fn find_common_prefix(suggestions: &[String]) -> String {
    if suggestions.is_empty() {
        return String::new();
    }

    let first = &suggestions[0];
    let mut common_len = first.len();

    for s in suggestions.iter().skip(1) {
        let mut len = 0;
        for (c1, c2) in first.chars().zip(s.chars()) {
            if c1.to_lowercase().eq(c2.to_lowercase()) {
                len += c1.len_utf8();
            } else {
                break;
            }
        }
        common_len = common_len.min(len);
    }

    // 디렉토리 접미사 `/` 제외
    let common: String = first.chars().take(common_len).collect();
    common.trim_end_matches('/').to_string()
}

/// 선택된 자동완성 항목 적용
fn apply_completion(dialog: &mut Dialog, base_dir: &Path, suggestion: &str) {
    let new_path = base_dir.join(suggestion.trim_end_matches('/'));
    let mut path_str = new_path.display().to_string();

    // 디렉토리인 경우 `/` 추가
    if suggestion.ends_with('/') && !path_str.ends_with('/') {
        path_str.push('/');
    }

    dialog.input = path_str;
    dialog.cursor_pos = dialog.input.chars().count();
}

pub fn draw_dialog(frame: &mut Frame, app: &App, dialog: &Dialog, area: Rect, theme: &Theme) {
    // 자동완성 목록이 표시될 경우 높이 동적 조정
    let completion_height = if let Some(ref completion) = dialog.completion {
        if completion.visible && !completion.suggestions.is_empty() {
            completion.suggestions.len().min(8) as u16 + 1
        } else {
            0
        }
    } else {
        0
    };

    // 다이얼로그 타입별 크기 설정
    let (width, height) = match dialog.dialog_type {
        DialogType::Delete | DialogType::LargeImageConfirm | DialogType::TrueColorWarning => (50u16, 6u16),
        DialogType::Copy | DialogType::Move => {
            let w = area.width.saturating_sub(6).max(60);
            (w, 7 + completion_height)
        }
        DialogType::Goto => {
            // 터미널 너비 - 여백 6 (양쪽 3씩)
            let w = area.width.saturating_sub(6).max(60);
            (w, 6 + completion_height)
        }
        DialogType::Search | DialogType::Mkdir | DialogType::Rename => (50u16, 5u16),  // 간결한 입력창
        DialogType::Progress => (50u16, 10u16),  // Progress dialog
        DialogType::DuplicateConflict => (50u16, 10u16),  // Duplicate conflict dialog
    };

    let x = area.x + (area.width.saturating_sub(width)) / 2;
    let y = area.y + (area.height.saturating_sub(height)) / 2;
    let dialog_area = Rect::new(x, y, width, height);

    // Clear the area
    frame.render_widget(Clear, dialog_area);

    match dialog.dialog_type {
        DialogType::Delete => {
            draw_confirm_dialog(frame, dialog, dialog_area, theme, " Delete ");
        }
        DialogType::LargeImageConfirm => {
            draw_confirm_dialog(frame, dialog, dialog_area, theme, " Large Image ");
        }
        DialogType::TrueColorWarning => {
            draw_confirm_dialog(frame, dialog, dialog_area, theme, " True Color ");
        }
        DialogType::Copy | DialogType::Move => {
            draw_copy_move_dialog(frame, dialog, dialog_area, theme);
        }
        DialogType::Goto => {
            draw_goto_dialog(frame, dialog, dialog_area, theme);
        }
        DialogType::Search | DialogType::Mkdir | DialogType::Rename => {
            draw_simple_input_dialog(frame, dialog, dialog_area, theme);
        }
        DialogType::Progress => {
            draw_progress_dialog(frame, app, dialog_area, theme);
        }
        DialogType::DuplicateConflict => {
            if let Some(ref state) = app.conflict_state {
                draw_duplicate_conflict_dialog(frame, dialog, state, dialog_area, theme);
            }
        }
    }
}

/// 간결한 입력 다이얼로그 (Find File, Mkdir, Rename)
fn draw_simple_input_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme) {
    let title = match dialog.dialog_type {
        DialogType::Search => " Find File ",
        DialogType::Mkdir => " Create Directory ",
        DialogType::Rename => " Rename ",
        _ => " Input ",
    };

    let block = Block::default()
        .title(title)
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // 입력 필드만 표시 (중앙 정렬)
    let max_input_width = (inner.width - 4) as usize;
    let input_chars: Vec<char> = dialog.input.chars().collect();
    let cursor_pos = dialog.cursor_pos.min(input_chars.len());

    // 스크롤 처리: 커서가 보이도록 표시 범위 계산
    let (display_chars, display_cursor_pos) = if input_chars.len() > max_input_width {
        // 커서가 보이도록 스크롤 범위 계산
        let visible_width = max_input_width.saturating_sub(3); // "..." 제외
        let scroll_start = if cursor_pos < visible_width {
            0
        } else {
            cursor_pos.saturating_sub(visible_width) + 1
        };
        let scroll_end = (scroll_start + visible_width).min(input_chars.len());
        let chars: Vec<char> = input_chars[scroll_start..scroll_end].to_vec();
        let adj_cursor = cursor_pos.saturating_sub(scroll_start);
        if scroll_start > 0 {
            let mut prefix_chars = vec!['.', '.', '.'];
            prefix_chars.extend(chars);
            (prefix_chars, adj_cursor + 3)
        } else {
            (chars, adj_cursor)
        }
    } else {
        (input_chars.clone(), cursor_pos)
    };

    // 커서 위치에 따라 텍스트 분할
    let before_cursor: String = display_chars[..display_cursor_pos].iter().collect();
    let cursor_char = if display_cursor_pos < display_chars.len() {
        display_chars[display_cursor_pos].to_string()
    } else {
        " ".to_string() // 커서가 끝에 있으면 공백 표시
    };
    let after_cursor: String = if display_cursor_pos < display_chars.len() {
        display_chars[display_cursor_pos + 1..].iter().collect()
    } else {
        String::new()
    };

    let cursor_style = Style::default()
        .fg(theme.bg)
        .bg(theme.border_active)
        .add_modifier(Modifier::SLOW_BLINK);

    let input_line = Line::from(vec![
        Span::styled("> ", Style::default().fg(theme.info)),
        Span::styled(before_cursor, theme.normal_style()),
        Span::styled(cursor_char, cursor_style),
        Span::styled(after_cursor, theme.normal_style()),
    ]);

    // 수직 중앙에 배치
    let y_pos = inner.y + inner.height / 2;
    let input_area = Rect::new(inner.x + 1, y_pos, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(input_line), input_area);
}

fn draw_confirm_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme, title: &str) {
    let block = Block::default()
        .title(title)
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Message
    let message_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(dialog.message.clone())
            .style(theme.normal_style())
            .alignment(ratatui::layout::Alignment::Center),
        message_area,
    );

    // 버튼 스타일
    let selected_style = theme.selected_style();
    let normal_style = theme.dim_style();

    let yes_style = if dialog.selected_button == 0 { selected_style } else { normal_style };
    let no_style = if dialog.selected_button == 1 { selected_style } else { normal_style };

    // 버튼 (중앙 정렬)
    let buttons = Line::from(vec![
        Span::styled("  ", Style::default()),
        Span::styled(" Yes ", yes_style),
        Span::styled("    ", Style::default()),
        Span::styled(" No ", no_style),
        Span::styled("  ", Style::default()),
    ]);
    let button_area = Rect::new(inner.x + 1, inner.y + inner.height - 2, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(buttons).alignment(ratatui::layout::Alignment::Center),
        button_area,
    );
}

/// Copy/Move 다이얼로그 (경로 자동완성 포함)
fn draw_copy_move_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme) {
    let title = match dialog.dialog_type {
        DialogType::Copy => " Copy ",
        DialogType::Move => " Move ",
        _ => " Transfer ",
    };

    let block = Block::default()
        .title(title)
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // 파일 목록 메시지
    let message_area = Rect::new(inner.x + 1, inner.y, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(dialog.message.clone()).style(theme.normal_style()),
        message_area,
    );

    // 경로 입력 필드 (goto 스타일)
    let (base_dir, _) = parse_path_for_completion(&dialog.input);
    let is_root_path = base_dir == Path::new("/");

    let input_chars: Vec<char> = dialog.input.chars().collect();
    let prefix_char_start = if dialog.input.ends_with('/') {
        input_chars.len()
    } else {
        input_chars.iter().rposition(|&c| c == '/').map(|i| i + 1).unwrap_or(0)
    };

    let current_prefix: String = input_chars[prefix_char_start..].iter().collect();

    let preview_suffix = if let Some(ref completion) = dialog.completion {
        if completion.visible && !completion.suggestions.is_empty() {
            if let Some(selected) = completion.suggestions.get(completion.selected_index) {
                let selected_name = selected.trim_end_matches('/');
                if selected_name.to_lowercase().starts_with(&current_prefix.to_lowercase()) {
                    let suffix = &selected_name[current_prefix.len()..];
                    if selected.ends_with('/') {
                        format!("{}/", suffix)
                    } else {
                        suffix.to_string()
                    }
                } else {
                    String::new()
                }
            } else {
                String::new()
            }
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let max_input_width = (inner.width - 4) as usize;
    let preview_chars: Vec<char> = preview_suffix.chars().collect();
    let total_len = input_chars.len() + preview_chars.len();
    let cursor_pos = dialog.cursor_pos.min(input_chars.len());

    let (display_chars, display_preview, display_prefix_start, display_cursor_pos) = if total_len > max_input_width {
        let available = max_input_width.saturating_sub(3);
        if preview_chars.len() >= available {
            let preview_display: String = preview_chars[..available].iter().collect();
            (vec!['.', '.', '.'], preview_display, 3usize, 3usize)
        } else {
            let input_available = available - preview_chars.len();
            let skip = input_chars.len().saturating_sub(input_available);
            let input_display: Vec<char> = input_chars[skip..].to_vec();
            let prefix_pos = if prefix_char_start >= skip {
                3 + (prefix_char_start - skip)
            } else {
                3
            };
            let adj_cursor = if cursor_pos >= skip { 3 + cursor_pos - skip } else { 3 };
            let mut display = vec!['.', '.', '.'];
            display.extend(input_display);
            (display, preview_suffix.clone(), prefix_pos, adj_cursor)
        }
    } else {
        (input_chars.clone(), preview_suffix.clone(), prefix_char_start, cursor_pos)
    };

    // 커서 위치에 따라 텍스트 분할
    let before_cursor: String = display_chars[..display_cursor_pos].iter().collect();
    let cursor_char = if display_cursor_pos < display_chars.len() {
        display_chars[display_cursor_pos].to_string()
    } else {
        if !display_preview.is_empty() {
            display_preview.chars().next().unwrap().to_string()
        } else {
            " ".to_string()
        }
    };
    let after_cursor: String = if display_cursor_pos < display_chars.len() {
        display_chars[display_cursor_pos + 1..].iter().collect()
    } else {
        String::new()
    };
    let display_preview_after = if display_cursor_pos >= display_chars.len() && !display_preview.is_empty() {
        display_preview.chars().skip(1).collect()
    } else {
        display_preview.clone()
    };

    let cursor_style = Style::default()
        .fg(theme.bg)
        .bg(theme.border_active)
        .add_modifier(Modifier::SLOW_BLINK);

    let input_line = Line::from(vec![
        Span::styled("> ", Style::default().fg(theme.info)),
        Span::styled(before_cursor, theme.normal_style()),
        Span::styled(cursor_char, cursor_style),
        Span::styled(after_cursor, theme.normal_style()),
        Span::styled(&display_preview_after, theme.dim_style()),
    ]);
    let input_area = Rect::new(inner.x + 1, inner.y + 2, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(input_line), input_area);

    // 자동완성 목록 (입력창 아래 한 칸 여백)
    let list_start_y = inner.y + 4;
    // 루트 경로일 때는 "/" 위치에 맞추기 위해 1 감소 (단, prefix가 있을 때만)
    let list_x = if is_root_path && display_prefix_start > 0 {
        inner.x + 1 + 2 + display_prefix_start as u16 - 1
    } else {
        inner.x + 1 + 2 + display_prefix_start as u16
    };
    let list_width = if is_root_path && display_prefix_start > 0 {
        inner.width.saturating_sub(2 + display_prefix_start as u16)
    } else {
        inner.width.saturating_sub(3 + display_prefix_start as u16)
    };

    if let Some(ref completion) = dialog.completion {
        if completion.visible && !completion.suggestions.is_empty() {
            draw_completion_list(
                frame,
                completion,
                Rect::new(list_x, list_start_y, list_width, inner.height.saturating_sub(6)),
                theme,
                is_root_path,
            );
        }
    }

    // 하단 도움말
    let help_line = Line::from(vec![
        Span::styled("Tab", theme.header_style()),
        Span::styled(":complete ", theme.dim_style()),
        Span::styled("Enter", theme.header_style()),
        Span::styled(":confirm ", theme.dim_style()),
        Span::styled("Esc", theme.header_style()),
        Span::styled(":cancel", theme.dim_style()),
    ]);
    let help_area = Rect::new(inner.x + 1, inner.y + inner.height - 1, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(help_line), help_area);
}

#[allow(dead_code)]
fn draw_input_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme) {
    let title = match dialog.dialog_type {
        DialogType::Mkdir => " Create Directory ",
        DialogType::Rename => " Rename File ",
        DialogType::Search => " Find File ",
        DialogType::Goto => " Go to Path ",
        _ => " Input ",
    };

    let block = Block::default()
        .title(title)
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Prompt
    let prompt_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(dialog.message.clone()).style(theme.normal_style()),
        prompt_area,
    );

    // Input field
    let max_input_width = (inner.width - 4) as usize;
    let input_chars: Vec<char> = dialog.input.chars().collect();
    let display_input = if input_chars.len() > max_input_width {
        let skip = input_chars.len().saturating_sub(max_input_width.saturating_sub(3));
        let suffix: String = input_chars[skip..].iter().collect();
        format!("...{}", suffix)
    } else {
        dialog.input.clone()
    };

    let input_line = Line::from(vec![
        Span::styled("> ", Style::default().fg(theme.info)),
        Span::styled(display_input, theme.normal_style()),
        Span::styled("_", Style::default().fg(theme.border_active).add_modifier(Modifier::SLOW_BLINK)),
    ]);
    let input_area = Rect::new(inner.x + 1, inner.y + 3, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(input_line), input_area);

    // Help
    let help = Span::styled("[Enter] Confirm  [Esc] Cancel", theme.dim_style());
    let help_area = Rect::new(inner.x + 1, inner.y + inner.height - 2, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(help), help_area);
}

/// Go to Path 대화상자 렌더링 (자동완성 목록 포함)
fn draw_goto_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme) {
    let title = " Go to Path ";

    let block = Block::default()
        .title(title)
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // 입력에서 완성할 이름(prefix)의 시작 위치 계산 (char 인덱스)
    let input_chars: Vec<char> = dialog.input.chars().collect();
    let prefix_char_start = if dialog.input.ends_with('/') {
        input_chars.len()
    } else {
        // 마지막 '/' 위치 찾기
        input_chars.iter().rposition(|&c| c == '/').map(|i| i + 1).unwrap_or(0)
    };

    // 현재 입력된 prefix 추출
    let current_prefix: String = input_chars[prefix_char_start..].iter().collect();

    // base_dir 계산하여 루트 경로 여부 확인
    let (base_dir, _) = parse_path_for_completion(&dialog.input);
    let is_root_path = base_dir == Path::new("/");

    // 선택된 항목에서 미리보기 부분 계산 (입력된 prefix 이후 부분)
    let preview_suffix = if let Some(ref completion) = dialog.completion {
        if completion.visible && !completion.suggestions.is_empty() {
            if let Some(selected) = completion.suggestions.get(completion.selected_index) {
                let selected_name = selected.trim_end_matches('/');
                // 대소문자 무시하여 prefix 매칭 후 나머지 부분 추출
                if selected_name.to_lowercase().starts_with(&current_prefix.to_lowercase()) {
                    let suffix = &selected_name[current_prefix.len()..];
                    if selected.ends_with('/') {
                        format!("{}/", suffix)
                    } else {
                        suffix.to_string()
                    }
                } else {
                    String::new()
                }
            } else {
                String::new()
            }
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    // Input field 및 표시 위치 계산
    // 미리보기를 포함한 전체 길이 고려
    let max_input_width = (inner.width - 4) as usize;
    let preview_chars: Vec<char> = preview_suffix.chars().collect();
    let total_len = input_chars.len() + preview_chars.len();
    let cursor_pos = dialog.cursor_pos.min(input_chars.len());

    let (display_chars, display_preview, display_prefix_start, display_cursor_pos) = if total_len > max_input_width {
        // 앞부분을 ...로 생략하고 뒷부분(미리보기 포함) 표시
        let available = max_input_width.saturating_sub(3); // "..." 제외한 공간

        if preview_chars.len() >= available {
            // 미리보기만으로도 공간 초과 - 미리보기만 잘라서 표시
            let preview_display: String = preview_chars[..available].iter().collect();
            (vec!['.', '.', '.'], preview_display, 3usize, 3usize)
        } else {
            // 입력 일부 + 미리보기 전체 표시
            let input_available = available - preview_chars.len();
            let skip = input_chars.len().saturating_sub(input_available);
            let input_display: Vec<char> = input_chars[skip..].to_vec();
            let prefix_pos = if prefix_char_start >= skip {
                3 + (prefix_char_start - skip)
            } else {
                3
            };
            let adj_cursor = if cursor_pos >= skip { 3 + cursor_pos - skip } else { 3 };
            let mut display = vec!['.', '.', '.'];
            display.extend(input_display);
            (display, preview_suffix.clone(), prefix_pos, adj_cursor)
        }
    } else {
        (input_chars.clone(), preview_suffix.clone(), prefix_char_start, cursor_pos)
    };

    // 커서 위치에 따라 텍스트 분할
    let before_cursor: String = display_chars[..display_cursor_pos].iter().collect();
    let cursor_char = if display_cursor_pos < display_chars.len() {
        display_chars[display_cursor_pos].to_string()
    } else {
        // 커서가 입력 끝에 있을 때 미리보기 첫 문자 또는 공백
        if !display_preview.is_empty() {
            display_preview.chars().next().unwrap().to_string()
        } else {
            " ".to_string()
        }
    };
    let after_cursor: String = if display_cursor_pos < display_chars.len() {
        display_chars[display_cursor_pos + 1..].iter().collect()
    } else {
        String::new()
    };
    // 미리보기 텍스트 (커서가 끝에 있으면 첫 글자 제외)
    let display_preview_after = if display_cursor_pos >= display_chars.len() && !display_preview.is_empty() {
        display_preview.chars().skip(1).collect()
    } else {
        display_preview.clone()
    };

    let cursor_style = Style::default()
        .fg(theme.bg)
        .bg(theme.border_active)
        .add_modifier(Modifier::SLOW_BLINK);

    // 입력 필드 렌더링 (선택된 항목 미리보기 포함)
    let input_line = Line::from(vec![
        Span::styled("> ", Style::default().fg(theme.info)),
        Span::styled(before_cursor, theme.normal_style()),
        Span::styled(cursor_char, cursor_style),
        Span::styled(after_cursor, theme.normal_style()),
        Span::styled(&display_preview_after, theme.dim_style()),  // 흐리게 미리보기
    ]);
    let input_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(input_line), input_area);

    // 자동완성 목록 표시 (prefix 시작 위치에 맞춤)
    let list_start_y = inner.y + 2;
    // x 좌표: inner.x + 1 (패딩) + 2 ("> ") + prefix 시작 위치
    // 루트 경로일 때는 "/" 위치에 맞추기 위해 1 감소 (단, prefix가 있을 때만)
    let list_x = if is_root_path && display_prefix_start > 0 {
        inner.x + 1 + 2 + display_prefix_start as u16 - 1
    } else {
        inner.x + 1 + 2 + display_prefix_start as u16
    };
    let list_width = if is_root_path && display_prefix_start > 0 {
        inner.width.saturating_sub(2 + display_prefix_start as u16)
    } else {
        inner.width.saturating_sub(3 + display_prefix_start as u16)
    };

    if let Some(ref completion) = dialog.completion {
        if completion.visible && !completion.suggestions.is_empty() {
            draw_completion_list(
                frame,
                completion,
                Rect::new(list_x, list_start_y, list_width, inner.height.saturating_sub(3)),
                theme,
                is_root_path,
            );
        }
    }

    // Help (맨 아래에 표시) - 메인 화면 스타일과 통일
    let help_line = if let Some(ref completion) = dialog.completion {
        if completion.visible && !completion.suggestions.is_empty() {
            Line::from(vec![
                Span::styled("↑↓", theme.header_style()),
                Span::styled(":select ", theme.dim_style()),
                Span::styled("Tab", theme.header_style()),
                Span::styled(":complete ", theme.dim_style()),
                Span::styled("Enter", theme.header_style()),
                Span::styled(":go ", theme.dim_style()),
                Span::styled("Esc", theme.header_style()),
                Span::styled(":cancel", theme.dim_style()),
            ])
        } else {
            Line::from(vec![
                Span::styled("Tab", theme.header_style()),
                Span::styled(":complete ", theme.dim_style()),
                Span::styled("Enter", theme.header_style()),
                Span::styled(":go ", theme.dim_style()),
                Span::styled("Esc", theme.header_style()),
                Span::styled(":cancel", theme.dim_style()),
            ])
        }
    } else {
        Line::from(vec![
            Span::styled("Enter", theme.header_style()),
            Span::styled(":confirm ", theme.dim_style()),
            Span::styled("Esc", theme.header_style()),
            Span::styled(":cancel", theme.dim_style()),
        ])
    };

    let help_area = Rect::new(inner.x + 1, inner.y + inner.height - 1, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(help_line), help_area);
}

/// Progress dialog for file operations
fn draw_progress_dialog(frame: &mut Frame, app: &App, area: Rect, theme: &Theme) {
    let progress = match &app.file_operation_progress {
        Some(p) => p,
        None => return,
    };

    let title = match progress.operation_type {
        FileOperationType::Copy => " Copying ",
        FileOperationType::Move => " Moving ",
    };

    let block = Block::default()
        .title(title)
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Current file name (truncated if needed)
    let max_filename_len = (inner.width - 8) as usize;
    let current_file = if progress.current_file.len() > max_filename_len {
        format!("...{}", &progress.current_file[progress.current_file.len().saturating_sub(max_filename_len - 3)..])
    } else {
        progress.current_file.clone()
    };

    let file_line = Line::from(vec![
        Span::styled("File: ", theme.dim_style()),
        Span::styled(current_file, theme.normal_style()),
    ]);
    let file_area = Rect::new(inner.x + 1, inner.y, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(file_line), file_area);

    // Current file progress bar
    let bar_width = (inner.width - 8) as usize;
    let file_progress_percent = (progress.current_file_progress * 100.0) as u8;
    let file_filled = (progress.current_file_progress * bar_width as f64) as usize;
    let file_empty = bar_width.saturating_sub(file_filled);
    let file_bar = format!(
        "{}{}",
        "█".repeat(file_filled),
        "░".repeat(file_empty)
    );

    let file_bar_line = Line::from(vec![
        Span::styled(file_bar, theme.info_style()),
        Span::styled(format!(" {:3}%", file_progress_percent), theme.normal_style()),
    ]);
    let file_bar_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(file_bar_line), file_bar_area);

    // Total progress info
    let total_info = format!(
        "{}/{} files ({}/{})",
        progress.completed_files,
        progress.total_files,
        format_size(progress.completed_bytes),
        format_size(progress.total_bytes),
    );
    let total_line = Line::from(Span::styled(total_info, theme.dim_style()));
    let total_area = Rect::new(inner.x + 1, inner.y + 3, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(total_line), total_area);

    // Total progress bar
    let total_progress = progress.overall_progress();
    let total_progress_percent = (total_progress * 100.0) as u8;
    let total_filled = (total_progress * bar_width as f64) as usize;
    let total_empty = bar_width.saturating_sub(total_filled);
    let total_bar = format!(
        "{}{}",
        "█".repeat(total_filled),
        "░".repeat(total_empty)
    );

    let total_bar_line = Line::from(vec![
        Span::styled(total_bar, theme.info_style()),
        Span::styled(format!(" {:3}%", total_progress_percent), theme.normal_style()),
    ]);
    let total_bar_area = Rect::new(inner.x + 1, inner.y + 4, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(total_bar_line), total_bar_area);

    // Help text
    let help_line = Line::from(Span::styled(
        "Press ESC to cancel",
        theme.dim_style(),
    ));
    let help_area = Rect::new(inner.x + 1, inner.y + inner.height - 2, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(help_line).alignment(ratatui::layout::Alignment::Center),
        help_area,
    );
}

/// Duplicate conflict dialog for file paste operations
fn draw_duplicate_conflict_dialog(
    frame: &mut Frame,
    dialog: &Dialog,
    state: &ConflictState,
    area: Rect,
    theme: &Theme,
) {
    let block = Block::default()
        .title(" File Exists ")
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Get current conflict info
    let (_, _, display_name) = state.conflicts.get(state.current_index)
        .cloned()
        .unwrap_or_else(|| (PathBuf::new(), PathBuf::new(), String::new()));

    // Line 1: "File already exists:"
    let label_area = Rect::new(inner.x + 2, inner.y + 1, inner.width - 4, 1);
    frame.render_widget(
        Paragraph::new("File already exists:").style(theme.normal_style()),
        label_area,
    );

    // Line 2: filename (quoted, truncated if needed)
    let max_name_len = (inner.width - 6) as usize;
    let truncated_name = if display_name.len() > max_name_len {
        format!("\"{}...\"", &display_name[..max_name_len.saturating_sub(4)])
    } else {
        format!("\"{}\"", display_name)
    };
    let filename_area = Rect::new(inner.x + 2, inner.y + 2, inner.width - 4, 1);
    frame.render_widget(
        Paragraph::new(truncated_name).style(theme.info_style()),
        filename_area,
    );

    // Line 3: progress indicator "(1 of 3 conflicts)" or "(1 of 1 conflict)"
    let total = state.conflicts.len();
    let current = state.current_index + 1;
    let conflict_word = if total == 1 { "conflict" } else { "conflicts" };
    let progress_text = format!("({} of {} {})", current, total, conflict_word);
    let progress_area = Rect::new(inner.x + 2, inner.y + 3, inner.width - 4, 1);
    frame.render_widget(
        Paragraph::new(progress_text).style(theme.dim_style()),
        progress_area,
    );

    // Buttons - 2 rows of 2 buttons each
    // Row 1: Overwrite (0), Skip (1)
    // Row 2: Overwrite All (2), Skip All (3)
    let selected = dialog.selected_button;

    let normal_style = theme.dim_style();
    let selected_style = theme.selected_style();

    // Calculate button positions
    let button_y1 = inner.y + 5;
    let button_y2 = inner.y + 6;
    let col1_x = inner.x + 4;
    let col2_x = inner.x + inner.width / 2 + 2;

    // Button labels with shortcuts
    let btn_overwrite = " [O]verwrite ";
    let btn_skip = " [S]kip ";
    let btn_overwrite_all = " Overwrite [A]ll ";
    let btn_skip_all = " Skip A[l]l ";

    // Row 1
    let overwrite_style = if selected == 0 { selected_style } else { normal_style };
    let skip_style = if selected == 1 { selected_style } else { normal_style };
    frame.render_widget(
        Paragraph::new(btn_overwrite).style(overwrite_style),
        Rect::new(col1_x, button_y1, btn_overwrite.len() as u16, 1),
    );
    frame.render_widget(
        Paragraph::new(btn_skip).style(skip_style),
        Rect::new(col2_x, button_y1, btn_skip.len() as u16, 1),
    );

    // Row 2
    let overwrite_all_style = if selected == 2 { selected_style } else { normal_style };
    let skip_all_style = if selected == 3 { selected_style } else { normal_style };
    frame.render_widget(
        Paragraph::new(btn_overwrite_all).style(overwrite_all_style),
        Rect::new(col1_x, button_y2, btn_overwrite_all.len() as u16, 1),
    );
    frame.render_widget(
        Paragraph::new(btn_skip_all).style(skip_all_style),
        Rect::new(col2_x, button_y2, btn_skip_all.len() as u16, 1),
    );

    // Help text at bottom
    let help_line = Line::from(vec![
        Span::styled("←→↑↓", theme.header_style()),
        Span::styled(":select ", theme.dim_style()),
        Span::styled("Enter", theme.header_style()),
        Span::styled(":confirm ", theme.dim_style()),
        Span::styled("Esc", theme.header_style()),
        Span::styled(":cancel", theme.dim_style()),
    ]);
    let help_area = Rect::new(inner.x + 1, inner.y + inner.height - 1, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(help_line).alignment(ratatui::layout::Alignment::Center),
        help_area,
    );
}

/// Format file size for display
fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = 1024 * 1024;
    const GB: u64 = 1024 * 1024 * 1024;

    if bytes >= GB {
        format!("{:.1}GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1}MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1}KB", bytes as f64 / KB as f64)
    } else {
        format!("{}B", bytes)
    }
}

/// 자동완성 목록 렌더링
fn draw_completion_list(
    frame: &mut Frame,
    completion: &PathCompletion,
    area: Rect,
    theme: &Theme,
    is_root: bool,
) {
    let max_visible = area.height.min(8) as usize;
    let total = completion.suggestions.len();

    // 스크롤 계산: 선택된 항목이 항상 보이도록
    let scroll_offset = if total <= max_visible || completion.selected_index < max_visible / 2 {
        0
    } else if completion.selected_index >= total - max_visible / 2 {
        total - max_visible
    } else {
        completion.selected_index - max_visible / 2
    };

    let visible_items: Vec<&String> = completion
        .suggestions
        .iter()
        .skip(scroll_offset)
        .take(max_visible)
        .collect();

    let selected_style = Style::default()
        .bg(theme.bg_selected)
        .fg(theme.text_selected)
        .add_modifier(Modifier::BOLD);
    let dir_style = Style::default().fg(theme.text_directory);
    let file_style = theme.normal_style();

    for (i, suggestion) in visible_items.iter().enumerate() {
        let actual_index = scroll_offset + i;
        let is_selected = actual_index == completion.selected_index;
        let is_dir = suggestion.ends_with('/');

        let style = if is_selected {
            selected_style
        } else if is_dir {
            dir_style
        } else {
            file_style
        };

        // 루트 경로일 때 "/" 추가
        let display_name = if is_root {
            format!("/{}", suggestion)
        } else {
            suggestion.to_string()
        };

        // 전체 라인을 선택 스타일로 채우기
        let padded = format!("{:<width$}", display_name, width = area.width as usize);
        let line = Line::from(Span::styled(padded, style));

        let y = area.y + i as u16;
        if y < area.y + area.height {
            let item_area = Rect::new(area.x, y, area.width, 1);
            frame.render_widget(Paragraph::new(line), item_area);
        }
    }

    // 스크롤 인디케이터 (오른쪽에 표시)
    if total > max_visible {
        let scroll_info = format!("[{}/{}]", completion.selected_index + 1, total);
        let info_len = scroll_info.len() as u16;
        let info_x = area.x + area.width.saturating_sub(info_len + 1);
        let info_y = area.y;
        frame.render_widget(
            Paragraph::new(Span::styled(scroll_info, theme.dim_style())),
            Rect::new(info_x, info_y, info_len + 1, 1),
        );
    }
}

pub fn handle_dialog_input(app: &mut App, code: KeyCode, modifiers: KeyModifiers) -> bool {
    if let Some(ref mut dialog) = app.dialog {
        match dialog.dialog_type {
            DialogType::Delete => {
                match code {
                    KeyCode::Char('y') | KeyCode::Char('Y') => {
                        app.dialog = None;
                        app.execute_delete();
                    }
                    KeyCode::Char('n') | KeyCode::Char('N') | KeyCode::Esc => {
                        app.dialog = None;
                    }
                    KeyCode::Left | KeyCode::Right | KeyCode::Tab => {
                        // 버튼 토글 (0: Yes, 1: No)
                        dialog.selected_button = 1 - dialog.selected_button;
                    }
                    KeyCode::Enter => {
                        if dialog.selected_button == 0 {
                            app.dialog = None;
                            app.execute_delete();
                        } else {
                            app.dialog = None;
                        }
                    }
                    _ => {}
                }
            }
            DialogType::LargeImageConfirm | DialogType::TrueColorWarning => {
                match code {
                    KeyCode::Char('y') | KeyCode::Char('Y') => {
                        app.dialog = None;
                        app.execute_open_large_image();
                    }
                    KeyCode::Char('n') | KeyCode::Char('N') | KeyCode::Esc => {
                        app.dialog = None;
                        app.pending_large_image = None;
                    }
                    KeyCode::Left | KeyCode::Right | KeyCode::Tab => {
                        dialog.selected_button = 1 - dialog.selected_button;
                    }
                    KeyCode::Enter => {
                        if dialog.selected_button == 0 {
                            app.dialog = None;
                            app.execute_open_large_image();
                        } else {
                            app.dialog = None;
                            app.pending_large_image = None;
                        }
                    }
                    _ => {}
                }
            }
            DialogType::Copy | DialogType::Move => {
                return handle_copy_move_dialog_input(app, code, modifiers);
            }
            DialogType::Goto => {
                return handle_goto_dialog_input(app, code, modifiers);
            }
            DialogType::Progress => {
                return handle_progress_dialog_input(app, code);
            }
            DialogType::DuplicateConflict => {
                return handle_duplicate_conflict_input(app, code, modifiers);
            }
            _ => {
                match code {
                    KeyCode::Enter => {
                        let input = dialog.input.clone();
                        let dialog_type = dialog.dialog_type;
                        app.dialog = None;
                        if !input.trim().is_empty() {
                            match dialog_type {
                                DialogType::Mkdir => app.execute_mkdir(&input),
                                DialogType::Rename => app.execute_rename(&input),
                                DialogType::Search => app.execute_search(&input),
                                DialogType::Goto => app.execute_goto(&input),
                                _ => {}
                            }
                        }
                    }
                    KeyCode::Esc => {
                        app.dialog = None;
                    }
                    KeyCode::Backspace => {
                        if dialog.cursor_pos > 0 {
                            let mut chars: Vec<char> = dialog.input.chars().collect();
                            chars.remove(dialog.cursor_pos - 1);
                            dialog.input = chars.into_iter().collect();
                            dialog.cursor_pos -= 1;
                        }
                    }
                    KeyCode::Delete => {
                        let char_count = dialog.input.chars().count();
                        if dialog.cursor_pos < char_count {
                            let mut chars: Vec<char> = dialog.input.chars().collect();
                            chars.remove(dialog.cursor_pos);
                            dialog.input = chars.into_iter().collect();
                        }
                    }
                    KeyCode::Left => {
                        if dialog.cursor_pos > 0 {
                            dialog.cursor_pos -= 1;
                        }
                    }
                    KeyCode::Right => {
                        if dialog.cursor_pos < dialog.input.chars().count() {
                            dialog.cursor_pos += 1;
                        }
                    }
                    KeyCode::Home => {
                        dialog.cursor_pos = 0;
                    }
                    KeyCode::End => {
                        dialog.cursor_pos = dialog.input.chars().count();
                    }
                    KeyCode::Char(c) => {
                        let mut chars: Vec<char> = dialog.input.chars().collect();
                        chars.insert(dialog.cursor_pos, c);
                        dialog.input = chars.into_iter().collect();
                        dialog.cursor_pos += 1;
                    }
                    _ => {}
                }
            }
        }
    }
    false
}

/// Go to Path 대화상자 키 입력 처리
fn handle_goto_dialog_input(app: &mut App, code: KeyCode, _modifiers: KeyModifiers) -> bool {
    if let Some(ref mut dialog) = app.dialog {
        let completion_visible = dialog
            .completion
            .as_ref()
            .map(|c| c.visible && !c.suggestions.is_empty())
            .unwrap_or(false);

        match code {
            KeyCode::Tab => {
                if completion_visible {
                    // 목록에서 선택된 항목으로 완성
                    let (base_dir, _) = parse_path_for_completion(&dialog.input);
                    let suggestion = dialog
                        .completion
                        .as_ref()
                        .and_then(|c| c.suggestions.get(c.selected_index).cloned());

                    if let Some(suggestion) = suggestion {
                        apply_completion(dialog, &base_dir, &suggestion);
                    }
                    // 완성 후 새로운 suggestions 업데이트
                    update_path_suggestions(dialog);
                } else {
                    // 목록이 없으면 자동완성 트리거
                    trigger_path_completion(dialog);
                }
            }
            KeyCode::BackTab => {
                // Shift+Tab: 이전 항목
                if completion_visible {
                    if let Some(ref mut completion) = dialog.completion {
                        if !completion.suggestions.is_empty() {
                            if completion.selected_index == 0 {
                                completion.selected_index = completion.suggestions.len() - 1;
                            } else {
                                completion.selected_index -= 1;
                            }
                        }
                    }
                }
            }
            KeyCode::Up => {
                if completion_visible {
                    if let Some(ref mut completion) = dialog.completion {
                        if !completion.suggestions.is_empty() {
                            if completion.selected_index == 0 {
                                completion.selected_index = completion.suggestions.len() - 1;
                            } else {
                                completion.selected_index -= 1;
                            }
                        }
                    }
                }
            }
            KeyCode::Down => {
                if completion_visible {
                    if let Some(ref mut completion) = dialog.completion {
                        if !completion.suggestions.is_empty() {
                            completion.selected_index =
                                (completion.selected_index + 1) % completion.suggestions.len();
                        }
                    }
                }
            }
            KeyCode::Enter => {
                if completion_visible {
                    // 선택된 항목으로 완성
                    let (base_dir, _) = parse_path_for_completion(&dialog.input);
                    let suggestion = dialog
                        .completion
                        .as_ref()
                        .and_then(|c| c.suggestions.get(c.selected_index).cloned());

                    if let Some(suggestion) = suggestion {
                        apply_completion(dialog, &base_dir, &suggestion);
                    }
                }

                // 경로 검증
                let input = dialog.input.clone();
                if input.trim().is_empty() {
                    return false;
                }

                let path = expand_path_string(&input);

                if !path.exists() {
                    // 존재하지 않는 경로 - 다이얼로그 유지, 하단에 에러 메시지 표시
                    // 자동완성 목록 숨기기
                    if let Some(ref mut completion) = dialog.completion {
                        completion.visible = false;
                        completion.suggestions.clear();
                    }
                    let error_msg = format!("Path not found: {}", input);
                    app.show_message(&error_msg);
                    return false;
                }

                if path.is_file() {
                    // 파일인 경우 - 부모 디렉토리로 이동하고 파일에 커서 위치
                    if let Some(parent) = path.parent() {
                        let filename = path.file_name()
                            .map(|n| n.to_string_lossy().to_string());
                        app.dialog = None;
                        app.goto_directory_with_focus(parent, filename);
                        app.show_message(&format!("Moved to file: {}", path.display()));
                    }
                    return false;
                }

                // 디렉토리인 경우 - 그 디렉토리로 이동
                app.dialog = None;
                app.execute_goto(&input);
                return false;
            }
            KeyCode::Esc => {
                if completion_visible {
                    // 목록 숨기기
                    if let Some(ref mut completion) = dialog.completion {
                        completion.visible = false;
                        completion.suggestions.clear();
                    }
                } else {
                    // 다이얼로그 닫기
                    app.dialog = None;
                }
            }
            KeyCode::Backspace => {
                if dialog.cursor_pos > 0 {
                    let mut chars: Vec<char> = dialog.input.chars().collect();
                    chars.remove(dialog.cursor_pos - 1);
                    dialog.input = chars.into_iter().collect();
                    dialog.cursor_pos -= 1;
                    // 입력 변경 후 자동완성 목록 업데이트
                    update_path_suggestions(dialog);
                }
            }
            KeyCode::Delete => {
                let char_count = dialog.input.chars().count();
                if dialog.cursor_pos < char_count {
                    let mut chars: Vec<char> = dialog.input.chars().collect();
                    chars.remove(dialog.cursor_pos);
                    dialog.input = chars.into_iter().collect();
                    update_path_suggestions(dialog);
                }
            }
            KeyCode::Left => {
                // 완성 이름 시작 위치 계산 (마지막 '/' 다음 위치)
                let input_chars: Vec<char> = dialog.input.chars().collect();
                let prefix_start = if dialog.input.ends_with('/') {
                    input_chars.len()
                } else {
                    input_chars.iter().rposition(|&c| c == '/').map(|i| i + 1).unwrap_or(0)
                };
                if dialog.cursor_pos > prefix_start {
                    dialog.cursor_pos -= 1;
                }
            }
            KeyCode::Right => {
                if dialog.cursor_pos < dialog.input.chars().count() {
                    dialog.cursor_pos += 1;
                }
            }
            KeyCode::Home => {
                // 완성 이름 시작 위치로 이동
                let input_chars: Vec<char> = dialog.input.chars().collect();
                let prefix_start = if dialog.input.ends_with('/') {
                    input_chars.len()
                } else {
                    input_chars.iter().rposition(|&c| c == '/').map(|i| i + 1).unwrap_or(0)
                };
                dialog.cursor_pos = prefix_start;
            }
            KeyCode::End => {
                dialog.cursor_pos = dialog.input.chars().count();
            }
            KeyCode::Char(c) => {
                if c == '~' {
                    // '~' 입력 시 홈 폴더 경로로 설정
                    if let Some(home) = dirs::home_dir() {
                        dialog.input = format!("{}/", home.display());
                        dialog.cursor_pos = dialog.input.chars().count();
                        update_path_suggestions(dialog);
                    }
                } else if c == '/' {
                    // 연속 '/' 입력 방지
                    let chars: Vec<char> = dialog.input.chars().collect();
                    let prev_char = if dialog.cursor_pos > 0 {
                        chars.get(dialog.cursor_pos - 1).copied()
                    } else {
                        None
                    };
                    if prev_char != Some('/') {
                        let mut chars = chars;
                        chars.insert(dialog.cursor_pos, c);
                        dialog.input = chars.into_iter().collect();
                        dialog.cursor_pos += 1;
                        update_path_suggestions(dialog);
                    }
                } else {
                    let mut chars: Vec<char> = dialog.input.chars().collect();
                    chars.insert(dialog.cursor_pos, c);
                    dialog.input = chars.into_iter().collect();
                    dialog.cursor_pos += 1;
                    // 입력 변경 후 자동완성 목록 업데이트
                    update_path_suggestions(dialog);
                }
            }
            _ => {}
        }
    }
    false
}

/// Copy/Move 다이얼로그 키 입력 처리
fn handle_copy_move_dialog_input(app: &mut App, code: KeyCode, _modifiers: KeyModifiers) -> bool {
    if let Some(ref mut dialog) = app.dialog {
        let completion_visible = dialog
            .completion
            .as_ref()
            .map(|c| c.visible && !c.suggestions.is_empty())
            .unwrap_or(false);

        match code {
            KeyCode::Tab => {
                if completion_visible {
                    let (base_dir, _) = parse_path_for_completion(&dialog.input);
                    let suggestion = dialog
                        .completion
                        .as_ref()
                        .and_then(|c| c.suggestions.get(c.selected_index).cloned());

                    if let Some(suggestion) = suggestion {
                        apply_completion(dialog, &base_dir, &suggestion);
                    }
                    update_path_suggestions(dialog);
                } else {
                    trigger_path_completion(dialog);
                }
            }
            KeyCode::BackTab | KeyCode::Up => {
                if completion_visible {
                    if let Some(ref mut completion) = dialog.completion {
                        if !completion.suggestions.is_empty() {
                            if completion.selected_index == 0 {
                                completion.selected_index = completion.suggestions.len() - 1;
                            } else {
                                completion.selected_index -= 1;
                            }
                        }
                    }
                }
            }
            KeyCode::Down => {
                if completion_visible {
                    if let Some(ref mut completion) = dialog.completion {
                        if !completion.suggestions.is_empty() {
                            completion.selected_index =
                                (completion.selected_index + 1) % completion.suggestions.len();
                        }
                    }
                }
            }
            KeyCode::Enter => {
                if completion_visible {
                    let (base_dir, _) = parse_path_for_completion(&dialog.input);
                    let suggestion = dialog
                        .completion
                        .as_ref()
                        .and_then(|c| c.suggestions.get(c.selected_index).cloned());

                    if let Some(suggestion) = suggestion {
                        apply_completion(dialog, &base_dir, &suggestion);
                    }
                    update_path_suggestions(dialog);
                    return false;
                }

                // 경로 검증
                let input = dialog.input.clone();
                if input.trim().is_empty() {
                    app.show_message("Please enter a target path");
                    return false;
                }

                let path = expand_path_string(&input);

                if !path.exists() || !path.is_dir() {
                    if let Some(ref mut completion) = dialog.completion {
                        completion.visible = false;
                        completion.suggestions.clear();
                    }
                    app.show_message(&format!("Invalid directory: {}", input));
                    return false;
                }

                // 복사/이동 실행 (프로그레스바 버전)
                let dialog_type = dialog.dialog_type;
                let target_path = path;
                app.dialog = None;

                match dialog_type {
                    DialogType::Copy => app.execute_copy_to_with_progress(&target_path),
                    DialogType::Move => app.execute_move_to_with_progress(&target_path),
                    _ => {}
                }
                return false;
            }
            KeyCode::Esc => {
                if completion_visible {
                    if let Some(ref mut completion) = dialog.completion {
                        completion.visible = false;
                        completion.suggestions.clear();
                    }
                } else {
                    app.dialog = None;
                }
            }
            KeyCode::Backspace => {
                if dialog.cursor_pos > 0 {
                    let mut chars: Vec<char> = dialog.input.chars().collect();
                    chars.remove(dialog.cursor_pos - 1);
                    dialog.input = chars.into_iter().collect();
                    dialog.cursor_pos -= 1;
                    update_path_suggestions(dialog);
                }
            }
            KeyCode::Delete => {
                let char_count = dialog.input.chars().count();
                if dialog.cursor_pos < char_count {
                    let mut chars: Vec<char> = dialog.input.chars().collect();
                    chars.remove(dialog.cursor_pos);
                    dialog.input = chars.into_iter().collect();
                    update_path_suggestions(dialog);
                }
            }
            KeyCode::Left => {
                // 완성 이름 시작 위치 계산 (마지막 '/' 다음 위치)
                let input_chars: Vec<char> = dialog.input.chars().collect();
                let prefix_start = if dialog.input.ends_with('/') {
                    input_chars.len()
                } else {
                    input_chars.iter().rposition(|&c| c == '/').map(|i| i + 1).unwrap_or(0)
                };
                if dialog.cursor_pos > prefix_start {
                    dialog.cursor_pos -= 1;
                }
            }
            KeyCode::Right => {
                if dialog.cursor_pos < dialog.input.chars().count() {
                    dialog.cursor_pos += 1;
                }
            }
            KeyCode::Home => {
                // 완성 이름 시작 위치로 이동
                let input_chars: Vec<char> = dialog.input.chars().collect();
                let prefix_start = if dialog.input.ends_with('/') {
                    input_chars.len()
                } else {
                    input_chars.iter().rposition(|&c| c == '/').map(|i| i + 1).unwrap_or(0)
                };
                dialog.cursor_pos = prefix_start;
            }
            KeyCode::End => {
                dialog.cursor_pos = dialog.input.chars().count();
            }
            KeyCode::Char(c) => {
                if c == '/' && completion_visible {
                    let (base_dir, _) = parse_path_for_completion(&dialog.input);
                    let suggestion = dialog
                        .completion
                        .as_ref()
                        .and_then(|comp| comp.suggestions.get(comp.selected_index).cloned());

                    if let Some(suggestion) = suggestion {
                        apply_completion(dialog, &base_dir, &suggestion);
                    }
                    update_path_suggestions(dialog);
                } else if c == '~' {
                    if let Some(home) = dirs::home_dir() {
                        dialog.input = format!("{}/", home.display());
                        dialog.cursor_pos = dialog.input.chars().count();
                        update_path_suggestions(dialog);
                    }
                } else if c == '/' {
                    // 연속 '/' 입력 방지
                    let chars: Vec<char> = dialog.input.chars().collect();
                    let prev_char = if dialog.cursor_pos > 0 {
                        chars.get(dialog.cursor_pos - 1).copied()
                    } else {
                        None
                    };
                    if prev_char != Some('/') {
                        let mut chars = chars;
                        chars.insert(dialog.cursor_pos, c);
                        dialog.input = chars.into_iter().collect();
                        dialog.cursor_pos += 1;
                        update_path_suggestions(dialog);
                    }
                } else {
                    let mut chars: Vec<char> = dialog.input.chars().collect();
                    chars.insert(dialog.cursor_pos, c);
                    dialog.input = chars.into_iter().collect();
                    dialog.cursor_pos += 1;
                    update_path_suggestions(dialog);
                }
            }
            _ => {}
        }
    }
    false
}

/// Handle progress dialog input (ESC to cancel)
fn handle_progress_dialog_input(app: &mut App, code: KeyCode) -> bool {
    if code == KeyCode::Esc {
        // Cancel the operation
        if let Some(ref mut progress) = app.file_operation_progress {
            progress.cancel();
        }
        // Dialog will be closed when the operation completes (or is cancelled)
    }
    false
}

/// Handle duplicate conflict dialog input
fn handle_duplicate_conflict_input(app: &mut App, code: KeyCode, _modifiers: KeyModifiers) -> bool {
    if let Some(ref mut dialog) = app.dialog {
        match code {
            // Shortcut keys
            KeyCode::Char('o') | KeyCode::Char('O') => {
                resolve_current_conflict(app, ConflictResolution::Overwrite);
                return false;
            }
            KeyCode::Char('s') | KeyCode::Char('S') => {
                resolve_current_conflict(app, ConflictResolution::Skip);
                return false;
            }
            KeyCode::Char('a') | KeyCode::Char('A') => {
                resolve_current_conflict(app, ConflictResolution::OverwriteAll);
                return false;
            }
            KeyCode::Char('l') | KeyCode::Char('L') => {
                resolve_current_conflict(app, ConflictResolution::SkipAll);
                return false;
            }

            // Navigation - 2x2 grid layout:
            // 0 (Overwrite)     1 (Skip)
            // 2 (Overwrite All) 3 (Skip All)
            KeyCode::Left => {
                // Move left in row: 1->0, 3->2
                if dialog.selected_button == 1 {
                    dialog.selected_button = 0;
                } else if dialog.selected_button == 3 {
                    dialog.selected_button = 2;
                }
            }
            KeyCode::Right => {
                // Move right in row: 0->1, 2->3
                if dialog.selected_button == 0 {
                    dialog.selected_button = 1;
                } else if dialog.selected_button == 2 {
                    dialog.selected_button = 3;
                }
            }
            KeyCode::Up => {
                // Move up between rows: 2->0, 3->1
                if dialog.selected_button == 2 {
                    dialog.selected_button = 0;
                } else if dialog.selected_button == 3 {
                    dialog.selected_button = 1;
                }
            }
            KeyCode::Down => {
                // Move down between rows: 0->2, 1->3
                if dialog.selected_button == 0 {
                    dialog.selected_button = 2;
                } else if dialog.selected_button == 1 {
                    dialog.selected_button = 3;
                }
            }
            KeyCode::Tab => {
                // Cycle through buttons: 0->1->2->3->0
                dialog.selected_button = (dialog.selected_button + 1) % 4;
            }
            KeyCode::BackTab => {
                // Reverse cycle: 0->3->2->1->0
                dialog.selected_button = if dialog.selected_button == 0 {
                    3
                } else {
                    dialog.selected_button - 1
                };
            }

            KeyCode::Enter => {
                let resolution = match dialog.selected_button {
                    0 => ConflictResolution::Overwrite,
                    1 => ConflictResolution::Skip,
                    2 => ConflictResolution::OverwriteAll,
                    3 => ConflictResolution::SkipAll,
                    _ => ConflictResolution::Skip,
                };
                resolve_current_conflict(app, resolution);
                return false;
            }

            KeyCode::Esc => {
                // Cancel entire operation - restore clipboard if it was a copy operation
                if let Some(ref state) = app.conflict_state {
                    if !state.is_move_operation {
                        // Restore clipboard for copy operations
                        if let Some(ref backup) = state.clipboard_backup {
                            app.clipboard = Some(backup.clone());
                        }
                    }
                }
                app.dialog = None;
                app.conflict_state = None;
                app.show_message("Paste operation cancelled");
            }

            _ => {}
        }
    }
    false
}

/// Resolve current conflict with the given resolution
fn resolve_current_conflict(app: &mut App, resolution: ConflictResolution) {
    let should_finish = {
        let state = match app.conflict_state.as_mut() {
            Some(s) => s,
            None => return,
        };

        match resolution {
            ConflictResolution::Overwrite => {
                // Mark current file for overwrite
                if let Some((src, _, _)) = state.conflicts.get(state.current_index) {
                    state.files_to_overwrite.push(src.clone());
                }
                advance_to_next_conflict(state)
            }
            ConflictResolution::Skip => {
                // Mark current file for skip
                if let Some((src, _, _)) = state.conflicts.get(state.current_index) {
                    state.files_to_skip.push(src.clone());
                }
                advance_to_next_conflict(state)
            }
            ConflictResolution::OverwriteAll => {
                // Mark all remaining conflicts for overwrite
                for i in state.current_index..state.conflicts.len() {
                    if let Some((src, _, _)) = state.conflicts.get(i) {
                        state.files_to_overwrite.push(src.clone());
                    }
                }
                true // Finished
            }
            ConflictResolution::SkipAll => {
                // Mark all remaining conflicts for skip
                for i in state.current_index..state.conflicts.len() {
                    if let Some((src, _, _)) = state.conflicts.get(i) {
                        state.files_to_skip.push(src.clone());
                    }
                }
                true // Finished
            }
        }
    };

    if should_finish {
        finish_conflict_resolution(app);
    }
}

/// Advance to next conflict, returns true if all conflicts resolved
fn advance_to_next_conflict(state: &mut ConflictState) -> bool {
    state.current_index += 1;
    state.current_index >= state.conflicts.len()
}

/// Finish conflict resolution and execute the paste operation
fn finish_conflict_resolution(app: &mut App) {
    app.dialog = None;
    app.execute_paste_with_conflicts();
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicU64, Ordering};

    /// Counter for unique temp directory names
    static TEST_COUNTER: AtomicU64 = AtomicU64::new(0);

    /// Helper to create a temporary directory for testing
    fn create_temp_test_dir() -> PathBuf {
        let unique_id = TEST_COUNTER.fetch_add(1, Ordering::SeqCst);
        let temp_dir = std::env::temp_dir().join(format!(
            "cokacdir_dialog_test_{}_{}",
            std::process::id(),
            unique_id
        ));
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).expect("Failed to create temp dir");
        temp_dir
    }

    /// Helper to cleanup temp directory
    fn cleanup_temp_test_dir(path: &Path) {
        let _ = fs::remove_dir_all(path);
    }

    // ========== expand_path_string tests ==========

    #[test]
    fn test_expand_tilde() {
        let result = expand_path_string("~");
        if let Some(home) = dirs::home_dir() {
            assert_eq!(result, home);
        }
    }

    #[test]
    fn test_expand_tilde_subpath() {
        let result = expand_path_string("~/Documents");
        if let Some(home) = dirs::home_dir() {
            assert_eq!(result, home.join("Documents"));
        }
    }

    #[test]
    fn test_expand_absolute_path() {
        let result = expand_path_string("/usr/bin");
        assert_eq!(result, PathBuf::from("/usr/bin"));
    }

    #[test]
    fn test_expand_relative_path() {
        let result = expand_path_string("relative/path");
        assert_eq!(result, PathBuf::from("relative/path"));
    }

    // ========== parse_path_for_completion tests ==========

    #[test]
    fn test_parse_path_trailing_slash() {
        let (base_dir, prefix) = parse_path_for_completion("/usr/");
        assert_eq!(base_dir, PathBuf::from("/usr/"));
        assert_eq!(prefix, "");
    }

    #[test]
    fn test_parse_path_partial_name() {
        let (base_dir, prefix) = parse_path_for_completion("/usr/bi");
        assert_eq!(base_dir, PathBuf::from("/usr"));
        assert_eq!(prefix, "bi");
    }

    #[test]
    fn test_parse_path_root() {
        let (base_dir, prefix) = parse_path_for_completion("/");
        assert_eq!(base_dir, PathBuf::from("/"));
        assert_eq!(prefix, "");
    }

    #[test]
    fn test_parse_path_tilde() {
        let (_base_dir, _prefix) = parse_path_for_completion("~/Doc");
        if let Some(home) = dirs::home_dir() {
            // Should expand tilde
            assert!(_base_dir.starts_with(home));
        }
    }

    // ========== get_path_suggestions tests ==========

    #[test]
    fn test_path_suggestions_filter_dots() {
        let temp_dir = create_temp_test_dir();

        // Create test files
        fs::write(temp_dir.join("file1.txt"), "").unwrap();
        fs::write(temp_dir.join("file2.txt"), "").unwrap();
        fs::create_dir(temp_dir.join("subdir")).unwrap();

        let suggestions = get_path_suggestions(&temp_dir, "");

        // Should not contain . or ..
        assert!(!suggestions.contains(&".".to_string()));
        assert!(!suggestions.contains(&"..".to_string()));

        // Should contain our test files
        assert!(suggestions.iter().any(|s| s.starts_with("file")));
        assert!(suggestions.iter().any(|s| s.starts_with("subdir")));

        cleanup_temp_test_dir(&temp_dir);
    }

    #[test]
    fn test_path_suggestions_prefix_filter() {
        let temp_dir = create_temp_test_dir();

        fs::write(temp_dir.join("apple.txt"), "").unwrap();
        fs::write(temp_dir.join("apricot.txt"), "").unwrap();
        fs::write(temp_dir.join("banana.txt"), "").unwrap();

        let suggestions = get_path_suggestions(&temp_dir, "ap");

        assert_eq!(suggestions.len(), 2);
        assert!(suggestions.iter().all(|s| s.to_lowercase().starts_with("ap")));

        cleanup_temp_test_dir(&temp_dir);
    }

    #[test]
    fn test_path_suggestions_case_insensitive() {
        let temp_dir = create_temp_test_dir();

        fs::write(temp_dir.join("Apple.txt"), "").unwrap();
        fs::write(temp_dir.join("APRICOT.txt"), "").unwrap();

        let suggestions = get_path_suggestions(&temp_dir, "ap");

        // Should match regardless of case
        assert_eq!(suggestions.len(), 2);

        cleanup_temp_test_dir(&temp_dir);
    }

    #[test]
    fn test_path_suggestions_directories_first() {
        let temp_dir = create_temp_test_dir();

        fs::write(temp_dir.join("afile.txt"), "").unwrap();
        fs::create_dir(temp_dir.join("adir")).unwrap();

        let suggestions = get_path_suggestions(&temp_dir, "a");

        // Directory should come first
        assert!(suggestions[0].ends_with('/'));
        assert_eq!(suggestions[0], "adir/");

        cleanup_temp_test_dir(&temp_dir);
    }

    // ========== find_common_prefix tests ==========

    #[test]
    fn test_common_prefix_single() {
        let suggestions = vec!["apple".to_string()];
        let common = find_common_prefix(&suggestions);
        assert_eq!(common, "apple");
    }

    #[test]
    fn test_common_prefix_multiple() {
        let suggestions = vec![
            "application".to_string(),
            "apple".to_string(),
            "apartment".to_string(),
        ];
        let common = find_common_prefix(&suggestions);
        assert_eq!(common, "ap");
    }

    #[test]
    fn test_common_prefix_same() {
        let suggestions = vec![
            "test".to_string(),
            "test".to_string(),
        ];
        let common = find_common_prefix(&suggestions);
        assert_eq!(common, "test");
    }

    #[test]
    fn test_common_prefix_empty() {
        let suggestions: Vec<String> = vec![];
        let common = find_common_prefix(&suggestions);
        assert_eq!(common, "");
    }

    #[test]
    fn test_common_prefix_no_common() {
        let suggestions = vec![
            "apple".to_string(),
            "banana".to_string(),
        ];
        let common = find_common_prefix(&suggestions);
        assert_eq!(common, "");
    }

    #[test]
    fn test_common_prefix_strips_trailing_slash() {
        let suggestions = vec![
            "dir/".to_string(),
            "dir2/".to_string(),
        ];
        let common = find_common_prefix(&suggestions);
        assert_eq!(common, "dir");
    }

    // ========== PathCompletion tests ==========

    #[test]
    fn test_path_completion_default() {
        let completion = PathCompletion::default();
        assert!(completion.suggestions.is_empty());
        assert_eq!(completion.selected_index, 0);
        assert!(!completion.visible);
    }

    // ========== Dialog tests ==========

    #[test]
    fn test_dialog_creation() {
        let dialog = Dialog {
            dialog_type: DialogType::Copy,
            input: "/home/user/".to_string(),
            cursor_pos: 11,
            message: "Copy files".to_string(),
            completion: Some(PathCompletion::default()),
            selected_button: 0,
        };

        assert_eq!(dialog.dialog_type, DialogType::Copy);
        assert_eq!(dialog.input, "/home/user/");
        assert!(dialog.completion.is_some());
    }

    // ========== update_path_suggestions tests ==========

    #[test]
    fn test_update_path_suggestions_existing_dir() {
        let temp_dir = create_temp_test_dir();
        fs::write(temp_dir.join("test.txt"), "").unwrap();

        let input = format!("{}/", temp_dir.display());
        let cursor_pos = input.chars().count();
        let mut dialog = Dialog {
            dialog_type: DialogType::Goto,
            input,
            cursor_pos,
            message: String::new(),
            completion: Some(PathCompletion::default()),
            selected_button: 0,
        };

        update_path_suggestions(&mut dialog);

        let completion = dialog.completion.as_ref().unwrap();
        assert!(completion.visible);
        assert!(completion.suggestions.iter().any(|s| s.contains("test")));

        cleanup_temp_test_dir(&temp_dir);
    }

    #[test]
    fn test_update_path_suggestions_no_match() {
        let temp_dir = create_temp_test_dir();
        fs::write(temp_dir.join("apple.txt"), "").unwrap();

        let input = format!("{}/xyz", temp_dir.display());
        let cursor_pos = input.chars().count();
        let mut dialog = Dialog {
            dialog_type: DialogType::Goto,
            input,
            cursor_pos,
            message: String::new(),
            completion: Some(PathCompletion::default()),
            selected_button: 0,
        };

        update_path_suggestions(&mut dialog);

        let completion = dialog.completion.as_ref().unwrap();
        assert!(!completion.visible);
        assert!(completion.suggestions.is_empty());

        cleanup_temp_test_dir(&temp_dir);
    }
}
