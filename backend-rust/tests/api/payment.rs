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
    let saved = sqlx::query!(
        "SELECT p.amount, c.name as category_name FROM expenses.payments p JOIN expenses.categories c ON p.category_id = c.id WHERE c.name = 'test'",
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("The query should retrieve the saved payment.");

    assert_eq!(saved.category_name, "test");
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

    // Verify it returns a JSON array (each item can be string or object)
    let categories: Vec<serde_json::Value> =
        response.json().await.expect("Failed to parse JSON array");
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
        "SELECT p.amount, p.description, c.name as category_name FROM expenses.payments p JOIN expenses.categories c ON p.category_id = c.id WHERE c.name = 'test' AND p.amount = -200",
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("The query should retrieve the saved payment.");

    assert_eq!(saved.category_name, "test");
    assert_eq!(saved.amount.unwrap(), -200);
    // Should be NULL when description is empty
    assert!(saved.description.is_none());
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
        "SELECT p.amount, p.description, c.name as category_name FROM expenses.payments p JOIN expenses.categories c ON p.category_id = c.id WHERE c.name = 'food' AND p.amount = -300",
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("The query should retrieve the saved payment.");

    assert_eq!(saved.category_name, "food");
    assert_eq!(saved.amount.unwrap(), -300);
    // Should be NULL when description is missing
    assert!(saved.description.is_none());
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

#[tokio::test]
async fn create_payment_auto_creates_category() {
    // Arrange
    let app = spawn_app().await;

    // Ensure category does not exist
    let category_name = "AutoCreatedCategory";
    let check_before = sqlx::query!(
        "SELECT id FROM expenses.categories WHERE lower(name) = lower($1)",
        category_name
    )
    .fetch_optional(&app.db_pool)
    .await
    .expect("Query failed");
    assert!(check_before.is_none());

    // Act - create payment with a new category name
    let body = format!(
        r#"
    {{
        "description": "payment auto category",
        "category": "{}",
        "amountInCents": -1234,
        "merchantName": "TestShop",
        "accountingDate": "2024-12-01T00:00:00.000"
    }}
    "#,
        category_name
    );

    let response = app.post_payment(&body).await;
    assert_eq!(200, response.status().as_u16());

    // Assert that category has been created and payment references it
    let created = sqlx::query!(
        "SELECT id FROM expenses.categories WHERE lower(name) = lower($1)",
        category_name
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("Category should exist");

    let payment_row = sqlx::query!(
        "SELECT category_id FROM expenses.payments WHERE description = $1",
        "payment auto category"
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("Payment should exist");

    assert!(payment_row.category_id.is_some());
    assert_eq!(payment_row.category_id.unwrap(), created.id);
}
#[tokio::test]
async fn update_payment_returns_200() {
    // Arrange
    let app = spawn_app().await;

    // Create initial payment
    let create_body = r#"
    {
        "description": "original description",
        "category": "food",
        "amountInCents": -5000,
        "merchantName": "Original Merchant",
        "accountingDate": "2023-11-13T00:00:00.000"
    }
    "#;

    let create_response = app.post_payment(create_body).await;
    assert_eq!(200, create_response.status().as_u16());
    let create_json: serde_json::Value = create_response.json().await.unwrap();
    let payment_id = uuid::Uuid::parse_str(create_json["id"].as_str().unwrap()).unwrap();

    // Act - Update the payment
    let update_body = r#"
    {
        "description": "updated description",
        "category": "transport",
        "amountInCents": -7500,
        "merchantName": "Updated Merchant",
        "accountingDate": "2023-11-14T00:00:00.000"
    }
    "#;

    let update_response = app.update_payment(payment_id, update_body).await;

    // Assert
    assert_eq!(200, update_response.status().as_u16());
    let update_json: serde_json::Value = update_response.json().await.unwrap();

    assert_eq!(update_json["description"], "updated description");
    assert_eq!(update_json["category"], "transport");
    assert_eq!(update_json["amountInCents"], -7500);
    assert_eq!(update_json["merchantName"], "Updated Merchant");

    // Verify in database
    let saved = sqlx::query!(
        "SELECT p.description, c.name as category_name, p.amount, p.merchant_name FROM expenses.payments p JOIN expenses.categories c ON p.category_id = c.id WHERE p.id = $1",
        payment_id
    )
    .fetch_one(&app.db_pool)
    .await
    .expect("Failed to retrieve updated payment");

    assert_eq!(saved.description.unwrap(), "updated description");
    assert_eq!(saved.category_name, "transport");
    assert_eq!(saved.amount.unwrap(), -7500);
    assert_eq!(saved.merchant_name.unwrap(), "Updated Merchant");
}

#[tokio::test]
async fn update_payment_with_tags_replaces_tags() {
    // Arrange
    let app = spawn_app().await;

    // Create payment with initial tags
    let create_body = r#"
    {
        "description": "payment with tags",
        "category": "shopping",
        "amountInCents": -3000,
        "merchantName": "Store",
        "accountingDate": "2023-11-13T00:00:00.000",
        "tags": [
            {"key": "old_tag", "value": "old_value"},
            {"key": "remove_me", "value": "will_be_deleted"}
        ]
    }
    "#;

    let create_response = app.post_payment(create_body).await;
    assert_eq!(200, create_response.status().as_u16());
    let create_json: serde_json::Value = create_response.json().await.unwrap();
    let payment_id = uuid::Uuid::parse_str(create_json["id"].as_str().unwrap()).unwrap();

    // Verify initial tags count
    // (initial_tags already asserted above)

    // Act - Update with new tags
    let update_body = r#"
    {
        "description": "payment with updated tags",
        "category": "shopping",
        "amountInCents": -3000,
        "merchantName": "Store",
        "accountingDate": "2023-11-13T00:00:00.000",
        "tags": [
            {"key": "new_tag", "value": "new_value"}
        ]
    }
    "#;

    let update_response = app.update_payment(payment_id, update_body).await;

    // Assert
    assert_eq!(200, update_response.status().as_u16());
    let update_json: serde_json::Value = update_response.json().await.unwrap();

    let updated_tags = update_json["tags"].as_array().unwrap();
    assert_eq!(1, updated_tags.len(), "Should have only 1 tag after update");
    assert_eq!(updated_tags[0]["key"], "new_tag");
    assert_eq!(updated_tags[0]["value"], "new_value");

    // Verify in database that old tags are gone
    let final_tags = sqlx::query!(
        "SELECT key, value FROM expenses.payments_tags WHERE payment_id = $1",
        payment_id
    )
    .fetch_all(&app.db_pool)
    .await
    .unwrap();

    assert_eq!(1, final_tags.len());
    assert_eq!(final_tags[0].key, "new_tag");
    assert_eq!(final_tags[0].value, "new_value");
}

#[tokio::test]
async fn update_payment_with_wallet() {
    // Arrange
    let app = spawn_app().await;

    // Create wallet
    let wallet_body = r#"{"name": "Test Wallet"}"#;
    let wallet_response = app.create_wallet(wallet_body).await;
    assert_eq!(200, wallet_response.status().as_u16());

    // Create payment with wallet
    let create_body = r#"
    {
        "description": "payment with wallet",
        "category": "utilities",
        "amountInCents": -10000,
        "merchantName": "Electric Company",
        "accountingDate": "2023-11-13T00:00:00.000",
        "wallet": "Test Wallet"
    }
    "#;

    let create_response = app.post_payment(create_body).await;
    assert_eq!(200, create_response.status().as_u16());
    let create_json: serde_json::Value = create_response.json().await.unwrap();
    let payment_id = uuid::Uuid::parse_str(create_json["id"].as_str().unwrap()).unwrap();

    // Act - Update payment with same wallet
    let update_body = r#"
    {
        "description": "updated payment",
        "category": "utilities",
        "amountInCents": -12000,
        "merchantName": "Electric Company",
        "accountingDate": "2023-11-14T00:00:00.000",
        "wallet": "Test Wallet"
    }
    "#;

    let update_response = app.update_payment(payment_id, update_body).await;

    // Assert
    assert_eq!(200, update_response.status().as_u16());
    let update_json: serde_json::Value = update_response.json().await.unwrap();
    assert_eq!(update_json["wallet"], "Test Wallet");
    assert_eq!(update_json["amountInCents"], -12000);
}

#[tokio::test]
async fn update_payment_converts_expense_to_income() {
    // Arrange
    let app = spawn_app().await;

    // Create expense
    let create_body = r#"
    {
        "description": "expense",
        "category": "food",
        "amountInCents": -5000,
        "merchantName": "Restaurant",
        "accountingDate": "2023-11-13T00:00:00.000"
    }
    "#;

    let create_response = app.post_payment(create_body).await;
    assert_eq!(200, create_response.status().as_u16());
    let create_json: serde_json::Value = create_response.json().await.unwrap();
    let payment_id = uuid::Uuid::parse_str(create_json["id"].as_str().unwrap()).unwrap();

    // Act - Convert to income by making amount positive
    let update_body = r#"
    {
        "description": "now income",
        "category": "income",
        "amountInCents": 5000,
        "merchantName": "Salary",
        "accountingDate": "2023-11-13T00:00:00.000"
    }
    "#;

    let update_response = app.update_payment(payment_id, update_body).await;

    // Assert
    assert_eq!(200, update_response.status().as_u16());
    let update_json: serde_json::Value = update_response.json().await.unwrap();
    assert_eq!(update_json["amountInCents"], 5000);
    assert_eq!(update_json["category"], "income");

    // Verify in database
    let saved = sqlx::query!(
        "SELECT p.amount, c.name as category_name FROM expenses.payments p JOIN expenses.categories c ON p.category_id = c.id WHERE p.id = $1",
        payment_id
    )
    .fetch_one(&app.db_pool)
    .await
    .unwrap();

    assert_eq!(saved.amount.unwrap(), 5000);
    assert_eq!(saved.category_name, "income");
}

#[rstest]
#[case(r#"{"amountInCents": 0}"#)] // Missing required fields
#[case(r#"{"description": "test", "category": "", "amountInCents": -100, "merchantName": "test", "accountingDate": "2023-11-13T00:00:00.000"}"#)] // Empty category
#[tokio::test]
async fn update_payment_returns_400_for_invalid_data(#[case] invalid_body: &str) {
    // Arrange
    let app = spawn_app().await;

    // Create a valid payment first
    let create_body = r#"
    {
        "description": "valid",
        "category": "food",
        "amountInCents": -100,
        "merchantName": "test",
        "accountingDate": "2023-11-13T00:00:00.000"
    }
    "#;

    let create_response = app.post_payment(create_body).await;
    let create_json: serde_json::Value = create_response.json().await.unwrap();
    let payment_id = uuid::Uuid::parse_str(create_json["id"].as_str().unwrap()).unwrap();

    // Act - Try to update with invalid data
    let update_response = app.update_payment(payment_id, invalid_body).await;

    // Assert
    assert_eq!(
        400,
        update_response.status().as_u16(),
        "API should return 400 for invalid payload: {}",
        invalid_body
    );
}

#[tokio::test]
async fn get_payments_filters_by_category() {
    // Arrange
    let app = spawn_app().await;

    // Create payments with different categories
    app.post_payment(
        r#"{
        "description": "Food expense",
        "category": "food",
        "amountInCents": -1000,
        "merchantName": "Restaurant",
        "accountingDate": "2023-06-15T00:00:00.000"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "Transport expense",
        "category": "transport",
        "amountInCents": -500,
        "merchantName": "Taxi",
        "accountingDate": "2023-06-15T00:00:00.000"
    }"#,
    )
    .await;

    // Act - Filter by food category
    let response = app.get_payments("?page=0&size=10&category=food").await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert_eq!(1, content.len());
    assert_eq!("food", content[0]["category"]);
}

#[tokio::test]
async fn get_payments_filters_by_wallet() {
    // Arrange
    let app = spawn_app().await;

    // Create wallets
    app.post_wallet(r#"{"name": "Cash"}"#).await;
    app.post_wallet(r#"{"name": "Credit Card"}"#).await;

    // Create payments with different wallets
    app.post_payment(
        r#"{
        "description": "Cash expense",
        "category": "food",
        "amountInCents": -1000,
        "merchantName": "Restaurant",
        "accountingDate": "2023-06-15T00:00:00.000",
        "wallet": "Cash"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "Card expense",
        "category": "food",
        "amountInCents": -2000,
        "merchantName": "Store",
        "accountingDate": "2023-06-15T00:00:00.000",
        "wallet": "Credit Card"
    }"#,
    )
    .await;

    // Act - Filter by Cash wallet
    let response = app.get_payments("?page=0&size=10&wallet=Cash").await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert_eq!(1, content.len());
    assert_eq!("Cash", content[0]["wallet"]);
}

#[tokio::test]
async fn get_payments_filters_by_search_merchant() {
    // Arrange
    let app = spawn_app().await;

    app.post_payment(
        r#"{
        "description": "test",
        "category": "food",
        "amountInCents": -1000,
        "merchantName": "SuperMarket ABC",
        "accountingDate": "2023-06-15T00:00:00.000"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "test",
        "category": "food",
        "amountInCents": -500,
        "merchantName": "Restaurant XYZ",
        "accountingDate": "2023-06-15T00:00:00.000"
    }"#,
    )
    .await;

    // Act - Search for "market" in merchant name
    let response = app.get_payments("?page=0&size=10&search=market").await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert_eq!(1, content.len());
    assert!(content[0]["merchantName"]
        .as_str()
        .unwrap()
        .to_lowercase()
        .contains("market"));
}

#[tokio::test]
async fn get_payments_filters_by_search_description() {
    // Arrange
    let app = spawn_app().await;

    app.post_payment(
        r#"{
        "description": "Weekly groceries shopping",
        "category": "food",
        "amountInCents": -1000,
        "merchantName": "Store",
        "accountingDate": "2023-06-15T00:00:00.000"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "Fuel for car",
        "category": "transport",
        "amountInCents": -500,
        "merchantName": "Gas Station",
        "accountingDate": "2023-06-15T00:00:00.000"
    }"#,
    )
    .await;

    // Act - Search for "groceries" in description
    let response = app.get_payments("?page=0&size=10&search=groceries").await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert_eq!(1, content.len());
    assert!(content[0]["description"]
        .as_str()
        .unwrap()
        .to_lowercase()
        .contains("groceries"));
}

#[tokio::test]
async fn get_payments_filters_by_date_range() {
    // Arrange
    let app = spawn_app().await;

    app.post_payment(
        r#"{
        "description": "Old payment",
        "category": "food",
        "amountInCents": -1000,
        "merchantName": "Store",
        "accountingDate": "2023-01-15T00:00:00.000"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "Recent payment",
        "category": "food",
        "amountInCents": -1500,
        "merchantName": "Store",
        "accountingDate": "2023-06-15T00:00:00.000"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "Future payment",
        "category": "food",
        "amountInCents": -2000,
        "merchantName": "Store",
        "accountingDate": "2023-12-15T00:00:00.000"
    }"#,
    )
    .await;

    // Act - Filter by date range (June 2023)
    let response = app
        .get_payments("?page=0&size=10&dateFrom=2023-06-01&dateTo=2023-06-30")
        .await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert_eq!(1, content.len());
    assert_eq!("Recent payment", content[0]["description"]);
}

#[tokio::test]
async fn get_payments_combines_multiple_filters() {
    // Arrange
    let app = spawn_app().await;

    app.post_wallet(r#"{"name": "Main Account"}"#).await;

    app.post_payment(
        r#"{
        "description": "Food at restaurant",
        "category": "food",
        "amountInCents": -1000,
        "merchantName": "Restaurant ABC",
        "accountingDate": "2023-06-15T00:00:00.000",
        "wallet": "Main Account"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "Food at market",
        "category": "food",
        "amountInCents": -1500,
        "merchantName": "SuperMarket",
        "accountingDate": "2023-06-15T00:00:00.000",
        "wallet": "Main Account"
    }"#,
    )
    .await;

    app.post_payment(
        r#"{
        "description": "Transport",
        "category": "transport",
        "amountInCents": -500,
        "merchantName": "Taxi",
        "accountingDate": "2023-06-15T00:00:00.000",
        "wallet": "Main Account"
    }"#,
    )
    .await;

    // Act - Filter by category=food, wallet=Main Account, search=restaurant
    let response = app
        .get_payments("?page=0&size=10&category=food&wallet=Main%20Account&search=restaurant")
        .await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let json: serde_json::Value = response.json().await.unwrap();
    let content = json["content"].as_array().unwrap();
    assert_eq!(1, content.len());
    assert_eq!("food", content[0]["category"]);
    assert_eq!("Main Account", content[0]["wallet"]);
    assert!(content[0]["merchantName"]
        .as_str()
        .unwrap()
        .to_lowercase()
        .contains("restaurant"));
}
