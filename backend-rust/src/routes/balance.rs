use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::ops::Deref;

#[derive(Serialize, Deserialize)]
pub struct BalanceResponse {
    #[serde(rename = "totalInCents")]
    pub total_in_cents: i32,
}

#[tracing::instrument(name = "Retrieve overall balance", skip(connection_pool))]
pub async fn get_balance(connection_pool: web::Data<PgPool>) -> impl Responder {
    match get_balance_from_db(connection_pool.deref()).await {
        Ok(balance) => HttpResponse::Ok().json(BalanceResponse {
            total_in_cents: balance,
        }),
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(name = "Retrieving balance from database", skip(connection_pool))]
async fn get_balance_from_db(connection_pool: &PgPool) -> Result<i32, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        SELECT COALESCE(SUM(amount), 0) as balance
        FROM expenses.payments
        "#
    )
    .fetch_one(connection_pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to execute query: {:?}", e);
        e
    })?;

    Ok(result.balance.unwrap_or(0) as i32)
}
