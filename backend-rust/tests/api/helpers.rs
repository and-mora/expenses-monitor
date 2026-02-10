use expenses_monitor_be::configuration::{get_configuration, DatabaseSettings, TelemetrySettings};
use expenses_monitor_be::startup::{get_connection_pool, Application};
use expenses_monitor_be::telemetry::{get_subscriber, init_subscriber};
use once_cell::sync::Lazy;
use secrecy::ExposeSecret;
use sqlx::{Executor, PgPool};
use uuid::Uuid;

static TRACING: Lazy<()> = Lazy::new(|| {
    let default_filter_level = "info".to_string();
    let subscriber_name = "test".to_string();
    let otlp_settings = TelemetrySettings {
        grpc_endpoint: String::from("http://localhost:4317"),
        service_name: String::from("be"),
    };
    // We cannot assign the output of `get_subscriber` to a variable based on the
    // value TEST_LOG` because the sink is part of the type returned by
    // `get_subscriber`, therefore they are not the same type. We could work around
    // it, but this is the most straight-forward way of moving forward.
    if std::env::var("TEST_LOG").is_ok() {
        let subscriber = get_subscriber(
            subscriber_name,
            default_filter_level,
            std::io::stdout,
            &otlp_settings,
        );
        init_subscriber(subscriber);
    } else {
        let subscriber = get_subscriber(
            subscriber_name,
            default_filter_level,
            std::io::sink,
            &otlp_settings,
        );
        init_subscriber(subscriber);
    };
});

pub struct TestApp {
    pub address: String,
    pub db_pool: PgPool,
}

impl TestApp {
    pub async fn post_payment(&self, body: &str) -> reqwest::Response {
        // Tests historically posted `category` as a name. After API change we
        // require `categoryId` (UUID). To keep tests concise we transform the
        // body: if it contains `category` but not `categoryId`, ensure the
        // category exists in the DB and replace it with `categoryId`.
        let mut payload: serde_json::Value = match serde_json::from_str(body) {
            Ok(v) => v,
            Err(_) => {
                // Not JSON (some tests send empty string) - forward as-is
                return reqwest::Client::new()
                    .post(format!("{}/api/payments", &self.address))
                    .header("Content-Type", "application/json")
                    .body(body.to_owned())
                    .send()
                    .await
                    .expect("Failed to execute request.");
            }
        };

        if payload.get("categoryId").is_none() {
            if let Some(cat_val) = payload.get("category") {
                if let Some(cat_name) = cat_val.as_str() {
                    let cat_trimmed = cat_name.trim();
                    // Only map non-empty category names to ids. Empty category should be
                    // left as-is so server validation can reject it.
                    if !cat_trimmed.is_empty() {
                        // Try to find existing category (case-insensitive)
                        if let Ok(row) = sqlx::query_scalar!(
                            "SELECT id FROM expenses.categories WHERE lower(name) = lower($1)",
                            cat_trimmed
                        )
                        .fetch_optional(&self.db_pool)
                        .await
                        {
                            let id = if let Some(id) = row {
                                id
                            } else {
                                // Insert and return id
                                sqlx::query_scalar!(
                                    "INSERT INTO expenses.categories (name) VALUES ($1) RETURNING id",
                                    cat_trimmed
                                )
                                .fetch_one(&self.db_pool)
                                .await
                                .expect("Failed to insert category in test helper")
                            };
                            // Replace payload
                            if let Some(m) = payload.as_object_mut() {
                                m.remove("category");
                                m.insert(
                                    "categoryId".to_string(),
                                    serde_json::Value::String(id.to_string()),
                                );
                            }
                        }
                    }
                }
            }
        }

        let body = serde_json::to_string(&payload).expect("Failed to serialize payload");
        reqwest::Client::new()
            .post(format!("{}/api/payments", &self.address))
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_categories(&self) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/payments/categories", &self.address))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_payments(&self, query: &str) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/payments{}", &self.address, query))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_balance(&self) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/balance", &self.address))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_balance_with_query(&self, query: &str) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/balance{}", &self.address, query))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn create_wallet(&self, body: &str) -> reqwest::Response {
        reqwest::Client::new()
            .post(format!("{}/api/wallets", &self.address))
            .header("Content-Type", "application/json")
            .body(body.to_owned())
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn post_wallet(&self, body: &str) -> reqwest::Response {
        self.create_wallet(body).await
    }

    pub async fn get_wallets(&self) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/wallets", &self.address))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn delete_wallet(&self, id: uuid::Uuid) -> reqwest::Response {
        reqwest::Client::new()
            .delete(format!("{}/api/wallets/{}", &self.address, id))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn delete_payment(&self, id: uuid::Uuid) -> reqwest::Response {
        reqwest::Client::new()
            .delete(format!("{}/api/payments/{}", &self.address, id))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn update_payment(&self, id: uuid::Uuid, body: &str) -> reqwest::Response {
        // Mirror the post_payment behaviour: translate `category` name -> `categoryId`
        // for update requests as well to keep test payloads using names working.
        let mut payload: serde_json::Value = match serde_json::from_str(body) {
            Ok(v) => v,
            Err(_) => {
                return reqwest::Client::new()
                    .put(format!("{}/api/payments/{}", &self.address, id))
                    .header("Content-Type", "application/json")
                    .body(body.to_owned())
                    .send()
                    .await
                    .expect("Failed to execute request.");
            }
        };

        if payload.get("categoryId").is_none() {
            if let Some(cat_val) = payload.get("category") {
                if let Some(cat_name) = cat_val.as_str() {
                    let cat_trimmed = cat_name.trim();
                    if !cat_trimmed.is_empty() {
                        if let Ok(row) = sqlx::query_scalar!(
                            "SELECT id FROM expenses.categories WHERE lower(name) = lower($1)",
                            cat_trimmed
                        )
                        .fetch_optional(&self.db_pool)
                        .await
                        {
                            let id = if let Some(id) = row {
                                id
                            } else {
                                sqlx::query_scalar!(
                                    "INSERT INTO expenses.categories (name) VALUES ($1) RETURNING id",
                                    cat_trimmed
                                )
                                .fetch_one(&self.db_pool)
                                .await
                                .expect("Failed to insert category in test helper")
                            };
                            if let Some(m) = payload.as_object_mut() {
                                m.remove("category");
                                m.insert(
                                    "categoryId".to_string(),
                                    serde_json::Value::String(id.to_string()),
                                );
                            }
                        }
                    }
                }
            }
        }

        let body = serde_json::to_string(&payload).expect("Failed to serialize payload");
        reqwest::Client::new()
            .put(format!("{}/api/payments/{}", &self.address, id))
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .expect("Failed to execute request.")
    }
}

pub async fn spawn_app() -> TestApp {
    // let subscriber = get_subscriber("test".into(), "info".into());
    // init_subscriber(subscriber);
    Lazy::force(&TRACING);

    let configuration = {
        let mut config = get_configuration().expect("Failed to read configuration.");
        // Use a different database for each test case
        config.database.database_name = Uuid::new_v4().to_string();
        // Use a random OS port
        config.application.port = 0;
        config
    };

    configure_database(&configuration.database).await;

    let application = Application::build(configuration.clone())
        .await
        .expect("Failed to build application.");

    // Get the port before spawning the application
    let address = format!("http://127.0.0.1:{}", application.port());
    tokio::spawn(application.run_until_stopped());
    TestApp {
        address,
        db_pool: get_connection_pool(&configuration),
    }
}

pub async fn configure_database(config: &DatabaseSettings) -> PgPool {
    let connection = PgPool::connect(config.connection_string_without_db().expose_secret())
        .await
        .expect("failed to connect db.");

    // Validate database name to prevent SQL injection
    let db_name = &config.database_name;
    if !db_name
        .chars()
        .all(|c| c.is_alphanumeric() || c == '_' || c == '-')
    {
        panic!("Invalid database name: only alphanumeric, underscore, and hyphen allowed");
    }

    // create the brand-new database (safe: validated above)
    connection
        .execute(format!(r#"CREATE DATABASE "{}";"#, db_name).as_str())
        .await
        .expect("failed to create db");

    let connection_pool = PgPool::connect(config.connection_string().expose_secret())
        .await
        .expect("failed to connect");

    sqlx::migrate!("./migrations")
        .run(&connection_pool)
        .await
        .expect("failed to migrate db");

    connection_pool
}
