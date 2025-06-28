use crate::domain::payment_category::PaymentCategory;
use chrono::NaiveDateTime;
use crate::domain::PaymentDescription;

// domain model
pub struct Payment {
    pub description: PaymentDescription,
    pub category: PaymentCategory,
    pub amount_in_cents: i32,
    pub merchant_name: String,
    pub accounting_date: NaiveDateTime,
}
