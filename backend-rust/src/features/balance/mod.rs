pub mod models;

use actix_web::web;
use actix_web::web::ServiceConfig;
use actix_web::HttpResponse;
use chrono::NaiveDateTime;
use serde::Deserialize;
use serde_json::json;
use sqlx::{PgPool, Row};

use crate::features::balance::models::BalanceResponse;
use crate::features::wallets::shared::get_wallet_id_by_name;

#[derive(Deserialize)]
pub struct BalanceQuery {
    pub wallet_name: String,
    pub start_date: Option<NaiveDateTime>,
    pub end_date: Option<NaiveDateTime>,
}

pub fn configure(cfg: &mut ServiceConfig) {
    cfg.service(web::scope("/api/balance").route("", web::get().to(get_balance)));
}

#[tracing::instrument(
    name = "Getting balance for wallet",
    skip(pool, query),
    fields(
        wallet_name = %query.wallet_name
    )
)]
pub async fn get_balance(pool: web::Data<PgPool>, query: web::Query<BalanceQuery>) -> HttpResponse {
    let wallet_name = &query.wallet_name;

    let wallet_id = match get_wallet_id_by_name(pool.get_ref(), wallet_name).await {
        Ok(Some(id)) => id,
        Ok(None) => {
            return HttpResponse::NotFound().json(json!({
                "error": "Wallet not found"
            }));
        }
        Err(e) => {
            tracing::error!("Failed to get wallet ID: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "error": "Failed to get wallet"
            }));
        }
    };

    let sql = r#"
        SELECT
            COALESCE(SUM(CASE WHEN c.kind = 'income' THEN p.amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN c.kind = 'expense' THEN p.amount ELSE 0 END), 0) as total_expenses
        FROM expenses.payments p
        JOIN expenses.categories c ON p.category_id = c.id
        WHERE p.wallet_id = $1
          AND ($2::timestamp IS NULL OR p.accounting_date >= $2)
          AND ($3::timestamp IS NULL OR p.accounting_date <= $3)
        "#;

    let query_builder = sqlx::query(sql)
        .bind(wallet_id)
        .bind(query.start_date)
        .bind(query.end_date);

    match query_builder.fetch_one(pool.get_ref()).await {
        Ok(row) => {
            let total_income: i64 = row.try_get("total_income").unwrap_or(0);
            let total_expenses: i64 = row.try_get("total_expenses").unwrap_or(0);
            let total_in_cents = total_income - total_expenses;
            HttpResponse::Ok().json(BalanceResponse {
                total_in_cents,
                income_in_cents: total_income,
                expenses_in_cents: total_expenses,
            })
        }
        Err(e) => {
            tracing::error!("Failed to calculate balance: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to calculate balance"
            }))
        }
    }
}
