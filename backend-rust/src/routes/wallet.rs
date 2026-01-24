use crate::domain::{Wallet, WalletName};
use actix_web::{web, HttpResponse, Responder};
use sqlx::PgPool;
use std::ops::Deref;
use uuid::Uuid;

#[derive(serde::Deserialize)]
pub struct WalletDto {
    pub id: Option<Uuid>,
    pub name: String,
}

impl From<Wallet> for WalletDto {
    fn from(wallet: Wallet) -> Self {
        Self {
            id: wallet.id,
            name: wallet.name.as_ref().to_string(),
        }
    }
}

#[derive(serde::Serialize)]
pub struct WalletResponseDto {
    pub id: Uuid,
    pub name: String,
}

#[tracing::instrument(
    name = "Creating a new wallet",
    skip(payload, connection_pool),
    fields(wallet_name = %payload.name)
)]
pub async fn create_wallet(
    payload: web::Json<WalletDto>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let wallet_name = match WalletName::parse(payload.name.clone()) {
        Ok(name) => name,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };

    match insert_wallet(&wallet_name, connection_pool.deref()).await {
        Ok(wallet) => HttpResponse::Ok().json(WalletResponseDto {
            id: wallet.id.unwrap(),
            name: wallet.name.as_ref().to_string(),
        }),
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            // Check for unique constraint violation (Postgres error code 23505)
            if let Some(db_error) = e.as_database_error() {
                if db_error.code().as_deref() == Some("23505") {
                    return HttpResponse::Conflict().finish();
                }
            }
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(name = "Inserting wallet in database", skip(name, pool))]
async fn insert_wallet(name: &WalletName, pool: &PgPool) -> Result<Wallet, sqlx::Error> {
    let row = sqlx::query!(
        r#"
        INSERT INTO expenses.wallets (name)
        VALUES ($1)
        RETURNING id, name
        "#,
        name.as_ref()
    )
    .fetch_one(pool)
    .await?;

    Ok(Wallet {
        id: Some(row.id),
        name: WalletName::parse(row.name.unwrap_or_default()).expect("Stored name should be valid"),
    })
}

#[tracing::instrument(name = "Get all wallets", skip(connection_pool))]
pub async fn get_wallets(connection_pool: web::Data<PgPool>) -> impl Responder {
    match get_wallets_from_db(connection_pool.deref()).await {
        Ok(wallets) => {
            let dtos: Vec<WalletResponseDto> = wallets
                .into_iter()
                .map(|w| WalletResponseDto {
                    id: w.id.unwrap(),
                    name: w.name.as_ref().to_string(),
                })
                .collect();
            HttpResponse::Ok().json(dtos)
        }
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(name = "Retrieving wallets from database", skip(pool))]
async fn get_wallets_from_db(pool: &PgPool) -> Result<Vec<Wallet>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
        SELECT id, name
        FROM expenses.wallets
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await?;

    let wallets = rows
        .into_iter()
        .map(|row| Wallet {
            id: Some(row.id),
            name: WalletName::parse(row.name.unwrap_or_default())
                .expect("Stored name should be valid"),
        })
        .collect();

    Ok(wallets)
}

#[tracing::instrument(name = "Deleting a wallet", skip(path, connection_pool))]
pub async fn delete_wallet(
    path: web::Path<Uuid>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let wallet_id = path.into_inner();
    match delete_wallet_from_db(wallet_id, connection_pool.deref()).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            // Check for foreign key violation (Postgres error code 23503)
            if let Some(db_error) = e.as_database_error() {
                if db_error.code().as_deref() == Some("23503") {
                    return HttpResponse::Conflict().finish();
                }
            }
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[tracing::instrument(name = "Deleting wallet from database", skip(pool))]
async fn delete_wallet_from_db(id: Uuid, pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM expenses.wallets
        WHERE id = $1
        "#,
        id
    )
    .execute(pool)
    .await?;
    Ok(())
}

#[tracing::instrument(name = "Get wallet ID by name", skip(pool))]
pub async fn get_wallet_id_by_name(name: &str, pool: &PgPool) -> Result<Option<Uuid>, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        SELECT id
        FROM expenses.wallets
        WHERE name = $1
        "#,
        name
    )
    .fetch_optional(pool)
    .await?;

    Ok(result.map(|r| r.id))
}
