use crate::configuration::Settings;
use crate::routes::{create_payment, delete_payment, get_categories, greet, health_check};
use crate::telemetry::init_meter;
use actix_web::dev::Server;
use actix_web::{web, App, HttpServer};
use actix_web_opentelemetry::{PrometheusMetricsHandler, RequestMetrics};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::net::TcpListener;
use tracing_actix_web::TracingLogger;

pub struct Application {
    port: u16,
    server: Server,
}

impl Application {
    pub async fn build(configuration: Settings) -> Result<Self, std::io::Error> {
        let metrics_handler = init_meter(&configuration.otlp);

        // tpc configuration
        let address = format!("0.0.0.0:{}", configuration.application.port);
        let listener = TcpListener::bind(address)?;
        let port = listener.local_addr()?.port();

        // database configuration
        let connection_pool = get_connection_pool(&configuration);

        let server = run(listener, connection_pool, metrics_handler)?;

        Ok(Self { port, server })
    }

    pub fn port(&self) -> u16 {
        self.port
    }

    // A more expressive name that makes it clear that
    // this function only returns when the application is stopped.
    pub async fn run_until_stopped(self) -> Result<(), std::io::Error> {
        self.server.await
    }
}

pub fn get_connection_pool(configuration: &Settings) -> PgPool {
    PgPoolOptions::new().connect_lazy_with(configuration.database.connect_options())
}

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
            .app_data(connection_pool.clone())
    })
    .listen(listener)?
    .run();

    Ok(server)
}
