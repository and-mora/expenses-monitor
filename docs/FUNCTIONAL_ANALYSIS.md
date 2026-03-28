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

### 3.9 Banking / PSD2 Staging Review ✅ Implemented in the primary stack
The bank-integration flow is now present in the Rust backend and React frontend.
*   **Bank Connection Flow**: `POST /banking/connect` creates a per-user connection owned by the Keycloak `sub` claim and returns an authorization URL.
*   **Callback Handling**: `GET /banking/callback` validates the state, encrypts the refresh token at rest with AES-GCM, and marks the connection connected.
*   **Sync**: `POST /banking/sync/{connectionId}` fetches provider transactions, upserts `expenses.staging_transactions`, and preserves user-reviewed/rejected/imported decisions plus edited merchant/category suggestions.
*   **Staging Review**: `GET /staging/transactions`, `PUT /staging/transactions/{id}`, and `POST /staging/import` support staged review and import into `expenses.payments`.
*   **Categories**: PSD2 import and payment flows now use user-scoped categories in the backend.
*   **Current provider support**: the backend currently accepts the `mock` provider only; the `nordigen` option in the UI is a placeholder for a later rollout.

## 4. Data Flow

1.  **Input**: Users enter data via React UI (expense-companion), including the `/banking` PSD2 page.
2.  **Auth**: JWT token from Keycloak included in all API requests; backend derives the internal `user_id` from the `sub` claim.
3.  **Processing**: Rust backend (Actix-web) validates and persists to PostgreSQL, including banking/staging tables.
4.  **Storage**: PostgreSQL schema `expenses` (wallets, payments, tags, payment_tags, bank_connections, staging_transactions).
5.  **Analytics**: Grafana connects via direct SQL queries for dashboards.
6.  **Observability**: Traces via OpenTelemetry → Tempo, Logs → Loki, Metrics → Prometheus.

## 5. UI Components Implemented

| Component | Location | Description |
|-----------|----------|-------------|
| Dashboard | `/` | Balance, wallets, spending chart, recent transactions |
| Transactions | `/transactions` | Full list with filters, pagination, infinite scroll |
| Banking | `/banking` | PSD2 connection, sync, staging review, and import |
| PaymentDetail | `/payments/:id` | Payment info, tags, edit/delete actions |
| Settings | `/settings` | Theme toggle |
| AddPaymentDialog | Dashboard | Modal for creating payments |
| EditPaymentDialog | Transaction list | Sheet for editing payments |
| BankConnectionSheet | Banking page | Start a PSD2 connection and receive an authorization URL |
| StagingTransactionSheet | Banking page | Edit staging merchant/category/status before import |
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
| `/banking/connect` | POST | Create a bank connection and return an authorization URL |
| `/banking/callback` | GET | Complete the provider callback and store encrypted refresh tokens |
| `/banking/accounts` | GET | List bank connections for the authenticated user |
| `/banking/sync/{connectionId}` | POST | Trigger a manual bank sync |
| `/banking/sync/{connectionId}/status` | GET | Read the last sync summary for a connection |
| `/staging/transactions` | GET | List staging transactions with filters and pagination |
| `/staging/transactions/{id}` | PUT | Update staging transaction merchant/category/status |
| `/staging/import` | POST | Import reviewed staging transactions into payments |
| `/metrics` | GET | Prometheus metrics |

## 7. What's Missing (See EVOLUTIONS.md for Roadmap)

### 7.1 Not Yet Implemented
- ❌ **Category Icons**: Categories are dynamic but icons are hardcoded (fallback to CircleDot)
- ❌ **Budgets**: No budget setting or tracking
- ❌ **Alerts/Notifications**: No threshold warnings
- ❌ **Recurring Payments**: No automation for subscriptions
- ❌ **Import/Export**: No CSV import or export
- ❌ **PWA/Mobile**: Not installable as app
- ❌ **Merchant Normalization**: No deduplication
- ❌ **Bank Disconnect / Revocation**: No user-facing disconnect flow yet
- ⚠️ **Live PSD2 Provider Rollout**: backend still runs on the mock provider path until the secret rollout is completed

### 7.2 Partially Implemented
- ⚠️ **In-App Reporting**: Basic spending chart exists, but no detailed breakdowns
- ⚠️ **Search**: Free-text search implemented but could be enhanced
- ⚠️ **Banking Provider Coverage**: UI exposes provider selection, but only the mock provider is currently accepted by the backend

## 8. Technical Aspects
*   **Backend Rust**: Migration from Java completed. All endpoints functional.
*   **Infrastructure**: Kubernetes deployment via ArgoCD, Helm charts in `manifest/`.
*   **CI/CD**: GitHub Actions with semantic versioning per module.
*   **Security**: Strict JWT validation, explicit CORS allowlists, and no raw token logging in bank flows.
*   **Observability**: Full stack (Prometheus, Grafana, Loki, Tempo).
