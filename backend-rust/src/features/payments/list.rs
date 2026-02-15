use crate::features::payments::models::{
    PagedResponse, PaginationParams, PaymentFilters, PaymentResponseDto, TagResponseDto,
};
use actix_web::{web, HttpResponse, Responder};
use serde_json;
use sqlx::{Error, PgPool};
use std::ops::Deref;
use tracing;
use uuid::Uuid;

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
               w.name as wallet_name,
               COALESCE((SELECT json_agg(
                   json_build_object('id', pt.id, 'key', pt.key, 'value', pt.value)
               ) FROM expenses.payments_tags pt WHERE pt.payment_id = p.id), '[]'::json) as tags
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
            Option<chrono::NaiveDateTime>,
            Option<i32>,
            Option<String>,    // wallet_name
            serde_json::Value, // tags as JSON array
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
        let tags_json = record.9;

        let tags: Vec<TagResponseDto> = match serde_json::from_value(tags_json) {
            Ok(tags) => tags,
            Err(e) => {
                tracing::error!("Failed to parse tags for payment {}: {:?}", payment_id, e);
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
