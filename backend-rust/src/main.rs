use expenses_monitor_be::configuration::get_configuration;
use expenses_monitor_be::startup::Application;
use expenses_monitor_be::telemetry::{get_subscriber, init_subscriber};

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let configuration = get_configuration().expect("Failed to read configuration");

    // logger configuration
    let subscriber = get_subscriber(
        configuration.application.name.clone(),
        configuration.application.log.level.clone(),
        std::io::stdout,
        &configuration.otlp,
    );
    init_subscriber(subscriber);

    let application = Application::build(configuration).await?;
    application.run_until_stopped().await
}
