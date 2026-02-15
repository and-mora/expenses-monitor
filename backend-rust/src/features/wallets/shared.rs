use sqlx::PgPool;
use uuid::Uuid;

pub async fn get_wallet_id_by_name(
    pool: &PgPool,
    wallet_name: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        SELECT id
        FROM expenses.wallets
        WHERE name = $1
        "#,
        wallet_name
    )
    .fetch_optional(pool)
    .await?;

    Ok(result.map(|row| row.id))
}
