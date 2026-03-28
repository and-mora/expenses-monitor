use crate::helpers::spawn_app;
use serde_json::Value;
use uuid::Uuid;

#[tokio::test]
async fn staging_update_and_import_flow_persists_payment_with_user_id() {
    let app = spawn_app().await;

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-003"
        }"#,
        )
        .await;
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let connection_id =
        Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).expect("connection id");
    let state = connect_json["state"].as_str().unwrap().to_string();
    let callback_resp = app
        .banking_callback(&format!("?code=auth-code-3&state={}&provider=mock", state))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);

    let sync_resp = app.banking_sync(connection_id).await;
    assert_eq!(sync_resp.status().as_u16(), 200);

    let staging_resp = app.staging_transactions("?page=0&size=10").await;
    assert_eq!(staging_resp.status().as_u16(), 200);
    let staging_json: Value = staging_resp.json().await.expect("valid staging json");
    let rows = staging_json["content"].as_array().unwrap();
    assert_eq!(rows.len(), 3);
    let row_id = Uuid::parse_str(rows[0]["id"].as_str().unwrap()).expect("row id");

    let update_resp = app
        .staging_transaction_update(
            row_id,
            r#"{
            "suggestedCategory": "Groceries",
            "suggestedMerchant": "Mock Market",
            "status": "reviewed"
        }"#,
        )
        .await;
    assert_eq!(update_resp.status().as_u16(), 200);
    let update_json: Value = update_resp.json().await.expect("valid update json");
    assert_eq!(update_json["transaction"]["status"], "reviewed");

    let import_resp = app
        .staging_import(&format!(r#"{{ "transactionIds": ["{}"] }}"#, row_id))
        .await;
    assert_eq!(import_resp.status().as_u16(), 200);
    let import_json: Value = import_resp.json().await.expect("valid import json");
    assert_eq!(import_json["importedCount"], 1);

    let staging_after_resp = app.staging_transactions("?page=0&size=10").await;
    let staging_after_json: Value = staging_after_resp.json().await.expect("valid json");
    let after_rows = staging_after_json["content"].as_array().unwrap();
    let row_id_str = row_id.to_string();
    let imported_row = after_rows
        .iter()
        .find(|row| row["id"].as_str() == Some(row_id_str.as_str()))
        .expect("imported row");
    assert_eq!(imported_row["status"], "imported");
    assert!(imported_row["importedPaymentId"].is_string());

    let imported_payment_id =
        Uuid::parse_str(imported_row["importedPaymentId"].as_str().unwrap()).expect("payment id");
    let payment_row = sqlx::query!(
        r#"
        SELECT id, user_id, amount, merchant_name
        FROM expenses.payments
        WHERE id = $1
        "#,
        imported_payment_id
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("payment should exist");

    assert_eq!(payment_row.user_id, app.auth_sub);
    assert_eq!(payment_row.amount, Some(-1299));
    assert_eq!(payment_row.merchant_name.as_deref(), Some("Mock Market"));
}

#[tokio::test]
async fn staging_import_only_processes_reviewed_rows() {
    let app = spawn_app().await;

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-003-reviewed"
        }"#,
        )
        .await;
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let connection_id =
        Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).expect("connection id");
    let state = connect_json["state"].as_str().unwrap().to_string();
    let callback_resp = app
        .banking_callback(&format!(
            "?code=auth-code-reviewed&state={}&provider=mock",
            state
        ))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);

    let sync_resp = app.banking_sync(connection_id).await;
    assert_eq!(sync_resp.status().as_u16(), 200);

    let staging_resp = app.staging_transactions("?page=0&size=10").await;
    assert_eq!(staging_resp.status().as_u16(), 200);
    let staging_json: Value = staging_resp.json().await.expect("valid staging json");
    let rows = staging_json["content"].as_array().unwrap();
    assert_eq!(rows.len(), 3);

    let reviewed_row_id = Uuid::parse_str(rows[0]["id"].as_str().unwrap()).expect("row id");
    let pending_row_id = Uuid::parse_str(rows[1]["id"].as_str().unwrap()).expect("row id");
    let rejected_row_id = Uuid::parse_str(rows[2]["id"].as_str().unwrap()).expect("row id");

    let reviewed_update = app
        .staging_transaction_update(
            reviewed_row_id,
            r#"{
            "suggestedCategory": "Groceries",
            "suggestedMerchant": "Mock Market",
            "status": "reviewed"
        }"#,
        )
        .await;
    assert_eq!(reviewed_update.status().as_u16(), 200);

    let rejected_update = app
        .staging_transaction_update(
            rejected_row_id,
            r#"{
            "status": "rejected"
        }"#,
        )
        .await;
    assert_eq!(rejected_update.status().as_u16(), 200);

    let import_resp = app
        .staging_import(&format!(
            r#"{{
                "transactionIds": ["{}", "{}", "{}"]
            }}"#,
            reviewed_row_id, pending_row_id, rejected_row_id
        ))
        .await;
    assert_eq!(import_resp.status().as_u16(), 200);
    let import_json: Value = import_resp.json().await.expect("valid import json");
    assert_eq!(import_json["selectedCount"], 3);
    assert_eq!(import_json["importedCount"], 1);
    assert_eq!(import_json["skippedCount"], 2);

    let staging_after_resp = app.staging_transactions("?page=0&size=10").await;
    let staging_after_json: Value = staging_after_resp.json().await.expect("valid staging json");
    let after_rows = staging_after_json["content"].as_array().unwrap();
    let reviewed_row = after_rows
        .iter()
        .find(|row| row["id"] == reviewed_row_id.to_string())
        .expect("reviewed row");
    let pending_row = after_rows
        .iter()
        .find(|row| row["id"] == pending_row_id.to_string())
        .expect("pending row");
    let rejected_row = after_rows
        .iter()
        .find(|row| row["id"] == rejected_row_id.to_string())
        .expect("rejected row");

    assert_eq!(reviewed_row["status"], "imported");
    assert!(reviewed_row["importedPaymentId"].is_string());
    assert_eq!(pending_row["status"], "pending");
    assert!(pending_row["importedPaymentId"].is_null());
    assert_eq!(rejected_row["status"], "rejected");
    assert!(rejected_row["importedPaymentId"].is_null());
}

#[tokio::test]
async fn staging_import_rejects_foreign_default_category() {
    let app = spawn_app().await;

    let other_sub = Uuid::new_v4().to_string();
    let other_token = app.auth_token_for_sub(&other_sub);
    let foreign_category_response = reqwest::Client::new()
        .post(format!("{}/api/payments", &app.address))
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", other_token))
        .body(
            r#"{
                "description": "foreign category seed",
                "categoryId": "Foreign Import Category",
                "amountInCents": -100,
                "merchantName": "Seed",
                "accountingDate": "2024-03-01T00:00:00.000"
            }"#,
        )
        .send()
        .await
        .expect("request should complete");
    assert_eq!(foreign_category_response.status().as_u16(), 200);

    let foreign_category = sqlx::query_scalar!(
        "SELECT id FROM expenses.categories WHERE lower(name) = lower($1) AND user_id = $2",
        "Foreign Import Category",
        &other_sub
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("foreign category should exist");

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-003-foreign-category"
        }"#,
        )
        .await;
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let connection_id =
        Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).expect("connection id");
    let state = connect_json["state"].as_str().unwrap().to_string();
    let callback_resp = app
        .banking_callback(&format!(
            "?code=auth-code-foreign&state={}&provider=mock",
            state
        ))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);
    let sync_resp = app.banking_sync(connection_id).await;
    assert_eq!(sync_resp.status().as_u16(), 200);

    let staging_resp = app.staging_transactions("?page=0&size=10").await;
    let staging_json: Value = staging_resp.json().await.expect("valid staging json");
    let reviewed_row_id =
        Uuid::parse_str(staging_json["content"][0]["id"].as_str().unwrap()).expect("row id");
    let review_resp = app
        .staging_transaction_update(
            reviewed_row_id,
            r#"{
            "status": "reviewed"
        }"#,
        )
        .await;
    assert_eq!(review_resp.status().as_u16(), 200);

    let import_resp = app
        .staging_import(&format!(
            r#"{{
                "transactionIds": ["{}"],
                "defaultCategoryId": "{}"
            }}"#,
            reviewed_row_id, foreign_category
        ))
        .await;

    assert_eq!(import_resp.status().as_u16(), 400);
}

#[tokio::test]
async fn staging_transactions_are_isolated_by_user() {
    let app = spawn_app().await;

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-004"
        }"#,
        )
        .await;
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let state = connect_json["state"].as_str().unwrap().to_string();
    let callback_resp = app
        .banking_callback(&format!("?code=auth-code-4&state={}&provider=mock", state))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);
    let sync_resp = app
        .banking_sync(Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).unwrap())
        .await;
    assert_eq!(sync_resp.status().as_u16(), 200);

    let other_token = app.auth_token_for_sub(&Uuid::new_v4().to_string());
    let client = reqwest::Client::new();
    let resp = client
        .get(format!(
            "{}/staging/transactions?page=0&size=10",
            &app.address
        ))
        .header("Authorization", format!("Bearer {}", other_token))
        .send()
        .await
        .expect("request should complete");
    assert_eq!(resp.status().as_u16(), 200);
    let json: Value = resp.json().await.expect("valid json");
    assert!(json["content"].as_array().unwrap().is_empty());
}

#[tokio::test]
async fn staging_update_rejects_invalid_status() {
    let app = spawn_app().await;

    let connect_resp = app
        .banking_connect(
            r#"{
            "provider": "mock",
            "accountId": "checking-005"
        }"#,
        )
        .await;
    let connect_json: Value = connect_resp.json().await.expect("valid connect json");
    let state = connect_json["state"].as_str().unwrap().to_string();
    let callback_resp = app
        .banking_callback(&format!("?code=auth-code-5&state={}&provider=mock", state))
        .await;
    assert_eq!(callback_resp.status().as_u16(), 200);
    let sync_resp = app
        .banking_sync(Uuid::parse_str(connect_json["connectionId"].as_str().unwrap()).unwrap())
        .await;
    assert_eq!(sync_resp.status().as_u16(), 200);

    let staging_resp = app.staging_transactions("?page=0&size=10").await;
    let staging_json: Value = staging_resp.json().await.expect("valid json");
    let row_id = Uuid::parse_str(staging_json["content"][0]["id"].as_str().unwrap()).unwrap();
    let response = app
        .staging_transaction_update(
            row_id,
            r#"{
            "status": "invalid"
        }"#,
        )
        .await;

    assert_eq!(response.status().as_u16(), 400);
}
