use crate::helpers::spawn_app;
use uuid::Uuid;

#[tokio::test]
async fn wallets_are_scoped_by_user() {
    let app = spawn_app().await;

    // User A creates a wallet
    let wallet_body = r#"{ "name": "user-a-wallet" }"#;
    let create_resp = app.create_wallet(wallet_body).await;
    assert_eq!(200, create_resp.status().as_u16());

    // Build a token for user B
    let sub_b = Uuid::new_v4().to_string();
    let token_b = app.auth_token_for_sub(&sub_b);

    // User B should see no wallets
    let get_resp = app.get_wallets_with_auth(&token_b).await;
    assert_eq!(200, get_resp.status().as_u16());
    let wallets: Vec<serde_json::Value> = get_resp.json().await.expect("Invalid JSON");
    assert!(wallets.is_empty());
}

#[tokio::test]
async fn payments_are_scoped_by_user() {
    let app = spawn_app().await;

    // User A creates a payment
    let payment = r#"
    {
        "description": "user-a-payment",
        "category": "test",
        "amountInCents": -100,
        "merchantName": "Market",
        "accountingDate": "2023-11-13T00:00:00.000"
    }
    "#;
    let create_resp = app.post_payment(payment).await;
    assert_eq!(200, create_resp.status().as_u16());

    // Build token for user B
    let sub_b = Uuid::new_v4().to_string();
    let token_b = app.auth_token_for_sub(&sub_b);

    // User B should not see user A's payments
    let resp = app.get_payments_with_auth("?page=0&size=10", &token_b).await;
    assert_eq!(200, resp.status().as_u16());
    let json: serde_json::Value = resp.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert!(content.is_empty());
}
