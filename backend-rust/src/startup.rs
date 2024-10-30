use crate::routes::{create_payment, delete_payment, health_check};
use actix_web::dev::Server;
use actix_web::{web, App, HttpServer};
use actix_web_opentelemetry::{PrometheusMetricsHandler, RequestMetrics};
use opentelemetry::{global, KeyValue};
use opentelemetry_sdk::metrics::SdkMeterProvider;
use opentelemetry_sdk::Resource;
use sqlx::PgPool;
use std::net::TcpListener;
use tracing_actix_web::TracingLogger;

pub fn run(listener: TcpListener, connection_pool: PgPool) -> Result<Server, std::io::Error> {
    let connection_pool = web::Data::new(connection_pool);

    let (metrics_handler, meter_provider) = {
        let registry = prometheus::Registry::new();
        let exporter = opentelemetry_prometheus::exporter()
            .with_registry(registry.clone())
            .build()
            .unwrap();
        let provider = SdkMeterProvider::builder()
            .with_reader(exporter)
            .with_resource(Resource::new([KeyValue::new("service.name", "my_app")]))
            .build();
        global::set_meter_provider(provider.clone());

        (PrometheusMetricsHandler::new(registry), provider)
    };

    let server = HttpServer::new(move || {
        App::new()
            .wrap(RequestMetrics::default())
            .route("/metrics", web::get().to(metrics_handler.clone()))
            // .route("/metrics", web::get().to(PrometheusMetricsHandler::new(registry.clone())))
            .wrap(TracingLogger::default())
            .route("/health", web::get().to(health_check))
            .route("/api/payment", web::post().to(create_payment))
            .route("/api/payment/{id}", web::delete().to(delete_payment))
            .app_data(connection_pool.clone())
    })
    .listen(listener)?
    .run();

    Ok(server)
}
