use chrono::NaiveDateTime;
use unicode_segmentation::UnicodeSegmentation;

pub struct PaymentCategory(String);

impl AsRef<str> for PaymentCategory {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl PaymentCategory {

    pub fn parse(s: String) -> PaymentCategory {

        // `.trim()` returns a view over the input `s` without trailing
        // whitespace-like characters.
        // `.is_empty` checks if the view contains any character.
        let is_empty_or_whitespace = s.trim().is_empty();
        // A grapheme is defined by the Unicode standard as a "user-perceived"
        // character: `å` is a single grapheme, but it is composed of two characters
        // (`a` and `̊`).
        //
        // `graphemes` returns an iterator over the graphemes in the input `s`.
        // `true` specifies that we want to use the extended grapheme definition set,
        // the recommended one.
        let is_too_long = s.graphemes(true).count() > 256;
        // Iterate over all characters in the input `s` to check if any of them
        // matches one of the characters in the forbidden array.
        let forbidden_characters = ['/', '(', ')', '"', '<', '>', '\\', '{', '}'];
        let contains_forbidden_characters = s
            .chars()
            .any(|g| forbidden_characters.contains(&g));
        if is_empty_or_whitespace || is_too_long || contains_forbidden_characters {
            panic!("{} is not a valid subscriber name.", s)
        } else {
            Self(s)
        }
    }
}

// domain model
pub struct Payment {
    pub description: String,
    pub category: PaymentCategory,
    pub amount_in_cents: i32,
    pub merchant_name: String,
    pub accounting_date: NaiveDateTime,
}