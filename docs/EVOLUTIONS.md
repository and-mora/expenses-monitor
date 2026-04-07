# Future Evolutions - Expenses Monitor

Based on the architectural and functional analysis of the current system, several pain points and improvement areas have been identified. Below are proposed solutions and new features to evolve the application.

---

## 🎯 NEXT PRIORITY: PSD2 Bank Account Integration

### Problem Statement
Users must manually enter each expense, which is time-consuming and error-prone. To achieve "zero manual entry", we need to automatically import transactions from bank accounts while maintaining user control over categorization and validation.

### Chosen Solution: Open Banking Integration with Staging Table

#### Architecture Overview
- **Provider Selection**: Use **Nordigen** (reliable EU-based Open Banking aggregator) or **GoCardless** for developer-friendly APIs
- **Data Flow**: K8s CronJob → Bank API → Staging Table → User Review → Import
- **Security**: OAuth2 consent flow, encrypted storage, no permanent bank credentials

#### Database Schema
```sql
-- Staging table for imported transactions
CREATE TABLE expenses.staging_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,                           -- From Keycloak
    bank_transaction_id TEXT UNIQUE NOT NULL,        -- Bank's unique ID
    amount_in_cents BIGINT NOT NULL,                 -- Always in cents
    currency TEXT NOT NULL DEFAULT 'EUR',
    booking_date DATE NOT NULL,
    value_date DATE,
    creditor_name TEXT,                              -- Merchant/payee
    debtor_name TEXT,                                -- For income transactions
    remittance_info TEXT,                            -- Transaction description
    suggested_category TEXT,                         -- AI/ML suggestion (future)
    suggested_merchant TEXT,                         -- Normalized merchant name
    status TEXT NOT NULL DEFAULT 'pending'           -- pending/reviewed/imported/rejected
        CHECK (status IN ('pending', 'reviewed', 'imported', 'rejected')),
    imported_payment_id UUID REFERENCES expenses.payments(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_staging_user_status ON expenses.staging_transactions(user_id, status);
CREATE INDEX idx_staging_booking_date ON expenses.staging_transactions(booking_date);
```

#### API Changes

**New Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /banking/connect` | POST | Initiate bank connection (OAuth2 flow) |
| `GET /banking/accounts` | GET | List connected bank accounts |
| `POST /banking/sync/{accountId}` | POST | Trigger manual sync for account |
| `GET /staging/transactions` | GET | List staging transactions with pagination |
| `PUT /staging/transactions/{id}` | PUT | Update staging transaction (category, merchant, status) |
| `POST /staging/import` | POST | Bulk import approved staging transactions |

**Bank Connection Flow:**
1. User clicks "Connect Bank" → Redirect to Nordigen/GoCardless OAuth2
2. User selects bank and consents to data access
3. Backend receives access token, stores encrypted refresh token
4. K8s CronJob runs daily to fetch new transactions

#### Frontend Changes

1. **Banking Settings Page**: 
   - Connect/disconnect bank accounts
   - View connected accounts and last sync status
   - Manual sync button

2. **Staging Review UI**:
   - List pending transactions with smart suggestions
   - Bulk edit category/merchant
   - Approve/reject transactions
   - Auto-import rules (future: "always import from this merchant as category X")

3. **Transaction Matching**:
   - Fuzzy matching against existing payments to avoid duplicates
   - Confidence scoring for auto-import candidates

#### Implementation Steps
1. Choose Open Banking provider (Nordigen recommended for EU compliance)
2. Create staging_transactions table migration
3. Implement OAuth2 connection flow in backend
4. Add K8s CronJob for automated sync
5. Create staging API endpoints
6. Build frontend banking settings and staging review UI
7. Add transaction deduplication logic
8. Update OpenAPI spec and test integration

---

## 1. Current Pain Points

*   **Manual Data Entry**: Users must record each expense manually. This is time-consuming ("friction") and prone to errors or omissions.
*   **Reactive Analytics**: Dashboards show what happened in the past, but they do not proactively help plan ahead or avoid exceeding the budget before it happens.
*   **Lack of Automation**: Recurring expenses (rent, subscriptions) must be entered each time or managed manually.
*   **Implicit Income/Expense Semantics**: At the moment, income vs expense is inferred from the sign of the amount (negative = expense, positive = income). This is simple and works for basic flows, but it becomes ambiguous for refunds, chargebacks, and especially transfers between wallets.
*   **Missing Core Finance Flows**: Common scenarios are not first-class (income vs expense, transfers between wallets, refunds, split transactions).
*   **Data Quality Issues Over Time**: Merchant naming drift/duplicates, accidental double entries, inconsistent categories/tags, and low searchability reduce the value of the dataset.
*   **Budgeting and Alerts Are Not Built-In**: Users cannot set category/wallet budgets, get warnings before overspending, or forecast month-end results.
*   **Identity and Data Ownership Model**: If Keycloak/OIDC is used, the platform needs clear per-user (or multi-tenant) ownership and access control across wallets/payments/tags.
*   **Operational Gaps**: Import jobs, migrations, backups, and post-deploy checks are not described as a full operational lifecycle.

## 2. Evolution Proposals

### A. Category Icons & Customization ✅ COMPLETED
Allow users to customize icons and colors for their categories.
*   **Category Table**: Store icon_name and color per category in DB.
*   **Icon Picker UI**: Settings page with icon grid selection.
*   **Auto-creation**: New categories auto-created with defaults on first use.
*   See Completed Features table for implementation details.

### B. Automation and Data Integration (Goal: Zero Manual Entry)
Drastically reduce the time spent on data entry.

*   **Bank Account Integration (PSD2)**:
    *   Use an Open Banking provider (e.g., **GoCardless** or **Nordigen**) that offers developer-friendly APIs.
    *   The Rust backend, via a Kubernetes-scheduled job, periodically queries the bank API to download new transactions.
    *   Transactions are saved into a "staging" table to be reviewed or auto-imported when recognized.

*   **Smart CSV Import**:
    *   Implement an endpoint for uploading statements (CSV/XLSX).
    *   Provide a mapping + preview workflow (column mapping, date/amount parsing, locale/currency).
    *   **Smart Matching**: Classify imported rows and suggest Category and Merchant based on historical data.
    *   Add deduplication (e.g., hash on date/amount/merchant) and idempotency keys to avoid duplicates on retries.
    *   Provide a "Reconciliation" UI in the frontend to confirm suggestions and resolve conflicts.

*   **Recurring Payments Management**:
    *   Use **K8s CronJobs** to automatically generate recurring transactions (e.g., rent, subscriptions) with no manual intervention.
    *   Add recurrence templates (active/paused), exception handling ("skip next occurrence"), and a predictable "next run" schedule.

### C. User Experience (UX/UI)
Improve accessibility and speed of use.

*   **Mobile First / PWA**: Optimize the frontend for smartphone usage, enabling quick "on-the-go" entry.
*   **Quick Actions**: Widgets to enter frequent expenses with a single tap.

### D. Artificial Intelligence
Leverage historical data to provide insights.

*   **Smart Categorization**: Automatically suggest category and merchant when entering a new expense.

### E. Core Finance Model
Make the platform handle real-world money flows reliably.

*   **Transaction Types**: Introduce first-class types such as `expense`, `income`, `transfer`, `refund`.
    *   Backward compatible approach: keep the current "sign = direction" convention as the default, and introduce an optional `type` field for cases where the sign is not enough (e.g., refunds, chargebacks, transfers).
*   **Transfers Between Wallets**: Model transfers as linked transactions (or a single transfer entity) to keep balances consistent.
*   **Split Transactions**: Allow splitting one payment into multiple category lines (useful for supermarket receipts).

### F. Budgeting and Proactive Insights
Help users avoid overspending, not just analyze it afterwards.

*   **Budgets**: Monthly budgets by category and/or wallet.
*   **Alerts**: Threshold notifications (e.g., 80% / 100%), with optional hard warnings in UI.
*   **Forecast**: Simple month-end forecast based on current spending + historic seasonality.

### G. Data Quality, Search, and Reporting
Increase the long-term usefulness of the dataset.

*   **Merchant Normalization**: Canonical merchants + aliases; merge duplicates.
*   **Better Search**: Filter by date range, wallet, category, merchant, tags; saved filters/views. ✅ DONE
*   **Exports**: CSV export for a date range, category, or tag.
*   **In-App Summaries**: "Spend by category", "Top merchants", "Month-over-month" views (Grafana remains available for advanced dashboards).

### H. Security and Data Ownership
Make identity integration operationally complete.

*   **Ownership**: Add `user_id` (or tenant id) to wallets/payments/tags; enforce it in queries.
*   **Access Control**: Minimal RBAC (user/admin) if needed.
*   **Audit Log**: Track destructive operations (delete wallet/payment), including who did what and when.

### I. Architecture and Operations
Leverage the existing Kubernetes infrastructure to add value.

*   **K8s CronJobs**: Implement recurring expenses and backups using native Kubernetes CronJobs.
*   **Migrations Lifecycle**: Run DB migrations as a dedicated job/init step in the deployment pipeline. ✅ DONE
*   **Backups/Restore**: Document and test a restore procedure (especially before introducing imports/automation).
*   **Post-Deploy Smoke Checks**: Automate basic health checks and API smoke tests after deployments.
*   **Scalability**: Define Horizontal Pod Autoscalers (HPA) even if load is low, for educational purposes.
*   **GitOps**: Continue improving deployment automation (ArgoCD is already mentioned in dashboards).

## 3. Updated Roadmap (February 2026)

| Phase | Focus Area | Features | Effort |
|-------|------------|----------|--------|
| **1** | **Category Icons** ✅ | Categories table, icon picker, auto-creation | 1-2 days |
| **2** | PSD2 Integration | Open Banking, staging table, auto-import | 5-10 days |
| **3** | Reporting | In-app "Spend by category", "Top merchants" views | 1-2 days |
| **4** | Budgets | Monthly budgets per category, threshold warnings | 2-3 days |
| **5** | Recurring Payments | K8s CronJobs, templates, skip/pause | 2-3 days |
| **6** | CSV Import | Upload wizard, column mapping, dedup, reconciliation | 3-5 days |
| **7** | Data Ownership | user_id in model, Keycloak integration, audit log | 3-5 days |
| **8** | Mobile/PWA | Installable app, offline mode, quick actions | 3-5 days |
| **9** | PSD2 Integration | Open Banking, staging table, auto-import | 5-10 days |
| **10** | AI Features | Smart categorization, receipt OCR | 5-10 days |

---

## 4. Completed Features (Reference)

| Feature | Status | Notes |
|---------|--------|-------|
| Rust Backend Migration | ✅ | Full API parity with Java |
| React Frontend | ✅ | expense-companion is primary UI |
| Transaction Filters | ✅ | Date, category, wallet, search |
| Server-side Pagination | ✅ | With infinite scroll |
| Timeline View | ✅ | Grouped by day |
| Tags System | ✅ | Key-value tags with junction table |
| Keycloak Auth | ✅ | OAuth2/OIDC with auto-refresh |
| Dark/Light Theme | ✅ | Toggle in Settings |
| Grafana Dashboards | ✅ | Multiple themed dashboards |
| Kubernetes Deployment | ✅ | ArgoCD GitOps |
| Observability Stack | ✅ | Prometheus, Loki, Tempo, Grafana |
| DB Migrations Automation | ✅ | K8s Job with ArgoCD PreSync hook, sqlx-cli |
| Declarative TLS Management | ✅ | `ClusterIssuer` + explicit `Certificate` CRDs under `manifest/gateway-api` for Gateway TLS renewal |
| Category Icons | ✅ | Categories table with icons and colors, icon picker UI, auto-creation |
