use crate::helpers::spawn_app;
use base64::Engine;
use uuid::Uuid;

#[tokio::test]
async fn create_wallet_returns_200() {
    // Arrange
    let app = spawn_app().await;

    // Act
    let body = r#"
    {
        "name": "My Wallet"
    }
    "#;

    let header = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(r#"{"alg":"none"}"#);
    let payload = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(
        serde_json::json!({
            "sub": "test-sub",
            "exp": (chrono::Utc::now().timestamp() + 60)
        })
        .to_string(),
    );
    let token = format!("{}.{}.", header, payload);

    let response = app.create_wallet_with_auth(body, &token).await;

    // Assert
    assert_eq!(200, response.status().as_u16());

    let saved = sqlx::query!(
        "SELECT name as \"name!\", user_id FROM expenses.wallets WHERE name = 'My Wallet'",
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("Failed to fetch saved wallet");

    assert_eq!(saved.name.as_str(), "My Wallet");
    assert_eq!(saved.user_id.as_deref(), Some("test-sub"));
}

#[tokio::test]
async fn create_wallet_returns_409_when_duplicate() {
    // Arrange
    let app = spawn_app().await;
    let body = r#"{"name": "My Wallet"}"#;
    let header = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(r#"{"alg":"none"}"#);
    let payload = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(
        serde_json::json!({
            "sub": "dup-sub",
            "exp": (chrono::Utc::now().timestamp() + 60)
        })
        .to_string(),
    );
    let token = format!("{}.{}.", header, payload);

    app.create_wallet_with_auth(body, &token).await;

    // Act
    let response = app.create_wallet_with_auth(body, &token).await;

    // Assert
    assert_eq!(409, response.status().as_u16());
}

#[tokio::test]
async fn get_wallets_returns_list() {
    // Arrange
    let app = spawn_app().await;
    let body1 = r#"{"name": "Wallet A"}"#;
    let body2 = r#"{"name": "Wallet B"}"#;
    let header = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(r#"{"alg":"none"}"#);
    let payload = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(
        serde_json::json!({
            "sub": "list-sub",
            "exp": (chrono::Utc::now().timestamp() + 60)
        })
        .to_string(),
    );
    let token = format!("{}.{}.", header, payload);

    app.create_wallet_with_auth(body1, &token).await;
    app.create_wallet_with_auth(body2, &token).await;

    // Act
    let response = app.get_wallets_with_auth(&token).await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let text = response.text().await.unwrap();
    assert!(text.contains("Wallet A"));
    assert!(text.contains("Wallet B"));
}

#[tokio::test]
async fn delete_wallet_returns_200() {
    // Arrange
    let app = spawn_app().await;
    let body = r#"{"name": "To Delete"}"#;
    let header = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(r#"{"alg":"none"}"#);
    let payload = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(
        serde_json::json!({
            "sub": "del-sub",
            "exp": (chrono::Utc::now().timestamp() + 60)
        })
        .to_string(),
    );
    let token = format!("{}.{}.", header, payload);

    let create_response = app.create_wallet_with_auth(body, &token).await;
    let json: serde_json::Value = create_response.json().await.unwrap();
    let id_str = json["id"].as_str().unwrap();
    let id = Uuid::parse_str(id_str).unwrap();

    // Act
    let response = app.delete_wallet_with_auth(id, &token).await;

    // Assert
    assert_eq!(200, response.status().as_u16());

    let exists = sqlx::query!("SELECT id FROM expenses.wallets WHERE id = $1", id)
        .fetch_optional(&app.db_pool)
        .await
        .unwrap();
    assert!(exists.is_none());
}
