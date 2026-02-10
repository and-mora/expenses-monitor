use crate::domain::{Payment, PaymentDescription, PaymentMerchant};
use crate::routes::wallet::get_wallet_id_by_name;
use actix_web::web::Json;
use actix_web::{web, HttpResponse, Responder};
use chrono::NaiveDateTime;
use serde::Deserialize;
use sqlx::{Error, PgPool, Row};
use std::ops::Deref;
use uuid::Uuid;

#[derive(Deserialize, Debug, Clone)]
pub struct TagDto {
    key: String,
    value: String,
}

#[derive(Deserialize)]
pub struct PaymentDto {
    description: Option<String>,
    // Now require canonical category id (UUID). Breaking change: clients must send `categoryId`.
    #[serde(rename = "categoryId")]
    category_id: Uuid,
    #[serde(rename = "amountInCents")]
    amount_in_cents: i32,
    #[serde(rename = "merchantName")]
    merchant_name: String,
    #[serde(rename = "accountingDate")]
    accounting_date: NaiveDateTime,
    #[serde(skip_serializing_if = "Option::is_none")]
    wallet: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tags: Option<Vec<TagDto>>,
}

impl Payment {
    fn try_from_dto(dto: PaymentDto, wallet_id: Option<Uuid>) -> Result<Self, String> {
        // category_id is now canonical; we don't parse category name here
        // Parse description only if provided and non-empty
        let description = dto
            .description
            .filter(|s| !s.trim().is_empty())
            .map(PaymentDescription::parse)
            .transpose()?;
        let merchant_name = PaymentMerchant::parse(dto.merchant_name.clone())?;
        Ok(Self {
            description,
            category_id: dto.category_id,
            amount_in_cents: dto.amount_in_cents,
            merchant_name,
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
        category_id = %payload.category_id
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
        match get_wallet_id_by_name(name, connection_pool.get_ref()).await {
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

    // Create payment: now require canonical category_id provided by client
    let payment_data = payload.0;
    // Validate category exists
    match sqlx::query_scalar!(
        "SELECT id FROM expenses.categories WHERE id = $1",
        payment_data.category_id
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

    let payment = match Payment::try_from_dto(payment_data, wallet_id) {
        Ok(payment) => payment,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };
    // category_id already set on domain model via try_from_dto

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

#[tracing::instrument(
    name = "Updating a payment",
    skip(path, payload, connection_pool),
    fields(
        payment_id = %path.clone(),
        merchant_name = %payload.merchant_name,
        category_id = %payload.category_id
    )
)]
pub async fn update_payment(
    path: web::Path<Uuid>,
    payload: Json<PaymentDto>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let payment_id = path.into_inner();
    let tags = payload.0.tags.clone();
    let wallet_name_input = payload.0.wallet.clone();

    // Audit log: log payment modification
    tracing::info!("Updating payment with id: {}", payment_id);

    // Resolve wallet_id from wallet name
    let wallet_id = if let Some(name) = &wallet_name_input {
        match get_wallet_id_by_name(name, connection_pool.get_ref()).await {
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
    let payment_data = payload.0;
    // Validate category exists
    match sqlx::query_scalar!(
        "SELECT id FROM expenses.categories WHERE id = $1",
        payment_data.category_id
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
    };

    let payment = match Payment::try_from_dto(payment_data, wallet_id) {
        Ok(payment) => payment,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };

    // Update payment in database
    match update_payment_query(&payment, payment_id, connection_pool.get_ref()).await {
        Ok(_) => {
            // Delete existing tags
            if let Err(e) = delete_payment_tags(payment_id, connection_pool.get_ref()).await {
                tracing::error!("Failed to delete existing tags: {:?}", e);
                return HttpResponse::InternalServerError().finish();
            }

            // Insert new tags if provided
            if let Some(tags) = tags {
                if let Err(e) =
                    insert_payment_tags(payment_id, tags, connection_pool.get_ref()).await
                {
                    tracing::error!("Failed to insert tags: {:?}", e);
                    return HttpResponse::InternalServerError().finish();
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

            tracing::info!("Successfully updated payment: {}", payment_id);
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            tracing::error!("Failed to update payment: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(name = "Updating payment in database", skip(payment, connection_pool))]
async fn update_payment_query(
    payment: &Payment,
    payment_id: Uuid,
    connection_pool: &PgPool,
) -> Result<(), Error> {
    sqlx::query(
        r#"
        UPDATE expenses.payments
        SET category_id = $1,
                description = $2,
                merchant_name = $3,
                accounting_date = $4,
                amount = $5,
                wallet_id = $6
            WHERE id = $7
        "#,
    )
    .bind(payment.category_id)
    .bind(payment.description.as_ref().map(|d| d.as_ref()))
    .bind(payment.merchant_name.as_ref())
    .bind(payment.accounting_date)
    .bind(payment.amount_in_cents)
    .bind(payment.wallet_id)
    .bind(payment_id)
    .execute(connection_pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to execute update query: {:?}", e);
        e
    })?;
    Ok(())
}

#[tracing::instrument(name = "Deleting payment tags", skip(connection_pool))]
async fn delete_payment_tags(payment_id: Uuid, connection_pool: &PgPool) -> Result<(), Error> {
    sqlx::query!(
        "DELETE FROM expenses.payments_tags WHERE payment_id = $1",
        payment_id
    )
    .execute(connection_pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to delete payment tags: {:?}", e);
        e
    })?;
    Ok(())
}

/*
 categories
*/
#[derive(Deserialize, Debug)]
pub struct CategoryQuery {
    #[serde(rename = "type")]
    category_type: Option<String>,
}

use serde::Serialize as SerSerialize;

#[derive(SerSerialize)]
pub struct CategoryDto {
    #[serde(rename = "id")]
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "icon", skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

#[tracing::instrument(name = "Retrieve all categories", skip(connection_pool))]
pub async fn get_categories(
    connection_pool: web::Data<PgPool>,
    query: web::Query<CategoryQuery>,
) -> impl Responder {
    match get_categories_from_db(connection_pool.get_ref(), query.category_type.as_deref()).await {
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
async fn get_categories_from_db(
    connection_pool: &PgPool,
    category_type: Option<&str>,
) -> Result<Vec<CategoryDto>, Error> {
    // Build query to return category name and optional icon
    let query = match category_type {
        Some("expense") => "select distinct c.id, c.name, c.icon from expenses.categories c join expenses.payments p on p.category_id = c.id where p.amount < 0",
        Some("income") => "select distinct c.id, c.name, c.icon from expenses.categories c join expenses.payments p on p.category_id = c.id where p.amount > 0",
        _ => "select c.id, c.name, c.icon from expenses.categories c",
    };

    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>)>(query)
        .fetch_all(connection_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to execute query: {:?}", e);
            e
        })?;
    let categories = rows
        .into_iter()
        .map(|(id, name, icon)| CategoryDto { id, name, icon })
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
    #[serde(rename = "dateFrom")]
    date_from: Option<String>,
    #[serde(rename = "dateTo")]
    date_to: Option<String>,
    category: Option<String>,
    wallet: Option<String>,
    search: Option<String>,
}

#[derive(Clone, Debug)]
struct PaymentFilters {
    date_from: Option<String>,
    date_to: Option<String>,
    category: Option<String>,
    wallet: Option<String>,
    search: Option<String>,
}

impl From<&PaginationParams> for PaymentFilters {
    fn from(params: &PaginationParams) -> Self {
        Self {
            date_from: params.date_from.clone(),
            date_to: params.date_to.clone(),
            category: params.category.clone(),
            wallet: params.wallet.clone(),
            search: params.search.clone(),
        }
    }
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
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(rename = "amountInCents")]
    amount_in_cents: i32,
    #[serde(rename = "merchantName")]
    merchant_name: String,
    #[serde(rename = "accountingDate")]
    accounting_date: NaiveDateTime,
    category: String,
    #[serde(rename = "categoryId")]
    #[serde(skip_serializing_if = "Option::is_none")]
    category_id: Option<Uuid>,
    #[serde(rename = "categoryIcon")]
    #[serde(skip_serializing_if = "Option::is_none")]
    category_icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    wallet: Option<String>,
    tags: Vec<TagResponseDto>,
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
    let filters = PaymentFilters::from(params.deref());

    match get_recent_payments_from_db(connection_pool.get_ref(), params.size, offset, filters).await
    {
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
    filters: PaymentFilters,
) -> Result<Vec<PaymentResponseDto>, Error> {
    // Build dynamic WHERE clause conditions with proper parameter indexing
    let mut conditions = Vec::new();
    let mut param_index = 3; // Start after limit ($1) and offset ($2)

    let date_from_param_idx = if filters.date_from.is_some() {
        let idx = param_index;
        conditions.push(format!("DATE(p.accounting_date) >= ${}::date", idx));
        param_index += 1;
        Some(idx)
    } else {
        None
    };

    let date_to_param_idx = if filters.date_to.is_some() {
        let idx = param_index;
        conditions.push(format!("DATE(p.accounting_date) <= ${}::date", idx));
        param_index += 1;
        Some(idx)
    } else {
        None
    };

    let category_param_idx = if filters.category.is_some() {
        let idx = param_index;
        // If the provided category filter is a UUID, filter by category_id, otherwise filter by category name
        if filters
            .category
            .as_ref()
            .and_then(|s| s.parse::<Uuid>().ok())
            .is_some()
        {
            conditions.push(format!("p.category_id = ${}", idx));
        } else {
            conditions.push(format!("LOWER(c.name) = LOWER(${})", idx));
        }
        param_index += 1;
        Some(idx)
    } else {
        None
    };

    let wallet_param_idx = if filters.wallet.is_some() {
        let idx = param_index;
        conditions.push(format!("w.name = ${}", idx));
        param_index += 1;
        Some(idx)
    } else {
        None
    };

    let search_param_idx = if filters.search.is_some() {
        let idx = param_index;
        conditions.push(format!(
            "(LOWER(p.merchant_name) LIKE ${} OR LOWER(p.description) LIKE ${})",
            idx, idx
        ));
        Some(idx)
    } else {
        None
    };

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let query_str = format!(
        r#"
         SELECT p.id,
             c.name AS category_name,
             c.icon AS category_icon,
             p.category_id,
               p.description,
               p.merchant_name,
               p.accounting_date,
               p.amount,
               w.name as wallet_name
        FROM expenses.payments p
        LEFT JOIN expenses.categories c ON p.category_id = c.id
        LEFT JOIN expenses.wallets w ON p.wallet_id = w.id
        {}
        ORDER BY p.accounting_date DESC
        LIMIT $1 OFFSET $2
        "#,
        where_clause
    );

    // Build query with proper parameters in order
    let mut query = sqlx::query_as::<
        _,
        (
            Uuid,
            Option<String>, // category_name
            Option<String>, // category_icon (from categories.icon)
            Option<Uuid>,   // category_id
            Option<String>, // description
            Option<String>, // merchant_name
            Option<NaiveDateTime>,
            Option<i32>,
            Option<String>,
        ),
    >(&query_str)
    .bind(limit)
    .bind(offset);

    if let (Some(_), Some(df)) = (date_from_param_idx, &filters.date_from) {
        query = query.bind(df);
    }
    if let (Some(_), Some(dt)) = (date_to_param_idx, &filters.date_to) {
        query = query.bind(dt);
    }
    if let (Some(_), Some(cat)) = (category_param_idx, &filters.category) {
        // Bind as UUID when possible, otherwise bind as string
        if let Ok(uid) = cat.parse::<Uuid>() {
            query = query.bind(uid);
        } else {
            query = query.bind(cat.clone());
        }
    }
    if let (Some(_), Some(wal)) = (wallet_param_idx, &filters.wallet) {
        query = query.bind(wal);
    }
    if let (Some(_), Some(s)) = (search_param_idx, &filters.search) {
        let search_pattern = format!("%{}%", s.to_lowercase());
        query = query.bind(search_pattern);
    }

    let records = query.fetch_all(connection_pool).await.map_err(|e| {
        tracing::error!("Failed to execute query: {:?}", e);
        e
    })?;

    let mut result = Vec::new();
    for record in records {
        let payment_id = record.0;
        let tags = match get_payment_tags(payment_id, connection_pool).await {
            Ok(tags) => {
                tracing::debug!("Retrieved {} tags for payment {}", tags.len(), payment_id);
                tags
            }
            Err(e) => {
                tracing::error!(
                    "Failed to retrieve tags for payment {}: {:?}",
                    payment_id,
                    e
                );
                Vec::new()
            }
        };

        result.push(PaymentResponseDto {
            id: payment_id,
            description: record.4,
            amount_in_cents: record.7.unwrap_or(0),
            merchant_name: record.5.unwrap_or_default(),
            accounting_date: record.6.unwrap_or_default(),
            category: record.1.unwrap_or_default(),
            category_id: record.3,
            category_icon: record.2,
            wallet: record.8,
            tags,
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
