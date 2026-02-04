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
    app::{App, ConflictResolution, ConflictState, Dialog, DialogType, PathCompletion, SettingsState, fuzzy_match},
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
    // 다이얼로그 크기 상수
    const MAX_COMPLETION_ITEMS: u16 = 8;      // 자동완성 목록 최대 표시 항목 수
    const COMPLETION_EXTRA_HEIGHT: u16 = 1;   // 자동완성 목록 추가 여백
    const MAX_COMPLETION_HEIGHT: u16 = MAX_COMPLETION_ITEMS + COMPLETION_EXTRA_HEIGHT;

    const DIALOG_MARGIN: u16 = 6;             // 다이얼로그 좌우 여백 (양쪽 3씩)
    const DIALOG_MIN_WIDTH: u16 = 60;         // 다이얼로그 최소 너비
    const SIMPLE_DIALOG_WIDTH: u16 = 50;      // 간단한 다이얼로그 너비

    const GOTO_BASE_HEIGHT: u16 = 6;          // Goto 다이얼로그 기본 높이
    const COPY_MOVE_BASE_HEIGHT: u16 = 7;     // Copy/Move 다이얼로그 기본 높이
    const SIMPLE_INPUT_HEIGHT: u16 = 5;       // 간단한 입력 다이얼로그 높이
    const CONFIRM_DIALOG_HEIGHT: u16 = 6;     // 확인 다이얼로그 높이
    const PROGRESS_DIALOG_HEIGHT: u16 = 8;    // 프로그레스 다이얼로그 높이
    const CONFLICT_DIALOG_HEIGHT: u16 = 9;    // 충돌 다이얼로그 높이 (버튼 2줄)

    // 자동완성 목록 현재 높이 계산
    let completion_height = if let Some(ref completion) = dialog.completion {
        if completion.visible && !completion.suggestions.is_empty() {
            (completion.suggestions.len() as u16).min(MAX_COMPLETION_ITEMS) + COMPLETION_EXTRA_HEIGHT
        } else {
            0
        }
    } else {
        0
    };

    // 다이얼로그 타입별 크기 설정
    // Y좌표는 max_height 기준 고정, 실제 높이는 동적
    let (width, height, max_height) = match dialog.dialog_type {
        DialogType::Delete | DialogType::LargeImageConfirm | DialogType::LargeFileConfirm | DialogType::TrueColorWarning => {
            (SIMPLE_DIALOG_WIDTH, CONFIRM_DIALOG_HEIGHT, CONFIRM_DIALOG_HEIGHT)
        }
        DialogType::ExtensionHandlerError => {
            // Error dialog: wider to accommodate error messages, taller for multi-line
            (65, 8, 8)
        }
        DialogType::Copy | DialogType::Move => {
            let w = area.width.saturating_sub(DIALOG_MARGIN).max(DIALOG_MIN_WIDTH);
            let max_h = COPY_MOVE_BASE_HEIGHT + MAX_COMPLETION_HEIGHT;
            let h = COPY_MOVE_BASE_HEIGHT + completion_height;
            (w, h, max_h)
        }
        DialogType::Goto => {
            let w = area.width.saturating_sub(DIALOG_MARGIN).max(DIALOG_MIN_WIDTH);
            let max_h = GOTO_BASE_HEIGHT + MAX_COMPLETION_HEIGHT;

            // 북마크 모드인지 확인 (입력이 /나 ~로 시작하지 않으면 북마크 모드)
            let is_bookmark_mode = !dialog.input.starts_with('/') && !dialog.input.starts_with('~');

            let h = if is_bookmark_mode && !app.settings.bookmarked_path.is_empty() {
                // 북마크 모드이고 북마크가 있으면 최대 높이 사용
                max_h
            } else {
                GOTO_BASE_HEIGHT + completion_height
            };

            (w, h, max_h)
        }
        DialogType::Search | DialogType::Mkdir | DialogType::Rename | DialogType::Tar => {
            (SIMPLE_DIALOG_WIDTH, SIMPLE_INPUT_HEIGHT, SIMPLE_INPUT_HEIGHT)
        }
        DialogType::Progress => {
            (SIMPLE_DIALOG_WIDTH, PROGRESS_DIALOG_HEIGHT, PROGRESS_DIALOG_HEIGHT)
        }
        DialogType::DuplicateConflict => {
            (SIMPLE_DIALOG_WIDTH, CONFLICT_DIALOG_HEIGHT, CONFLICT_DIALOG_HEIGHT)
        }
        DialogType::TarExcludeConfirm | DialogType::CopyExcludeConfirm => {
            (60, 15, 15) // Exclude confirm dialog
        }
        DialogType::Settings => {
            (42, 5, 5) // Settings dialog: width=42, height=5
        }
        DialogType::BinaryFileHandler => {
            (75, 11, 11) // Binary file handler dialog
        }
    };

    let x = area.x + (area.width.saturating_sub(width)) / 2;
    // Y좌표는 항상 최대 높이 기준으로 계산 (절대 고정)
    let y = area.y + (area.height.saturating_sub(max_height)) / 2;
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
        DialogType::LargeFileConfirm => {
            draw_confirm_dialog(frame, dialog, dialog_area, theme, " Large File ");
        }
        DialogType::TrueColorWarning => {
            draw_confirm_dialog(frame, dialog, dialog_area, theme, " True Color ");
        }
        DialogType::Copy | DialogType::Move => {
            draw_copy_move_dialog(frame, dialog, dialog_area, theme);
        }
        DialogType::Goto => {
            draw_goto_dialog(frame, app, dialog, dialog_area, theme);
        }
        DialogType::Search | DialogType::Mkdir | DialogType::Rename | DialogType::Tar => {
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
        DialogType::TarExcludeConfirm => {
            if let Some(ref state) = app.tar_exclude_state {
                draw_tar_exclude_confirm_dialog(frame, dialog, state, dialog_area, theme);
            }
        }
        DialogType::CopyExcludeConfirm => {
            if let Some(ref state) = app.copy_exclude_state {
                draw_copy_exclude_confirm_dialog(frame, dialog, state, dialog_area, theme);
            }
        }
        DialogType::Settings => {
            if let Some(ref state) = app.settings_state {
                draw_settings_dialog(frame, state, dialog_area, theme);
            }
        }
        DialogType::ExtensionHandlerError => {
            draw_error_dialog(frame, dialog, dialog_area, theme, " Handler Error ");
        }
        DialogType::BinaryFileHandler => {
            draw_binary_file_handler_dialog(frame, dialog, dialog_area, theme);
        }
    }
}

/// Binary file handler setup dialog
fn draw_binary_file_handler_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme) {
    let extension = &dialog.message; // Extension is stored in message field
    let is_edit_mode = dialog.selected_button == 1; // 0: Set, 1: Edit (fixed at dialog creation)

    let title = if is_edit_mode { " Edit Handler " } else { " Set Handler " };

    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.border))
        .style(Style::default().bg(theme.dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Message varies based on whether handler exists
    let (msg1, msg2) = if is_edit_mode {
        (
            format!("A handler is configured for \".{}\" files.", extension),
            "You can modify or replace the command below.".to_string(),
        )
    } else {
        (
            format!("No handler configured for \".{}\" files.", extension),
            "Please specify a program to open this file type.".to_string(),
        )
    };

    let msg1_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(msg1).style(Style::default().fg(theme.dialog.text)),
        msg1_area,
    );

    let msg2_area = Rect::new(inner.x + 1, inner.y + 2, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(msg2).style(Style::default().fg(theme.dialog.text)),
        msg2_area,
    );

    // Message line 3 (extension specific)
    let msg3 = format!(
        "Enter the command to use for \".{}\" files:",
        extension
    );
    let msg3_area = Rect::new(inner.x + 1, inner.y + 3, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(msg3).style(Style::default().fg(theme.dialog.text)),
        msg3_area,
    );

    // Input field with placeholder (extension-specific examples)
    let input_area = Rect::new(inner.x + 1, inner.y + 5, inner.width - 2, 1);
    let placeholder = get_handler_placeholder(extension);
    let display_text = if dialog.input.is_empty() {
        placeholder.clone()
    } else {
        dialog.input.clone()
    };
    let input_style = if dialog.input.is_empty() {
        Style::default().fg(theme.dialog.text_dim) // placeholder uses dim text color
    } else {
        Style::default().fg(theme.dialog.input_text)
    };
    frame.render_widget(
        Paragraph::new(display_text).style(input_style),
        input_area,
    );

    // Key hints (Enter: confirm, Esc: cancel)
    let button_style = Style::default()
        .fg(theme.confirm_dialog.button_selected_text)
        .bg(theme.confirm_dialog.button_selected_bg);

    let buttons = Line::from(vec![
        Span::styled("  Enter: confirm  ", button_style),
        Span::raw("    "),
        Span::styled("  Esc: cancel  ", button_style),
    ]);
    let button_area = Rect::new(inner.x + 1, inner.y + inner.height - 2, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(buttons).alignment(ratatui::layout::Alignment::Center),
        button_area,
    );

    // Always show cursor in input field
    let cursor_x = input_area.x + dialog.cursor_pos as u16;
    let cursor_y = input_area.y;
    frame.set_cursor_position(ratatui::layout::Position::new(cursor_x, cursor_y));
}

/// Get placeholder example command for file extension
fn get_handler_placeholder(extension: &str) -> String {
    let ext_lower = extension.to_lowercase();
    let command = match ext_lower.as_str() {
        // Images - common formats
        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" => "feh {{FILEPATH}}",
        "svg" | "svgz" => "inkscape {{FILEPATH}}",
        "ico" | "icns" => "feh {{FILEPATH}}",
        "tif" | "tiff" => "gimp {{FILEPATH}}",
        "psd" | "xcf" => "gimp {{FILEPATH}}",
        "raw" | "cr2" | "nef" | "arw" | "dng" => "darktable {{FILEPATH}}",
        "heic" | "heif" => "feh {{FILEPATH}}",
        "jxl" | "avif" => "feh {{FILEPATH}}",

        // Videos
        "mp4" | "avi" | "mkv" | "webm" | "mov" => "vlc {{FILEPATH}}",
        "flv" | "wmv" | "m4v" | "mpg" | "mpeg" => "vlc {{FILEPATH}}",
        "3gp" | "3g2" | "ogv" | "vob" | "mts" | "m2ts" => "vlc {{FILEPATH}}",
        "ts" => "vlc {{FILEPATH}}",

        // Audio
        "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac" => "vlc {{FILEPATH}}",
        "wma" | "opus" | "aiff" | "ape" | "mka" => "vlc {{FILEPATH}}",
        "mid" | "midi" => "timidity {{FILEPATH}}",
        "mod" | "xm" | "it" | "s3m" => "vlc {{FILEPATH}}",

        // Documents - PDF
        "pdf" => "evince {{FILEPATH}}",
        "djvu" | "djv" => "evince {{FILEPATH}}",
        "epub" | "mobi" | "azw" | "azw3" => "calibre {{FILEPATH}}",
        "fb2" => "calibre {{FILEPATH}}",
        "cbz" | "cbr" | "cb7" => "evince {{FILEPATH}}",

        // Documents - Office
        "doc" | "docx" | "docm" => "libreoffice {{FILEPATH}}",
        "xls" | "xlsx" | "xlsm" | "xlsb" => "libreoffice {{FILEPATH}}",
        "ppt" | "pptx" | "pptm" => "libreoffice {{FILEPATH}}",
        "odt" | "ods" | "odp" | "odg" | "odf" => "libreoffice {{FILEPATH}}",
        "rtf" | "wps" | "wpd" => "libreoffice {{FILEPATH}}",
        "csv" | "tsv" => "libreoffice {{FILEPATH}}",

        // Programming - Systems
        "rs" => "vim {{FILEPATH}}",
        "c" | "h" => "vim {{FILEPATH}}",
        "cpp" | "cc" | "cxx" | "hpp" | "hxx" | "hh" => "vim {{FILEPATH}}",
        "go" => "vim {{FILEPATH}}",
        "zig" => "vim {{FILEPATH}}",
        "asm" | "s" => "vim {{FILEPATH}}",

        // Programming - JVM
        "java" => "vim {{FILEPATH}}",
        "kt" | "kts" => "vim {{FILEPATH}}",
        "scala" | "sc" => "vim {{FILEPATH}}",
        "groovy" | "gradle" => "vim {{FILEPATH}}",
        "clj" | "cljs" | "cljc" | "edn" => "vim {{FILEPATH}}",

        // Programming - .NET
        "cs" => "vim {{FILEPATH}}",
        "fs" | "fsx" | "fsi" => "vim {{FILEPATH}}",
        "vb" => "vim {{FILEPATH}}",

        // Programming - Scripting
        "py" | "pyw" | "pyx" | "pxd" => "vim {{FILEPATH}}",
        "rb" | "erb" | "rake" => "vim {{FILEPATH}}",
        "pl" | "pm" | "pod" => "vim {{FILEPATH}}",
        "php" | "phtml" | "php3" | "php4" | "php5" => "vim {{FILEPATH}}",
        "lua" => "vim {{FILEPATH}}",
        "tcl" => "vim {{FILEPATH}}",
        "r" | "rmd" => "vim {{FILEPATH}}",
        "jl" => "vim {{FILEPATH}}",

        // Programming - Web/JS
        "js" | "mjs" | "cjs" => "vim {{FILEPATH}}",
        "jsx" => "vim {{FILEPATH}}",
        "ts" | "mts" | "cts" => "vim {{FILEPATH}}",
        "tsx" => "vim {{FILEPATH}}",
        "vue" | "svelte" => "vim {{FILEPATH}}",
        "coffee" => "vim {{FILEPATH}}",

        // Programming - Functional
        "hs" | "lhs" => "vim {{FILEPATH}}",
        "ml" | "mli" | "mll" | "mly" => "vim {{FILEPATH}}",
        "ex" | "exs" => "vim {{FILEPATH}}",
        "erl" | "hrl" => "vim {{FILEPATH}}",
        "elm" => "vim {{FILEPATH}}",
        "purs" => "vim {{FILEPATH}}",
        "lisp" | "cl" | "el" | "scm" | "ss" | "rkt" => "vim {{FILEPATH}}",

        // Programming - Other
        "swift" => "vim {{FILEPATH}}",
        "m" | "mm" => "vim {{FILEPATH}}",
        "dart" => "vim {{FILEPATH}}",
        "nim" => "vim {{FILEPATH}}",
        "cr" => "vim {{FILEPATH}}",
        "v" | "vhdl" | "vhd" => "vim {{FILEPATH}}",
        "sv" | "svh" => "vim {{FILEPATH}}",
        "d" => "vim {{FILEPATH}}",
        "pas" | "pp" | "inc" => "vim {{FILEPATH}}",
        "ada" | "adb" | "ads" => "vim {{FILEPATH}}",
        "f" | "f90" | "f95" | "f03" | "f08" | "for" => "vim {{FILEPATH}}",
        "cob" | "cbl" => "vim {{FILEPATH}}",
        "pro" | "pl" => "vim {{FILEPATH}}",

        // Markup/Config - Web
        "html" | "htm" | "xhtml" | "shtml" => "firefox {{FILEPATH}}",
        "css" | "scss" | "sass" | "less" | "styl" => "vim {{FILEPATH}}",

        // Markup/Config - Data
        "json" | "jsonc" | "json5" => "vim {{FILEPATH}}",
        "yaml" | "yml" => "vim {{FILEPATH}}",
        "toml" => "vim {{FILEPATH}}",
        "xml" | "xsl" | "xslt" | "xsd" | "dtd" => "vim {{FILEPATH}}",
        "ini" | "cfg" | "conf" | "config" => "vim {{FILEPATH}}",
        "env" | "properties" => "vim {{FILEPATH}}",
        "plist" => "vim {{FILEPATH}}",

        // Markup/Config - Documentation
        "md" | "markdown" | "mdown" | "mkd" => "vim {{FILEPATH}}",
        "rst" | "rest" => "vim {{FILEPATH}}",
        "adoc" | "asciidoc" => "vim {{FILEPATH}}",
        "tex" | "latex" | "ltx" | "sty" | "cls" => "vim {{FILEPATH}}",
        "org" => "vim {{FILEPATH}}",
        "wiki" | "mediawiki" => "vim {{FILEPATH}}",

        // Text/Logs
        "txt" | "text" => "vim {{FILEPATH}}",
        "log" | "logs" => "vim {{FILEPATH}}",
        "nfo" | "diz" => "vim {{FILEPATH}}",

        // Shell/Scripts
        "sh" | "bash" | "zsh" | "fish" | "ksh" | "csh" | "tcsh" => "vim {{FILEPATH}}",
        "ps1" | "psm1" | "psd1" => "vim {{FILEPATH}}",
        "bat" | "cmd" => "vim {{FILEPATH}}",
        "awk" | "sed" => "vim {{FILEPATH}}",

        // Build/DevOps
        "makefile" | "mk" | "cmake" => "vim {{FILEPATH}}",
        "dockerfile" => "vim {{FILEPATH}}",
        "vagrantfile" => "vim {{FILEPATH}}",
        "jenkinsfile" => "vim {{FILEPATH}}",
        "tf" | "tfvars" | "hcl" => "vim {{FILEPATH}}",
        "nix" => "vim {{FILEPATH}}",

        // Database
        "sql" | "mysql" | "pgsql" | "plsql" => "vim {{FILEPATH}}",
        "db" | "sqlite" | "sqlite3" => "sqlitebrowser {{FILEPATH}}",

        // Archives
        "zip" | "7z" | "rar" | "tar" => "file-roller {{FILEPATH}}",
        "gz" | "bz2" | "xz" | "lz" | "lzma" | "zst" => "file-roller {{FILEPATH}}",
        "tgz" | "tbz2" | "txz" => "file-roller {{FILEPATH}}",
        "cab" | "arj" | "lzh" | "ace" => "file-roller {{FILEPATH}}",
        "deb" | "rpm" => "file-roller {{FILEPATH}}",
        "iso" | "img" | "dmg" => "file-roller {{FILEPATH}}",

        // 3D/CAD
        "blend" => "blender {{FILEPATH}}",
        "obj" | "fbx" | "stl" | "3ds" | "dae" => "blender {{FILEPATH}}",
        "gltf" | "glb" => "blender {{FILEPATH}}",
        "dwg" | "dxf" => "librecad {{FILEPATH}}",
        "step" | "stp" | "iges" | "igs" => "freecad {{FILEPATH}}",

        // Fonts
        "ttf" | "otf" | "woff" | "woff2" | "eot" => "gnome-font-viewer {{FILEPATH}}",

        // Misc binary
        "bin" | "exe" | "dll" | "so" | "dylib" => "hexdump -C {{FILEPATH}} | less",
        "o" | "a" | "lib" => "hexdump -C {{FILEPATH}} | less",
        "class" | "jar" | "war" | "ear" => "file-roller {{FILEPATH}}",
        "pyc" | "pyo" => "hexdump -C {{FILEPATH}} | less",

        // Notebooks
        "ipynb" => "jupyter notebook {{FILEPATH}}",

        // Certificates/Keys
        "pem" | "crt" | "cer" | "key" | "csr" | "p12" | "pfx" => "vim {{FILEPATH}}",

        // Default
        _ => "xdg-open {{FILEPATH}}",
    };
    command.to_string()
}

/// 간결한 입력 다이얼로그 (Find File, Mkdir, Rename)
fn draw_simple_input_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme) {
    let title = match dialog.dialog_type {
        DialogType::Search => " Find File ",
        DialogType::Mkdir => " Create Directory ",
        DialogType::Rename => " Rename ",
        DialogType::Tar => " Create Archive ",
        _ => " Input ",
    };

    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.border))
        .style(Style::default().bg(theme.dialog.bg));

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
        .fg(theme.dialog.input_cursor_fg)
        .bg(theme.dialog.input_cursor_bg)
        .add_modifier(Modifier::SLOW_BLINK);

    // 선택 스타일
    let selection_style = Style::default()
        .fg(theme.dialog.input_cursor_fg)
        .bg(theme.dialog.input_cursor_bg);

    let input_line = if let Some((sel_start, sel_end)) = dialog.selection {
        // 선택 범위가 있는 경우
        let sel_start = sel_start.min(display_chars.len());
        let sel_end = sel_end.min(display_chars.len());
        let before_sel: String = display_chars[..sel_start].iter().collect();
        let selected: String = display_chars[sel_start..sel_end].iter().collect();
        let after_sel: String = display_chars[sel_end..].iter().collect();
        Line::from(vec![
            Span::styled("> ", Style::default().fg(theme.dialog.input_prompt)),
            Span::styled(before_sel, Style::default().fg(theme.dialog.input_text)),
            Span::styled(selected, selection_style),
            Span::styled(after_sel, Style::default().fg(theme.dialog.input_text)),
        ])
    } else {
        Line::from(vec![
            Span::styled("> ", Style::default().fg(theme.dialog.input_prompt)),
            Span::styled(before_cursor, Style::default().fg(theme.dialog.input_text)),
            Span::styled(cursor_char, cursor_style),
            Span::styled(after_cursor, Style::default().fg(theme.dialog.input_text)),
        ])
    };

    // Tar/Mkdir/Rename 다이얼로그의 경우 메시지 표시 (에러 메시지 포함)
    if (dialog.dialog_type == DialogType::Tar
        || dialog.dialog_type == DialogType::Mkdir
        || dialog.dialog_type == DialogType::Rename)
        && !dialog.message.is_empty()
    {
        let message_y = inner.y;
        let message_area = Rect::new(inner.x + 1, message_y, inner.width - 2, 1);
        // Use warning style for error messages (ending with !)
        let message_style = if dialog.message.ends_with('!') {
            Style::default().fg(theme.state.warning).add_modifier(Modifier::BOLD)
        } else {
            Style::default().fg(theme.dialog.text)
        };
        frame.render_widget(
            Paragraph::new(dialog.message.clone()).style(message_style),
            message_area,
        );
        let input_area = Rect::new(inner.x + 1, inner.y + 2, inner.width - 2, 1);
        frame.render_widget(Paragraph::new(input_line), input_area);
    } else {
        // 수직 중앙에 배치
        let y_pos = inner.y + inner.height / 2;
        let input_area = Rect::new(inner.x + 1, y_pos, inner.width - 2, 1);
        frame.render_widget(Paragraph::new(input_line), input_area);
    }
}

fn draw_confirm_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme, title: &str) {
    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.confirm_dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.confirm_dialog.border))
        .style(Style::default().bg(theme.confirm_dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Message
    let message_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(dialog.message.clone())
            .style(Style::default().fg(theme.confirm_dialog.message_text))
            .alignment(ratatui::layout::Alignment::Center),
        message_area,
    );

    // 버튼 스타일
    let selected_style = Style::default()
        .fg(theme.confirm_dialog.button_selected_text)
        .bg(theme.confirm_dialog.button_selected_bg);
    let normal_style = Style::default().fg(theme.confirm_dialog.button_text);

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

/// Error dialog with OK button only
fn draw_error_dialog(frame: &mut Frame, dialog: &Dialog, area: Rect, theme: &Theme, title: &str) {
    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.confirm_dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.confirm_dialog.border))
        .style(Style::default().bg(theme.confirm_dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Message (can be multi-line, wrapped)
    let message_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, inner.height - 4);
    frame.render_widget(
        Paragraph::new(dialog.message.clone())
            .style(Style::default().fg(theme.confirm_dialog.message_text))
            .wrap(ratatui::widgets::Wrap { trim: true }),
        message_area,
    );

    // OK button (always selected)
    let selected_style = Style::default()
        .fg(theme.confirm_dialog.button_selected_text)
        .bg(theme.confirm_dialog.button_selected_bg);

    let buttons = Line::from(vec![
        Span::styled(" OK ", selected_style),
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
        .title_style(Style::default().fg(theme.dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.border))
        .style(Style::default().bg(theme.dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // 레이아웃 Y 좌표 계산 (상대적 위치)
    let message_y = inner.y;
    let input_y = message_y + 2;  // 메시지 아래 1줄 여백 후
    let list_y = input_y + 1;     // 입력창 바로 아래
    let help_y = inner.y + inner.height - 1;  // 하단
    let list_height = help_y.saturating_sub(list_y).saturating_sub(1);  // 목록과 도움말 사이 여백

    // 파일 목록 메시지
    let message_area = Rect::new(inner.x + 1, message_y, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(dialog.message.clone()).style(Style::default().fg(theme.dialog.text)),
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
        .fg(theme.dialog.input_cursor_fg)
        .bg(theme.dialog.input_cursor_bg)
        .add_modifier(Modifier::SLOW_BLINK);

    let input_line = Line::from(vec![
        Span::styled("> ", Style::default().fg(theme.dialog.input_prompt)),
        Span::styled(before_cursor, Style::default().fg(theme.dialog.input_text)),
        Span::styled(cursor_char, cursor_style),
        Span::styled(after_cursor, Style::default().fg(theme.dialog.input_text)),
        Span::styled(&display_preview_after, Style::default().fg(theme.dialog.preview_suffix_text)),
    ]);
    let input_area = Rect::new(inner.x + 1, input_y, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(input_line), input_area);

    // 자동완성 목록
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
                Rect::new(list_x, list_y, list_width, list_height),
                theme,
                is_root_path,
            );
        }
    }

    // 하단 도움말
    let help_line = Line::from(vec![
        Span::styled("Tab", Style::default().fg(theme.dialog.help_key_text).add_modifier(Modifier::BOLD)),
        Span::styled(":complete ", Style::default().fg(theme.dialog.help_label_text)),
        Span::styled("Enter", Style::default().fg(theme.dialog.help_key_text).add_modifier(Modifier::BOLD)),
        Span::styled(":confirm ", Style::default().fg(theme.dialog.help_label_text)),
        Span::styled("Esc", Style::default().fg(theme.dialog.help_key_text).add_modifier(Modifier::BOLD)),
        Span::styled(":cancel", Style::default().fg(theme.dialog.help_label_text)),
    ]);
    let help_area = Rect::new(inner.x + 1, help_y, inner.width - 2, 1);
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
        .title_style(Style::default().fg(theme.dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.border))
        .style(Style::default().bg(theme.dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Prompt
    let prompt_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(
        Paragraph::new(dialog.message.clone()).style(Style::default().fg(theme.dialog.text)),
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
        Span::styled("> ", Style::default().fg(theme.dialog.input_prompt)),
        Span::styled(display_input, Style::default().fg(theme.dialog.input_text)),
        Span::styled("_", Style::default().fg(theme.dialog.input_cursor_bg).add_modifier(Modifier::SLOW_BLINK)),
    ]);
    let input_area = Rect::new(inner.x + 1, inner.y + 3, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(input_line), input_area);

    // Help
    let help = Span::styled("[Enter] Confirm  [Esc] Cancel", Style::default().fg(theme.dialog.help_label_text));
    let help_area = Rect::new(inner.x + 1, inner.y + inner.height - 2, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(help), help_area);
}

/// Go to Path 대화상자 렌더링 (자동완성 목록 및 북마크 포함)
fn draw_goto_dialog(frame: &mut Frame, app: &App, dialog: &Dialog, area: Rect, theme: &Theme) {
    let title = " Go to Path ";

    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.border))
        .style(Style::default().bg(theme.dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // 레이아웃 Y 좌표 계산 (상대적 위치)
    let input_y = inner.y + 1;    // 상단 여백 1줄
    let list_y = input_y + 1;     // 입력창 바로 아래
    let help_y = inner.y + inner.height - 1;  // 하단
    let list_height = help_y.saturating_sub(list_y).saturating_sub(1);  // 목록과 도움말 사이 여백

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
        .fg(theme.dialog.input_cursor_fg)
        .bg(theme.dialog.input_cursor_bg)
        .add_modifier(Modifier::SLOW_BLINK);

    // 선택 스타일
    let selection_style = Style::default()
        .fg(theme.dialog.input_cursor_fg)
        .bg(theme.dialog.input_cursor_bg);

    // 입력 필드 렌더링 (선택 범위 지원)
    let input_line = if let Some((sel_start, sel_end)) = dialog.selection {
        // 선택 범위가 있는 경우
        let sel_start = sel_start.min(display_chars.len());
        let sel_end = sel_end.min(display_chars.len());
        let before_sel: String = display_chars[..sel_start].iter().collect();
        let selected: String = display_chars[sel_start..sel_end].iter().collect();
        let after_sel: String = display_chars[sel_end..].iter().collect();
        Line::from(vec![
            Span::styled("> ", Style::default().fg(theme.dialog.input_prompt)),
            Span::styled(before_sel, Style::default().fg(theme.dialog.input_text)),
            Span::styled(selected, selection_style),
            Span::styled(after_sel, Style::default().fg(theme.dialog.input_text)),
        ])
    } else {
        // 일반 상태: 커서 위치에 따라 분리
        Line::from(vec![
            Span::styled("> ", Style::default().fg(theme.dialog.input_prompt)),
            Span::styled(before_cursor, Style::default().fg(theme.dialog.input_text)),
            Span::styled(cursor_char, cursor_style),
            Span::styled(after_cursor, Style::default().fg(theme.dialog.input_text)),
            Span::styled(&display_preview_after, Style::default().fg(theme.dialog.preview_suffix_text)),  // 흐리게 미리보기
        ])
    };
    let input_area = Rect::new(inner.x + 1, input_y, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(input_line), input_area);

    // 경로 입력 모드 vs 북마크 검색 모드 분기
    let is_path_mode = dialog.input.starts_with('/') || dialog.input.starts_with('~');

    // Help (맨 아래에 표시)
    let help_key_style = Style::default().fg(theme.dialog.help_key_text).add_modifier(Modifier::BOLD);
    let help_label_style = Style::default().fg(theme.dialog.help_label_text);

    if is_path_mode {
        // === 경로 입력 모드: 기존 Go to Path 동작 그대로 ===
        // 자동완성 목록 표시 (prefix 시작 위치에 맞춤)
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
                    Rect::new(list_x, list_y, list_width, list_height),
                    theme,
                    is_root_path,
                );
            }
        }

        // 기존 도움말
        let help_line = if let Some(ref completion) = dialog.completion {
            if completion.visible && !completion.suggestions.is_empty() {
                Line::from(vec![
                    Span::styled("↑↓", help_key_style),
                    Span::styled(":select ", help_label_style),
                    Span::styled("Tab", help_key_style),
                    Span::styled(":complete ", help_label_style),
                    Span::styled("Enter", help_key_style),
                    Span::styled(":go ", help_label_style),
                    Span::styled("Esc", help_key_style),
                    Span::styled(":cancel", help_label_style),
                ])
            } else {
                Line::from(vec![
                    Span::styled("Tab", help_key_style),
                    Span::styled(":complete ", help_label_style),
                    Span::styled("Enter", help_key_style),
                    Span::styled(":go ", help_label_style),
                    Span::styled("Esc", help_key_style),
                    Span::styled(":cancel", help_label_style),
                ])
            }
        } else {
            Line::from(vec![
                Span::styled("Enter", help_key_style),
                Span::styled(":go ", help_label_style),
                Span::styled("Esc", help_key_style),
                Span::styled(":cancel", help_label_style),
            ])
        };
        let help_area = Rect::new(inner.x + 1, help_y, inner.width - 2, 1);
        frame.render_widget(Paragraph::new(help_line), help_area);
    } else {
        // === 북마크 검색 모드: 북마크만 표시 ===
        let filter_lower = dialog.input.to_lowercase();
        let filtered_bookmarks: Vec<&String> = app.settings.bookmarked_path.iter()
            .filter(|p| {
                if filter_lower.is_empty() {
                    true
                } else {
                    fuzzy_match(&p.to_lowercase(), &filter_lower)
                }
            })
            .collect();

        let has_bookmarks = !filtered_bookmarks.is_empty();

        // 목록 영역 (입력 프롬프트 "> "에 맞춤)
        let list_x = inner.x + 1 + 2;  // 패딩 + "> " 프롬프트
        let list_width = inner.width.saturating_sub(4);

        if has_bookmarks {
            // 선택 인덱스를 필터링된 목록 크기에 맞게 조정
            let bookmark_count = filtered_bookmarks.len();
            let selected_idx = dialog.completion.as_ref()
                .map(|c| c.selected_index.min(bookmark_count.saturating_sub(1)))
                .unwrap_or(0);
            draw_bookmark_list(
                frame,
                &filtered_bookmarks,
                selected_idx,
                Rect::new(list_x, list_y, list_width, list_height),
                theme,
            );
        }

        // 북마크 모드 도움말
        let help_line = if has_bookmarks {
            Line::from(vec![
                Span::styled("↑↓", help_key_style),
                Span::styled(":select ", help_label_style),
                Span::styled("Enter", help_key_style),
                Span::styled(":go ", help_label_style),
                Span::styled("Esc", help_key_style),
                Span::styled(":cancel", help_label_style),
            ])
        } else {
            Line::from(vec![
                Span::styled("Enter", help_key_style),
                Span::styled(":go ", help_label_style),
                Span::styled("Esc", help_key_style),
                Span::styled(":cancel", help_label_style),
            ])
        };
        let help_area = Rect::new(inner.x + 1, help_y, inner.width - 2, 1);
        frame.render_widget(Paragraph::new(help_line), help_area);
    }
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
        FileOperationType::Tar => " Creating Archive ",
        FileOperationType::Untar => " Extracting Archive ",
    };

    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.border))
        .style(Style::default().bg(theme.dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Show spinner and preparing message during preparation phase
    if progress.is_preparing {
        // Spinner characters that rotate based on time
        let spinner_chars = ['|', '/', '-', '\\'];
        let spinner_idx = (std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() / 100) as usize % spinner_chars.len();
        let spinner = spinner_chars[spinner_idx];

        let preparing_line = Line::from(vec![
            Span::styled(format!("{} ", spinner), Style::default().fg(theme.dialog.progress_bar_fill)),
            Span::styled(&progress.preparing_message, Style::default().fg(theme.dialog.progress_value_text)),
        ]);
        let preparing_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
        frame.render_widget(Paragraph::new(preparing_line), preparing_area);

        return;
    }

    // Current file name (truncated if needed)
    let max_filename_len = (inner.width - 8) as usize;
    let current_file = if progress.current_file.len() > max_filename_len {
        format!("...{}", &progress.current_file[progress.current_file.len().saturating_sub(max_filename_len - 3)..])
    } else {
        progress.current_file.clone()
    };

    let file_line = Line::from(vec![
        Span::styled("File: ", Style::default().fg(theme.dialog.progress_label_text)),
        Span::styled(current_file, Style::default().fg(theme.dialog.progress_value_text)),
    ]);
    let file_area = Rect::new(inner.x + 1, inner.y, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(file_line), file_area);

    // Current file progress bar
    let bar_width = (inner.width - 8) as usize;
    let file_progress_percent = (progress.current_file_progress * 100.0) as u8;
    let file_filled = (progress.current_file_progress * bar_width as f64) as usize;
    let file_empty = bar_width.saturating_sub(file_filled);
    let file_bar_fill = "█".repeat(file_filled);
    let file_bar_empty = "░".repeat(file_empty);

    let file_bar_line = Line::from(vec![
        Span::styled(file_bar_fill, Style::default().fg(theme.dialog.progress_bar_fill)),
        Span::styled(file_bar_empty, Style::default().fg(theme.dialog.progress_bar_empty)),
        Span::styled(format!(" {:3}%", file_progress_percent), Style::default().fg(theme.dialog.progress_percent_text)),
    ]);
    let file_bar_area = Rect::new(inner.x + 1, inner.y + 1, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(file_bar_line), file_bar_area);

    // Total progress info
    let total_info = if progress.operation_type == FileOperationType::Tar
        || progress.operation_type == FileOperationType::Untar {
        if progress.total_files > 0 {
            format!("{}/{} files", progress.completed_files, progress.total_files)
        } else {
            format!("{} files processed", progress.completed_files)
        }
    } else {
        format!(
            "{}/{} files ({}/{})",
            progress.completed_files,
            progress.total_files,
            format_size(progress.completed_bytes),
            format_size(progress.total_bytes),
        )
    };
    let total_line = Line::from(Span::styled(total_info, Style::default().fg(theme.dialog.progress_label_text)));
    let total_area = Rect::new(inner.x + 1, inner.y + 3, inner.width - 2, 1);
    frame.render_widget(Paragraph::new(total_line), total_area);

    // Total progress bar - use determinate style if we know total count
    let use_determinate = progress.total_files > 0;

    if use_determinate {
        let total_progress = progress.overall_progress();
        let total_progress_percent = (total_progress * 100.0) as u8;
        let total_filled = (total_progress * bar_width as f64) as usize;
        let total_empty = bar_width.saturating_sub(total_filled);
        let total_bar_fill = "█".repeat(total_filled);
        let total_bar_empty = "░".repeat(total_empty);

        let total_bar_line = Line::from(vec![
            Span::styled(total_bar_fill, Style::default().fg(theme.dialog.progress_bar_fill)),
            Span::styled(total_bar_empty, Style::default().fg(theme.dialog.progress_bar_empty)),
            Span::styled(format!(" {:3}%", total_progress_percent), Style::default().fg(theme.dialog.progress_percent_text)),
        ]);
        let total_bar_area = Rect::new(inner.x + 1, inner.y + 4, inner.width - 2, 1);
        frame.render_widget(Paragraph::new(total_bar_line), total_bar_area);
    }
    // Indeterminate progress: don't show progress bar or percentage
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
        .title_style(Style::default().fg(theme.dialog.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.border))
        .style(Style::default().bg(theme.dialog.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Get current conflict info
    let (_, _, display_name) = state.conflicts.get(state.current_index)
        .cloned()
        .unwrap_or_else(|| (PathBuf::new(), PathBuf::new(), String::new()));

    // Line 1: "File already exists:"
    let label_area = Rect::new(inner.x + 2, inner.y + 1, inner.width - 4, 1);
    frame.render_widget(
        Paragraph::new("File already exists:").style(Style::default().fg(theme.dialog.text)),
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
        Paragraph::new(truncated_name).style(Style::default().fg(theme.dialog.conflict_filename_text)),
        filename_area,
    );

    // Line 3: progress indicator "(1 of 3 conflicts)" or "(1 of 1 conflict)"
    let total = state.conflicts.len();
    let current = state.current_index + 1;
    let conflict_word = if total == 1 { "conflict" } else { "conflicts" };
    let progress_text = format!("({} of {} {})", current, total, conflict_word);
    let progress_area = Rect::new(inner.x + 2, inner.y + 3, inner.width - 4, 1);
    frame.render_widget(
        Paragraph::new(progress_text).style(Style::default().fg(theme.dialog.conflict_count_text)),
        progress_area,
    );

    // Buttons - 2 rows of 2 buttons each
    // Row 1: Overwrite (0), Skip (1)
    // Row 2: Overwrite All (2), Skip All (3)
    let selected = dialog.selected_button;

    // Calculate button positions
    let button_y1 = inner.y + 5;
    let button_y2 = inner.y + 6;
    let col1_x = inner.x + 4;
    let col2_x = inner.x + inner.width / 2 + 2;

    // Style helpers
    let key_fg = theme.dialog.conflict_shortcut_text;
    let get_styles = |is_selected: bool| {
        let bg = if is_selected { theme.dialog.button_selected_bg } else { theme.dialog.bg };
        let fg = if is_selected { theme.dialog.button_selected_text } else { theme.dialog.button_text };
        (
            Style::default().fg(fg).bg(bg),
            Style::default().fg(key_fg).bg(bg).add_modifier(Modifier::BOLD),
        )
    };

    // Row 1: Overwrite, Skip
    let (style, key_style) = get_styles(selected == 0);
    let btn_overwrite = Line::from(vec![
        Span::styled(" ", style),
        Span::styled("O", key_style),
        Span::styled("verwrite ", style),
    ]);
    frame.render_widget(Paragraph::new(btn_overwrite), Rect::new(col1_x, button_y1, 11, 1));

    let (style, key_style) = get_styles(selected == 1);
    let btn_skip = Line::from(vec![
        Span::styled(" ", style),
        Span::styled("S", key_style),
        Span::styled("kip ", style),
    ]);
    frame.render_widget(Paragraph::new(btn_skip), Rect::new(col2_x, button_y1, 6, 1));

    // Row 2: Overwrite All, Skip All
    let (style, key_style) = get_styles(selected == 2);
    let btn_overwrite_all = Line::from(vec![
        Span::styled(" Overwrite ", style),
        Span::styled("A", key_style),
        Span::styled("ll ", style),
    ]);
    frame.render_widget(Paragraph::new(btn_overwrite_all), Rect::new(col1_x, button_y2, 15, 1));

    let (style, key_style) = get_styles(selected == 3);
    let btn_skip_all = Line::from(vec![
        Span::styled(" Skip A", style),
        Span::styled("l", key_style),
        Span::styled("l ", style),
    ]);
    frame.render_widget(Paragraph::new(btn_skip_all), Rect::new(col2_x, button_y2, 10, 1));
}

/// Tar exclude confirmation dialog
fn draw_tar_exclude_confirm_dialog(
    frame: &mut Frame,
    dialog: &Dialog,
    state: &crate::ui::app::TarExcludeState,
    area: Rect,
    theme: &Theme,
) {
    let block = Block::default()
        .title(" Exclude Unsafe Symlinks ")
        .title_style(Style::default().fg(theme.dialog.tar_exclude_title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.tar_exclude_border))
        .style(Style::default().bg(theme.dialog.tar_exclude_bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Message line
    let msg = format!(
        "Found {} unsafe symlink(s) that will be excluded:",
        state.excluded_paths.len()
    );
    let msg_area = Rect::new(inner.x + 2, inner.y + 1, inner.width - 4, 1);
    frame.render_widget(
        Paragraph::new(msg).style(Style::default().fg(theme.dialog.tar_exclude_message_text)),
        msg_area,
    );

    // List of excluded paths (scrollable)
    let list_height = (inner.height - 5) as usize; // Reserve space for message and buttons
    let visible_paths: Vec<&String> = state.excluded_paths
        .iter()
        .skip(state.scroll_offset)
        .take(list_height)
        .collect();

    for (i, path) in visible_paths.iter().enumerate() {
        let y = inner.y + 2 + i as u16;
        let display_path = if path.len() > (inner.width - 6) as usize {
            format!("  ...{}", &path[path.len().saturating_sub((inner.width - 9) as usize)..])
        } else {
            format!("  {}", path)
        };
        frame.render_widget(
            Paragraph::new(display_path).style(Style::default().fg(theme.dialog.tar_exclude_path_text)),
            Rect::new(inner.x + 2, y, inner.width - 4, 1),
        );
    }

    // Scroll indicator if needed
    if state.excluded_paths.len() > list_height {
        let scroll_info = format!(
            "[{}-{}/{}]",
            state.scroll_offset + 1,
            (state.scroll_offset + list_height).min(state.excluded_paths.len()),
            state.excluded_paths.len()
        );
        let scroll_area = Rect::new(
            inner.x + inner.width - scroll_info.len() as u16 - 2,
            inner.y + 1,
            scroll_info.len() as u16,
            1,
        );
        frame.render_widget(
            Paragraph::new(scroll_info).style(Style::default().fg(theme.dialog.tar_exclude_scroll_info)),
            scroll_area,
        );
    }

    // Buttons: Proceed / Cancel
    let selected = dialog.selected_button;
    let button_y = inner.y + inner.height - 2;

    let normal_style = Style::default().fg(theme.dialog.tar_exclude_button_text);
    let selected_style = Style::default()
        .fg(theme.dialog.tar_exclude_button_selected_text)
        .bg(theme.dialog.tar_exclude_button_selected_bg);

    let btn_proceed = " Proceed ";
    let btn_cancel = " Cancel ";

    let proceed_style = if selected == 0 { selected_style } else { normal_style };
    let cancel_style = if selected == 1 { selected_style } else { normal_style };

    let btn_width = btn_proceed.len() + btn_cancel.len() + 4;
    let btn_start = inner.x + (inner.width - btn_width as u16) / 2;

    frame.render_widget(
        Paragraph::new(btn_proceed).style(proceed_style),
        Rect::new(btn_start, button_y, btn_proceed.len() as u16, 1),
    );
    frame.render_widget(
        Paragraph::new(btn_cancel).style(cancel_style),
        Rect::new(btn_start + btn_proceed.len() as u16 + 4, button_y, btn_cancel.len() as u16, 1),
    );
}

/// Copy/Move exclude confirmation dialog
fn draw_copy_exclude_confirm_dialog(
    frame: &mut Frame,
    dialog: &Dialog,
    state: &crate::ui::app::CopyExcludeState,
    area: Rect,
    theme: &Theme,
) {
    let title = if state.is_move {
        " Move: Sensitive Symlinks "
    } else {
        " Copy: Sensitive Symlinks "
    };
    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.dialog.tar_exclude_title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.dialog.tar_exclude_border))
        .style(Style::default().bg(theme.dialog.tar_exclude_bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    // Message line
    let msg = format!(
        "Found {} symlink(s) pointing to sensitive paths:",
        state.excluded_paths.len()
    );
    let msg_area = Rect::new(inner.x + 2, inner.y + 1, inner.width - 4, 1);
    frame.render_widget(
        Paragraph::new(msg).style(Style::default().fg(theme.dialog.tar_exclude_message_text)),
        msg_area,
    );

    // List of excluded paths (scrollable)
    let list_height = (inner.height - 5) as usize;
    let visible_paths: Vec<&String> = state.excluded_paths
        .iter()
        .skip(state.scroll_offset)
        .take(list_height)
        .collect();

    for (i, path) in visible_paths.iter().enumerate() {
        let y = inner.y + 2 + i as u16;
        let display_path = if path.len() > (inner.width - 6) as usize {
            format!("  ...{}", &path[path.len().saturating_sub((inner.width - 9) as usize)..])
        } else {
            format!("  {}", path)
        };
        frame.render_widget(
            Paragraph::new(display_path).style(Style::default().fg(theme.dialog.tar_exclude_path_text)),
            Rect::new(inner.x + 2, y, inner.width - 4, 1),
        );
    }

    // Scroll indicator if needed
    if state.excluded_paths.len() > list_height {
        let scroll_info = format!(
            "[{}-{}/{}]",
            state.scroll_offset + 1,
            (state.scroll_offset + list_height).min(state.excluded_paths.len()),
            state.excluded_paths.len()
        );
        let scroll_area = Rect::new(
            inner.x + inner.width - scroll_info.len() as u16 - 2,
            inner.y + 1,
            scroll_info.len() as u16,
            1,
        );
        frame.render_widget(
            Paragraph::new(scroll_info).style(Style::default().fg(theme.dialog.tar_exclude_scroll_info)),
            scroll_area,
        );
    }

    // Buttons: Proceed / Cancel
    let selected = dialog.selected_button;
    let button_y = inner.y + inner.height - 2;

    let normal_style = Style::default().fg(theme.dialog.tar_exclude_button_text);
    let selected_style = Style::default()
        .fg(theme.dialog.tar_exclude_button_selected_text)
        .bg(theme.dialog.tar_exclude_button_selected_bg);

    let btn_proceed = " Proceed ";
    let btn_cancel = " Cancel ";

    let proceed_style = if selected == 0 { selected_style } else { normal_style };
    let cancel_style = if selected == 1 { selected_style } else { normal_style };

    let btn_width = btn_proceed.len() + btn_cancel.len() + 4;
    let btn_start = inner.x + (inner.width - btn_width as u16) / 2;

    frame.render_widget(
        Paragraph::new(btn_proceed).style(proceed_style),
        Rect::new(btn_start, button_y, btn_proceed.len() as u16, 1),
    );
    frame.render_widget(
        Paragraph::new(btn_cancel).style(cancel_style),
        Rect::new(btn_start + btn_proceed.len() as u16 + 4, button_y, btn_cancel.len() as u16, 1),
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

/// 북마크 목록 렌더링 (Go to Path 다이얼로그용)
fn draw_bookmark_list(
    frame: &mut Frame,
    bookmarks: &[&String],
    selected_index: usize,
    area: Rect,
    theme: &Theme,
) {
    let max_visible = area.height.min(8) as usize;
    let total = bookmarks.len();

    // 스크롤 계산: 선택된 항목이 항상 보이도록
    let scroll_offset = if total <= max_visible || selected_index < max_visible / 2 {
        0
    } else if selected_index >= total - max_visible / 2 {
        total.saturating_sub(max_visible)
    } else {
        selected_index.saturating_sub(max_visible / 2)
    };

    let visible_items: Vec<&&String> = bookmarks
        .iter()
        .skip(scroll_offset)
        .take(max_visible)
        .collect();

    let selected_style = Style::default()
        .bg(theme.dialog.autocomplete_selected_bg)
        .fg(theme.dialog.autocomplete_selected_text)
        .add_modifier(Modifier::BOLD);
    let normal_style = Style::default().fg(theme.dialog.autocomplete_directory_text);

    for (i, bookmark) in visible_items.iter().enumerate() {
        let actual_index = scroll_offset + i;
        let is_selected = actual_index == selected_index;

        let style = if is_selected {
            selected_style
        } else {
            normal_style
        };

        // 경로 표시 (너무 길면 앞부분 생략) - 문자 단위로 처리
        let max_width = area.width as usize;
        let chars: Vec<char> = bookmark.chars().collect();
        let char_count = chars.len();
        let display_path = if char_count > max_width {
            let suffix_len = max_width.saturating_sub(3);
            let start = char_count.saturating_sub(suffix_len);
            format!("...{}", chars[start..].iter().collect::<String>())
        } else {
            bookmark.to_string()
        };

        // 전체 라인을 선택 스타일로 채우기
        let padded = format!("{:<width$}", display_path, width = max_width);
        let line = Line::from(Span::styled(padded, style));

        let y = area.y + i as u16;
        if y < area.y + area.height {
            let item_area = Rect::new(area.x, y, area.width, 1);
            frame.render_widget(Paragraph::new(line), item_area);
        }
    }

    // 스크롤 인디케이터 (오른쪽에 표시)
    if total > max_visible {
        let scroll_info = format!("[{}/{}]", selected_index + 1, total);
        let info_len = scroll_info.len() as u16;
        let info_x = area.x + area.width.saturating_sub(info_len + 1);
        let info_y = area.y;
        if info_x >= area.x {
            frame.render_widget(
                Paragraph::new(scroll_info).style(Style::default().fg(theme.dialog.autocomplete_scroll_info)),
                Rect::new(info_x, info_y, info_len, 1),
            );
        }
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
        .bg(theme.dialog.autocomplete_selected_bg)
        .fg(theme.dialog.autocomplete_selected_text)
        .add_modifier(Modifier::BOLD);
    let dir_style = Style::default().fg(theme.dialog.autocomplete_directory_text);
    let file_style = Style::default().fg(theme.dialog.autocomplete_text);

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
            Paragraph::new(Span::styled(scroll_info, Style::default().fg(theme.dialog.autocomplete_scroll_info))),
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
            DialogType::LargeFileConfirm => {
                match code {
                    KeyCode::Char('y') | KeyCode::Char('Y') => {
                        app.dialog = None;
                        app.execute_open_large_file();
                    }
                    KeyCode::Char('n') | KeyCode::Char('N') | KeyCode::Esc => {
                        app.dialog = None;
                        app.pending_large_file = None;
                    }
                    KeyCode::Left | KeyCode::Right | KeyCode::Tab => {
                        dialog.selected_button = 1 - dialog.selected_button;
                    }
                    KeyCode::Enter => {
                        if dialog.selected_button == 0 {
                            app.dialog = None;
                            app.execute_open_large_file();
                        } else {
                            app.dialog = None;
                            app.pending_large_file = None;
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
            DialogType::TarExcludeConfirm => {
                return handle_tar_exclude_confirm_input(app, code);
            }
            DialogType::CopyExcludeConfirm => {
                return handle_copy_exclude_confirm_input(app, code);
            }
            DialogType::Settings => {
                return handle_settings_dialog_input(app, code);
            }
            DialogType::ExtensionHandlerError => {
                // Simple error dialog - any key closes it
                match code {
                    KeyCode::Enter | KeyCode::Esc | KeyCode::Char(_) => {
                        app.dialog = None;
                    }
                    _ => {}
                }
            }
            DialogType::BinaryFileHandler => {
                return handle_binary_file_handler_input(app, code);
            }
            _ => {
                // selection 상태에서의 특수 처리
                if let Some((sel_start, sel_end)) = dialog.selection {
                    match code {
                        KeyCode::Char(c) => {
                            // 선택 범위 삭제 후 새 문자 입력
                            let mut chars: Vec<char> = dialog.input.chars().collect();
                            chars.drain(sel_start..sel_end);
                            chars.insert(sel_start, c);
                            dialog.input = chars.into_iter().collect();
                            dialog.cursor_pos = sel_start + 1;
                            dialog.selection = None;
                            return false;
                        }
                        KeyCode::Backspace | KeyCode::Delete => {
                            // 선택 범위 삭제
                            let mut chars: Vec<char> = dialog.input.chars().collect();
                            chars.drain(sel_start..sel_end);
                            dialog.input = chars.into_iter().collect();
                            dialog.cursor_pos = sel_start;
                            dialog.selection = None;
                            return false;
                        }
                        KeyCode::Left | KeyCode::Home => {
                            // 선택 해제, 커서를 선택 시작으로
                            dialog.selection = None;
                            dialog.cursor_pos = sel_start;
                            return false;
                        }
                        KeyCode::Right | KeyCode::End => {
                            // 선택 해제, 커서를 선택 끝으로
                            dialog.selection = None;
                            dialog.cursor_pos = sel_end;
                            return false;
                        }
                        KeyCode::Esc => {
                            app.dialog = None;
                            return false;
                        }
                        KeyCode::Enter => {
                            // Enter는 선택 해제 후 계속 진행
                            dialog.selection = None;
                        }
                        _ => {
                            dialog.selection = None;
                        }
                    }
                }

                match code {
                    KeyCode::Enter => {
                        let input = dialog.input.clone();
                        let dialog_type = dialog.dialog_type;

                        // For Tar dialog, check if archive already exists before closing
                        if dialog_type == DialogType::Tar && !input.trim().is_empty() {
                            // Get path before modifying dialog
                            let current_path = app.active_panel().path.clone();
                            let archive_path = current_path.join(&input);
                            if archive_path.exists() {
                                // Update dialog message to show error, keep dialog open
                                if let Some(ref mut d) = app.dialog {
                                    d.message = format!("'{}' already exists!", input);
                                }
                                return false;
                            }
                        }

                        // For Rename dialog, check if target file already exists
                        if dialog_type == DialogType::Rename && !input.trim().is_empty() {
                            let current_path = app.active_panel().path.clone();
                            let new_path = current_path.join(&input);
                            if new_path.exists() {
                                if let Some(ref mut d) = app.dialog {
                                    d.message = format!("'{}' already exists!", input);
                                }
                                return false;
                            }
                        }

                        // For Mkdir dialog, check if directory already exists
                        if dialog_type == DialogType::Mkdir && !input.trim().is_empty() {
                            let current_path = app.active_panel().path.clone();
                            let new_path = current_path.join(&input);
                            if new_path.exists() {
                                if let Some(ref mut d) = app.dialog {
                                    d.message = format!("'{}' already exists!", input);
                                }
                                return false;
                            }
                        }

                        app.dialog = None;
                        if !input.trim().is_empty() {
                            match dialog_type {
                                DialogType::Mkdir => app.execute_mkdir(&input),
                                DialogType::Rename => app.execute_rename(&input),
                                DialogType::Tar => app.execute_tar(&input),
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
        // ' 키는 항상 북마크 토글
        if code == KeyCode::Char('\'') {
            app.dialog = None;
            app.toggle_bookmark();
            return false;
        }

        // selection 상태에서의 특수 처리 (모드 분기 이전에 처리)
        if dialog.selection.is_some() {
            match code {
                KeyCode::Char(c) => {
                    // 선택 범위 삭제 후 새 문자 입력
                    dialog.input.clear();
                    dialog.cursor_pos = 0;
                    dialog.selection = None;
                    if let Some(ref mut completion) = dialog.completion {
                        completion.visible = false;
                        completion.suggestions.clear();
                        completion.selected_index = 0;
                    }

                    // 새 문자 처리
                    if c == '~' {
                        if let Some(home) = dirs::home_dir() {
                            dialog.input = format!("{}/", home.display());
                            dialog.cursor_pos = dialog.input.chars().count();
                            update_path_suggestions(dialog);
                        }
                    } else if c == '/' {
                        dialog.input = "/".to_string();
                        dialog.cursor_pos = 1;
                        update_path_suggestions(dialog);
                    } else {
                        dialog.input = c.to_string();
                        dialog.cursor_pos = 1;
                        // 북마크 모드로 전환됨 - 자동완성 불필요
                    }
                    return false;
                }
                KeyCode::Backspace | KeyCode::Delete => {
                    // 선택 범위 삭제
                    dialog.input.clear();
                    dialog.cursor_pos = 0;
                    dialog.selection = None;
                    if let Some(ref mut completion) = dialog.completion {
                        completion.visible = false;
                        completion.suggestions.clear();
                        completion.selected_index = 0;
                    }
                    return false;
                }
                KeyCode::Left => {
                    // 선택 해제, 커서 맨 앞으로
                    dialog.selection = None;
                    dialog.cursor_pos = 0;
                    return false;
                }
                KeyCode::Right | KeyCode::End => {
                    // 선택 해제, 커서 맨 뒤로
                    dialog.selection = None;
                    dialog.cursor_pos = dialog.input.chars().count();
                    return false;
                }
                KeyCode::Home => {
                    // 선택 해제, 커서 맨 앞으로
                    dialog.selection = None;
                    dialog.cursor_pos = 0;
                    return false;
                }
                KeyCode::Esc => {
                    // 다이얼로그 닫기
                    app.dialog = None;
                    return false;
                }
                _ => {
                    // 다른 키는 선택 해제만
                    dialog.selection = None;
                }
            }
        }

        // 경로 모드 vs 북마크 모드 결정 (selection 처리 후 재계산)
        let is_path_mode = dialog.input.starts_with('/') || dialog.input.starts_with('~');

        if is_path_mode {
            // === 경로 입력 모드: 기존 Go to Path 동작 그대로 ===
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
                        // 존재하지 않는 경로 - 다이얼로그 유지
                        if let Some(ref mut completion) = dialog.completion {
                            completion.visible = false;
                            completion.suggestions.clear();
                        }
                        app.show_message(&format!("Path not found: {}", input));
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
                        if prev_char != Some('/') || dialog.input.is_empty() {
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
        } else {
            // === 북마크 검색 모드 ===
            let filter_lower = dialog.input.to_lowercase();
            let filtered_bookmarks: Vec<String> = app.settings.bookmarked_path.iter()
                .filter(|p| {
                    if filter_lower.is_empty() {
                        true
                    } else {
                        fuzzy_match(&p.to_lowercase(), &filter_lower)
                    }
                })
                .cloned()
                .collect();
            let bookmark_count = filtered_bookmarks.len();
            let has_bookmarks = bookmark_count > 0;

            // 선택 인덱스를 필터링된 목록 크기에 맞게 조정
            let selected_idx = dialog.completion.as_ref()
                .map(|c| c.selected_index.min(bookmark_count.saturating_sub(1)))
                .unwrap_or(0);

            match code {
                KeyCode::Tab | KeyCode::Enter => {
                    if has_bookmarks {
                        // 선택된 북마크로 이동
                        if let Some(bookmark) = filtered_bookmarks.get(selected_idx) {
                            let path = PathBuf::from(bookmark);
                            if path.is_dir() {
                                app.dialog = None;
                                app.active_panel_mut().path = path;
                                app.active_panel_mut().load_files();
                                app.show_message(&format!("Moved to: {}", bookmark));
                                return false;
                            } else {
                                app.show_message(&format!("Path not found: {}", bookmark));
                            }
                        }
                    }
                }
                KeyCode::BackTab | KeyCode::Up => {
                    if has_bookmarks {
                        if let Some(ref mut completion) = dialog.completion {
                            if completion.selected_index == 0 {
                                completion.selected_index = bookmark_count - 1;
                            } else {
                                completion.selected_index -= 1;
                            }
                        }
                    }
                }
                KeyCode::Down => {
                    if has_bookmarks {
                        if let Some(ref mut completion) = dialog.completion {
                            completion.selected_index = (completion.selected_index + 1) % bookmark_count;
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
                    // 선택 인덱스 리셋
                    if let Some(ref mut completion) = dialog.completion {
                        completion.selected_index = 0;
                    }
                }
                KeyCode::Delete => {
                    let char_count = dialog.input.chars().count();
                    if dialog.cursor_pos < char_count {
                        let mut chars: Vec<char> = dialog.input.chars().collect();
                        chars.remove(dialog.cursor_pos);
                        dialog.input = chars.into_iter().collect();
                    }
                    // 선택 인덱스 리셋
                    if let Some(ref mut completion) = dialog.completion {
                        completion.selected_index = 0;
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
                    // '/' 또는 '~' 입력 시 경로 모드로 전환
                    if c == '/' || c == '~' {
                        if c == '~' {
                            if let Some(home) = dirs::home_dir() {
                                dialog.input = format!("{}/", home.display());
                                dialog.cursor_pos = dialog.input.chars().count();
                                update_path_suggestions(dialog);
                            }
                        } else {
                            dialog.input = "/".to_string();
                            dialog.cursor_pos = 1;
                            update_path_suggestions(dialog);
                        }
                    } else {
                        let mut chars: Vec<char> = dialog.input.chars().collect();
                        chars.insert(dialog.cursor_pos, c);
                        dialog.input = chars.into_iter().collect();
                        dialog.cursor_pos += 1;
                    }
                    // 선택 인덱스 리셋
                    if let Some(ref mut completion) = dialog.completion {
                        completion.selected_index = 0;
                    }
                }
                _ => {}
            }
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

/// Handle tar exclude confirmation dialog input
fn handle_tar_exclude_confirm_input(app: &mut App, code: KeyCode) -> bool {
    if let Some(ref mut dialog) = app.dialog {
        match code {
            KeyCode::Left | KeyCode::Right | KeyCode::Tab | KeyCode::BackTab => {
                // Toggle between Proceed (0) and Cancel (1)
                dialog.selected_button = if dialog.selected_button == 0 { 1 } else { 0 };
            }
            KeyCode::Up => {
                // Scroll up in the list
                if let Some(ref mut state) = app.tar_exclude_state {
                    if state.scroll_offset > 0 {
                        state.scroll_offset -= 1;
                    }
                }
            }
            KeyCode::Down => {
                // Scroll down in the list
                if let Some(ref mut state) = app.tar_exclude_state {
                    if state.scroll_offset + 8 < state.excluded_paths.len() {
                        state.scroll_offset += 1;
                    }
                }
            }
            KeyCode::Enter => {
                if dialog.selected_button == 0 {
                    // Proceed - execute tar with exclusions
                    if let Some(state) = app.tar_exclude_state.take() {
                        app.dialog = None;
                        app.execute_tar_with_excludes(
                            &state.archive_name,
                            &state.files,
                            &state.excluded_paths,
                        );
                    }
                } else {
                    // Cancel
                    app.tar_exclude_state = None;
                    app.dialog = None;
                    app.show_message("Tar operation cancelled");
                }
                return false;
            }
            KeyCode::Esc => {
                // Cancel
                app.tar_exclude_state = None;
                app.dialog = None;
                app.show_message("Tar operation cancelled");
                return false;
            }
            _ => {}
        }
    }
    false
}

/// Handle copy exclude confirmation dialog input
fn handle_copy_exclude_confirm_input(app: &mut App, code: KeyCode) -> bool {
    if let Some(ref mut dialog) = app.dialog {
        match code {
            KeyCode::Left | KeyCode::Right | KeyCode::Tab | KeyCode::BackTab => {
                dialog.selected_button = if dialog.selected_button == 0 { 1 } else { 0 };
            }
            KeyCode::Up => {
                if let Some(ref mut state) = app.copy_exclude_state {
                    if state.scroll_offset > 0 {
                        state.scroll_offset -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Some(ref mut state) = app.copy_exclude_state {
                    if state.scroll_offset + 8 < state.excluded_paths.len() {
                        state.scroll_offset += 1;
                    }
                }
            }
            KeyCode::Enter => {
                if dialog.selected_button == 0 {
                    // Proceed - execute copy/move (skip symlink check)
                    if let Some(state) = app.copy_exclude_state.take() {
                        app.dialog = None;
                        if state.is_move {
                            app.execute_move_to_with_progress_internal(&state.target_path);
                        } else {
                            app.execute_copy_to_with_progress_internal(&state.target_path);
                        }
                    }
                } else {
                    // Cancel
                    let is_move = app.copy_exclude_state.as_ref().map(|s| s.is_move).unwrap_or(false);
                    app.copy_exclude_state = None;
                    app.dialog = None;
                    app.show_message(if is_move { "Move operation cancelled" } else { "Copy operation cancelled" });
                }
                return false;
            }
            KeyCode::Esc => {
                let is_move = app.copy_exclude_state.as_ref().map(|s| s.is_move).unwrap_or(false);
                app.copy_exclude_state = None;
                app.dialog = None;
                app.show_message(if is_move { "Move operation cancelled" } else { "Copy operation cancelled" });
                return false;
            }
            _ => {}
        }
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

/// Handle settings dialog input
fn handle_settings_dialog_input(app: &mut App, code: KeyCode) -> bool {
    match code {
        KeyCode::Esc => {
            app.cancel_settings_dialog();
        }
        KeyCode::Enter => {
            app.apply_settings_from_dialog();
        }
        KeyCode::Left => {
            if let Some(ref mut state) = app.settings_state {
                state.prev_theme();
                // Apply theme immediately for preview
                let theme_name = state.current_theme();
                app.theme = crate::ui::theme::Theme::load(theme_name);
            }
        }
        KeyCode::Right | KeyCode::Char(' ') => {
            if let Some(ref mut state) = app.settings_state {
                state.next_theme();
                // Apply theme immediately for preview
                let theme_name = state.current_theme();
                app.theme = crate::ui::theme::Theme::load(theme_name);
            }
        }
        _ => {}
    }
    false
}

/// Handle input for binary file handler dialog
fn handle_binary_file_handler_input(app: &mut App, code: KeyCode) -> bool {
    let dialog = match app.dialog.as_mut() {
        Some(d) => d,
        None => return false,
    };

    match code {
        KeyCode::Esc => {
            // Cancel - close dialog without saving
            app.dialog = None;
            app.pending_binary_file = None;
        }
        KeyCode::Enter => {
            // Confirm - save/remove handler
            let input = dialog.input.trim().to_string();
            let is_edit_mode = dialog.selected_button == 1;

            if let Some((path, extension)) = app.pending_binary_file.take() {
                if !extension.is_empty() {
                    let ext_lower = extension.to_lowercase();

                    if input.is_empty() {
                        // Empty input - remove handler (only meaningful in edit mode)
                        if is_edit_mode {
                            app.settings.extension_handler.remove(&ext_lower);
                            app.message = Some(format!("Handler removed for .{}", ext_lower));
                            app.message_timer = 30;

                            // Save settings
                            if let Err(e) = app.settings.save() {
                                app.message = Some(format!("Failed to save settings: {}", e));
                                app.message_timer = 30;
                            }
                        }
                        // In set mode with empty input, just close without action
                    } else {
                        // Non-empty input - add or update handler
                        app.settings.extension_handler
                            .entry(ext_lower.clone())
                            .or_insert_with(Vec::new)
                            .insert(0, input.clone()); // Insert at front as first choice

                        // Save settings
                        if let Err(e) = app.settings.save() {
                            app.message = Some(format!("Failed to save settings: {}", e));
                            app.message_timer = 30;
                        }

                        // Close dialog and try to execute the handler on the file
                        app.dialog = None;
                        if let Err(error_msg) = app.try_extension_handler(&path) {
                            app.show_extension_handler_error(&error_msg);
                        }
                        return false;
                    }
                }
            }
            app.dialog = None;
        }
        KeyCode::Char(c) => {
            let mut chars: Vec<char> = dialog.input.chars().collect();
            chars.insert(dialog.cursor_pos, c);
            dialog.input = chars.into_iter().collect();
            dialog.cursor_pos += 1;
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
            let chars: Vec<char> = dialog.input.chars().collect();
            if dialog.cursor_pos < chars.len() {
                let mut chars = chars;
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
            let len = dialog.input.chars().count();
            if dialog.cursor_pos < len {
                dialog.cursor_pos += 1;
            }
        }
        KeyCode::Home => {
            dialog.cursor_pos = 0;
        }
        KeyCode::End => {
            dialog.cursor_pos = dialog.input.chars().count();
        }
        _ => {}
    }
    false
}

/// Draw settings dialog
fn draw_settings_dialog(frame: &mut Frame, state: &SettingsState, area: Rect, theme: &Theme) {
    let block = Block::default()
        .title(" Settings ")
        .title_style(Style::default().fg(theme.settings.title).add_modifier(Modifier::BOLD))
        .borders(Borders::ALL)
        .border_style(Style::default().fg(theme.settings.border))
        .style(Style::default().bg(theme.settings.bg));

    let inner = block.inner(area);
    frame.render_widget(block, area);

    let mut lines: Vec<Line> = Vec::new();

    // Theme setting
    let theme_value = format!("< {} >", state.current_theme());
    lines.push(Line::from(vec![
        Span::styled("> ", Style::default().fg(theme.settings.prompt)),
        Span::styled("Theme: ", Style::default().fg(theme.settings.label_text)),
        Span::styled(
            theme_value,
            Style::default().fg(theme.settings.value_text).bg(theme.settings.value_bg),
        ),
    ]));

    lines.push(Line::from(""));

    // Help line
    lines.push(Line::from(vec![
        Span::styled("←→/Space", Style::default().fg(theme.settings.help_key)),
        Span::styled(" Change  ", Style::default().fg(theme.settings.help_text)),
        Span::styled("Enter", Style::default().fg(theme.settings.help_key)),
        Span::styled(" Save  ", Style::default().fg(theme.settings.help_text)),
        Span::styled("Esc", Style::default().fg(theme.settings.help_key)),
        Span::styled(" Cancel", Style::default().fg(theme.settings.help_text)),
    ]));

    let paragraph = Paragraph::new(lines);
    frame.render_widget(paragraph, inner);
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
