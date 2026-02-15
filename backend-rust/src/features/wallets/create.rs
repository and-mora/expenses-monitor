use actix_web::{web, HttpResponse};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::WalletName;
use crate::features::wallets::models::{CreateWalletRequest, WalletResponse};

#[tracing::instrument(
    name = "Creating a new wallet",
    skip(pool, request),
    fields(
        wallet_name = %request.name
    )
)]
pub async fn create_wallet(
    pool: web::Data<PgPool>,
    request: web::Json<CreateWalletRequest>,
) -> HttpResponse {
    let wallet = match WalletName::parse(request.name.clone()) {
        Ok(wallet) => wallet,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "error": "Invalid wallet name"
            }));
        }
    };

    let wallet_id = Uuid::new_v4();
    match sqlx::query!(
        r#"
        INSERT INTO expenses.wallets (id, name)
        VALUES ($1, $2)
        "#,
        wallet_id,
        wallet.as_ref()
    )
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => {
            tracing::info!("New wallet created: {}", wallet.as_ref());
            HttpResponse::Created().json(WalletResponse {
                id: wallet_id.to_string(),
                name: wallet.to_string(),
            })
        }
        Err(sqlx::Error::Database(e)) if e.constraint() == Some("unique_wallet_name") => {
            tracing::info!("Wallet name already exists: {}", wallet.as_ref());
            HttpResponse::Conflict().json(json!({
                "error": "Wallet name already exists"
            }))
        }
        Err(e) => {
            tracing::error!("Failed to create wallet: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to create wallet"
            }))
        }
    }
}
