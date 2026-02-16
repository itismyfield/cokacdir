use thiserror::Error;

#[derive(Debug, Error)]
pub enum CokacencError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Invalid magic bytes in chunk header")]
    InvalidMagic,

    #[error("Unsupported version: {0}")]
    UnsupportedVersion(u32),

    #[error("Invalid PKCS7 padding")]
    InvalidPadding,

    #[error("MD5 mismatch: expected {expected}, got {actual}")]
    Md5Mismatch { expected: String, actual: String },

    #[error("No .cokacenc files found for group: {0}")]
    NoEncFiles(String),

    #[error("Missing chunk in sequence: expected seq {expected} but not found")]
    MissingChunk { expected: String },

    #[error("Key file is empty")]
    EmptyKeyFile,

    #[error("Sequence index {0} exceeds maximum (456975)")]
    SeqOverflow(usize),

    #[error("Metadata parse error: {0}")]
    MetadataParse(String),

    #[error("{0}")]
    Other(String),
}
