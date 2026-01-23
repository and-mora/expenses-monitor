use crate::domain::{Payment, PaymentCategory, PaymentDescription, PaymentMerchant};
use crate::routes::wallet::get_wallet_id_by_name;
use actix_web::web::Json;
use actix_web::{web, HttpResponse, Responder};
use chrono::NaiveDateTime;
use serde::Deserialize;
use sqlx::{Error, PgPool};
use std::ops::Deref;
use uuid::Uuid;

#[derive(Deserialize, Debug, Clone)]
pub struct TagDto {
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<Uuid>,
    key: String,
    value: String,
}

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
    #[serde(skip_serializing_if = "Option::is_none")]
    wallet: Option<String>, // Changed from wallet_id to wallet (name)
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<Vec<TagDto>>,
}

impl Payment {
    fn try_from_dto(dto: PaymentDto, wallet_id: Option<Uuid>) -> Result<Self, String> {
        let category_name = PaymentCategory::parse(dto.category.clone())?;
        let description = PaymentDescription::parse(dto.description.clone())?;
        let merchant_name = PaymentMerchant::parse(dto.merchant_name.clone())?;
        Ok(Self {
            description,
            merchant_name,
            category: category_name,
            amount_in_cents: dto.amount_in_cents,
            accounting_date: dto.accounting_date,
            wallet_id,
        })
    }
}

impl TryFrom<Json<PaymentDto>> for Payment {
    type Error = String;

    fn try_from(json: Json<PaymentDto>) -> Result<Self, Self::Error> {
        Self::try_from_dto(json.0, None)
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
    let tags = payload.0.tags.clone();
    let wallet_name_input = payload.0.wallet.clone();

    // Resolve wallet_id from wallet name
    let wallet_id = if let Some(name) = &wallet_name_input {
        match get_wallet_id_by_name(name, connection_pool.deref()).await {
            Ok(Some(id)) => Some(id),
            Ok(None) => {
                tracing::error!("Wallet not found: {}", name);
                return HttpResponse::BadRequest().body(format!("Wallet '{}' not found", name));
            }
            Err(e) => {
                tracing::error!("Failed to lookup wallet: {:?}", e);
                return HttpResponse::InternalServerError().finish();
            }
        }
    } else {
        None
    };

    // Create payment with resolved wallet_id
    let mut payment_data = payload.0;
    let payment = match Payment::try_from_dto(payment_data, wallet_id) {
        Ok(payment) => payment,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };

    match insert_payment(&payment, connection_pool.deref()).await {
        Ok(payment_id) => {
            // Insert tags if provided
            if let Some(tags) = tags {
                if let Err(e) = insert_payment_tags(payment_id, tags, connection_pool.deref()).await {
                    tracing::error!("Failed to insert tags: {:?}", e);
                    // Continue anyway, tags are optional
                }
            }

            // Fetch wallet name if wallet_id is provided
            let wallet_name = if let Some(wid) = wallet_id {
                get_wallet_name(wid, connection_pool.deref()).await.ok().flatten()
            } else {
                None
            };

            // Fetch tags for response
            let response_tags = get_payment_tags(payment_id, connection_pool.deref())
                .await
                .unwrap_or_default();

            let response = PaymentResponseDto {
                id: payment_id,
                description: payment.description.as_ref().to_string(),
                amount_in_cents: payment.amount_in_cents,
                merchant_name: payment.merchant_name.as_ref().to_string(),
                accounting_date: payment.accounting_date,
                category: payment.category.as_ref().to_string(),
                wallet: wallet_name,
                tags: if response_tags.is_empty() { None } else { Some(response_tags) },
            };

            HttpResponse::Ok().json(response)
        }
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
async fn insert_payment(payment: &Payment, connection_pool: &PgPool) -> Result<Uuid, Error> {
    let row = sqlx::query!(
        "insert into expenses.payments (category, description, merchant_name, accounting_date, amount, wallet_id) values ($1, $2, $3, $4, $5, $6) RETURNING id",
        payment.category.as_ref(),
        payment.description.as_ref(),
        payment.merchant_name.as_ref(),
        payment.accounting_date,
        payment.amount_in_cents,
        payment.wallet_id
    )
        .fetch_one(connection_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
        })?;
    Ok(row.id)
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
        Ok(_) => HttpResponse::NoContent().finish(),
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(
    name = "Deleting a payment in the database",
    skip(payment_id, connection_pool)
)]
async fn delete_payment_query(connection_pool: &PgPool, payment_id: Uuid) -> Result<(), Error> {
    // First, delete all associated tags to avoid foreign key constraint violation
    sqlx::query!(
        "delete from expenses.payments_tags where payment_id = $1",
        payment_id
    )
    .execute(connection_pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to delete payment tags: {:?}", e);
        e
    })?;

    // Then delete the payment itself
    sqlx::query!("delete from expenses.payments where id = $1", payment_id)
        .execute(connection_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete payment: {:?}", e);
            e
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
        .filter_map(|cat| cat.category)
        .collect();

    Ok(categories)
}

/*
 get recent payments (paginated)
*/

#[derive(Deserialize)]
pub struct PaginationParams {
    #[serde(default)]
    page: i64,
    #[serde(default = "default_size")]
    size: i64,
}

fn default_size() -> i64 {
    10
}

use serde::Serialize;

#[derive(Serialize)]
pub struct TagResponseDto {
    id: Uuid,
    key: String,
    value: String,
}

#[derive(Serialize)]
pub struct PaymentResponseDto {
    id: Uuid,
    description: String,
    #[serde(rename = "amountInCents")]
    amount_in_cents: i32,
    #[serde(rename = "merchantName")]
    merchant_name: String,
    #[serde(rename = "accountingDate")]
    accounting_date: NaiveDateTime,
    category: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    wallet: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<Vec<TagResponseDto>>,
}

#[derive(Serialize)]
pub struct PagedResponse<T> {
    content: Vec<T>,
    page: i64,
    size: i64,
}

#[tracing::instrument(name = "Retrieve recent payments", skip(connection_pool, params))]
pub async fn get_recent_payments(
    params: web::Query<PaginationParams>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let offset = params.page * params.size;
    
    match get_recent_payments_from_db(connection_pool.deref(), params.size, offset).await {
        Ok(payments) => {
            let response = PagedResponse {
                content: payments,
                page: params.page,
                size: params.size,
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(
    name = "Retrieving recent payments from database",
    skip(connection_pool)
)]
async fn get_recent_payments_from_db(
    connection_pool: &PgPool,
    limit: i64,
    offset: i64,
) -> Result<Vec<PaymentResponseDto>, Error> {
    let payments = sqlx::query!(
        r#"
        SELECT p.id, p.category, p.description, p.merchant_name, p.accounting_date, p.amount, w.name as wallet_name
        FROM expenses.payments p
        LEFT JOIN expenses.wallets w ON p.wallet_id = w.id
        ORDER BY p.accounting_date DESC
        LIMIT $1 OFFSET $2
        "#,
        limit,
        offset
    )
    .fetch_all(connection_pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to execute query: {:?}", e);
        e
    })?;

    let mut result = Vec::new();
    for record in payments {
        let payment_id = record.id;
        let tags = get_payment_tags(payment_id, connection_pool).await.unwrap_or_default();

        result.push(PaymentResponseDto {
            id: payment_id,
            description: record.description.unwrap_or_default(),
            amount_in_cents: record.amount.unwrap_or(0),
            merchant_name: record.merchant_name.unwrap_or_default(),
            accounting_date: record.accounting_date.unwrap_or_default(),
            category: record.category.unwrap_or_default(),
            wallet: record.wallet_name,
            tags: if tags.is_empty() { None } else { Some(tags) },
        });
    }

    Ok(result)
}

/*
 Helper functions for tags
*/

#[tracing::instrument(name = "Inserting payment tags", skip(connection_pool))]
async fn insert_payment_tags(
    payment_id: Uuid,
    tags: Vec<TagDto>,
    connection_pool: &PgPool,
) -> Result<(), Error> {
    for tag in tags {
        // Insert or get tag id
        let tag_id = if let Some(id) = tag.id {
            id
        } else {
            // Insert new tag or get existing one
            let row = sqlx::query!(
                r#"
                INSERT INTO expenses.tags (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key, value) DO UPDATE SET key = EXCLUDED.key
                RETURNING id
                "#,
                tag.key,
                tag.value
            )
            .fetch_one(connection_pool)
            .await?;
            row.id
        };

        // Link payment to tag
        sqlx::query!(
            r#"
            INSERT INTO expenses.payment_tags (payment_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            "#,
            payment_id,
            tag_id
        )
        .execute(connection_pool)
        .await?;
    }
    Ok(())
}

#[tracing::instrument(name = "Retrieving payment tags", skip(connection_pool))]
async fn get_payment_tags(
    payment_id: Uuid,
    connection_pool: &PgPool,
) -> Result<Vec<TagResponseDto>, Error> {
    let tags = sqlx::query!(
        r#"
        SELECT t.id, t.key, t.value
        FROM expenses.tags t
        INNER JOIN expenses.payment_tags pt ON pt.tag_id = t.id
        WHERE pt.payment_id = $1
        "#,
        payment_id
    )
    .fetch_all(connection_pool)
    .await?
    .into_iter()
    .map(|row| TagResponseDto {
        id: row.id,
        key: row.key,
        value: row.value,
    })
    .collect();

    Ok(tags)
}

#[tracing::instrument(name = "Retrieving wallet name", skip(connection_pool))]
async fn get_wallet_name(
    wallet_id: Uuid,
    connection_pool: &PgPool,
) -> Result<Option<String>, Error> {
    let result = sqlx::query!(
        r#"
        SELECT name
        FROM expenses.wallets
        WHERE id = $1
        "#,
        wallet_id
    )
    .fetch_optional(connection_pool)
    .await?;

    Ok(result.and_then(|r| r.name))
}
