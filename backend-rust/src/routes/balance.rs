use actix_web::{web, HttpResponse, Responder};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::ops::Deref;

#[derive(Deserialize)]
pub struct BalanceQuery {
    #[serde(rename = "startDate")]
    start_date: Option<NaiveDate>,
    #[serde(rename = "endDate")]
    end_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize)]
pub struct BalanceResponse {
    #[serde(rename = "totalInCents")]
    pub total_in_cents: i32,
    #[serde(rename = "incomeInCents")]
    pub income_in_cents: i32,
    #[serde(rename = "expensesInCents")]
    pub expenses_in_cents: i32,
}

#[tracing::instrument(name = "Retrieve overall balance", skip(connection_pool, query))]
pub async fn get_balance(
    query: web::Query<BalanceQuery>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    match get_balance_from_db(
        connection_pool.deref(),
        query.start_date,
        query.end_date,
    )
    .await
    {
        Ok(balance) => HttpResponse::Ok().json(balance),
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(
    name = "Retrieving balance from database",
    skip(connection_pool),
    fields(start_date = ?start_date, end_date = ?end_date)
)]
async fn get_balance_from_db(
    connection_pool: &PgPool,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
) -> Result<BalanceResponse, sqlx::Error> {
    let (total, income, expenses) = match (start_date, end_date) {
        (Some(start), Some(end)) => {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0) as total,
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses
                FROM expenses.payments
                WHERE accounting_date >= $1 AND accounting_date <= $2
                "#,
                start as NaiveDate,
                end as NaiveDate
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?;
            (result.total.unwrap_or(0), result.income.unwrap_or(0), result.expenses.unwrap_or(0))
        }
        (Some(start), None) => {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0) as total,
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses
                FROM expenses.payments
                WHERE accounting_date >= $1
                "#,
                start as NaiveDate
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?;
            (result.total.unwrap_or(0), result.income.unwrap_or(0), result.expenses.unwrap_or(0))
        }
        (None, Some(end)) => {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0) as total,
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses
                FROM expenses.payments
                WHERE accounting_date <= $1
                "#,
                end as NaiveDate
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?;
            (result.total.unwrap_or(0), result.income.unwrap_or(0), result.expenses.unwrap_or(0))
        }
        (None, None) => {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0) as total,
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses
                FROM expenses.payments
                "#
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?;
            (result.total.unwrap_or(0), result.income.unwrap_or(0), result.expenses.unwrap_or(0))
        }
    };

    Ok(BalanceResponse {
        total_in_cents: total as i32,
        income_in_cents: income as i32,
        expenses_in_cents: expenses as i32,
    })
}
