use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CategoryKind {
    Expense,
    Income,
}

impl Default for CategoryKind {
    fn default() -> Self {
        CategoryKind::Expense
    }
}
