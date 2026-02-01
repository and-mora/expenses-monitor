use crate::helpers::spawn_app;

#[tokio::test]
async fn get_balance_returns_zero_when_no_payments() {
    let app = spawn_app().await;

    let response = app.get_balance().await;

    assert_eq!(response.status().as_u16(), 200);
    
    let balance: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse response");
    
    assert_eq!(balance["totalInCents"], 0);
    assert_eq!(balance["incomeInCents"], 0);
    assert_eq!(balance["expensesInCents"], 0);
}

#[tokio::test]
async fn get_balance_calculates_total_income_and_expenses() {
    let app = spawn_app().await;

    // Create income payment (+1000)
    let income_payload = serde_json::json!({
        "merchantName": "Salary",
        "amountInCents": 100000,
        "category": "salary",
        "accountingDate": "2026-01-15T10:00:00",
        "description": "Monthly salary"
    });
    
    app.post_payment(&income_payload.to_string()).await;

    // Create expense payment (-500)
    let expense1_payload = serde_json::json!({
        "merchantName": "Grocery Store",
        "amountInCents": -50000,
        "category": "food",
        "accountingDate": "2026-01-16T10:00:00",
        "description": "Groceries"
    });
    
    app.post_payment(&expense1_payload.to_string()).await;

    // Create another expense (-300)
    let expense2_payload = serde_json::json!({
        "merchantName": "Restaurant",
        "amountInCents": -30000,
        "category": "food",
        "accountingDate": "2026-01-17T10:00:00",
        "description": "Dinner"
    });
    
    app.post_payment(&expense2_payload.to_string()).await;

    let response = app.get_balance().await;

    assert_eq!(response.status().as_u16(), 200);
    
    let balance: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse response");
    
    // Total = 1000 - 500 - 300 = 200
    assert_eq!(balance["totalInCents"], 20000);
    // Income = 1000
    assert_eq!(balance["incomeInCents"], 100000);
    // Expenses = -500 + -300 = -800
    assert_eq!(balance["expensesInCents"], -80000);
}

#[tokio::test]
async fn get_balance_filters_by_start_date() {
    let app = spawn_app().await;

    // Payment before filter range
    let old_payment = serde_json::json!({
        "merchantName": "Old Payment",
        "amountInCents": -10000,
        "category": "food",
        "accountingDate": "2025-12-01T10:00:00",
        "description": "Old"
    });
    
    app.post_payment(&old_payment.to_string()).await;

    // Payment in filter range
    let new_payment = serde_json::json!({
        "merchantName": "New Payment",
        "amountInCents": -5000,
        "category": "food",
        "accountingDate": "2026-01-15T10:00:00",
        "description": "New"
    });
    
    app.post_payment(&new_payment.to_string()).await;

    let response = app.get_balance_with_query("?startDate=2026-01-01").await;

    assert_eq!(response.status().as_u16(), 200);
    
    let balance: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse response");
    
    // Should only include new payment (-50)
    assert_eq!(balance["totalInCents"], -5000);
    assert_eq!(balance["expensesInCents"], -5000);
}

#[tokio::test]
async fn get_balance_filters_by_date_range() {
    let app = spawn_app().await;

    // Payment before range
    let before_payment = serde_json::json!({
        "merchantName": "Before",
        "amountInCents": -10000,
        "category": "food",
        "accountingDate": "2025-12-15T10:00:00",
        "description": "Before"
    });
    
    app.post_payment(&before_payment.to_string()).await;

    // Payment in range
    let in_range_payment = serde_json::json!({
        "merchantName": "In Range",
        "amountInCents": 50000,
        "category": "salary",
        "accountingDate": "2026-01-15T10:00:00",
        "description": "In range"
    });
    
    app.post_payment(&in_range_payment.to_string()).await;

    // Payment after range
    let after_payment = serde_json::json!({
        "merchantName": "After",
        "amountInCents": -20000,
        "category": "food",
        "accountingDate": "2026-02-15T10:00:00",
        "description": "After"
    });
    
    app.post_payment(&after_payment.to_string()).await;

    let response = app
        .get_balance_with_query("?startDate=2026-01-01&endDate=2026-01-31")
        .await;

    assert_eq!(response.status().as_u16(), 200);
    
    let balance: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse response");
    
    // Should only include in-range payment (+500)
    assert_eq!(balance["totalInCents"], 50000);
    assert_eq!(balance["incomeInCents"], 50000);
    assert_eq!(balance["expensesInCents"], 0);
}

#[tokio::test]
async fn get_balance_filters_by_end_date() {
    let app = spawn_app().await;

    // Payment before end date
    let early_payment = serde_json::json!({
        "merchantName": "Early Payment",
        "amountInCents": 30000,
        "category": "salary",
        "accountingDate": "2026-01-10T10:00:00",
        "description": "Early"
    });
    
    app.post_payment(&early_payment.to_string()).await;

    // Payment after end date
    let late_payment = serde_json::json!({
        "merchantName": "Late Payment",
        "amountInCents": -10000,
        "category": "food",
        "accountingDate": "2026-02-10T10:00:00",
        "description": "Late"
    });
    
    app.post_payment(&late_payment.to_string()).await;

    let response = app.get_balance_with_query("?endDate=2026-01-31").await;

    assert_eq!(response.status().as_u16(), 200);
    
    let balance: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse response");
    
    // Should only include early payment (+300)
    assert_eq!(balance["totalInCents"], 30000);
    assert_eq!(balance["incomeInCents"], 30000);
    assert_eq!(balance["expensesInCents"], 0);
}
