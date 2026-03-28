use crate::auth::AuthenticatedUser;
use crate::domain::StagingTransactionStatus;
use actix_web::{web, HttpResponse, Responder};
use chrono::{DateTime, NaiveDate, NaiveDateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StagingListQuery {
    #[serde(default = "default_page")]
    page: i64,
    #[serde(default = "default_size")]
    size: i64,
    status: Option<String>,
    #[serde(rename = "dateFrom")]
    date_from: Option<NaiveDate>,
    #[serde(rename = "dateTo")]
    date_to: Option<NaiveDate>,
    #[serde(rename = "connectionId")]
    connection_id: Option<Uuid>,
}

fn default_page() -> i64 {
    0
}

fn default_size() -> i64 {
    50
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStagingTransactionRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    suggested_category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    suggested_merchant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    status: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportStagingTransactionsRequest {
    #[serde(default)]
    transaction_ids: Vec<Uuid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    default_category_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StagingTransactionDto {
    pub id: Uuid,
    pub bank_connection_id: Uuid,
    pub bank_transaction_id: String,
    pub amount_in_cents: i32,
    pub currency: String,
    pub booking_date: NaiveDate,
    pub value_date: Option<NaiveDate>,
    pub creditor_name: Option<String>,
    pub debtor_name: Option<String>,
    pub remittance_info: Option<String>,
    pub suggested_category: Option<String>,
    pub suggested_merchant: Option<String>,
    pub status: String,
    pub imported_payment_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedStagingResponse {
    pub content: Vec<StagingTransactionDto>,
    pub page: i64,
    pub size: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StagingUpdateResponse {
    pub transaction: StagingTransactionDto,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummaryResponse {
    pub selected_count: i64,
    pub imported_count: i64,
    pub skipped_count: i64,
    pub imported_payment_ids: Vec<Uuid>,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
struct ImportableStagingRow {
    id: Uuid,
    bank_connection_id: Uuid,
    bank_transaction_id: String,
    amount_in_cents: i32,
    currency: String,
    booking_date: NaiveDate,
    value_date: Option<NaiveDate>,
    creditor_name: Option<String>,
    debtor_name: Option<String>,
    remittance_info: Option<String>,
    suggested_category: Option<String>,
    suggested_merchant: Option<String>,
    status: String,
    imported_payment_id: Option<Uuid>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

pub async fn get_staging_transactions(
    query: web::Query<StagingListQuery>,
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let offset = query.page * query.size;
    let status = match query.status.as_ref() {
        Some(status) => match StagingTransactionStatus::parse(status) {
            Ok(status) => Some(status.as_str().to_string()),
            Err(_) => return HttpResponse::BadRequest().body("invalid status"),
        },
        None => None,
    };

    match sqlx::query_as!(
        StagingTransactionDto,
        r#"
        SELECT
            id as "id!",
            bank_connection_id as "bank_connection_id!",
            bank_transaction_id as "bank_transaction_id!",
            amount_in_cents as "amount_in_cents!",
            currency as "currency!",
            booking_date as "booking_date!",
            value_date,
            creditor_name,
            debtor_name,
            remittance_info,
            suggested_category,
            suggested_merchant,
            status as "status!",
            imported_payment_id,
            created_at as "created_at!",
            updated_at as "updated_at!"
        FROM expenses.staging_transactions
        WHERE user_id = $1
          AND ($2::text IS NULL OR status = $2)
          AND ($3::date IS NULL OR booking_date >= $3)
          AND ($4::date IS NULL OR booking_date <= $4)
          AND ($5::uuid IS NULL OR bank_connection_id = $5)
        ORDER BY booking_date ASC, created_at ASC
        LIMIT $6 OFFSET $7
        "#,
        &user.sub,
        status,
        query.date_from,
        query.date_to,
        query.connection_id,
        query.size,
        offset
    )
    .fetch_all(connection_pool.get_ref())
    .await
    {
        Ok(content) => HttpResponse::Ok().json(PagedStagingResponse {
            content,
            page: query.page,
            size: query.size,
        }),
        Err(err) => {
            tracing::error!("Failed to load staging transactions: {:?}", err);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn update_staging_transaction(
    path: web::Path<Uuid>,
    payload: web::Json<UpdateStagingTransactionRequest>,
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let status = match payload.status.as_ref() {
        Some(status) => {
            let parsed = match StagingTransactionStatus::parse(status) {
                Ok(status) => status,
                Err(_) => return HttpResponse::BadRequest().body("invalid status"),
            };
            if matches!(parsed, StagingTransactionStatus::Imported) {
                return HttpResponse::BadRequest()
                    .body("imported status can only be set by import");
            }
            Some(parsed.as_str().to_string())
        }
        None => None,
    };

    let suggested_category = payload
        .suggested_category
        .as_ref()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    let suggested_merchant = payload
        .suggested_merchant
        .as_ref()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let row = match sqlx::query_as!(
        StagingTransactionDto,
        r#"
        UPDATE expenses.staging_transactions
        SET suggested_category = COALESCE($1, suggested_category),
            suggested_merchant = COALESCE($2, suggested_merchant),
            status = COALESCE($3, status),
            updated_at = now()
        WHERE id = $4 AND user_id = $5
        RETURNING
            id as "id!",
            bank_connection_id as "bank_connection_id!",
            bank_transaction_id as "bank_transaction_id!",
            amount_in_cents as "amount_in_cents!",
            currency as "currency!",
            booking_date as "booking_date!",
            value_date,
            creditor_name,
            debtor_name,
            remittance_info,
            suggested_category,
            suggested_merchant,
            status as "status!",
            imported_payment_id,
            created_at as "created_at!",
            updated_at as "updated_at!"
        "#,
        suggested_category,
        suggested_merchant,
        status,
        path.into_inner(),
        &user.sub
    )
    .fetch_optional(connection_pool.get_ref())
    .await
    {
        Ok(Some(row)) => row,
        Ok(None) => return HttpResponse::NotFound().finish(),
        Err(err) => {
            tracing::error!("Failed to update staging transaction: {:?}", err);
            return HttpResponse::InternalServerError().finish();
        }
    };

    HttpResponse::Ok().json(StagingUpdateResponse { transaction: row })
}

pub async fn import_staging_transactions(
    payload: web::Json<ImportStagingTransactionsRequest>,
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let requested_transaction_ids = payload.transaction_ids.clone();
    let default_category_id = payload.default_category_id;
    let mut tx = match connection_pool.begin().await {
        Ok(tx) => tx,
        Err(err) => {
            tracing::error!("Failed to open import transaction: {:?}", err);
            return HttpResponse::InternalServerError().finish();
        }
    };

    let selected_rows: Vec<ImportableStagingRow> = if requested_transaction_ids.is_empty() {
        match sqlx::query_as!(
            ImportableStagingRow,
            r#"
            SELECT
                id as "id!",
                bank_connection_id as "bank_connection_id!",
                bank_transaction_id as "bank_transaction_id!",
                amount_in_cents as "amount_in_cents!",
                currency as "currency!",
                booking_date as "booking_date!",
                value_date,
                creditor_name,
                debtor_name,
                remittance_info,
                suggested_category,
                suggested_merchant,
                status as "status!",
                imported_payment_id,
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM expenses.staging_transactions
            WHERE user_id = $1 AND status = 'reviewed'
            ORDER BY booking_date ASC, created_at ASC
            "#,
            &user.sub
        )
        .fetch_all(&mut *tx)
        .await
        {
            Ok(rows) => rows,
            Err(err) => {
                tracing::error!("Failed to load reviewed staging transactions: {:?}", err);
                return HttpResponse::InternalServerError().finish();
            }
        }
    } else {
        match sqlx::query_as!(
            ImportableStagingRow,
            r#"
            SELECT
                id as "id!",
                bank_connection_id as "bank_connection_id!",
                bank_transaction_id as "bank_transaction_id!",
                amount_in_cents as "amount_in_cents!",
                currency as "currency!",
                booking_date as "booking_date!",
                value_date,
                creditor_name,
                debtor_name,
                remittance_info,
                suggested_category,
                suggested_merchant,
                status as "status!",
                imported_payment_id,
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM expenses.staging_transactions
            WHERE user_id = $1 AND id = ANY($2)
            ORDER BY booking_date ASC, created_at ASC
            "#,
            &user.sub,
            &requested_transaction_ids
        )
        .fetch_all(&mut *tx)
        .await
        {
            Ok(rows) => rows,
            Err(err) => {
                tracing::error!("Failed to load selected staging transactions: {:?}", err);
                return HttpResponse::InternalServerError().finish();
            }
        }
    };

    let mut imported_payment_ids = Vec::new();
    let mut imported_count = 0_i64;
    let mut skipped_count = 0_i64;

    for row in selected_rows {
        match row.status.as_str() {
            "reviewed" => {}
            "imported" => {
                skipped_count += 1;
                if let Some(imported_payment_id) = row.imported_payment_id {
                    imported_payment_ids.push(imported_payment_id);
                }
                continue;
            }
            _ => {
                skipped_count += 1;
                continue;
            }
        }

        let category_id = match resolve_category_id(
            row.suggested_category.as_deref(),
            default_category_id,
            &user.sub,
            &mut tx,
        )
        .await
        {
            Ok(category_id) => category_id,
            Err(response) => return response,
        };

        let payment_id = match insert_imported_payment(&mut tx, &user.sub, category_id, &row).await
        {
            Ok(payment_id) => payment_id,
            Err(response) => return response,
        };

        if let Err(err) = sqlx::query!(
            r#"
            UPDATE expenses.staging_transactions
            SET status = 'imported',
                imported_payment_id = $1,
                updated_at = now()
            WHERE id = $2 AND user_id = $3
            "#,
            payment_id,
            row.id,
            &user.sub
        )
        .execute(&mut *tx)
        .await
        {
            tracing::error!("Failed to mark staging transaction as imported: {:?}", err);
            return HttpResponse::InternalServerError().finish();
        }

        imported_count += 1;
        imported_payment_ids.push(payment_id);
    }

    if let Err(err) = tx.commit().await {
        tracing::error!("Failed to commit staging import transaction: {:?}", err);
        return HttpResponse::InternalServerError().finish();
    }

    HttpResponse::Ok().json(ImportSummaryResponse {
        selected_count: imported_count + skipped_count,
        imported_count,
        skipped_count,
        imported_payment_ids,
    })
}

async fn resolve_category_id<'a>(
    suggested_category: Option<&str>,
    default_category_id: Option<Uuid>,
    user_id: &str,
    tx: &mut sqlx::Transaction<'a, sqlx::Postgres>,
) -> Result<Uuid, HttpResponse> {
    if let Some(category_id) = default_category_id {
        let exists = sqlx::query_scalar!(
            "SELECT id FROM expenses.categories WHERE id = $1 AND user_id = $2",
            category_id,
            user_id
        )
        .fetch_optional(&mut **tx)
        .await
        .map_err(|err| {
            tracing::error!("Failed to validate default category: {:?}", err);
            HttpResponse::InternalServerError().finish()
        })?;
        if exists.is_none() {
            return Err(HttpResponse::BadRequest().body("default category not found"));
        }
        return Ok(category_id);
    }

    let category_name = match suggested_category {
        Some(value) if !value.trim().is_empty() => value.trim().to_string(),
        _ => return Err(HttpResponse::BadRequest().body("missing category for import")),
    };

    let existing = sqlx::query_scalar!(
        "SELECT id FROM expenses.categories WHERE lower(name) = lower($1) AND user_id = $2",
        &category_name,
        user_id
    )
    .fetch_optional(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to look up category: {:?}", err);
        HttpResponse::InternalServerError().finish()
    })?;

    if let Some(category_id) = existing {
        return Ok(category_id);
    }

    let inserted = sqlx::query_scalar!(
        "INSERT INTO expenses.categories (name, user_id) VALUES ($1, $2) RETURNING id",
        category_name,
        user_id
    )
    .fetch_one(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to insert category: {:?}", err);
        HttpResponse::InternalServerError().finish()
    })?;

    Ok(inserted)
}

async fn insert_imported_payment<'a>(
    tx: &mut sqlx::Transaction<'a, sqlx::Postgres>,
    user_id: &str,
    category_id: Uuid,
    row: &ImportableStagingRow,
) -> Result<Uuid, HttpResponse> {
    let merchant_name = row
        .suggested_merchant
        .clone()
        .or_else(|| row.creditor_name.clone())
        .or_else(|| row.debtor_name.clone())
        .unwrap_or_else(|| "Bank transfer".to_string());
    let description = row.remittance_info.clone();
    let booking_date: NaiveDate = row.booking_date;
    let accounting_date = NaiveDateTime::new(
        booking_date,
        NaiveTime::from_hms_opt(0, 0, 0).expect("midnight should be valid"),
    );

    let inserted = sqlx::query_scalar!(
        r#"
        INSERT INTO expenses.payments (
            category_id,
            description,
            merchant_name,
            accounting_date,
            amount,
            wallet_id,
            user_id
        )
        VALUES ($1, $2, $3, $4, $5, NULL, $6)
        RETURNING id
        "#,
        category_id,
        description,
        merchant_name,
        accounting_date,
        row.amount_in_cents,
        user_id
    )
    .fetch_one(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to insert imported payment: {:?}", err);
        HttpResponse::InternalServerError().finish()
    })?;

    Ok(inserted)
}
