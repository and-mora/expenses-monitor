use actix_web::{web, HttpResponse, Responder};
use chrono::NaiveDateTime;
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Payment {
    #[serde(skip_serializing_if = "Option::is_none")]
    description: String,
    category: String,
    #[serde(rename = "amountInCents")]
    amount_in_cents: i32,
    #[serde(rename = "merchantName")]
    merchant_name: String,
    #[serde(rename = "accountingDate")]
    accounting_date: NaiveDateTime,
}

pub async fn create_payment(
    payload: web::Json<Payment>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let request_id = Uuid::new_v4();
    tracing::info!(
        "request_id {} - Adding '{}' '{}' as a new payment.",
        request_id,
        payload.merchant_name,
        payload.category
    );
    tracing::info!(
        "request_id {} - Saving new payment in the database",
        request_id
    );

    match sqlx::query!(
        "insert into expenses.payments (category, description, merchant_name, accounting_date, amount) values ($1, $2, $3, $4, $5)",
        payload.category,
        payload.description,
        payload.merchant_name,
        payload.accounting_date,
        payload.amount_in_cents
    )
        .execute(connection_pool.get_ref())
        .await
    {
        Ok(_) => {
            tracing::info!(
                "request_id {} - New payment has been saved",
                request_id
            );
            HttpResponse::Ok()
        }
        Err(e) => {
            tracing::error!(
                "request_id {} - Failed to execute query: {:?}",
                request_id,
                e
            );
            HttpResponse::InternalServerError()
        }
    }
}

pub async fn delete_payment(
    path: web::Path<Uuid>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let request_id = Uuid::new_v4();
    let payment_id = path.into_inner();
    tracing::info!(
        "request_id {} - Deleting payment '{}'.",
        request_id,
        payment_id
    );

    match sqlx::query!("delete from expenses.payments where id = $1", payment_id)
        .execute(connection_pool.get_ref())
        .await
    {
        Ok(_) => {
            tracing::info!("request_id {} - payment has been deleted", request_id);
            HttpResponse::Ok()
        }
        Err(e) => {
            tracing::error!(
                "request_id {} - Failed to execute query: {:?}",
                request_id,
                e
            );
            HttpResponse::InternalServerError()
        }
    }
}
