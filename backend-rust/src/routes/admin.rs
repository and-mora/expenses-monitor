use actix_web::{web, HttpResponse};
use prometheus::{Encoder, Registry, TextEncoder};

/// Prometheus metrics exposition endpoint
pub async fn metrics(registry: web::Data<Registry>) -> HttpResponse {
    let encoder = TextEncoder::new();
    let metric_families = registry.gather();
    let mut buffer = vec![];
    encoder.encode(&metric_families, &mut buffer).unwrap();
    HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body(buffer)
}
