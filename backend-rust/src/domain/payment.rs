use crate::domain::{PaymentCategory, PaymentDescription, PaymentMerchant};
use chrono::NaiveDateTime;

// domain model
pub struct Payment {
    pub description: PaymentDescription,
    pub category: PaymentCategory,
    pub amount_in_cents: i32,
    pub merchant_name: PaymentMerchant,
    pub accounting_date: NaiveDateTime,
}
