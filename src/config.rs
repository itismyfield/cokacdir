use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use crate::ui::theme::Theme;

/// Panel-specific settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelSettings {
    #[serde(default)]
    pub start_path: Option<String>,
    #[serde(default = "default_sort_by")]
    pub sort_by: String,
    #[serde(default = "default_sort_order")]
    pub sort_order: String,
}

fn default_sort_by() -> String {
    "name".to_string()
}

fn default_sort_order() -> String {
    "asc".to_string()
}

impl Default for PanelSettings {
    fn default() -> Self {
        Self {
            start_path: None,
            sort_by: default_sort_by(),
            sort_order: default_sort_order(),
        }
    }
}

/// Theme settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSettings {
    #[serde(default = "default_theme_name")]
    pub name: String,
}

fn default_theme_name() -> String {
    "light".to_string()
}

impl Default for ThemeSettings {
    fn default() -> Self {
        Self {
            name: default_theme_name(),
        }
    }
}

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default)]
    pub left_panel: PanelSettings,
    #[serde(default)]
    pub right_panel: PanelSettings,
    #[serde(default = "default_active_panel")]
    pub active_panel: String,
    #[serde(default)]
    pub theme: ThemeSettings,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tar_path: Option<String>,
    /// Extension handlers: maps file extensions to command arrays
    /// Example: {"jpg": ["imageviewer {{FILEPATH}}", "imgviewer {{FILEPATH}}"]}
    /// Commands are tried in order until one succeeds (fallback)
    /// {{FILEPATH}} is replaced with the actual file path
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub extension_handler: HashMap<String, Vec<String>>,
    /// Bookmarked paths for quick navigation
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub bookmarked_path: Vec<String>,
}

fn default_active_panel() -> String {
    "left".to_string()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            left_panel: PanelSettings::default(),
            right_panel: PanelSettings::default(),
            active_panel: default_active_panel(),
            theme: ThemeSettings::default(),
            tar_path: None,
            extension_handler: HashMap::new(),
            bookmarked_path: Vec::new(),
        }
    }
}

impl Settings {
    /// Returns the config directory path (~/.cokacdir)
    pub fn config_dir() -> Option<PathBuf> {
        dirs::home_dir().map(|h| h.join(".cokacdir"))
    }

    /// Returns the themes directory path (~/.cokacdir/themes)
    pub fn themes_dir() -> Option<PathBuf> {
        Self::config_dir().map(|d| d.join("themes"))
    }

    /// Returns the config file path (~/.cokacdir/settings.json)
    pub fn config_path() -> Option<PathBuf> {
        Self::config_dir().map(|d| d.join("settings.json"))
    }

    /// Ensures config directories and default files exist
    /// Called on app startup to initialize configuration
    pub fn ensure_config_exists() {
        // Create ~/.cokacdir/
        if let Some(config_dir) = Self::config_dir() {
            if !config_dir.exists() {
                if fs::create_dir_all(&config_dir).is_ok() {
                    // Set directory permissions to user-only on Unix
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        let perms = fs::Permissions::from_mode(0o700);
                        let _ = fs::set_permissions(&config_dir, perms);
                    }
                }
            }
        }

        // Create ~/.cokacdir/themes/
        if let Some(themes_dir) = Self::themes_dir() {
            if !themes_dir.exists() {
                let _ = fs::create_dir_all(&themes_dir);
            }

            // Create default light.json if not exists
            let light_theme_path = themes_dir.join("light.json");
            if !light_theme_path.exists() {
                let _ = fs::write(&light_theme_path, Theme::light().to_json());
            }

            // Create default dark.json if not exists
            let dark_theme_path = themes_dir.join("dark.json");
            if !dark_theme_path.exists() {
                let _ = fs::write(&dark_theme_path, Theme::dark().to_json());
            }
        }

        // Create default settings.json if not exists
        if let Some(config_path) = Self::config_path() {
            if !config_path.exists() {
                let default_settings = Self::default();
                let _ = default_settings.save();
            }
        }
    }

    /// Loads settings from the config file, returns default if not found or invalid
    pub fn load() -> Self {
        Self::load_with_error().unwrap_or_default()
    }

    /// Loads settings from the config file with error information
    /// Returns Ok(settings) on success, Err(error_message) on failure
    pub fn load_with_error() -> Result<Self, String> {
        // Ensure config directories and files exist
        Self::ensure_config_exists();

        let config_path = Self::config_path()
            .ok_or_else(|| "Could not determine config path".to_string())?;

        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read settings file: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Invalid JSON in settings.json: {}", e))
    }

    /// Saves settings to the config file using atomic write pattern
    pub fn save(&self) -> io::Result<()> {
        let Some(config_dir) = Self::config_dir() else {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "Could not determine config directory",
            ));
        };

        // Create config directory if it doesn't exist
        if !config_dir.exists() {
            fs::create_dir_all(&config_dir)?;
            // Set directory permissions to user-only on Unix
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let perms = fs::Permissions::from_mode(0o700);
                let _ = fs::set_permissions(&config_dir, perms);
            }
        }

        let config_path = config_dir.join("settings.json");
        let temp_path = config_dir.join("settings.json.tmp");
        let content = serde_json::to_string_pretty(self)?;

        // Atomic write: write to temp file first, then rename
        fs::write(&temp_path, &content)?;
        fs::rename(&temp_path, &config_path)?;

        Ok(())
    }

    /// Returns a valid start path for the left panel
    /// Falls back to current directory, then home directory, then root
    pub fn left_start_path(&self) -> PathBuf {
        self.resolve_path(&self.left_panel.start_path, || {
            std::env::current_dir().unwrap_or_else(|_| PathBuf::from("/"))
        })
    }

    /// Returns a valid start path for the right panel
    /// Falls back to home directory, then root
    pub fn right_start_path(&self) -> PathBuf {
        self.resolve_path(&self.right_panel.start_path, || {
            dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"))
        })
    }

    /// Resolves a path setting to a valid directory
    /// Security: Only accepts absolute paths and canonicalizes to resolve symlinks
    fn resolve_path<F>(&self, path_opt: &Option<String>, fallback: F) -> PathBuf
    where
        F: FnOnce() -> PathBuf,
    {
        if let Some(path_str) = path_opt {
            let path = PathBuf::from(path_str);

            // Security: Reject relative paths to prevent path traversal
            if !path.is_absolute() {
                return fallback();
            }

            // Canonicalize to resolve symlinks and verify the path exists
            if let Ok(canonical) = path.canonicalize() {
                if canonical.is_dir() {
                    return canonical;
                }
            }

            // If canonicalize fails, try parent directories
            let mut current = path;
            while let Some(parent) = current.parent() {
                if let Ok(canonical_parent) = parent.canonicalize() {
                    if canonical_parent.is_dir() {
                        return canonical_parent;
                    }
                }
                if parent == current {
                    break;
                }
                current = parent.to_path_buf();
            }
        }
        fallback()
    }

    /// Gets the extension handler for a given file extension (case-insensitive)
    /// Supports pipe-separated extensions: "jpg|jpeg|png"
    /// Returns None if no handler is defined for this extension
    pub fn get_extension_handler(&self, extension: &str) -> Option<&Vec<String>> {
        let ext_lower = extension.to_lowercase();
        // Try to find a matching handler (case-insensitive, supports pipe-separated extensions)
        for (key, value) in &self.extension_handler {
            // Split by pipe and check each extension
            for key_ext in key.split('|') {
                if key_ext.trim().to_lowercase() == ext_lower {
                    return Some(value);
                }
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = Settings::default();
        assert_eq!(settings.active_panel, "left");
        assert_eq!(settings.left_panel.sort_by, "name");
        assert_eq!(settings.left_panel.sort_order, "asc");
        assert_eq!(settings.theme.name, "light");
    }

    #[test]
    fn test_parse_partial_json() {
        let json = r#"{"left_panel":{"start_path":"/tmp"}}"#;
        let settings: Settings = serde_json::from_str(json).unwrap();
        assert_eq!(settings.left_panel.start_path, Some("/tmp".to_string()));
        assert_eq!(settings.left_panel.sort_by, "name");
        assert_eq!(settings.right_panel.sort_by, "name");
    }

    #[test]
    fn test_ensure_config_exists() {
        Settings::ensure_config_exists();
        if let Some(themes_dir) = Settings::themes_dir() {
            assert!(themes_dir.exists(), "themes directory should exist");
            let light_theme = themes_dir.join("light.json");
            assert!(light_theme.exists(), "light.json should exist");
        }
    }

    #[test]
    fn test_theme_to_json() {
        let json = Theme::light().to_json();
        assert!(json.contains("\"name\": \"light\""));
        assert!(json.contains("\"palette\""));
        assert!(json.contains("\"panel\""));
    }
}
