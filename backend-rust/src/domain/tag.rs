use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Tag {
    pub id: Option<Uuid>,
    pub key: TagKey,
    pub value: TagValue,
}

#[derive(Debug, Clone)]
pub struct TagKey(String);

impl TagKey {
    pub fn parse(s: String) -> Result<TagKey, String> {
        let is_empty_or_whitespace = s.trim().is_empty();
        if is_empty_or_whitespace {
            Err("Tag key cannot be empty".to_string())
        } else {
            Ok(Self(s))
        }
    }
}

impl AsRef<str> for TagKey {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone)]
pub struct TagValue(String);

impl TagValue {
    pub fn parse(s: String) -> Result<TagValue, String> {
        let is_empty_or_whitespace = s.trim().is_empty();
        if is_empty_or_whitespace {
            Err("Tag value cannot be empty".to_string())
        } else {
            Ok(Self(s))
        }
    }
}

impl AsRef<str> for TagValue {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

