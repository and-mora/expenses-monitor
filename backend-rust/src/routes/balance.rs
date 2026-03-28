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

struct BalanceSummaryRow {
    total: i32,
    income: i32,
    expenses: i32,
}

#[tracing::instrument(name = "Retrieve overall balance", skip(connection_pool, query))]
pub async fn get_balance(
    query: web::Query<BalanceQuery>,
    user: crate::auth::AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    match get_balance_from_db(
        connection_pool.deref(),
        &user.sub,
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
    user_id: &str,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
) -> Result<BalanceResponse, sqlx::Error> {
    let summary = match (start_date, end_date) {
        (Some(start), Some(end)) => {
            sqlx::query_as!(
                BalanceSummaryRow,
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0)::INT as "total!",
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::INT as "income!",
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)::INT as "expenses!"
                FROM expenses.payments
                WHERE user_id = $3 AND accounting_date >= $1 AND accounting_date <= $2
                "#,
                start as NaiveDate,
                end as NaiveDate,
                user_id
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?
        }
        (Some(start), None) => {
            sqlx::query_as!(
                BalanceSummaryRow,
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0)::INT as "total!",
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::INT as "income!",
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)::INT as "expenses!"
                FROM expenses.payments
                WHERE user_id = $2 AND accounting_date >= $1
                "#,
                start as NaiveDate,
                user_id
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?
        }
        (None, Some(end)) => {
            sqlx::query_as!(
                BalanceSummaryRow,
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0)::INT as "total!",
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::INT as "income!",
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)::INT as "expenses!"
                FROM expenses.payments
                WHERE user_id = $2 AND accounting_date <= $1
                "#,
                end as NaiveDate,
                user_id
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?
        }
        (None, None) => {
            sqlx::query_as!(
                BalanceSummaryRow,
                r#"
                SELECT 
                    COALESCE(SUM(amount), 0)::INT as "total!",
                    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)::INT as "income!",
                    COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)::INT as "expenses!"
                FROM expenses.payments
                WHERE user_id = $1
                "#,
                user_id
            )
            .fetch_one(connection_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to execute query: {:?}", e);
                e
            })?
        }
    };

    Ok(BalanceResponse {
        total_in_cents: summary.total,
        income_in_cents: summary.income,
        expenses_in_cents: summary.expenses,
    })
}
