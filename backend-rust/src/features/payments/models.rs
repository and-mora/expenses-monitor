use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize, Debug, Clone)]
pub struct TagDto {
    pub key: String,
    pub value: String,
}

// CategoryIdentifier accepts either a UUID or a name string from clients.
#[derive(Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum CategoryIdentifier {
    Uid(Uuid),
    Name(String),
}

#[derive(Deserialize, Debug)]
pub struct CategoryQuery {
    #[serde(rename = "type")]
    pub category_type: Option<String>,
}

#[derive(Serialize)]
pub struct CategoryDto {
    #[serde(rename = "id")]
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "icon", skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

#[derive(Deserialize)]
pub struct PaginationParams {
    #[serde(default)]
    pub page: i64,
    #[serde(default = "default_size")]
    pub size: i64,
    #[serde(rename = "dateFrom")]
    pub date_from: Option<String>,
    #[serde(rename = "dateTo")]
    pub date_to: Option<String>,
    pub category: Option<String>,
    pub wallet: Option<String>,
    pub search: Option<String>,
}

#[derive(Clone, Debug)]
pub struct PaymentFilters {
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub category: Option<String>,
    pub wallet: Option<String>,
    pub search: Option<String>,
}

impl From<&PaginationParams> for PaymentFilters {
    fn from(params: &PaginationParams) -> Self {
        Self {
            date_from: params.date_from.clone(),
            date_to: params.date_to.clone(),
            category: params.category.clone(),
            wallet: params.wallet.clone(),
            search: params.search.clone(),
        }
    }
}

fn default_size() -> i64 {
    10
}

#[derive(Serialize, Deserialize)]
pub struct TagResponseDto {
    pub id: Uuid,
    pub key: String,
    pub value: String,
}

#[derive(Serialize)]
pub struct PaymentResponseDto {
    pub id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "amountInCents")]
    pub amount_in_cents: i32,
    #[serde(rename = "merchantName")]
    pub merchant_name: String,
    #[serde(rename = "accountingDate")]
    pub accounting_date: NaiveDateTime,
    pub category: String,
    #[serde(rename = "categoryId")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<Uuid>,
    #[serde(rename = "categoryIcon")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wallet: Option<String>,
    pub tags: Vec<TagResponseDto>,
}

#[derive(Serialize)]
pub struct PagedResponse<T> {
    pub content: Vec<T>,
    pub page: i64,
    pub size: i64,
}
