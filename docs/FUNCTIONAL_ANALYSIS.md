# Functional Analysis - Expenses Monitor

## 1. Introduction
**Expenses Monitor** is a web application designed for tracking and analyzing personal expenses. The system allows users to record financial transactions, organize them by wallets and categories, and visualize detailed insights about their finances through dedicated dashboards.

The current architecture includes:
- **Frontend**: React + Vite (expense-companion) - primary modern UI
- **Frontend Legacy**: Angular (frontend) - being phased out
- **Backend**: Rust Actix (backend-rust) - primary API server ✅
- **Backend Legacy**: Java Spring Boot (backend) - deprecated
- **Database**: PostgreSQL with schema `expenses`
- **Auth**: Keycloak (OAuth2/OIDC)
- **Observability**: Prometheus, Grafana, Loki, Tempo
- **Deployment**: Kubernetes via ArgoCD GitOps

## 2. Actors and User Personas
*   **End User**: The main actor interacts with the system to enter data and consult reports.
    *   **Goal**: Track daily expenses, categorize them, and monitor monthly budget and savings trends.

## 3. Functional Modules

### 3.1 Access Management and Security ✅ Completed
The system protects user data via authentication.
*   **Login**: Keycloak OAuth2/OIDC integration with automatic token refresh (every 60s)
*   **Logout**: Secure session termination with token invalidation
*   **Protected Routes**: All application routes require authentication via `<AuthGuard>`

### 3.2 Wallet Management ✅ Completed
Users can manage multiple financial "containers" to separate expenses or funds.
*   **Create Wallet**: Create new wallets (e.g., "Cash", "Bank Account", "PayPal").
    *   *Data*: Wallet name (unique).
*   **View**: List active wallets with balance display on Dashboard.
*   **Delete**: Remove a wallet (with integrity checks if it contains payments).
*   **API**: `GET/POST /wallets`, `DELETE /wallets/{id}`

### 3.3 Expense Tracking (Payments) ✅ Completed
The core of the application is recording transactions.
*   **Create Payment**: Register a new expense via AddPaymentDialog.
    *   *Data*: Description, Amount (in cents), Category, Merchant, Accounting Date, Reference Wallet (optional), Tags (key-value pairs).
*   **Edit Payment**: Modify existing transactions via EditPaymentDialog (mobile-optimized Sheet).
*   **Delete Payment**: Remove transactions with confirmation.
*   **View Payment Detail**: Dedicated page with full payment information and tags.
*   **API**: Full CRUD - `GET/POST /payments`, `GET/PUT/DELETE /payments/{id}`

### 3.4 Transaction Listing ✅ Completed (Major UX Investment)
Advanced transaction browsing with filtering and multiple views.
*   **List View**: Paginated table with compact layout.
*   **Timeline View**: Chronological view grouped by day with infinite scroll.
*   **Filters**: 
    *   Date range (from/to)
    *   Category filter
    *   Wallet filter
    *   Free-text search (description, merchant)
*   **Server-Side Filtering**: Filters applied at database level for performance.
*   **Pagination**: Server-side pagination with configurable page size (default 50).
*   **Infinite Scroll**: Timeline view with automatic page loading.

### 3.5 Balance and Analytics ✅ Completed
*   **Total Balance**: Real-time calculation from all transactions (`GET /balance`).
*   **Balance by Date Range**: Filter balance by period.
*   **Spending Chart**: Category breakdown visualization on Dashboard (recharts).
*   **Categories API**: Dynamic categories from existing payments (`GET /categories`).

### 3.6 Tags System ✅ Completed
Flexible tagging for categorization beyond categories.
*   **Key-Value Tags**: Each tag has a key and optional value.
*   **Add Tags**: Tag input with autocomplete during payment creation/edit.
*   **Display Tags**: Tags shown on transaction items and detail page.
*   **Junction Table**: `payment_tags` links payments to tags.

### 3.7 Dashboards and Analytics (Grafana) ✅ Completed
The system delegates business intelligence to Grafana, which queries data sources or exposed metrics.
*   **Overall Trend**: High-level overview of finances over time.
*   **Current Month**: Focus on current-month expenses with category breakdown.
*   **Thematic Dashboards**:
    *   *Transportation*: Analysis focused on mobility-related expenses.
    *   *Travel*: Aggregation of expenses related to vacations or trips.
    *   *Welfare Tickets*: Tracking for company benefits/meal vouchers.

### 3.8 User Preferences ✅ Partial
*   **Theme Switching**: Dark/Light mode toggle.
*   **Layout Persistence**: Transaction view layout saved in localStorage.

## 4. Data Flow

1.  **Input**: Users enter data via React UI (expense-companion).
2.  **Auth**: JWT token from Keycloak included in all API requests.
3.  **Processing**: Rust backend (Actix-web) validates and persists to PostgreSQL.
4.  **Storage**: PostgreSQL schema `expenses` (wallets, payments, tags, payment_tags).
5.  **Analytics**: Grafana connects via direct SQL queries for dashboards.
6.  **Observability**: Traces via OpenTelemetry → Tempo, Logs → Loki, Metrics → Prometheus.

## 5. UI Components Implemented

| Component | Location | Description |
|-----------|----------|-------------|
| Dashboard | `/` | Balance, wallets, spending chart, recent transactions |
| Transactions | `/transactions` | Full list with filters, pagination, infinite scroll |
| PaymentDetail | `/payments/:id` | Payment info, tags, edit/delete actions |
| Settings | `/settings` | Theme toggle |
| AddPaymentDialog | Dashboard | Modal for creating payments |
| EditPaymentDialog | Transaction list | Sheet for editing payments |
| TransactionFilters | Transactions page | Filter controls |
| CategoryCombobox | Payment forms | Category selection with autocomplete |
| TagInput | Payment forms | Tag entry with suggestions |

## 6. API Endpoints (Backend Rust)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/balance` | GET | Get total balance (optional date filters) |
| `/wallets` | GET/POST | List/Create wallets |
| `/wallets/{id}` | DELETE | Delete wallet |
| `/payments` | GET/POST | List/Create payments (with pagination/filters) |
| `/payments/{id}` | GET/PUT/DELETE | Get/Update/Delete payment |
| `/categories` | GET | Get distinct categories (optional type filter) |
| `/metrics` | GET | Prometheus metrics |

## 7. What's Missing (See EVOLUTIONS.md for Roadmap)

### 7.1 Not Yet Implemented
- ❌ **Category Icons**: Categories are dynamic but icons are hardcoded (fallback to CircleDot)
- ❌ **Budgets**: No budget setting or tracking
- ❌ **Alerts/Notifications**: No threshold warnings
- ❌ **Recurring Payments**: No automation for subscriptions
- ❌ **Import/Export**: No CSV import or export
- ❌ **Multi-user/Ownership**: No user_id in data model
- ❌ **PWA/Mobile**: Not installable as app
- ❌ **Merchant Normalization**: No deduplication

### 7.2 Partially Implemented
- ⚠️ **In-App Reporting**: Basic spending chart exists, but no detailed breakdowns
- ⚠️ **Search**: Free-text search implemented but could be enhanced

## 8. Technical Aspects
*   **Backend Rust**: Migration from Java completed. All endpoints functional.
*   **Infrastructure**: Kubernetes deployment via ArgoCD, Helm charts in `manifest/`.
*   **CI/CD**: GitHub Actions with semantic versioning per module.
*   **Observability**: Full stack (Prometheus, Grafana, Loki, Tempo).
