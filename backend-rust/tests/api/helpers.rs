use actix_web::{web, App, HttpResponse, HttpServer};
use expenses_monitor_be::configuration::{get_configuration, DatabaseSettings, TelemetrySettings};
use expenses_monitor_be::startup::{get_connection_pool, Application};
use expenses_monitor_be::telemetry::{get_subscriber, init_subscriber};
use jsonwebtoken::{Algorithm, EncodingKey, Header};
use once_cell::sync::Lazy;
use secrecy::ExposeSecret;
use secrecy::SecretString;
use sqlx::{Executor, PgPool};
use std::net::TcpListener;
use uuid::Uuid;

pub const TEST_PRIVATE_KEY_PEM: &str = r#"-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDiy17qpkObhc0A
9gy/K4b6CIjcSsShztgvc0ylh4ZqHBdcpnO8KIsthqoMlbpBSEsb5v/NaNQ1/zZK
mCzvvtuVRHzr0hEB3A8uPR1TbdeeyHlLcJGKpdLd4dUNQhEN/9nDBeYwnhzFHsZh
K+U2hrWcfuWRvx/ZzuQMh99Ay4O4qd4c83rEFnZjS82mDsOFkFHAmkK8BeTdZWMk
lWzd52ZGkBKbw2Qdim2wlgmI+zGEv/1uL6GAY37HFv/TTcNpm7JrN0FPObaRnOAy
2NVfoBHLEEdE7fOpbUj9gcMCG4eu2y+40fhClRv2lKgDGE+dcz+gzebFsRJbKIaq
rinUzar9AgMBAAECggEAFmEhHaCIfVlHsHeXLGocKKIc9zf9jUX++Te0cYUdE21w
NLlMJF4P1c87CoDf3z9GAhvaVCerASUM83Fuxb2cp28ZsJ+LBBb1/IcVVL07ELUR
mwshoX/ZfgGh52wEiNAdaew0GcoQZrcxtjcBqE7ErwuqlaY5e2G6CS6DLj6m4drZ
vRJgxs7GaAN152efba++MZdo5Zgk/yC/md/3wr7Fbm2anGCgrO3+f92b74LkLM+i
lLM+DH79eXRIPUNhoa+y286hx6yavgk4s8iQITOewpi4sbadoYR3D63OyfvmKywI
3PNOHQqzr0WxHkIH70NWOO1B8eGcdAUyrxshtUUHYQKBgQDyLJ1+7eQvYEkERpK2
uVdbcCz9oaRbQZ3YyQMZZhclYVBukKBMyWwcFWhFqWrYK/AmZ+5RY8PXiP5bYNW1
HEEDWfOlcdf81VZpBac+RD/Q/FLpYEtD/2H1mcunGJYCjnuSxrlUMp+fssWuFqq3
BacbxWgmhL8oHdli2qFb0QKa9QKBgQDvvfp3xZaULCVE2IQ2EsHal0z9BH0Q0nUO
CMaNyfjcf6GIzzHvAiZWcO/ILvCYD/E8ErtJO/lQ2WZwr+u6p7cOF6hUt6Q2e971
pvzx4tFuC5pw1l9WZLngEiuUnezpWrbv/zFCtSgqcUcGHi5o65bg1AP6y5demJt4
/SUyY1La6QKBgQDcfZyD1WpdbCfuuaaYsRUFTpPX9RTkdVCW8SVeOaI3SWvmzsz0
PKuuwhrm2gJKgW6sORI1jkTf933Gitrog6n5uCtqZcWGEGMVSa1kttT3nNSMYT0F
0v5Ik9dk8rCZ8Uo3b7GLJHBLAYSUJVUXQBFO6qQR9ejpSIwFQhOJujnKBQKBgQDb
W+vaPUt7Bi2PocDPLTh8xuWluL6qbra2AaeTQtNXBd0KrfJVa5UikLGFbBWuPSAQ
RF9jMeH8bP8DaqP5JM4ksdbOtT0msQ6fnIxi0pOn6iwExNF03jMI5/dCQ4HrPpqW
W9x52gIHW6CN4325eJ6T1spRZol4/496E74+LY05SQKBgQDvMPRZPcDmXzGfRo8m
viFEhrWIs+QMV7Z2CmTRiaHVHlXkSJPSZZf92EMjb//U37/N/vp/wbTxbfzoZRTW
XBCNdDRdCjX90haVI2OqFdZE3kvc9iDRm6QCTXboeGU/5MbRJFb44cJDmmh+lWEi
4kjx9mhHz4O9aarC7PYKEVJPNA==
-----END PRIVATE KEY-----"#;

const TEST_BANKING_ENCRYPTION_KEY_B64: &str = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const TEST_JWK_KID: &str = "test-signing-key";
const TEST_JWK_MODULUS: &str = "4ste6qZDm4XNAPYMvyuG-giI3ErEoc7YL3NMpYeGahwXXKZzvCiLLYaqDJW6QUhLG-b_zWjUNf82Spgs777blUR869IRAdwPLj0dU23Xnsh5S3CRiqXS3eHVDUIRDf_ZwwXmMJ4cxR7GYSvlNoa1nH7lkb8f2c7kDIffQMuDuKneHPN6xBZ2Y0vNpg7DhZBRwJpCvAXk3WVjJJVs3edmRpASm8NkHYptsJYJiPsxhL_9bi-hgGN-xxb_003DaZuyazdBTzm2kZzgMtjVX6ARyxBHRO3zqW1I_YHDAhuHrtsvuNH4QpUb9pSoAxhPnXM_oM3mxbESWyiGqq4p1M2q_Q";
const TEST_JWK_EXPONENT: &str = "AQAB";

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
    pub auth_token: String,
    pub auth_sub: String,
    auth_issuer: String,
}

impl TestApp {
    pub fn auth_token_for_sub(&self, sub: &str) -> String {
        let claims = serde_json::json!({
            "sub": sub,
            "exp": chrono::Utc::now().timestamp() + 60
        });
        self.auth_token_with_claims(claims)
    }

    pub fn auth_token_with_claims(&self, claims: serde_json::Value) -> String {
        self.auth_token_with_claims_and_kid(claims, TEST_JWK_KID)
    }

    pub fn auth_token_with_claims_and_kid(&self, claims: serde_json::Value, kid: &str) -> String {
        let mut claims = claims;
        if let Some(object) = claims.as_object_mut() {
            object
                .entry("iss".to_string())
                .or_insert_with(|| serde_json::Value::String(self.auth_issuer.clone()));
            object
                .entry("aud".to_string())
                .or_insert_with(|| serde_json::Value::String("expenses-monitor".to_string()));
        }
        let mut header = Header::new(Algorithm::RS256);
        header.kid = Some(kid.to_string());
        jsonwebtoken::encode(
            &header,
            &claims,
            &EncodingKey::from_rsa_pem(TEST_PRIVATE_KEY_PEM.as_bytes())
                .expect("valid test signing key"),
        )
        .expect("failed to sign test token")
    }

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
                    .header("Authorization", format!("Bearer {}", self.auth_token))
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
                            "SELECT id FROM expenses.categories WHERE lower(name) = lower($1) AND user_id = $2",
                            cat_trimmed,
                            &self.auth_sub
                        )
                        .fetch_optional(&self.db_pool)
                        .await
                        {
                            let id = if let Some(row) = row {
                                row
                            } else {
                                // Insert and return id
                                sqlx::query_scalar!(
                                    "INSERT INTO expenses.categories (name, user_id) VALUES ($1, $2) RETURNING id",
                                    cat_trimmed,
                                    &self.auth_sub
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
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .body(body)
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_categories(&self) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/payments/categories", &self.address))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_payments(&self, query: &str) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/payments{}", &self.address, query))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_balance(&self) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/balance", &self.address))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn get_balance_with_query(&self, query: &str) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/balance{}", &self.address, query))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn create_wallet(&self, body: &str) -> reqwest::Response {
        reqwest::Client::new()
            .post(format!("{}/api/wallets", &self.address))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .body(body.to_owned())
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn create_wallet_with_auth(&self, body: &str, token: &str) -> reqwest::Response {
        reqwest::Client::new()
            .post(format!("{}/api/wallets", &self.address))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", token))
            .body(body.to_owned())
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn post_wallet(&self, body: &str) -> reqwest::Response {
        self.create_wallet(body).await
    }

    pub async fn get_wallets_with_auth(&self, token: &str) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/wallets", &self.address))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn delete_wallet_with_auth(&self, id: uuid::Uuid, token: &str) -> reqwest::Response {
        reqwest::Client::new()
            .delete(format!("{}/api/wallets/{}", &self.address, id))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn delete_payment(&self, id: uuid::Uuid) -> reqwest::Response {
        reqwest::Client::new()
            .delete(format!("{}/api/payments/{}", &self.address, id))
            .header("Authorization", format!("Bearer {}", self.auth_token))
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
                    .header("Authorization", format!("Bearer {}", self.auth_token))
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
                            "SELECT id FROM expenses.categories WHERE lower(name) = lower($1) AND user_id = $2",
                            cat_trimmed,
                            &self.auth_sub
                        )
                        .fetch_optional(&self.db_pool)
                        .await
                        {
                            let cat_id = if let Some(row) = row {
                                row
                            } else {
                                sqlx::query_scalar!(
                                    "INSERT INTO expenses.categories (name, user_id) VALUES ($1, $2) RETURNING id",
                                    cat_trimmed,
                                    &self.auth_sub
                                )
                                .fetch_one(&self.db_pool)
                                .await
                                .expect("Failed to insert category in update test helper")
                            };
                            if let Some(m) = payload.as_object_mut() {
                                m.remove("category");
                                m.insert(
                                    "categoryId".to_string(),
                                    serde_json::Value::String(cat_id.to_string()),
                                );
                            }
                        }
                    }
                }
            }
        }

        let body = serde_json::to_string(&payload).expect("Failed to serialize update payload");
        reqwest::Client::new()
            .put(format!("{}/api/payments/{}", &self.address, id))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .body(body)
            .send()
            .await
            .expect("Failed to execute request.")
    }

    #[allow(dead_code)]
    pub async fn get_payment(&self, id: uuid::Uuid) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/api/payments/{}", &self.address, id))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn banking_connect(&self, body: &str) -> reqwest::Response {
        reqwest::Client::new()
            .post(format!("{}/banking/connect", &self.address))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .body(body.to_owned())
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn banking_callback(&self, query: &str) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/banking/callback{}", &self.address, query))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn banking_accounts(&self) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/banking/accounts", &self.address))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn banking_sync(&self, connection_id: Uuid) -> reqwest::Response {
        reqwest::Client::new()
            .post(format!("{}/banking/sync/{}", &self.address, connection_id))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn staging_transactions(&self, query: &str) -> reqwest::Response {
        reqwest::Client::new()
            .get(format!("{}/staging/transactions{}", &self.address, query))
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn staging_transaction_update(&self, id: Uuid, body: &str) -> reqwest::Response {
        reqwest::Client::new()
            .put(format!("{}/staging/transactions/{}", &self.address, id))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .body(body.to_owned())
            .send()
            .await
            .expect("Failed to execute request.")
    }

    pub async fn staging_import(&self, body: &str) -> reqwest::Response {
        reqwest::Client::new()
            .post(format!("{}/staging/import", &self.address))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.auth_token))
            .body(body.to_owned())
            .send()
            .await
            .expect("Failed to execute request.")
    }
}

#[derive(Clone)]
struct TestOpenIdProviderState {
    discovery_document: serde_json::Value,
    jwks: serde_json::Value,
}

struct TestOpenIdProvider {
    issuer: String,
}

async fn openid_configuration(
    state: web::Data<TestOpenIdProviderState>,
) -> actix_web::HttpResponse {
    HttpResponse::Ok().json(state.discovery_document.clone())
}

async fn jwks(state: web::Data<TestOpenIdProviderState>) -> actix_web::HttpResponse {
    HttpResponse::Ok().json(state.jwks.clone())
}

fn spawn_test_openid_provider() -> TestOpenIdProvider {
    let listener = TcpListener::bind("127.0.0.1:0").expect("failed to bind test OIDC listener");
    let port = listener
        .local_addr()
        .expect("failed to read test OIDC listener address")
        .port();
    let issuer = format!("http://127.0.0.1:{port}/realms/expenses");
    let state = TestOpenIdProviderState {
        discovery_document: serde_json::json!({
            "issuer": issuer.clone(),
            "jwks_uri": format!("http://127.0.0.1:{port}/realms/expenses/protocol/openid-connect/certs")
        }),
        jwks: serde_json::json!({
            "keys": [
                {
                    "kty": "RSA",
                    "kid": TEST_JWK_KID,
                    "use": "sig",
                    "alg": "RS256",
                    "n": TEST_JWK_MODULUS,
                    "e": TEST_JWK_EXPONENT
                }
            ]
        }),
    };

    let server = HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(state.clone()))
            .route(
                "/realms/expenses/.well-known/openid-configuration",
                web::get().to(openid_configuration),
            )
            .route(
                "/realms/expenses/protocol/openid-connect/certs",
                web::get().to(jwks),
            )
    })
    .listen(listener)
    .expect("failed to listen on test OIDC listener")
    .run();

    tokio::spawn(server);
    TestOpenIdProvider { issuer }
}

pub async fn spawn_app() -> TestApp {
    let auth_provider = spawn_test_openid_provider();
    spawn_app_with_auth_issuer_and_audience(auth_provider.issuer, "expenses-monitor".to_string())
        .await
}

pub async fn spawn_app_with_auth_issuer(auth_issuer: String) -> TestApp {
    spawn_app_with_auth_issuer_and_audience(auth_issuer, "expenses-monitor".to_string()).await
}

pub async fn spawn_app_with_auth_audience(auth_audience: String) -> TestApp {
    let auth_provider = spawn_test_openid_provider();
    spawn_app_with_auth_issuer_and_audience(auth_provider.issuer, auth_audience).await
}

pub async fn spawn_app_with_auth_issuer_and_audience(
    auth_issuer: String,
    auth_audience: String,
) -> TestApp {
    // let subscriber = get_subscriber("test".into(), "info".into());
    // init_subscriber(subscriber);
    Lazy::force(&TRACING);
    let configuration = {
        let mut config = get_configuration().expect("Failed to read configuration.");
        // Use a different database for each test case
        config.database.database_name = Uuid::new_v4().to_string();
        // Use a random OS port
        config.application.port = 0;
        config.authentication.jwt_issuer = auth_issuer.clone();
        config.authentication.jwt_audience = auth_audience;
        config.authentication.jwt_clock_skew_seconds = 30;
        config.banking.token_encryption_key =
            SecretString::from(TEST_BANKING_ENCRYPTION_KEY_B64.to_string());
        config
    };

    configure_database(&configuration.database).await;

    let application = Application::build(configuration.clone())
        .await
        .expect("Failed to build application.");

    // Get the port before spawning the application
    let address = format!("http://127.0.0.1:{}", application.port());
    tokio::spawn(application.run_until_stopped());
    let sub = Uuid::new_v4().to_string();
    let mut app = TestApp {
        address,
        db_pool: get_connection_pool(&configuration),
        auth_token: String::new(),
        auth_sub: sub,
        auth_issuer,
    };
    let auth_sub = app.auth_sub.clone();
    app.auth_token = app.auth_token_for_sub(&auth_sub);

    app
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
