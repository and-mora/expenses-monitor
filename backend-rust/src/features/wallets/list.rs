use actix_web::{web, HttpResponse};
use serde_json::json;
use sqlx::PgPool;

use crate::features::wallets::models::{WalletResponse, WalletsResponse};

#[tracing::instrument(name = "Listing all wallets", skip(pool))]
pub async fn list_wallets(pool: web::Data<PgPool>) -> HttpResponse {
    match sqlx::query!(
        r#"
        SELECT id, name
        FROM expenses.wallets
        ORDER BY name
        "#
    )
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(rows) => {
            let wallets = rows
                .into_iter()
                .map(|row| WalletResponse {
                    id: row.id.to_string(),
                    name: row.name.unwrap_or_default(),
                })
                .collect::<Vec<_>>();
            HttpResponse::Ok().json(WalletsResponse { wallets })
        }
        Err(e) => {
            tracing::error!("Failed to list wallets: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to list wallets"
            }))
        }
    }
}
