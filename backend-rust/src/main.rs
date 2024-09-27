use expenses_monitor_be::configuration::get_configuration;
use expenses_monitor_be::startup::run;
use expenses_monitor_be::telemetry::{get_subscriber, init_subscriber};
use secrecy::ExposeSecret;
use sqlx::PgPool;
use std::net::TcpListener;

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    // logger configuration
    let subscriber = get_subscriber("expenses-monitor-be".into(), "info".into(), std::io::stdout);
    init_subscriber(subscriber);

    let configuration = get_configuration().expect("Failed to read configuration");

    // tpc configuration
    let address = format!("0.0.0.0:{}", configuration.application.port);
    let listener = TcpListener::bind(address)?;

    // database configuration
    let connection_string = configuration.database.connection_string();
    let connection_pool = PgPool::connect(connection_string.expose_secret())
        .await
        .expect("Failed to connect to database");

    run(listener, connection_pool)?.await
}
