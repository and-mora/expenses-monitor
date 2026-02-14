use crate::configuration::Settings;
use crate::routes::{
    create_payment, create_wallet, delete_payment, delete_wallet, get_balance, get_categories,
    get_recent_payments, get_wallets, greet, health_check, metrics, update_payment,
};
use crate::telemetry::init_meter;
use actix_cors::Cors;
use actix_web::dev::Server;
use actix_web::{http, web, App, HttpServer};
use opentelemetry_instrumentation_actix_web::RequestMetrics;
use prometheus::Registry;
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
        let metrics_registry = init_meter(&configuration.otlp);

        // tpc configuration
        let address = format!("0.0.0.0:{}", configuration.application.port);
        let listener = TcpListener::bind(address)?;
        let port = listener.local_addr()?.port();

        // database configuration
        let connection_pool = get_connection_pool(&configuration);

        let server = run(listener, connection_pool, metrics_registry)?;

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
    PgPoolOptions::new()
        .max_connections(10) // Limit max connections to prevent pool exhaustion
        .min_connections(2) // Keep some connections ready
        .acquire_timeout(std::time::Duration::from_secs(30)) // Timeout for acquiring connections
        .connect_lazy_with(configuration.database.connect_options())
}

pub fn run(
    listener: TcpListener,
    connection_pool: PgPool,
    metrics_registry: Registry,
) -> Result<Server, std::io::Error> {
    let connection_pool = web::Data::new(connection_pool);
    let metrics_registry = web::Data::new(metrics_registry);

    let server = HttpServer::new(move || {
        // Configure CORS for local development and production
        let cors = Cors::default()
            .allowed_origin("http://localhost:5173") // Vite default port
            .allowed_origin("http://localhost:5174") // Vite alternate port
            .allowed_origin("http://localhost:3000") // Next.js fallback
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("http://127.0.0.1:5174")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("https://expenses.expmonitor.freeddns.org") // Production frontend
            .allowed_origin("https://expmonitor.freeddns.org") // Legacy frontend (if still in use)
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                http::header::AUTHORIZATION,
                http::header::ACCEPT,
                http::header::CONTENT_TYPE,
            ])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(RequestMetrics::default())
            .route("/metrics", web::get().to(metrics))
            .wrap(TracingLogger::default())
            .route("/health", web::get().to(health_check))
            .route("/api/payments/categories", web::get().to(get_categories))
            .route("/greet", web::get().to(greet))
            .route("/api/payments", web::get().to(get_recent_payments))
            .route("/api/payments", web::post().to(create_payment))
            .route("/api/payments/{id}", web::put().to(update_payment))
            .route("/api/payments/{id}", web::delete().to(delete_payment))
            .route("/api/balance", web::get().to(get_balance))
            .route("/api/wallets", web::get().to(get_wallets))
            .route("/api/wallets", web::post().to(create_wallet))
            .route("/api/wallets/{id}", web::delete().to(delete_wallet))
            .app_data(metrics_registry.clone())
            .app_data(connection_pool.clone())
    })
    .listen(listener)?
    .run();

    Ok(server)
}
