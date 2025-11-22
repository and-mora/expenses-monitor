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
}
