use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct BalanceResponse {
    pub total_in_cents: i64,
    pub income_in_cents: i64,
    pub expenses_in_cents: i64,
}
