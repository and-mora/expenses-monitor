use crate::features::payments::models::{CategoryDto, CategoryQuery};
use actix_web::{web, HttpResponse, Responder};
use sqlx::{Error, PgPool};
use tracing;
use uuid::Uuid;

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
        Some("expense") => {
            "select c.id, c.name, c.icon from expenses.categories c where c.kind = 'expense'"
        }
        Some("income") => {
            "select c.id, c.name, c.icon from expenses.categories c where c.kind = 'income'"
        }
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
