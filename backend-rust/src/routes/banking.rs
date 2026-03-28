use crate::auth::AuthenticatedUser;
use crate::configuration::BankingSettings;
use crate::domain::{BankConnectionStatus, BankProviderName};
use actix_web::{web, HttpResponse, Responder};
use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::Engine as _;
use chrono::{DateTime, NaiveDate, Utc};
use getrandom::fill as getrandom_fill;
use secrecy::ExposeSecret;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectRequest {
    #[serde(default = "default_provider")]
    provider: String,
    account_id: Option<String>,
    connection_label: Option<String>,
    redirect_uri: Option<String>,
}

fn default_provider() -> String {
    "mock".to_string()
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CallbackQuery {
    code: String,
    state: String,
    #[serde(default = "default_provider")]
    provider: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectResponse {
    pub connection_id: Uuid,
    pub provider: String,
    pub authorization_url: String,
    pub state: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BankingAccountDto {
    pub connection_id: Uuid,
    pub provider: String,
    pub provider_account_id: Option<String>,
    pub connection_label: Option<String>,
    pub connection_status: String,
    pub last_sync_at: Option<DateTime<Utc>>,
    pub last_sync_status: String,
    pub last_sync_created_count: i32,
    pub last_sync_updated_count: i32,
    pub last_sync_duplicate_count: i32,
    pub last_sync_error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResponse {
    pub connection_id: Uuid,
    pub provider: String,
    pub connection_status: String,
    pub created_count: i32,
    pub updated_count: i32,
    pub duplicate_count: i32,
    pub synced_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusResponse {
    pub connection_id: Uuid,
    pub provider: String,
    pub connection_status: String,
    pub last_sync_at: Option<DateTime<Utc>>,
    pub last_sync_status: String,
    pub last_sync_created_count: i32,
    pub last_sync_updated_count: i32,
    pub last_sync_duplicate_count: i32,
    pub last_sync_error: Option<String>,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
struct BankConnection {
    id: Uuid,
    user_id: String,
    provider: String,
    provider_account_id: Option<String>,
    connection_label: Option<String>,
    connection_status: String,
    encrypted_refresh_token: Option<Vec<u8>>,
    oauth_state: Option<String>,
    oauth_state_expires_at: Option<DateTime<Utc>>,
    scopes: Vec<String>,
    last_sync_at: Option<DateTime<Utc>>,
    last_sync_status: String,
    last_sync_created_count: i32,
    last_sync_updated_count: i32,
    last_sync_duplicate_count: i32,
    last_sync_error: Option<String>,
}

#[derive(Debug, Clone)]
struct BankTransaction {
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
}

#[derive(Debug, Clone)]
struct ExistingStagingRow {
    id: Uuid,
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
}

pub async fn banking_connect(
    payload: web::Json<ConnectRequest>,
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let provider = match BankProviderName::parse(&payload.provider) {
        Ok(provider) => provider,
        Err(_) => return HttpResponse::BadRequest().body("unsupported provider"),
    };

    let state = Uuid::new_v4().to_string();
    let expires_at = Utc::now() + chrono::Duration::minutes(15);
    let connection_id = Uuid::new_v4();
    let connection_label = payload.connection_label.clone();
    let provider_account_id = payload.account_id.clone();

    let authorization_url = build_authorization_url(
        provider.as_ref(),
        &state,
        connection_id,
        payload.redirect_uri.as_deref(),
    );

    let result = sqlx::query!(
        r#"
        INSERT INTO expenses.bank_connections (
            id,
            user_id,
            provider,
            provider_account_id,
            connection_label,
            connection_status,
            oauth_state,
            oauth_state_expires_at,
            scopes,
            last_sync_status,
            last_sync_created_count,
            last_sync_updated_count,
            last_sync_duplicate_count,
            created_at,
            updated_at
        )
        VALUES (
            $1, $2, $3, $4, $5, 'pending', $6, $7, $8, 'never', 0, 0, 0, now(), now()
        )
        "#,
        connection_id,
        user.sub,
        provider.as_ref(),
        provider_account_id,
        connection_label,
        &state,
        expires_at,
        &vec!["accounts".to_string(), "transactions".to_string()]
    )
    .execute(connection_pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(ConnectResponse {
            connection_id,
            provider: provider.to_string(),
            authorization_url,
            state: state.clone(),
            expires_at,
        }),
        Err(err) => {
            tracing::error!("Failed to create pending bank connection: {:?}", err);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn banking_callback(
    query: web::Query<CallbackQuery>,
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
    banking_settings: web::Data<BankingSettings>,
) -> impl Responder {
    let provider = match BankProviderName::parse(&query.provider) {
        Ok(provider) => provider,
        Err(_) => return HttpResponse::BadRequest().body("unsupported provider"),
    };

    let mut tx = match connection_pool.begin().await {
        Ok(tx) => tx,
        Err(err) => {
            tracing::error!("Failed to open database transaction: {:?}", err);
            return HttpResponse::InternalServerError().finish();
        }
    };

    let connection =
        match fetch_pending_connection(&mut tx, &user.sub, provider.as_ref(), &query.state).await {
            Ok(Some(connection)) => connection,
            Ok(None) => return HttpResponse::NotFound().body("bank connection not found"),
            Err(err) => {
                tracing::error!("Failed to fetch bank connection: {:?}", err);
                return HttpResponse::InternalServerError().finish();
            }
        };

    if let Some(expires_at) = connection.oauth_state_expires_at {
        if expires_at < Utc::now() {
            return HttpResponse::BadRequest().body("bank connection state expired");
        }
    }

    let provider_state = ProviderAuthState {
        code: query.code.clone(),
        state: query.state.clone(),
    };
    let provider_tokens = match mock_provider_exchange(&connection, &provider_state) {
        Ok(tokens) => tokens,
        Err(err) => {
            let _ = sqlx::query!(
                r#"
                UPDATE expenses.bank_connections
                SET connection_status = 'error',
                    last_sync_status = 'error',
                    last_sync_error = $1,
                    updated_at = now()
                WHERE id = $2 AND user_id = $3
                "#,
                err,
                connection.id,
                user.sub
            )
            .execute(&mut *tx)
            .await;
            let _ = tx.commit().await;
            return HttpResponse::BadRequest().body("bank provider authorization failed");
        }
    };

    let encrypted_refresh_token =
        match encrypt_token(&provider_tokens.refresh_token, banking_settings.get_ref()) {
            Ok(blob) => blob,
            Err(err) => {
                tracing::error!("Failed to encrypt refresh token: {}", err);
                return HttpResponse::InternalServerError().finish();
            }
        };

    let scopes = provider_tokens.scopes.clone();
    let updated = sqlx::query!(
        r#"
        UPDATE expenses.bank_connections
        SET connection_status = 'connected',
            provider_account_id = COALESCE(provider_account_id, $1),
            encrypted_refresh_token = $2,
            oauth_state = NULL,
            oauth_state_expires_at = NULL,
            scopes = $3,
            updated_at = now()
        WHERE id = $4 AND user_id = $5
        "#,
        provider_tokens.provider_account_id,
        encrypted_refresh_token,
        &scopes,
        connection.id,
        user.sub
    )
    .execute(&mut *tx)
    .await;

    if let Err(err) = updated {
        tracing::error!("Failed to update connected bank connection: {:?}", err);
        return HttpResponse::InternalServerError().finish();
    }

    if let Err(err) = tx.commit().await {
        tracing::error!("Failed to commit bank callback transaction: {:?}", err);
        return HttpResponse::InternalServerError().finish();
    }

    HttpResponse::Ok().json(ConnectResponse {
        connection_id: connection.id,
        provider: provider.to_string(),
        authorization_url: build_authorization_url(
            provider.as_ref(),
            &query.state,
            connection.id,
            None,
        ),
        state: query.state.clone(),
        expires_at: Utc::now(),
    })
}

pub async fn banking_accounts(
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    match sqlx::query_as!(
        BankingAccountDto,
        r#"
        SELECT
            id as connection_id,
            provider,
            provider_account_id,
            connection_label,
            connection_status as "connection_status!",
            last_sync_at,
            last_sync_status as "last_sync_status!",
            last_sync_created_count as "last_sync_created_count!",
            last_sync_updated_count as "last_sync_updated_count!",
            last_sync_duplicate_count as "last_sync_duplicate_count!",
            last_sync_error
        FROM expenses.bank_connections
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
        user.sub
    )
    .fetch_all(connection_pool.get_ref())
    .await
    {
        Ok(accounts) => HttpResponse::Ok().json(accounts),
        Err(err) => {
            tracing::error!("Failed to load banking accounts: {:?}", err);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn banking_sync(
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
    banking_settings: web::Data<BankingSettings>,
) -> impl Responder {
    let connection_id = path.into_inner();
    match sync_connection(
        connection_pool.get_ref(),
        banking_settings.get_ref(),
        &user.sub,
        connection_id,
    )
    .await
    {
        Ok(summary) => HttpResponse::Ok().json(summary),
        Err(SyncError::NotFound) => HttpResponse::NotFound().finish(),
        Err(SyncError::Unauthorized) => HttpResponse::NotFound().finish(),
        Err(SyncError::BadRequest(message)) => HttpResponse::BadRequest().body(message),
        Err(SyncError::Persistence) => HttpResponse::InternalServerError().finish(),
    }
}

pub async fn banking_sync_status(
    path: web::Path<Uuid>,
    user: AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let connection_id = path.into_inner();
    match sqlx::query_as!(
        SyncStatusResponse,
        r#"
        SELECT
            id as connection_id,
            provider,
            connection_status as "connection_status!",
            last_sync_at,
            last_sync_status as "last_sync_status!",
            last_sync_created_count as "last_sync_created_count!",
            last_sync_updated_count as "last_sync_updated_count!",
            last_sync_duplicate_count as "last_sync_duplicate_count!",
            last_sync_error
        FROM expenses.bank_connections
        WHERE id = $1 AND user_id = $2
        "#,
        connection_id,
        user.sub
    )
    .fetch_optional(connection_pool.get_ref())
    .await
    {
        Ok(Some(row)) => HttpResponse::Ok().json(row),
        Ok(None) => HttpResponse::NotFound().finish(),
        Err(err) => {
            tracing::error!("Failed to load sync status: {:?}", err);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SyncSummary {
    connection_id: Uuid,
    provider: String,
    connection_status: String,
    created_count: i32,
    updated_count: i32,
    duplicate_count: i32,
    synced_at: DateTime<Utc>,
}

#[derive(Debug)]
#[allow(dead_code)]
enum SyncError {
    NotFound,
    Unauthorized,
    BadRequest(String),
    Persistence,
}

async fn sync_connection(
    connection_pool: &PgPool,
    banking_settings: &BankingSettings,
    user_id: &str,
    connection_id: Uuid,
) -> Result<SyncSummary, SyncError> {
    let mut tx = connection_pool.begin().await.map_err(|err| {
        tracing::error!("Failed to start sync transaction: {:?}", err);
        SyncError::Persistence
    })?;

    let connection = fetch_connection(&mut tx, user_id, connection_id)
        .await?
        .ok_or(SyncError::NotFound)?;

    if connection.connection_status != BankConnectionStatus::Connected.as_str() {
        return Err(SyncError::BadRequest(
            "bank connection is not connected".to_string(),
        ));
    }

    let encrypted_refresh_token = connection
        .encrypted_refresh_token
        .clone()
        .ok_or_else(|| SyncError::BadRequest("missing encrypted refresh token".to_string()))?;
    let refresh_token =
        decrypt_token(&encrypted_refresh_token, banking_settings).map_err(SyncError::BadRequest)?;

    let transactions = mock_provider_fetch_transactions(&connection, &refresh_token)?;
    let mut created_count = 0;
    let mut updated_count = 0;
    let mut duplicate_count = 0;

    for transaction in transactions {
        match upsert_staging_transaction(&mut tx, &connection, transaction).await? {
            UpsertOutcome::Created => created_count += 1,
            UpsertOutcome::Updated => updated_count += 1,
            UpsertOutcome::Duplicate => duplicate_count += 1,
        }
    }

    let synced_at = Utc::now();
    sqlx::query!(
        r#"
        UPDATE expenses.bank_connections
        SET last_sync_at = $1,
            last_sync_status = 'success',
            last_sync_created_count = $2,
            last_sync_updated_count = $3,
            last_sync_duplicate_count = $4,
            last_sync_error = NULL,
            updated_at = now()
        WHERE id = $5 AND user_id = $6
        "#,
        synced_at,
        created_count,
        updated_count,
        duplicate_count,
        connection.id,
        user_id
    )
    .execute(&mut *tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to store sync summary: {:?}", err);
        SyncError::Persistence
    })?;

    tx.commit().await.map_err(|err| {
        tracing::error!("Failed to commit sync transaction: {:?}", err);
        SyncError::Persistence
    })?;

    Ok(SyncSummary {
        connection_id: connection.id,
        provider: connection.provider,
        connection_status: BankConnectionStatus::Connected.as_str().to_string(),
        created_count,
        updated_count,
        duplicate_count,
        synced_at,
    })
}

#[derive(Debug, Clone, Copy)]
enum UpsertOutcome {
    Created,
    Updated,
    Duplicate,
}

async fn upsert_staging_transaction(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    connection: &BankConnection,
    transaction: BankTransaction,
) -> Result<UpsertOutcome, SyncError> {
    let existing = sqlx::query_as!(
        ExistingStagingRow,
        r#"
        SELECT
            id as "id!",
            amount_in_cents as "amount_in_cents!",
            currency as "currency!",
            booking_date as "booking_date!",
            value_date,
            creditor_name,
            debtor_name,
            remittance_info,
            suggested_category,
            suggested_merchant,
            status as "status!"
        FROM expenses.staging_transactions
        WHERE user_id = $1 AND bank_transaction_id = $2
        "#,
        &connection.user_id,
        &transaction.bank_transaction_id
    )
    .fetch_optional(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to lookup staging transaction: {:?}", err);
        SyncError::Persistence
    })?;

    let now = Utc::now();
    match existing {
        Some(existing) => {
            let preserve_user_fields = existing.status != "pending";
            let unchanged = existing.amount_in_cents == transaction.amount_in_cents
                && existing.currency == transaction.currency
                && existing.booking_date == transaction.booking_date
                && existing.value_date == transaction.value_date
                && existing.creditor_name == transaction.creditor_name
                && existing.debtor_name == transaction.debtor_name
                && existing.remittance_info == transaction.remittance_info
                && (preserve_user_fields
                    || (existing.suggested_category == transaction.suggested_category
                        && existing.suggested_merchant == transaction.suggested_merchant));

            sqlx::query!(
                r#"
                UPDATE expenses.staging_transactions
                SET amount_in_cents = $1,
                    currency = $2,
                    booking_date = $3,
                    value_date = $4,
                    creditor_name = $5,
                    debtor_name = $6,
                    remittance_info = $7,
                    suggested_category = CASE WHEN $8 THEN suggested_category ELSE $9 END,
                    suggested_merchant = CASE WHEN $8 THEN suggested_merchant ELSE $10 END,
                    updated_at = $11
                WHERE id = $12 AND user_id = $13
                "#,
                transaction.amount_in_cents,
                transaction.currency,
                transaction.booking_date,
                transaction.value_date,
                transaction.creditor_name,
                transaction.debtor_name,
                transaction.remittance_info,
                preserve_user_fields,
                transaction.suggested_category,
                transaction.suggested_merchant,
                now,
                existing.id,
                &connection.user_id
            )
            .execute(&mut **tx)
            .await
            .map_err(|err| {
                tracing::error!("Failed to update staging transaction: {:?}", err);
                SyncError::Persistence
            })?;

            if unchanged {
                Ok(UpsertOutcome::Duplicate)
            } else {
                Ok(UpsertOutcome::Updated)
            }
        }
        None => {
            sqlx::query!(
                r#"
                INSERT INTO expenses.staging_transactions (
                    id,
                    user_id,
                    bank_connection_id,
                    bank_transaction_id,
                    amount_in_cents,
                    currency,
                    booking_date,
                    value_date,
                    creditor_name,
                    debtor_name,
                    remittance_info,
                    suggested_category,
                    suggested_merchant,
                    status,
                    imported_payment_id,
                    created_at,
                    updated_at
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', NULL, $14, $14
                )
                "#,
                Uuid::new_v4(),
                &connection.user_id,
                connection.id,
                transaction.bank_transaction_id,
                transaction.amount_in_cents,
                transaction.currency,
                transaction.booking_date,
                transaction.value_date,
                transaction.creditor_name,
                transaction.debtor_name,
                transaction.remittance_info,
                transaction.suggested_category,
                transaction.suggested_merchant,
                now
            )
            .execute(&mut **tx)
            .await
            .map_err(|err| {
                tracing::error!("Failed to insert staging transaction: {:?}", err);
                SyncError::Persistence
            })?;

            Ok(UpsertOutcome::Created)
        }
    }
}

async fn fetch_connection(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: &str,
    connection_id: Uuid,
) -> Result<Option<BankConnection>, SyncError> {
    let row = sqlx::query_as!(
        BankConnection,
        r#"
        SELECT
            id as "id!",
            user_id as "user_id!",
            provider as "provider!",
            provider_account_id,
            connection_label,
            connection_status as "connection_status!",
            encrypted_refresh_token,
            oauth_state,
            oauth_state_expires_at,
            scopes as "scopes!",
            last_sync_at,
            last_sync_status as "last_sync_status!",
            last_sync_created_count as "last_sync_created_count!",
            last_sync_updated_count as "last_sync_updated_count!",
            last_sync_duplicate_count as "last_sync_duplicate_count!",
            last_sync_error
        FROM expenses.bank_connections
        WHERE id = $1 AND user_id = $2
        "#,
        connection_id,
        user_id
    )
    .fetch_optional(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch connection: {:?}", err);
        SyncError::Persistence
    })?;

    Ok(row)
}

async fn fetch_pending_connection(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: &str,
    provider: &str,
    state: &str,
) -> Result<Option<BankConnection>, SyncError> {
    let row = sqlx::query_as!(
        BankConnection,
        r#"
        SELECT
            id as "id!",
            user_id as "user_id!",
            provider as "provider!",
            provider_account_id,
            connection_label,
            connection_status as "connection_status!",
            encrypted_refresh_token,
            oauth_state,
            oauth_state_expires_at,
            scopes as "scopes!",
            last_sync_at,
            last_sync_status as "last_sync_status!",
            last_sync_created_count as "last_sync_created_count!",
            last_sync_updated_count as "last_sync_updated_count!",
            last_sync_duplicate_count as "last_sync_duplicate_count!",
            last_sync_error
        FROM expenses.bank_connections
        WHERE user_id = $1 AND provider = $2 AND oauth_state = $3
        "#,
        user_id,
        provider,
        state
    )
    .fetch_optional(&mut **tx)
    .await
    .map_err(|err| {
        tracing::error!("Failed to fetch pending connection: {:?}", err);
        SyncError::Persistence
    })?;

    Ok(row)
}

struct ProviderAuthState {
    code: String,
    state: String,
}

struct ProviderTokens {
    refresh_token: String,
    provider_account_id: Option<String>,
    scopes: Vec<String>,
}

fn mock_provider_exchange(
    connection: &BankConnection,
    state: &ProviderAuthState,
) -> Result<ProviderTokens, String> {
    if connection.provider != "mock" {
        return Err("unsupported provider".to_string());
    }

    let provider_account_id = connection
        .provider_account_id
        .clone()
        .or_else(|| Some(format!("mock-account-{}", connection.id)));

    Ok(ProviderTokens {
        refresh_token: format!("refresh:{}:{}:{}", connection.id, state.code, state.state),
        provider_account_id,
        scopes: vec!["accounts".to_string(), "transactions".to_string()],
    })
}

fn mock_provider_fetch_transactions(
    connection: &BankConnection,
    _refresh_token: &str,
) -> Result<Vec<BankTransaction>, SyncError> {
    if connection.provider != "mock" {
        return Err(SyncError::BadRequest("unsupported provider".to_string()));
    }

    let account_suffix = connection
        .provider_account_id
        .clone()
        .unwrap_or_else(|| connection.id.to_string());
    let base_date = NaiveDate::from_ymd_opt(2026, 3, 1).expect("valid base date");

    Ok(vec![
        BankTransaction {
            bank_transaction_id: format!("{}-tx-001", account_suffix),
            amount_in_cents: -1299,
            currency: "EUR".to_string(),
            booking_date: base_date,
            value_date: Some(base_date),
            creditor_name: Some("Mock Market".to_string()),
            debtor_name: None,
            remittance_info: Some("Groceries".to_string()),
            suggested_category: Some("Groceries".to_string()),
            suggested_merchant: Some("Mock Market".to_string()),
        },
        BankTransaction {
            bank_transaction_id: format!("{}-tx-002", account_suffix),
            amount_in_cents: -560,
            currency: "EUR".to_string(),
            booking_date: base_date.succ_opt().unwrap(),
            value_date: Some(base_date.succ_opt().unwrap()),
            creditor_name: Some("Coffee Bar".to_string()),
            debtor_name: None,
            remittance_info: Some("Coffee".to_string()),
            suggested_category: Some("Dining".to_string()),
            suggested_merchant: Some("Coffee Bar".to_string()),
        },
        BankTransaction {
            bank_transaction_id: format!("{}-tx-003", account_suffix),
            amount_in_cents: 250000,
            currency: "EUR".to_string(),
            booking_date: base_date.succ_opt().unwrap().succ_opt().unwrap(),
            value_date: Some(base_date.succ_opt().unwrap().succ_opt().unwrap()),
            creditor_name: None,
            debtor_name: Some("Mock Employer".to_string()),
            remittance_info: Some("Salary".to_string()),
            suggested_category: Some("Income".to_string()),
            suggested_merchant: Some("Mock Employer".to_string()),
        },
    ])
}

fn build_authorization_url(
    provider: &str,
    state: &str,
    connection_id: Uuid,
    redirect_uri: Option<&str>,
) -> String {
    match redirect_uri {
        Some(redirect_uri) => format!(
            "https://{provider}.local/oauth/authorize?state={state}&connection_id={connection_id}&redirect_uri={redirect_uri}"
        ),
        None => format!(
            "https://{provider}.local/oauth/authorize?state={state}&connection_id={connection_id}"
        ),
    }
}

pub fn encrypt_token(token: &str, settings: &BankingSettings) -> Result<Vec<u8>, String> {
    let key_bytes = base64::engine::general_purpose::STANDARD
        .decode(settings.token_encryption_key.expose_secret())
        .map_err(|_| "invalid AES-GCM key encoding".to_string())?;
    if key_bytes.len() != 32 {
        return Err("AES-GCM key must be 32 bytes".to_string());
    }

    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|_| "failed to initialize AES-GCM cipher".to_string())?;
    let mut nonce_bytes = [0u8; 12];
    getrandom_fill(&mut nonce_bytes).map_err(|_| "failed to generate nonce".to_string())?;
    let nonce = Nonce::from(nonce_bytes);
    let ciphertext = cipher
        .encrypt(&nonce, token.as_bytes())
        .map_err(|_| "failed to encrypt token".to_string())?;

    let mut output = nonce_bytes.to_vec();
    output.extend_from_slice(&ciphertext);
    Ok(output)
}

pub fn decrypt_token(ciphertext: &[u8], settings: &BankingSettings) -> Result<String, String> {
    if ciphertext.len() < 13 {
        return Err("encrypted token is too short".to_string());
    }

    let key_bytes = base64::engine::general_purpose::STANDARD
        .decode(settings.token_encryption_key.expose_secret())
        .map_err(|_| "invalid AES-GCM key encoding".to_string())?;
    if key_bytes.len() != 32 {
        return Err("AES-GCM key must be 32 bytes".to_string());
    }

    let (nonce_bytes, encrypted) = ciphertext.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|_| "failed to initialize AES-GCM cipher".to_string())?;
    let nonce = Nonce::from(
        <[u8; 12]>::try_from(nonce_bytes).map_err(|_| "invalid nonce length".to_string())?,
    );
    let plaintext = cipher
        .decrypt(&nonce, encrypted)
        .map_err(|_| "failed to decrypt token".to_string())?;
    String::from_utf8(plaintext).map_err(|_| "decrypted token is not valid UTF-8".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn banking_settings() -> BankingSettings {
        BankingSettings {
            token_encryption_key: secrecy::SecretString::from(
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=".to_string(),
            ),
        }
    }

    #[test]
    fn encrypt_and_decrypt_refresh_token() {
        let settings = banking_settings();
        let token = "refresh-token";
        let encrypted = encrypt_token(token, &settings).expect("token should encrypt");
        let decrypted = decrypt_token(&encrypted, &settings).expect("token should decrypt");
        assert_eq!(decrypted, token);
    }

    #[test]
    fn invalid_provider_rejected() {
        assert!(BankProviderName::parse("unknown").is_err());
    }
}
