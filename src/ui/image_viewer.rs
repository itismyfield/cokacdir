use crossterm::event::KeyCode;
use image::{GenericImageView, DynamicImage};
use ratatui::{
    layout::Rect,
    style::{Color, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph},
    Frame,
};
use std::path::Path;

use super::{app::{App, Screen}, theme::Theme};

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
}

impl ImageViewerState {
    pub fn new(path: &Path) -> Self {
        let (image, error) = match image::open(path) {
            Ok(img) => (Some(img), None),
            Err(e) => (None, Some(format!("Failed to load image: {}", e))),
        };

        Self {
            path: path.to_path_buf(),
            image,
            error,
            zoom: 1.0,
            offset_x: 0,
            offset_y: 0,
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

    let title = if let Some(ref img) = state.image {
        format!(" {} ({}x{}) - {:.0}% ", filename, img.width(), img.height(), state.zoom * 100.0)
    } else {
        format!(" {} ", filename)
    };

    let block = Block::default()
        .title(title)
        .title_style(Style::default().fg(theme.border_active))
        .borders(Borders::ALL)
        .border_style(theme.border_style(true));

    let inner = block.inner(viewer_area);
    frame.render_widget(block, viewer_area);

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
        _ => {}
    }
}
