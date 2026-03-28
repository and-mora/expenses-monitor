use crate::helpers::{spawn_app, spawn_app_with_auth_audience, spawn_app_with_auth_issuer};
use serde_json::Value;
use std::net::TcpListener;

#[tokio::test]
async fn forwarded_jwt_is_validated_and_sub_returned() {
    let app = spawn_app().await;
    let token = app.auth_token_for_sub("test-sub");

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert!(res.status().is_success());
    let body: Value = res.json().await.expect("invalid json");
    assert_eq!(body.get("sub").and_then(Value::as_str), Some("test-sub"));
}

#[tokio::test]
async fn missing_authorization_is_rejected() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn expired_token_is_rejected() {
    let app = spawn_app().await;
    let token = app.auth_token_with_claims(serde_json::json!({
        "sub": "test-sub",
        "exp": (chrono::Utc::now().timestamp() - 60)
    }));

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn token_missing_sub_is_rejected() {
    let app = spawn_app().await;
    let token = app.auth_token_with_claims(serde_json::json!({
        "exp": (chrono::Utc::now().timestamp() + 60)
    }));

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn token_with_nbf_in_future_is_rejected() {
    let app = spawn_app().await;
    let token = app.auth_token_with_claims(serde_json::json!({
        "sub": "test-sub",
        "nbf": (chrono::Utc::now().timestamp() + 60),
        "exp": (chrono::Utc::now().timestamp() + 120)
    }));

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn malformed_token_is_rejected() {
    let app = spawn_app().await;

    let client = reqwest::Client::new();
    let valid = app.auth_token_for_sub("test-sub");
    let malformed = format!("{}x", valid);
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", malformed))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn token_with_unknown_kid_is_rejected() {
    let app = spawn_app().await;
    let token = app.auth_token_with_claims_and_kid(
        serde_json::json!({
            "sub": "test-sub",
            "exp": (chrono::Utc::now().timestamp() + 60)
        }),
        "unknown-key",
    );

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn token_with_matching_azp_is_accepted_when_aud_is_account() {
    let app = spawn_app_with_auth_audience("frontend".to_string()).await;
    let token = app.auth_token_with_claims(serde_json::json!({
        "sub": "test-sub",
        "aud": "account",
        "azp": "frontend",
        "exp": (chrono::Utc::now().timestamp() + 60)
    }));

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert!(res.status().is_success());
    let body: Value = res.json().await.expect("invalid json");
    assert_eq!(body.get("sub").and_then(Value::as_str), Some("test-sub"));
}

#[tokio::test]
async fn token_with_mismatched_azp_and_aud_is_rejected() {
    let app = spawn_app_with_auth_audience("frontend".to_string()).await;
    let token = app.auth_token_with_claims(serde_json::json!({
        "sub": "test-sub",
        "aud": "account",
        "azp": "other-client",
        "exp": (chrono::Utc::now().timestamp() + 60)
    }));

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn keycloak_unavailable_returns_service_unavailable() {
    let listener =
        TcpListener::bind("127.0.0.1:0").expect("failed to reserve port for unavailable issuer");
    let port = listener
        .local_addr()
        .expect("failed to read reserved port")
        .port();
    drop(listener);

    let app = spawn_app_with_auth_issuer(format!("http://127.0.0.1:{port}/realms/expenses")).await;
    let token = app.auth_token_for_sub("test-sub");

    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/api/debug/sub", &app.address))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .expect("failed to execute request");

    assert_eq!(res.status().as_u16(), 503);
}
