use crossterm::event::KeyCode;
use image::DynamicImage;
use ratatui::{
    layout::Rect,
    style::{Color, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph},
    Frame,
};
use std::path::Path;
use std::sync::mpsc::{self, Receiver, Sender};
use std::thread;

use super::{app::{App, Screen}, theme::Theme};

/// Result of async image loading
struct ImageLoadResult {
    image: Option<DynamicImage>,
    error: Option<String>,
}

/// Check if terminal supports true color (24-bit RGB)
pub fn supports_true_color() -> bool {
    // Check TERM_PROGRAM for known terminals
    if let Ok(term_program) = std::env::var("TERM_PROGRAM") {
        match term_program.as_str() {
            "Apple_Terminal" => return false,
            "iTerm.app" | "WezTerm" | "Hyper" | "vscode" | "Tabby" | "Alacritty" => return true,
            _ => {}
        }
    }

    // iTerm2 sets this
    if std::env::var("ITERM_SESSION_ID").is_ok() {
        return true;
    }

    // iTerm2 also sets LC_TERMINAL
    if let Ok(lc_term) = std::env::var("LC_TERMINAL") {
        if lc_term == "iTerm2" {
            return true;
        }
    }

    // Windows Terminal
    if std::env::var("WT_SESSION").is_ok() {
        return true;
    }

    // COLORTERM is the most reliable indicator
    if let Ok(colorterm) = std::env::var("COLORTERM") {
        if colorterm == "truecolor" || colorterm == "24bit" {
            return true;
        }
    }

    // If none of the above, assume no true color support
    // This is conservative but safer
    false
}

pub struct ImageViewerState {
    pub path: std::path::PathBuf,
    pub image: Option<DynamicImage>,
    pub error: Option<String>,
    pub zoom: f32,
    pub offset_x: i32,
    pub offset_y: i32,
    /// List of image files in the same directory
    image_list: Vec<std::path::PathBuf>,
    /// Current index in the image list
    current_index: usize,
    /// Whether image is currently loading
    pub is_loading: bool,
    /// Receiver for async image loading result
    receiver: Option<Receiver<ImageLoadResult>>,
}

impl ImageViewerState {
    pub fn new(path: &Path) -> Self {
        // Scan for image files in the same directory
        let (image_list, current_index) = Self::scan_images_in_directory(path);

        let mut state = Self {
            path: path.to_path_buf(),
            image: None,
            error: None,
            zoom: 1.0,
            offset_x: 0,
            offset_y: 0,
            image_list,
            current_index,
            is_loading: true,
            receiver: None,
        };

        // Start async image loading
        state.start_loading(path);
        state
    }

    /// Start async loading of an image
    fn start_loading(&mut self, path: &Path) {
        self.is_loading = true;
        self.image = None;
        self.error = None;

        let (tx, rx): (Sender<ImageLoadResult>, Receiver<ImageLoadResult>) = mpsc::channel();
        self.receiver = Some(rx);

        let path = path.to_path_buf();
        thread::spawn(move || {
            let result = match image::open(&path) {
                Ok(img) => ImageLoadResult {
                    image: Some(img),
                    error: None,
                },
                Err(e) => ImageLoadResult {
                    image: None,
                    error: Some(format!("Failed to load image: {}", e)),
                },
            };
            let _ = tx.send(result);
        });
    }

    /// Poll for image loading result
    /// Returns true if still loading
    pub fn poll(&mut self) -> bool {
        if !self.is_loading {
            return false;
        }

        if let Some(ref receiver) = self.receiver {
            match receiver.try_recv() {
                Ok(result) => {
                    self.image = result.image;
                    self.error = result.error;
                    self.is_loading = false;
                    self.receiver = None;
                    return false;
                }
                Err(mpsc::TryRecvError::Empty) => {
                    return true; // Still loading
                }
                Err(mpsc::TryRecvError::Disconnected) => {
                    self.is_loading = false;
                    self.receiver = None;
                    self.error = Some("Image loading failed".to_string());
                    return false;
                }
            }
        }
        false
    }

    /// Scan images in the same directory and find current image index
    fn scan_images_in_directory(path: &Path) -> (Vec<std::path::PathBuf>, usize) {
        let mut image_list = Vec::new();
        let mut current_index = 0;

        if let Some(parent) = path.parent() {
            if let Ok(entries) = std::fs::read_dir(parent) {
                let mut images: Vec<_> = entries
                    .filter_map(|e| e.ok())
                    .map(|e| e.path())
                    .filter(|p| is_image_file(p))
                    .collect();

                // Sort by filename for consistent ordering
                images.sort_by(|a, b| {
                    a.file_name()
                        .map(|s| s.to_string_lossy().to_lowercase())
                        .cmp(&b.file_name().map(|s| s.to_string_lossy().to_lowercase()))
                });

                // Find current image index
                if let Ok(canonical_path) = path.canonicalize() {
                    for (i, img_path) in images.iter().enumerate() {
                        if let Ok(canonical_img) = img_path.canonicalize() {
                            if canonical_img == canonical_path {
                                current_index = i;
                                break;
                            }
                        }
                    }
                } else {
                    // Fallback: compare by filename
                    if let Some(filename) = path.file_name() {
                        for (i, img_path) in images.iter().enumerate() {
                            if img_path.file_name() == Some(filename) {
                                current_index = i;
                                break;
                            }
                        }
                    }
                }

                image_list = images;
            }
        }

        (image_list, current_index)
    }

    /// Navigate to the previous image in the directory
    pub fn navigate_prev(&mut self) -> bool {
        if self.image_list.is_empty() {
            return false;
        }

        let new_index = if self.current_index == 0 {
            self.image_list.len() - 1  // Wrap to last
        } else {
            self.current_index - 1
        };

        self.load_image_at_index(new_index)
    }

    /// Navigate to the next image in the directory
    pub fn navigate_next(&mut self) -> bool {
        if self.image_list.is_empty() {
            return false;
        }

        let new_index = if self.current_index >= self.image_list.len() - 1 {
            0  // Wrap to first
        } else {
            self.current_index + 1
        };

        self.load_image_at_index(new_index)
    }

    /// Load image at given index (async)
    fn load_image_at_index(&mut self, index: usize) -> bool {
        if index >= self.image_list.len() {
            return false;
        }

        let new_path = self.image_list[index].clone();
        self.path = new_path.clone();
        self.current_index = index;
        // Reset view when switching images
        self.reset_view();
        // Start async loading
        self.start_loading(&new_path);
        true
    }

    /// Get current image position info (e.g., "3/10")
    pub fn get_position_info(&self) -> String {
        if self.image_list.is_empty() {
            String::new()
        } else {
            format!("{}/{}", self.current_index + 1, self.image_list.len())
        }
    }

    pub fn zoom_in(&mut self) {
        self.zoom = (self.zoom * 1.2).min(10.0);
    }

    pub fn zoom_out(&mut self) {
        self.zoom = (self.zoom / 1.2).max(0.1);
    }

    pub fn reset_view(&mut self) {
        self.zoom = 1.0;
        self.offset_x = 0;
        self.offset_y = 0;
    }

    pub fn pan(&mut self, dx: i32, dy: i32) {
        self.offset_x += dx;
        self.offset_y += dy;
    }
}

/// Check if a file is a supported image format
pub fn is_image_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext = ext.to_string_lossy().to_lowercase();
        matches!(ext.as_str(), "png" | "jpg" | "jpeg" | "gif" | "bmp" | "webp" | "ico" | "tiff" | "tif")
    } else {
        false
    }
}

/// Get spinner frame character based on current time
fn get_spinner_frame() -> char {
    const SPINNER_FRAMES: [char; 10] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frame_idx = (std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() / 100) as usize % SPINNER_FRAMES.len();
    SPINNER_FRAMES[frame_idx]
}

pub fn draw(frame: &mut Frame, app: &mut App, area: Rect, theme: &Theme) {
    // Draw dual panel in background
    super::draw::draw_dual_panel_background(frame, app, area, theme);

    let state = match &app.image_viewer_state {
        Some(s) => s,
        None => return,
    };

    // Calculate viewer area (leave some margin)
    let margin = 2;
    let viewer_width = area.width.saturating_sub(margin * 2);
    let viewer_height = area.height.saturating_sub(margin * 2);

    if viewer_width < 20 || viewer_height < 10 {
        return;
    }

    let x = area.x + margin;
    let y = area.y + margin;
    let viewer_area = Rect::new(x, y, viewer_width, viewer_height);

    // Clear area
    frame.render_widget(ratatui::widgets::Clear, viewer_area);

    let filename = state.path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Image".to_string());

    let position_info = state.get_position_info();
    let title = if let Some(ref img) = state.image {
        if position_info.is_empty() {
            format!(" {} ({}x{}) - {:.0}% ", filename, img.width(), img.height(), state.zoom * 100.0)
        } else {
            format!(" {} [{}] ({}x{}) - {:.0}% ", filename, position_info, img.width(), img.height(), state.zoom * 100.0)
        }
    } else if position_info.is_empty() {
        format!(" {} ", filename)
    } else {
        format!(" {} [{}] ", filename, position_info)
    };

    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.border_active))
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(viewer_area);
    frame.render_widget(block, viewer_area);

    // Show loading spinner if image is being loaded
    if state.is_loading {
        let spinner = get_spinner_frame();
        let loading_lines = vec![
            Line::from(""),
            Line::from(""),
            Line::from(""),
            Line::from(vec![
                Span::styled(format!(" {} ", spinner), Style::default().fg(theme.info)),
                Span::styled("Loading image...", Style::default().fg(theme.info)),
            ]),
        ];

        // Center the loading message
        let center_y = inner.y + inner.height / 2 - 2;
        let loading_area = Rect::new(inner.x, center_y, inner.width, 4);
        let paragraph = Paragraph::new(loading_lines)
            .alignment(ratatui::layout::Alignment::Center);
        frame.render_widget(paragraph, loading_area);
        return;
    }

    if let Some(ref error) = state.error {
        let error_lines = vec![
            Line::from(""),
            Line::from(Span::styled(error.clone(), Style::default().fg(theme.error))),
            Line::from(""),
            Line::from(Span::styled("Press ESC to close", theme.dim_style())),
        ];
        frame.render_widget(Paragraph::new(error_lines), inner);
        return;
    }

    if let Some(ref img) = state.image {
        render_image(frame, img, inner, state.zoom, state.offset_x, state.offset_y);
    }

    // Help line at bottom
    let help_area = Rect::new(inner.x, inner.y + inner.height.saturating_sub(1), inner.width, 1);
    let help = Line::from(vec![
        Span::styled("PgUp", Style::default().fg(theme.success)),
        Span::styled("/", theme.dim_style()),
        Span::styled("PgDn", Style::default().fg(theme.success)),
        Span::styled(" Prev/Next ", theme.dim_style()),
        Span::styled("+", Style::default().fg(theme.success)),
        Span::styled("/", theme.dim_style()),
        Span::styled("-", Style::default().fg(theme.success)),
        Span::styled(" Zoom ", theme.dim_style()),
        Span::styled("Arrow", Style::default().fg(theme.success)),
        Span::styled(" Pan ", theme.dim_style()),
        Span::styled("r", Style::default().fg(theme.success)),
        Span::styled(" Reset ", theme.dim_style()),
        Span::styled("Esc", Style::default().fg(theme.success)),
        Span::styled(" Close", theme.dim_style()),
    ]);
    frame.render_widget(Paragraph::new(help), help_area);
}

fn render_image(frame: &mut Frame, img: &DynamicImage, area: Rect, zoom: f32, offset_x: i32, offset_y: i32) {
    let term_width = area.width as u32;
    let term_height = area.height.saturating_sub(1) as u32;
    let pixel_height = term_height * 2;

    let img_width = img.width();
    let img_height = img.height();

    // Calculate scale to fit image in terminal area
    let scale_x = term_width as f32 / img_width as f32;
    let scale_y = pixel_height as f32 / img_height as f32;
    let base_scale = scale_x.min(scale_y);
    let scale = base_scale * zoom;

    let scaled_width = ((img_width as f32 * scale) as u32).max(1);
    let scaled_height = ((img_height as f32 * scale) as u32).max(1);

    // Resize image and convert to RGB8
    let resized = img.resize_exact(
        scaled_width,
        scaled_height,
        image::imageops::FilterType::Triangle,
    ).to_rgb8();

    // Calculate offset for centering (in pixels)
    let center_offset_x = (term_width as i32 - scaled_width as i32) / 2;
    let center_offset_y = (pixel_height as i32 - scaled_height as i32) / 2;

    // Apply user pan offset
    let view_offset_x = center_offset_x + offset_x;
    let view_offset_y = center_offset_y + offset_y;

    let mut lines: Vec<Line> = Vec::new();

    for term_row in 0..term_height {
        let mut spans: Vec<Span> = Vec::new();

        let pixel_row_top = (term_row * 2) as i32;
        let pixel_row_bottom = (term_row * 2 + 1) as i32;

        for term_col in 0..term_width {
            let img_x = term_col as i32 - view_offset_x;
            let img_y_top = pixel_row_top - view_offset_y;
            let img_y_bottom = pixel_row_bottom - view_offset_y;

            let top_color = if img_x >= 0 && img_x < scaled_width as i32
                && img_y_top >= 0 && img_y_top < scaled_height as i32
            {
                let rgb = resized.get_pixel(img_x as u32, img_y_top as u32);
                Some(Color::Rgb(rgb[0], rgb[1], rgb[2]))
            } else {
                None
            };

            let bottom_color = if img_x >= 0 && img_x < scaled_width as i32
                && img_y_bottom >= 0 && img_y_bottom < scaled_height as i32
            {
                let rgb = resized.get_pixel(img_x as u32, img_y_bottom as u32);
                Some(Color::Rgb(rgb[0], rgb[1], rgb[2]))
            } else {
                None
            };

            let (ch, style) = match (top_color, bottom_color) {
                (Some(top), Some(bottom)) => ('▀', Style::default().fg(top).bg(bottom)),
                (Some(top), None) => ('▀', Style::default().fg(top)),
                (None, Some(bottom)) => ('▄', Style::default().fg(bottom)),
                (None, None) => (' ', Style::default()),
            };

            spans.push(Span::styled(ch.to_string(), style));
        }

        lines.push(Line::from(spans));
    }

    frame.render_widget(
        Paragraph::new(lines),
        Rect::new(area.x, area.y, area.width, term_height as u16),
    );
}

pub fn handle_input(app: &mut App, code: KeyCode) {
    let state = match &mut app.image_viewer_state {
        Some(s) => s,
        None => {
            app.current_screen = Screen::DualPanel;
            return;
        }
    };

    match code {
        KeyCode::Esc | KeyCode::Char('q') | KeyCode::Char('Q') => {
            // Get the filename of the last viewed image to focus on it
            let last_image_name = state.path.file_name()
                .map(|n| n.to_string_lossy().to_string());

            // Set pending_focus on active panel so cursor lands on the last viewed image
            if let Some(filename) = last_image_name {
                app.active_panel_mut().pending_focus = Some(filename);
                app.active_panel_mut().load_files();
            }

            app.current_screen = Screen::DualPanel;
            app.image_viewer_state = None;
        }
        KeyCode::Char('+') | KeyCode::Char('=') => {
            state.zoom_in();
        }
        KeyCode::Char('-') | KeyCode::Char('_') => {
            state.zoom_out();
        }
        KeyCode::Char('r') | KeyCode::Char('R') => {
            state.reset_view();
        }
        KeyCode::Up => {
            state.pan(0, 5);
        }
        KeyCode::Down => {
            state.pan(0, -5);
        }
        KeyCode::Left => {
            state.pan(5, 0);
        }
        KeyCode::Right => {
            state.pan(-5, 0);
        }
        // Navigate to previous image
        KeyCode::PageUp => {
            state.navigate_prev();
        }
        // Navigate to next image
        KeyCode::PageDown => {
            state.navigate_next();
        }
        _ => {}
    }
}
