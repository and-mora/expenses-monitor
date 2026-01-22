use serde::{Deserialize, Serialize};
use unicode_segmentation::UnicodeSegmentation;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Uuid>,
    pub name: WalletName,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletName(String);

impl WalletName {
    /// Parses a string as a WalletName.
    /// Returns an error if the string is empty or contains only whitespace.
    pub fn parse(s: String) -> Result<WalletName, String> {
        let is_empty_or_whitespace = s.trim().is_empty();
        let is_too_long = s.graphemes(true).count() > 256;

        if is_empty_or_whitespace {
            Err("Wallet name cannot be empty".to_string())
        } else if is_too_long {
            Err("Wallet name is too long".to_string())
        } else {
            Ok(Self(s))
        }
    }
}

impl AsRef<str> for WalletName {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for WalletName {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
