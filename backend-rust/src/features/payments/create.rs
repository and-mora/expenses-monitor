use crate::domain::{Payment, PaymentDescription, PaymentMerchant};
use crate::features::payments::models::{
    CategoryIdentifier, PaymentResponseDto, TagDto, TagResponseDto,
};
use crate::features::wallets::shared::get_wallet_id_by_name;
use actix_web::web::Json;
use actix_web::{web, HttpResponse, Responder};
use chrono::NaiveDateTime;
use serde::Deserialize;
use sqlx::{Error, PgPool, Row};
use tracing;
use uuid::Uuid;

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreatePaymentRequest {
    pub description: Option<String>,
    pub category_id: CategoryIdentifier,
    #[serde(rename = "amountInCents")]
    pub amount_in_cents: i32,
    #[serde(rename = "merchantName")]
    pub merchant_name: String,
    #[serde(rename = "accountingDate")]
    pub accounting_date: NaiveDateTime,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wallet: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<TagDto>>,
}

impl TryFrom<CreatePaymentRequest> for Payment {
    type Error = String;

    fn try_from(dto: CreatePaymentRequest) -> Result<Self, Self::Error> {
        let description = dto
            .description
            .filter(|s| !s.trim().is_empty())
            .map(PaymentDescription::parse)
            .transpose()?;
        let merchant_name = PaymentMerchant::parse(dto.merchant_name.clone())?;
        Ok(Self {
            description,
            category_id: Uuid::nil(), // Will be set after resolution
            amount_in_cents: dto.amount_in_cents,
            merchant_name,
            accounting_date: dto.accounting_date,
            wallet_id: None, // Will be set after resolution
        })
    }
}

#[tracing::instrument(
    name = "Creating a new payment",
    skip(payload, connection_pool),
    fields(
        merchant_name = %payload.merchant_name,
        category_id = ?payload.category_id
    )
)]
pub async fn create_payment(
    payload: Json<CreatePaymentRequest>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let tags = payload.0.tags.clone();
    let wallet_name_input = payload.0.wallet.clone();

    // Resolve wallet_id from wallet name
    let wallet_id = if let Some(name) = &wallet_name_input {
        match get_wallet_id_by_name(connection_pool.get_ref(), name).await {
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

    // Resolve category identifier to canonical UUID
    let resolved_category_id: Uuid = match payload.0.category_id.clone() {
        CategoryIdentifier::Uid(uid) => uid,
        CategoryIdentifier::Name(name) => {
            match sqlx::query_scalar!(
                "SELECT id FROM expenses.categories WHERE LOWER(name) = LOWER($1)",
                name
            )
            .fetch_optional(connection_pool.get_ref())
            .await
            {
                Ok(Some(id)) => id,
                Ok(None) => {
                    // Category not found: create it (safe due to unique index on lower(name)).
                    match sqlx::query_scalar!(
                        "INSERT INTO expenses.categories (name) VALUES ($1) RETURNING id",
                        name
                    )
                    .fetch_one(connection_pool.get_ref())
                    .await
                    {
                        Ok(new_id) => new_id,
                        Err(insert_err) => {
                            tracing::warn!(
                                "Failed to insert category (maybe concurrent): {:?}",
                                insert_err
                            );
                            // Try to select again in case another request inserted it concurrently
                            match sqlx::query_scalar!(
                                "SELECT id FROM expenses.categories WHERE LOWER(name) = LOWER($1)",
                                name
                            )
                            .fetch_optional(connection_pool.get_ref())
                            .await
                            {
                                Ok(Some(id)) => id,
                                Ok(None) => {
                                    tracing::error!(
                                        "Failed to create category and it does not exist: {}",
                                        name
                                    );
                                    return HttpResponse::InternalServerError().finish();
                                }
                                Err(e) => {
                                    tracing::error!("Failed to lookup category by name after insert error: {:?}", e);
                                    return HttpResponse::InternalServerError().finish();
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to lookup category by name: {:?}", e);
                    return HttpResponse::InternalServerError().finish();
                }
            }
        }
    };

    // Validate category exists when UUID was provided by client
    match sqlx::query_scalar!(
        "SELECT id FROM expenses.categories WHERE id = $1",
        resolved_category_id
    )
    .fetch_optional(connection_pool.get_ref())
    .await
    {
        Ok(Some(_)) => {}
        Ok(None) => return HttpResponse::BadRequest().body("categoryId not found"),
        Err(e) => {
            tracing::error!("Failed to validate category: {:?}", e);
            return HttpResponse::InternalServerError().finish();
        }
    }

    let request = &payload.0;
    let mut payment = match Payment::try_from(request.clone()) {
        Ok(payment) => payment,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };
    payment.category_id = resolved_category_id;
    payment.wallet_id = wallet_id;

    match insert_payment(&payment, connection_pool.get_ref()).await {
        Ok(payment_id) => {
            // Insert tags if provided
            if let Some(tags) = tags {
                if let Err(e) =
                    insert_payment_tags(payment_id, tags, connection_pool.get_ref()).await
                {
                    tracing::error!("Failed to insert tags: {:?}", e);
                    // Continue anyway, tags are optional
                }
            }

            // Fetch wallet name if wallet_id is provided
            let wallet_name = if let Some(wid) = wallet_id {
                get_wallet_name(wid, connection_pool.get_ref())
                    .await
                    .ok()
                    .flatten()
            } else {
                None
            };

            // Fetch tags for response
            let response_tags = get_payment_tags(payment_id, connection_pool.get_ref())
                .await
                .unwrap_or_default();

            let response = PaymentResponseDto {
                id: payment_id,
                description: payment.description.as_ref().map(|d| d.as_ref().to_string()),
                amount_in_cents: payment.amount_in_cents,
                merchant_name: payment.merchant_name.as_ref().to_string(),
                accounting_date: payment.accounting_date,
                category: {
                    // fetch category name from categories table
                    match sqlx::query_scalar!(
                        "SELECT name FROM expenses.categories WHERE id = $1",
                        payment.category_id
                    )
                    .fetch_one(connection_pool.get_ref())
                    .await
                    {
                        Ok(name) => name,
                        Err(e) => {
                            tracing::error!("Failed to load category name for response: {:?}", e);
                            String::new()
                        }
                    }
                },
                category_id: Some(payment.category_id),
                category_icon: {
                    match sqlx::query_scalar!(
                        "SELECT icon FROM expenses.categories WHERE id = $1",
                        payment.category_id
                    )
                    .fetch_optional(connection_pool.get_ref())
                    .await
                    {
                        Ok(Some(icon)) => icon,
                        Ok(None) => None,
                        Err(e) => {
                            tracing::error!("Failed to fetch category icon: {:?}", e);
                            None
                        }
                    }
                },
                wallet: wallet_name,
                tags: response_tags,
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
    let row = sqlx::query(
        "insert into expenses.payments (category_id, description, merchant_name, accounting_date, amount, wallet_id) values ($1, $2, $3, $4, $5, $6) RETURNING id",
    )
    .bind(payment.category_id)
    .bind(payment.description.as_ref().map(|d| d.as_ref()))
    .bind(payment.merchant_name.as_ref())
    .bind(payment.accounting_date)
    .bind(payment.amount_in_cents)
    .bind(payment.wallet_id)
    .fetch_one(connection_pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to execute query: {:?}", e);
        e
    })?;
    let id: Uuid = row.try_get("id")?;
    Ok(id)
}

#[tracing::instrument(name = "Inserting payment tags", skip(connection_pool))]
async fn insert_payment_tags(
    payment_id: Uuid,
    tags: Vec<TagDto>,
    connection_pool: &PgPool,
) -> Result<(), Error> {
    for tag in tags {
        // Insert directly into payments_tags (denormalized structure)
        sqlx::query!(
            r#"
            INSERT INTO expenses.payments_tags (payment_id, key, value)
            VALUES ($1, $2, $3)
            "#,
            payment_id,
            tag.key,
            tag.value
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
        SELECT id, key, value
        FROM expenses.payments_tags
        WHERE payment_id = $1
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
        SELECT name as "name!"
        FROM expenses.wallets
        WHERE id = $1
        "#,
        wallet_id
    )
    .fetch_optional(connection_pool)
    .await?;

    Ok(result.map(|r| r.name))
}
