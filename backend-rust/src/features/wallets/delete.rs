use actix_web::{web, HttpResponse};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

#[tracing::instrument(
    name = "Deleting a wallet",
    skip(pool, path),
    fields(
        wallet_id = %path.as_ref()
    )
)]
pub async fn delete_wallet(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> HttpResponse {
    let wallet_id = path.into_inner();

    match sqlx::query!(
        r#"
        DELETE FROM expenses.wallets
        WHERE id = $1
        "#,
        wallet_id
    )
    .execute(pool.get_ref())
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                HttpResponse::NotFound().json(json!({
                    "error": "Wallet not found"
                }))
            } else {
                tracing::info!("Wallet deleted: {}", wallet_id);
                HttpResponse::NoContent().finish()
            }
        }
        Err(e) => {
            tracing::error!("Failed to delete wallet: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to delete wallet"
            }))
        }
    }
}
