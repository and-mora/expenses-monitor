# Functional Analysis - Expenses Monitor

## 1. Introduction
**Expenses Monitor** is a web application designed for tracking and analyzing personal expenses. The system allows users to record financial transactions, organize them by wallets and categories, and visualize detailed insights about their finances through dedicated dashboards.

The current architecture includes a web frontend (Angular), a backend (migrating from Java Spring Boot to Rust Actix), a relational database (PostgreSQL), and a monitoring/analytics stack based on Prometheus and Grafana.

## 2. Actors and User Personas
*   **End User**: The main actor interacts with the system to enter data and consult reports.
    *   **Goal**: Track daily expenses, categorize them, and monitor monthly budget and savings trends.

## 3. Functional Modules

### 3.1 Access Management and Security
The system protects user data via authentication.
*   **Login**: Sign-in with credentials. The system supports integration with Keycloak for identity management (OAuth2/OIDC) or Basic authentication (being deprecated/migrated).
*   **Logout**: Secure session termination.

### 3.2 Wallet Management
Users can manage multiple financial “containers” to separate expenses or funds.
*   **Create Wallet**: Create new wallets (e.g., “Cash”, “Bank Account”, “PayPal”).
    *   *Data*: Wallet name (unique).
*   **View**: List active wallets.
*   **Delete**: Remove a wallet (with integrity checks if it contains payments).

### 3.3 Expense Tracking (Payments)
The core of the application is recording transactions.
*   **Create Payment**: Register a new expense.
    *   *Data*: Description, Amount, Category, Merchant, Accounting Date, Reference Wallet, Optional Tags.
*   **Payments List**: Paginated view of the latest recorded expenses.
*   **Total Balance**: Immediate view of the overall balance calculated as the algebraic sum of all transactions.

### 3.4 Dashboards and Analytics (Grafana)
The system delegates business intelligence to Grafana, which queries data sources or exposed metrics.
*   **Overall Trend**: High-level overview of finances over time.
*   **Current Month**: Focus on current-month expenses, likely including a category breakdown to monitor budget.
*   **Thematic Dashboards**:
    *   *Transportation*: Analysis focused on mobility-related expenses.
    *   *Travel*: Aggregation of expenses related to vacations or trips.
    *   *Welfare Tickets*: Tracking for company benefits/meal vouchers.

## 4. Data Flow

1.  **Input**: Users enter data via the Angular UI.
2.  **Processing**: The backend (Rust/Java) receives the data, validates business rules (e.g., unique names, valid dates), and persists it to PostgreSQL.
3.  **Storage**: PostgreSQL is the source of truth for all transactional data.
4.  **Analytics**: Grafana connects to data sources (likely via direct SQL queries on Postgres or via exported metrics) to generate charts and real-time reports.

## 5. Relevant Technical Aspects
*   **Backend Migration**: The system is transitioning to Rust to improve performance and reduce resource footprint. Functionality has been aligned to ensure the frontend continues to work transparently.
*   **Infrastructure**: Native support for Kubernetes (k8s) deployment, including configuration for Secrets, ConfigMaps, and Ingress.
*   **Technical Monitoring**: In addition to business data, the system monitors itself (container/node metrics, ArgoCD) to ensure reliability.
