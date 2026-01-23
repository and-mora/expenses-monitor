use crate::configuration::Settings;
use crate::routes::{
    create_payment, create_wallet, delete_payment, delete_wallet, get_balance, get_categories,
    get_recent_payments, get_wallets, greet, health_check,
};
use crate::telemetry::init_meter;
use actix_cors::Cors;
use actix_web::dev::Server;
use actix_web::{http, web, App, HttpServer};
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
        // Configure CORS for local development
        let cors = Cors::default()
            .allowed_origin("http://localhost:5173") // Vite default port
            .allowed_origin("http://localhost:5174") // Vite alternate port
            .allowed_origin("http://localhost:3000") // Next.js fallback
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("http://127.0.0.1:5174")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_methods(vec!["GET", "POST", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                http::header::AUTHORIZATION,
                http::header::ACCEPT,
                http::header::CONTENT_TYPE,
            ])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(RequestMetrics::default())
            .route("/metrics", web::get().to(metrics_handler.clone()))
            .wrap(TracingLogger::default())
            .route("/health", web::get().to(health_check))
            .route("/api/payments/categories", web::get().to(get_categories))
            .route("/greet", web::get().to(greet))
            .route("/api/payments", web::get().to(get_recent_payments))
            .route("/api/payments", web::post().to(create_payment))
            .route("/api/payments/{id}", web::delete().to(delete_payment))
            .route("/api/balance", web::get().to(get_balance))
            .route("/api/wallets", web::get().to(get_wallets))
            .route("/api/wallets", web::post().to(create_wallet))
            .route("/api/wallets/{id}", web::delete().to(delete_wallet))
            .app_data(connection_pool.clone())
    })
    .listen(listener)?
    .run();

    Ok(server)
}
