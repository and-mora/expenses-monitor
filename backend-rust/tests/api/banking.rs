use crate::helpers::spawn_app;
use serde_json::Value;
use uuid::Uuid;

#[tokio::test]
async fn banking_connect_callback_and_sync_are_idempotent() {
    let app = spawn_app().await;

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-001",
            "connectionLabel": "Checking"
        }"#,
        )
        .await;
    assert_eq!(connect_resp.status().as_u16(), 200);
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let connection_id =
        Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).expect("connection id");
    let state = connect_json["state"].as_str().unwrap().to_string();

    let callback_resp = app
        .banking_callback(&format!("?code=auth-code-1&state={}&provider=mock", state))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);

    let accounts_resp = app.banking_accounts().await;
    assert_eq!(accounts_resp.status().as_u16(), 200);
    let accounts: Value = accounts_resp.json().await.expect("valid accounts json");
    assert_eq!(accounts.as_array().unwrap().len(), 1);
    assert_eq!(accounts[0]["connectionStatus"], "connected");
    assert_eq!(accounts[0]["providerAccountId"], "checking-001");

    let sync_first = app.banking_sync(connection_id).await;
    assert_eq!(sync_first.status().as_u16(), 200);
    let first_sync_json: Value = sync_first.json().await.expect("valid sync json");
    assert_eq!(first_sync_json["createdCount"], 3);
    assert_eq!(first_sync_json["duplicateCount"], 0);

    let sync_second = app.banking_sync(connection_id).await;
    assert_eq!(sync_second.status().as_u16(), 200);
    let second_sync_json: Value = sync_second.json().await.expect("valid sync json");
    assert_eq!(second_sync_json["createdCount"], 0);
    assert_eq!(second_sync_json["duplicateCount"], 3);

    let staging_resp = app.staging_transactions("?page=0&size=10").await;
    assert_eq!(staging_resp.status().as_u16(), 200);
    let staging_json: Value = staging_resp.json().await.expect("valid staging json");
    assert_eq!(staging_json["content"].as_array().unwrap().len(), 3);
}

#[tokio::test]
async fn banking_accounts_and_sync_are_scoped_by_user() {
    let app = spawn_app().await;

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-002"
        }"#,
        )
        .await;
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let connection_id =
        Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).expect("connection id");
    let state = connect_json["state"].as_str().unwrap().to_string();

    let callback_resp = app
        .banking_callback(&format!("?code=auth-code-2&state={}&provider=mock", state))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);

    let other_sub = Uuid::new_v4().to_string();
    let other_token = app.auth_token_for_sub(&other_sub);
    let client = reqwest::Client::new();
    let other_accounts_resp = client
        .get(format!("{}/banking/accounts", &app.address))
        .header("Authorization", format!("Bearer {}", other_token))
        .send()
        .await
        .expect("request should complete");
    assert_eq!(other_accounts_resp.status().as_u16(), 200);
    let other_accounts: Value = other_accounts_resp.json().await.expect("valid json");
    assert!(other_accounts.as_array().unwrap().is_empty());

    let other_sync_resp = client
        .post(format!("{}/banking/sync/{}", &app.address, connection_id))
        .header("Authorization", format!("Bearer {}", other_token))
        .send()
        .await
        .expect("request should complete");
    assert_eq!(other_sync_resp.status().as_u16(), 404);
}

#[tokio::test]
async fn banking_connect_rejects_unsupported_provider() {
    let app = spawn_app().await;

    let response = app
        .banking_connect(
            r#"{
            "provider": "unsupported"
        }"#,
        )
        .await;

    assert_eq!(response.status().as_u16(), 400);
}

#[tokio::test]
async fn banking_sync_preserves_reviewed_staging_edits() {
    let app = spawn_app().await;

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-006"
        }"#,
        )
        .await;
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let connection_id =
        Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).expect("connection id");
    let state = connect_json["state"].as_str().unwrap().to_string();

    let callback_resp = app
        .banking_callback(&format!("?code=auth-code-6&state={}&provider=mock", state))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);

    let first_sync = app.banking_sync(connection_id).await;
    assert_eq!(first_sync.status().as_u16(), 200);

    let staging_resp = app.staging_transactions("?page=0&size=10").await;
    assert_eq!(staging_resp.status().as_u16(), 200);
    let staging_json: Value = staging_resp.json().await.expect("valid staging json");
    let row_id = Uuid::parse_str(staging_json["content"][0]["id"].as_str().unwrap()).unwrap();

    let review_response = app
        .staging_transaction_update(
            row_id,
            r#"{
            "suggestedCategory": "User Edited Category",
            "suggestedMerchant": "User Edited Merchant",
            "status": "reviewed"
        }"#,
        )
        .await;
    assert_eq!(review_response.status().as_u16(), 200);

    let second_sync = app.banking_sync(connection_id).await;
    assert_eq!(second_sync.status().as_u16(), 200);

    let staging_after_resp = app.staging_transactions("?page=0&size=10").await;
    assert_eq!(staging_after_resp.status().as_u16(), 200);
    let staging_after_json: Value = staging_after_resp.json().await.expect("valid staging json");
    let updated_row = staging_after_json["content"]
        .as_array()
        .unwrap()
        .iter()
        .find(|row| row["id"] == row_id.to_string())
        .expect("updated row");

    assert_eq!(updated_row["status"], "reviewed");
    assert_eq!(updated_row["suggestedCategory"], "User Edited Category");
    assert_eq!(updated_row["suggestedMerchant"], "User Edited Merchant");
}
