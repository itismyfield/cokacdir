use std::fs;
use std::path::Path;
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use crossterm::event::KeyCode;
use ratatui::{
    layout::Rect,
    text::{Line, Span},
    widgets::{Block, Borders, Clear, Paragraph},
    Frame,
};

use super::{app::{App, Screen}, theme::Theme};
use crate::utils::format::{format_size, format_permissions};

/// Result of recursive directory calculation
#[derive(Debug, Clone)]
pub struct DirCalcResult {
    pub total_size: u64,
    pub file_count: u64,
    pub dir_count: u64,
}

/// State for async directory info calculation
pub struct FileInfoState {
    pub is_calculating: bool,
    pub result: Option<DirCalcResult>,
    pub cancel_flag: Arc<AtomicBool>,
    receiver: Option<Receiver<DirCalcResult>>,
}

impl Default for FileInfoState {
    fn default() -> Self {
        Self {
            is_calculating: false,
            result: None,
            cancel_flag: Arc::new(AtomicBool::new(false)),
            receiver: None,
        }
    }
}

impl FileInfoState {
    pub fn new() -> Self {
        Self::default()
    }

    /// Start async directory calculation
    pub fn start_calculation(&mut self, path: &Path) {
        // Reset state
        self.is_calculating = true;
        self.result = None;
        self.cancel_flag = Arc::new(AtomicBool::new(false));

        let (tx, rx): (Sender<DirCalcResult>, Receiver<DirCalcResult>) = mpsc::channel();
        self.receiver = Some(rx);

        let path = path.to_path_buf();
        let cancel_flag = self.cancel_flag.clone();

        thread::spawn(move || {
            let result = calculate_dir_size_recursive(&path, &cancel_flag);
            // Only send if not cancelled
            if !cancel_flag.load(Ordering::Relaxed) {
                let _ = tx.send(result);
            }
        });
    }

    /// Cancel ongoing calculation
    pub fn cancel(&mut self) {
        self.cancel_flag.store(true, Ordering::Relaxed);
        self.is_calculating = false;
        self.receiver = None;
    }

    /// Poll for calculation result
    /// Returns true if still calculating
    pub fn poll(&mut self) -> bool {
        if !self.is_calculating {
            return false;
        }

        if let Some(ref receiver) = self.receiver {
            match receiver.try_recv() {
                Ok(result) => {
                    self.result = Some(result);
                    self.is_calculating = false;
                    self.receiver = None;
                    return false;
                }
                Err(mpsc::TryRecvError::Empty) => {
                    return true; // Still calculating
                }
                Err(mpsc::TryRecvError::Disconnected) => {
                    // Thread finished or error
                    self.is_calculating = false;
                    self.receiver = None;
                    return false;
                }
            }
        }
        false
    }
}

/// Recursively calculate directory size with cancellation support
fn calculate_dir_size_recursive(path: &Path, cancel_flag: &AtomicBool) -> DirCalcResult {
    let mut total_size: u64 = 0;
    let mut file_count: u64 = 0;
    let mut dir_count: u64 = 0;

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.filter_map(|e| e.ok()) {
            // Check for cancellation
            if cancel_flag.load(Ordering::Relaxed) {
                break;
            }

            let entry_path = entry.path();
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_dir() {
                    dir_count += 1;
                    // Recursively calculate subdirectory
                    let sub_result = calculate_dir_size_recursive(&entry_path, cancel_flag);
                    total_size += sub_result.total_size;
                    file_count += sub_result.file_count;
                    dir_count += sub_result.dir_count;
                } else {
                    file_count += 1;
                    total_size += metadata.len();
                }
            }
        }
    }

    DirCalcResult {
        total_size,
        file_count,
        dir_count,
    }
}

/// Get spinner frame character based on current time
fn get_spinner_frame() -> char {
    const SPINNER_FRAMES: [char; 10] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frame_idx = (std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() / 100) as usize % SPINNER_FRAMES.len();
    SPINNER_FRAMES[frame_idx]
}

pub fn draw(frame: &mut Frame, app: &mut App, area: Rect, theme: &Theme) {
    // Draw dual panel in background first
    super::draw::draw_dual_panel_background(frame, app, area, theme);

    // Build content first to calculate required height
    let path = &app.info_file_path;
    let metadata = fs::metadata(path);

    let mut lines: Vec<Line> = Vec::new();

    if let Ok(meta) = metadata {
        let name = path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        lines.push(info_line("Name", &name, theme));
        lines.push(info_line("Path", &path.display().to_string(), theme));

        let file_type = if meta.is_dir() {
            "Directory"
        } else if meta.is_symlink() {
            "Symbolic Link"
        } else {
            "File"
        };
        lines.push(info_line("Type", file_type, theme));

        // For directories, show calculated total size or calculating status
        if meta.is_dir() {
            if let Some(ref state) = app.file_info_state {
                if state.is_calculating {
                    // Show spinner while calculating
                    let spinner = get_spinner_frame();
                    lines.push(Line::from(vec![
                        Span::styled(format!("{:12}", "Total Size"), theme.dim_style()),
                        Span::styled(format!("{} Calculating...", spinner), theme.info_style()),
                    ]));
                } else if let Some(ref result) = state.result {
                    // Show calculated results
                    lines.push(info_line("Total Size", &format_size(result.total_size), theme));
                    lines.push(info_line("Files", &result.file_count.to_string(), theme));
                    lines.push(info_line("Folders", &result.dir_count.to_string(), theme));
                } else {
                    // Calculation not started or cancelled
                    lines.push(info_line("Size", &format_size(meta.len()), theme));
                }
            } else {
                lines.push(info_line("Size", &format_size(meta.len()), theme));
            }
        } else {
            lines.push(info_line("Size", &format_size(meta.len()), theme));
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            lines.push(Line::from(Span::raw("")));
            lines.push(info_line("Permissions", &format_permissions(meta.mode()), theme));
            lines.push(info_line("Owner/Group", &format!("{}/{}", meta.uid(), meta.gid()), theme));
            lines.push(info_line("Links", &meta.nlink().to_string(), theme));
            lines.push(info_line("Inode", &meta.ino().to_string(), theme));
        }

        lines.push(Line::from(Span::raw("")));

        if let Ok(created) = meta.created() {
            let datetime: chrono::DateTime<chrono::Local> = created.into();
            lines.push(info_line("Created", &datetime.format("%Y-%m-%d %H:%M:%S").to_string(), theme));
        }

        if let Ok(modified) = meta.modified() {
            let datetime: chrono::DateTime<chrono::Local> = modified.into();
            lines.push(info_line("Modified", &datetime.format("%Y-%m-%d %H:%M:%S").to_string(), theme));
        }

        if let Ok(accessed) = meta.accessed() {
            let datetime: chrono::DateTime<chrono::Local> = accessed.into();
            lines.push(info_line("Accessed", &datetime.format("%Y-%m-%d %H:%M:%S").to_string(), theme));
        }

        // Directory-specific info: show immediate item count
        if meta.is_dir() {
            if let Ok(entries) = fs::read_dir(path) {
                let count = entries.count();
                lines.push(Line::from(Span::raw("")));
                lines.push(info_line("Direct Items", &count.to_string(), theme));
            }
        }
    } else {
        lines.push(Line::from(Span::styled(
            "Error reading file information",
            theme.error_style(),
        )));
    }

    lines.push(Line::from(Span::raw("")));

    // Show different hint based on calculation state
    let is_calculating = app.file_info_state
        .as_ref()
        .map(|s| s.is_calculating)
        .unwrap_or(false);

    if is_calculating {
        lines.push(Line::from(Span::styled(
            "Press ESC to cancel, any other key to close",
            theme.dim_style(),
        )));
    } else {
        lines.push(Line::from(Span::styled(
            "Press any key to close",
            theme.dim_style(),
        )));
    }

    // Calculate dialog size based on content (+2 for borders)
    let content_height = lines.len() as u16 + 2;
    let width = 60u16.min(area.width.saturating_sub(4));
    let height = content_height.min(area.height.saturating_sub(4));

    // Need minimum size to display anything useful
    if width < 20 || height < 5 {
        return;
    }

    let x = area.x + (area.width.saturating_sub(width)) / 2;
    let y = area.y + (area.height.saturating_sub(height)) / 2;
    let dialog_area = Rect::new(x, y, width, height);

    // Clear the area
    frame.render_widget(Clear, dialog_area);

    let block = Block::default()
        .title(" File Information ")
        .title_style(theme.header_style())
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(dialog_area);
    frame.render_widget(block, dialog_area);

    // Add horizontal padding (1 char on each side)
    let padded_inner = Rect::new(
        inner.x + 1,
        inner.y,
        inner.width.saturating_sub(2),
        inner.height,
    );

    let paragraph = Paragraph::new(lines);
    frame.render_widget(paragraph, padded_inner);
}

fn info_line<'a>(label: &str, value: &str, theme: &Theme) -> Line<'a> {
    Line::from(vec![
        Span::styled(format!("{:12}", label), theme.dim_style()),
        Span::styled(value.to_string(), theme.normal_style()),
    ])
}

pub fn handle_input(app: &mut App, code: KeyCode) {
    // Check if we're calculating
    let is_calculating = app.file_info_state
        .as_ref()
        .map(|s| s.is_calculating)
        .unwrap_or(false);

    if code == KeyCode::Esc && is_calculating {
        // ESC during calculation: cancel the calculation
        if let Some(ref mut state) = app.file_info_state {
            state.cancel();
        }
        // Don't close the dialog, just cancel the calculation
        return;
    }

    // Any other key (or ESC when not calculating) closes the dialog
    // Clean up state
    if let Some(ref mut state) = app.file_info_state {
        state.cancel(); // Cancel any ongoing calculation
    }
    app.file_info_state = None;
    app.current_screen = Screen::DualPanel;
}
