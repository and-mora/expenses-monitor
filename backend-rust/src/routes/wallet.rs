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
    user: crate::auth::AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let wallet_name = match WalletName::parse(payload.name.clone()) {
        Ok(name) => name,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };

    let user_id = user.sub;

    let input_wallet = Wallet {
        id: None,
        user_id,
        name: wallet_name,
    };

    match insert_wallet(&input_wallet, connection_pool.deref()).await {
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

#[tracing::instrument(name = "Inserting wallet in database", skip(wallet, pool))]
async fn insert_wallet(wallet: &Wallet, pool: &PgPool) -> Result<Wallet, sqlx::Error> {
    let row = sqlx::query!(
        r#"
        INSERT INTO expenses.wallets (name, user_id)
        VALUES ($1, $2)
        RETURNING id, name as "name!", user_id
        "#,
        wallet.name.as_ref(),
        wallet.user_id
    )
    .fetch_one(pool)
    .await?;

    Ok(Wallet {
        id: Some(row.id),
        user_id: row.user_id,
        name: WalletName::parse(row.name).expect("Stored name should be valid"),
    })
}

#[tracing::instrument(name = "Get all wallets", skip(connection_pool))]
pub async fn get_wallets(
    user: crate::auth::AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let user_id = user.sub;

    match get_wallets_from_db(&user_id, connection_pool.deref()).await {
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
async fn get_wallets_from_db(user_id: &str, pool: &PgPool) -> Result<Vec<Wallet>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
        SELECT id, name as "name!", user_id
        FROM expenses.wallets
        WHERE user_id = $1
        ORDER BY name
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    let wallets = rows
        .into_iter()
        .map(|row| Wallet {
            id: Some(row.id),
            user_id: row.user_id,
            name: WalletName::parse(row.name).expect("Stored name should be valid"),
        })
        .collect();

    Ok(wallets)
}

#[tracing::instrument(name = "Deleting a wallet", skip(path, connection_pool))]
pub async fn delete_wallet(
    path: web::Path<Uuid>,
    user: crate::auth::AuthenticatedUser,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let wallet_id = path.into_inner();
    let user_id = user.sub;

    match delete_wallet_from_db(wallet_id, connection_pool.deref(), &user_id).await {
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
async fn delete_wallet_from_db(id: Uuid, pool: &PgPool, user_id: &str) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM expenses.wallets
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

#[tracing::instrument(name = "Get wallet ID by name", skip(pool))]
pub async fn get_wallet_id_by_name(
    name: &str,
    pool: &PgPool,
    user_id: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        SELECT id
        FROM expenses.wallets
        WHERE name = $1 AND user_id = $2
        "#,
        name,
        user_id
    )
    .fetch_optional(pool)
    .await?;

    Ok(result.map(|r| r.id))
}
