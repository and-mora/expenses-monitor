use crate::helpers::spawn_app;
use expenses_monitor_be::routes::BalanceResponse;

#[tokio::test]
async fn get_balance_returns_correct_amount() {
    // Arrange
    let app = spawn_app().await;

    // Add some payments
    let payment1 = r#"
    {
        "description": "p1",
        "category": "test",
        "amountInCents": -1000,
        "merchantName": "m1",
        "accountingDate": "2023-01-01T00:00:00.000"
    }
    "#;
    let payment2 = r#"
    {
        "description": "p2",
        "category": "test",
        "amountInCents": 500,
        "merchantName": "m2",
        "accountingDate": "2023-01-01T00:00:00.000"
    }
    "#;

    app.post_payment(payment1).await;
    app.post_payment(payment2).await;

    // Act
    let response = app.get_balance().await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let balance: BalanceResponse = response.json().await.unwrap();
    assert_eq!(-500, balance.total_in_cents);
    assert_eq!(500, balance.income_in_cents);
    assert_eq!(-1000, balance.expenses_in_cents);
}

#[tokio::test]
async fn get_balance_returns_zero_when_no_payments() {
    // Arrange
    let app = spawn_app().await;

    // Act
    let response = app.get_balance().await;

    // Assert
    assert_eq!(200, response.status().as_u16());
    let balance: BalanceResponse = response.json().await.unwrap();
    assert_eq!(0, balance.total_in_cents);
    assert_eq!(0, balance.income_in_cents);
    assert_eq!(0, balance.expenses_in_cents);
}
