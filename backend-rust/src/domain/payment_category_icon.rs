use unicode_segmentation::UnicodeSegmentation;

#[derive(Debug, Clone)]
pub struct PaymentCategoryIcon(String);

impl AsRef<str> for PaymentCategoryIcon {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl PaymentCategoryIcon {
    pub fn parse(s: String) -> Result<PaymentCategoryIcon, String> {
        let trimmed = s.trim();
        if trimmed.is_empty() {
            return Err("Icon cannot be empty".to_string());
        }
        if trimmed.graphemes(true).count() > 64 {
            return Err(format!("Icon '{}' is too long", trimmed));
        }
        let forbidden = ['<', '>', '{', '}', '\0'];
        if trimmed.chars().any(|c| forbidden.contains(&c)) {
            return Err(format!("Icon '{}' contains forbidden characters", trimmed));
        }
        Ok(Self(trimmed.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use crate::domain::payment_category_icon::PaymentCategoryIcon;
    use claims::{assert_err, assert_ok};

    #[test]
    fn valid_emoji_is_ok() {
        let s = "💳".to_string();
        assert_ok!(PaymentCategoryIcon::parse(s));
    }

    #[test]
    fn empty_is_rejected() {
        let s = "".to_string();
        assert_err!(PaymentCategoryIcon::parse(s));
    }

    #[test]
    fn too_long_is_rejected() {
        let s = "a".repeat(65);
        assert_err!(PaymentCategoryIcon::parse(s));
    }

    #[test]
    fn forbidden_chars_are_rejected() {
        let s = "<svg>".to_string();
        assert_err!(PaymentCategoryIcon::parse(s));
    }
}
