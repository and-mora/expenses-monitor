use crate::domain::{Payment, PaymentCategory, PaymentDescription, PaymentMerchant};
use actix_web::{web, HttpResponse, Responder};
use chrono::NaiveDateTime;
use serde::Deserialize;
use sqlx::{Error, PgPool};
use std::ops::Deref;
use actix_web::web::Json;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct PaymentDto {
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

impl TryFrom<Json<PaymentDto>> for Payment {
    type Error = String;

    fn try_from(json: Json<PaymentDto>) -> Result<Self, Self::Error> {
        let category_name = PaymentCategory::parse(json.0.category.clone())?;
        let description = PaymentDescription::parse(json.0.description.clone())?;
        let merchant_name = PaymentMerchant::parse(json.0.merchant_name.clone())?;
        Ok(Self {
            description,
            merchant_name,
            category: category_name,
            amount_in_cents: json.0.amount_in_cents,
            accounting_date: json.0.accounting_date,
        })
    }
}

#[tracing::instrument(
    name = "Creating a new payment",
    skip(payload, connection_pool),
    fields(
        merchant_name = %payload.merchant_name,
        category = %payload.category
    )
)]
pub async fn create_payment(
    payload: Json<PaymentDto>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let payment = match Payment::try_from(payload) {
        Ok(payment) => payment,
        Err(_) => return HttpResponse::BadRequest().finish()
    };
    match insert_payment(&payment, connection_pool.deref()).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(
    name = "Inserting a new payment in the database",
    skip(payment, connection_pool)
)]
async fn insert_payment(payment: &Payment, connection_pool: &PgPool) -> Result<(), Error> {
    sqlx::query!(
        "insert into expenses.payments (category, description, merchant_name, accounting_date, amount) values ($1, $2, $3, $4, $5)",
        payment.category.as_ref(),
        payment.description.as_ref(),
        payment.merchant_name.as_ref(),
        payment.accounting_date,
        payment.amount_in_cents
    )
        .execute(connection_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
            // Using the `?` operator to return early
            // if the function failed, returning a sqlx::Error
        })?;
    Ok(())
}

#[tracing::instrument(
    name = "Deleting a payment",
    skip(path, connection_pool),
    fields(
        payment_id = %path.clone()
    )
)]
pub async fn delete_payment(
    path: web::Path<Uuid>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let payment_id = path.into_inner();

    match delete_payment_query(connection_pool.get_ref(), payment_id).await {
        Ok(_) => HttpResponse::Ok().await,
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().await
        }
    }
}

#[tracing::instrument(
    name = "Deleting a payment in the database",
    skip(payment_id, connection_pool)
)]
async fn delete_payment_query(connection_pool: &PgPool, payment_id: Uuid) -> Result<(), Error> {
    sqlx::query!("delete from expenses.payments where id = $1", payment_id)
        .execute(connection_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
            // Using the `?` operator to return early
            // if the function failed, returning a sqlx::Error
        })?;
    Ok(())
}

/*
 categories
*/
#[tracing::instrument(name = "Retrieve all categories", skip(connection_pool))]
pub async fn get_categories(connection_pool: web::Data<PgPool>) -> impl Responder {
    match get_categories_from_db(connection_pool.deref()).await {
        Ok(categories) => HttpResponse::Ok().json(categories),
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(
    name = "Retrieving all categories from database",
    skip(connection_pool)
)]
async fn get_categories_from_db(connection_pool: &PgPool) -> Result<Vec<String>, Error> {
    let categories = sqlx::query!("select distinct category from expenses.payments")
        .fetch_all(connection_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
        })?
        .into_iter()
        .map(|cat| cat.category.unwrap())
        .collect();

    Ok(categories)
}
