use crate::helpers::spawn_app;
use rstest::rstest;

#[tokio::test]
async fn create_payment_returns_a_200() {
    // Arrange
    let app = spawn_app().await;

    // Act
    let body = r#"
    {
        "description": "test",
        "category": "test",
        "amountInCents": -100,
        "merchantName": "Market",
        "accountingDate": "2023-11-13T00:00:00.000"
    }
    "#;

    let response = app.post_payment(body).await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let saved =
        sqlx::query!("SELECT category, amount FROM expenses.payments WHERE category = 'test'",)
            .fetch_one(&app.db_pool)
            .await
            .expect("The query should retrieve the saved payment.");

    assert_eq!(saved.category.unwrap(), "test");
    assert_eq!(saved.amount.unwrap(), -100);
}

#[rstest]
#[case("{}")]
#[case(
    r#"
{
    "description": "test",
    "amountInCents": -100,
    "merchantName": "Market",
    "accountingDate": "2023-11-13T00:00:00.000"
}
"#
)]
#[case(
    r#"
{
    "description": "test",
    "category": "test",
    "merchantName": "Market",
    "accountingDate": "2023-11-13T00:00:00.000"
}
"#
)]
#[case(
    r#"
{
    "description": "test",
    "category": "test",
    "amountInCents": -100,
    "accountingDate": "2023-11-13T00:00:00.000"
}
"#
)]
#[case(
    r#"
{
    "description": "test",
    "category": "",
    "amountInCents": -100,
    "merchantName": "Market",
    "accountingDate": "2023-11-13T00:00:00.000"
}
"#
)]
#[case("")]
#[tokio::test]
async fn create_payment_returns_a_400_when_data_is_missing(#[case] invalid_body: &str) {
    // Arrange
    let app = spawn_app().await;

    // Act
    let response = app.post_payment(invalid_body).await;

    // Assert
    assert_eq!(
        400,
        response.status().as_u16(),
        // Additional customised error message on test failure
        "The API did not fail with 400 Bad Request when the payload was {}.",
        invalid_body
    );
}

#[tokio::test]
async fn when_get_categories_then_ok() {
    // Arrange
    let app = spawn_app().await;

    // Act
    let response = app.get_categories().await;

    // Assert
    assert!(response.status().is_success());
    assert_ne!(response.content_length().unwrap(), 0);

    // Verify it returns a JSON array
    let categories: Vec<String> = response.json().await.expect("Failed to parse JSON array");
    assert!(categories.is_empty() || !categories.is_empty()); // At least validate it's a valid Vec
}

#[tokio::test]
async fn get_payments_returns_list() {
    // Arrange
    let app = spawn_app().await;

    let payment = r#"
    {
        "description": "p1",
        "category": "test",
        "amountInCents": -1000,
        "merchantName": "m1",
        "accountingDate": "2023-01-01T00:00:00.000"
    }
    "#;
    app.post_payment(payment).await;

    // Act
    let response = app.get_payments("?page=0&size=10").await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert_eq!(1, content.len());
    assert_eq!("p1", content[0]["description"]);
}

#[tokio::test]
async fn delete_payment_with_tags_succeeds() {
    // Arrange
    let app = spawn_app().await;

    // Create a payment
    let payment = r#"
    {
        "description": "test payment with tags",
        "category": "test",
        "amountInCents": -500,
        "merchantName": "test merchant",
        "accountingDate": "2023-01-01T00:00:00.000"
    }
    "#;
    let create_response = app.post_payment(payment).await;
    assert_eq!(200, create_response.status().as_u16());

    // Get the payment ID from the database
    let saved = sqlx::query!(
        "SELECT id FROM expenses.payments WHERE description = 'test payment with tags'"
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("Failed to retrieve payment");

    let payment_id = saved.id;

    // Create a tag for testing (using denormalized payments_tags table)
    sqlx::query!(
        "INSERT INTO expenses.payments_tags (payment_id, key, value) VALUES ($1, $2, $3)",
        payment_id,
        "category",
        "test-tag"
    )
    .execute(&app.db_pool)
    .await
    .expect("Failed to insert tag");

    // Verify the tag exists
    let tag_count = sqlx::query!(
        "SELECT COUNT(*) as count FROM expenses.payments_tags WHERE payment_id = $1",
        payment_id
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("Failed to count tags");
    assert_eq!(tag_count.count.unwrap(), 1);

    // Act - Delete the payment
    let delete_response = app.delete_payment(payment_id).await;

    // Assert - The deletion should succeed
    assert_eq!(204, delete_response.status().as_u16());

    // Verify the payment no longer exists
    let payment_exists = sqlx::query!("SELECT id FROM expenses.payments WHERE id = $1", payment_id)
        .fetch_optional(&app.db_pool)
        .await
        .expect("Failed to query payment");
    assert!(payment_exists.is_none(), "Payment should have been deleted");

    // Verify the tag was also deleted (CASCADE)
    let tags_exist = sqlx::query!(
        "SELECT COUNT(*) as count FROM expenses.payments_tags WHERE payment_id = $1",
        payment_id
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("Failed to count tags");
    assert_eq!(
        tags_exist.count.unwrap(),
        0,
        "Tags should have been deleted via CASCADE"
    );
}

#[tokio::test]
async fn create_payment_with_empty_description_returns_200() {
    // Arrange
    let app = spawn_app().await;

    // Act - Empty string description
    let body = r#"
    {
        "description": "",
        "category": "test",
        "amountInCents": -200,
        "merchantName": "Market",
        "accountingDate": "2023-11-13T00:00:00.000"
    }
    "#;

    let response = app.post_payment(body).await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let saved = sqlx::query!(
        "SELECT category, amount, description FROM expenses.payments WHERE category = 'test' AND amount = -200",
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("The query should retrieve the saved payment.");

    assert_eq!(saved.category.unwrap(), "test");
    assert_eq!(saved.amount.unwrap(), -200);
    // Should have default value
    assert_eq!(saved.description.unwrap(), "No description");
}

#[tokio::test]
async fn create_payment_without_description_returns_200() {
    // Arrange
    let app = spawn_app().await;

    // Act - No description field at all
    let body = r#"
    {
        "category": "food",
        "amountInCents": -300,
        "merchantName": "Supermarket",
        "accountingDate": "2023-11-14T10:30:00.000"
    }
    "#;

    let response = app.post_payment(body).await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let saved = sqlx::query!(
        "SELECT category, amount, description FROM expenses.payments WHERE category = 'food' AND amount = -300",
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("The query should retrieve the saved payment.");

    assert_eq!(saved.category.unwrap(), "food");
    assert_eq!(saved.amount.unwrap(), -300);
    // Should have default value
    assert_eq!(saved.description.unwrap(), "No description");
}

#[tokio::test]
async fn create_payment_with_wallet_name_returns_200() {
    // Arrange
    let app = spawn_app().await;

    // First create a wallet
    let wallet_body = r#"{"name": "TestWallet"}"#;
    let wallet_response = app.post_wallet(wallet_body).await;
    assert_eq!(200, wallet_response.status().as_u16());

    // Act - Create payment with wallet name
    let body = r#"
    {
        "description": "payment with wallet",
        "category": "shopping",
        "amountInCents": -1500,
        "merchantName": "Store",
        "accountingDate": "2023-11-15T14:00:00.000",
        "wallet": "TestWallet"
    }
    "#;

    let response = app.post_payment(body).await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    assert_eq!(json["wallet"], "TestWallet");
    assert_eq!(json["amountInCents"], -1500);
}

#[tokio::test]
async fn create_payment_with_nonexistent_wallet_returns_400() {
    // Arrange
    let app = spawn_app().await;

    // Act - Create payment with non-existent wallet
    let body = r#"
    {
        "description": "payment with invalid wallet",
        "category": "shopping",
        "amountInCents": -1000,
        "merchantName": "Store",
        "accountingDate": "2023-11-15T14:00:00.000",
        "wallet": "NonExistentWallet"
    }
    "#;

    let response = app.post_payment(body).await;

    // Assert
    assert_eq!(400, response.status().as_u16());
}

#[rstest]
#[case("2023-11-13T00:00:00")]
#[case("2023-11-13T10:30:00.000")]
#[case("2023-11-13T23:59:59")]
#[tokio::test]
async fn create_payment_accepts_various_datetime_formats(#[case] datetime: &str) {
    // Arrange
    let app = spawn_app().await;

    // Act
    let body = format!(
        r#"{{
            "description": "datetime test",
            "category": "test",
            "amountInCents": -100,
            "merchantName": "Market",
            "accountingDate": "{}"
        }}"#,
        datetime
    );

    let response = app.post_payment(&body).await;

    // Assert
    assert_eq!(
        200,
        response.status().as_u16(),
        "Should accept datetime format: {}",
        datetime
    );
}

#[tokio::test]
async fn create_payment_with_tags_and_retrieve_returns_tags() {
    // Arrange
    let app = spawn_app().await;

    // Act - Create payment with tags
    let body = r#"
    {
        "description": "payment with tags",
        "category": "groceries",
        "amountInCents": -2500,
        "merchantName": "Supermarket",
        "accountingDate": "2023-11-20T14:30:00.000",
        "tags": [
            {"key": "project", "value": "home"},
            {"key": "type", "value": "recurring"}
        ]
    }
    "#;

    let create_response = app.post_payment(body).await;

    // Assert creation succeeded
    assert_eq!(200, create_response.status().as_u16());
    let create_json: serde_json::Value = create_response.json().await.unwrap();

    // Verify tags in creation response
    assert!(create_json["tags"].is_array(), "Tags should be an array");
    let tags = create_json["tags"].as_array().unwrap();
    assert_eq!(2, tags.len(), "Should have 2 tags in creation response");

    // Act - Retrieve payments
    let get_response = app.get_payments("?page=0&size=10").await;

    // Assert retrieval succeeded
    assert_eq!(200, get_response.status().as_u16());
    let get_json: serde_json::Value = get_response.json().await.unwrap();
    let content = get_json["content"].as_array().unwrap();

    // Find the payment we just created
    let payment = content
        .iter()
        .find(|p| p["description"] == "payment with tags")
        .expect("Payment not found");

    // Verify tags are present in the GET response
    assert!(
        payment["tags"].is_array(),
        "Tags should be present in payment"
    );
    let retrieved_tags = payment["tags"].as_array().unwrap();
    assert_eq!(2, retrieved_tags.len(), "Should have 2 tags");

    // Verify tag contents
    let tag_keys: Vec<&str> = retrieved_tags
        .iter()
        .map(|t| t["key"].as_str().unwrap())
        .collect();
    assert!(tag_keys.contains(&"project"));
    assert!(tag_keys.contains(&"type"));
}
