use crate::routes::{create_payment, delete_payment, get_categories, greet, health_check, login};
use actix_web::dev::Server;
use actix_web::{web, App, HttpServer};
use actix_web_opentelemetry::{PrometheusMetricsHandler, RequestMetrics};
use sqlx::PgPool;
use std::net::TcpListener;
use tracing_actix_web::TracingLogger;

pub fn run(
    listener: TcpListener,
    connection_pool: PgPool,
    metrics_handler: PrometheusMetricsHandler,
) -> Result<Server, std::io::Error> {
    let connection_pool = web::Data::new(connection_pool);

    let server = HttpServer::new(move || {
        App::new()
            .wrap(RequestMetrics::default())
            .route("/metrics", web::get().to(metrics_handler.clone()))
            .wrap(TracingLogger::default())
            .route("/health", web::get().to(health_check))
            .route("/api/payment/categories", web::get().to(get_categories))
            .route("/greet", web::get().to(greet))
            .route("/api/payment", web::post().to(create_payment))
            .route("/api/payment/{id}", web::delete().to(delete_payment))
            .route("/login", web::post().to(login))
            .app_data(connection_pool.clone())
    })
    .listen(listener)?
    .run();

    Ok(server)
}
