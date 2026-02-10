use crate::domain::{PaymentDescription, PaymentMerchant};
use chrono::NaiveDateTime;
use uuid::Uuid;

// domain model
pub struct Payment {
    pub description: Option<PaymentDescription>,
    pub category_id: Uuid,
    pub amount_in_cents: i32,
    pub merchant_name: PaymentMerchant,
    pub accounting_date: NaiveDateTime,
    pub wallet_id: Option<Uuid>,
}
