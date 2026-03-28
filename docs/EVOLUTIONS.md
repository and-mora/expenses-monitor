# Future Evolutions - Expenses Monitor

Based on the architectural and functional analysis of the current system, several pain points and improvement areas have been identified. Below are proposed solutions and new features to evolve the application.

---

## 🎯 PSD2 Bank Account Integration

### Status
Implemented in the current working tree across `backend-rust/` and `expense-companion/`, with rollout still blocked by cluster provisioning of the AES-GCM token-encryption key and real-provider activation.

### Problem Statement
Users must manually enter each expense, which is time-consuming and error-prone. To achieve "zero manual entry", the product now stages bank transactions for review while keeping user control over categorization and validation.

### Implemented Architecture
- **Backend routes**: `backend-rust/src/routes/banking.rs` and `backend-rust/src/routes/staging.rs`
- **Frontend surface**: `expense-companion/src/pages/Banking.tsx`, `expense-companion/src/components/banking/*`
- **Data flow**: connect → callback → sync → staging review → import
- **Security**: Keycloak-backed JWT validation via issuer discovery + JWKS, per-user ownership via `sub`, AES-GCM encrypted refresh tokens, no raw token logging

### Data Model
- `expenses.bank_connections` stores the user-owned connection, OAuth state, connection status, refresh-token ciphertext, sync counters, and timestamps.
- `expenses.staging_transactions` stores imported bank rows, keyed by `user_id` and `bank_transaction_id`, with a foreign key to `bank_connections`.
- `expenses.categories` is now user-scoped for PSD2 import/payment flows.
- Sync is idempotent and preserves user-reviewed/rejected/imported state plus edited merchant/category suggestions.

### Security Notes
- `user_id` is derived from the Keycloak `sub` claim.
- Refresh tokens are encrypted at rest using AES-GCM.
- `POST /banking/connect`, `GET /banking/callback`, `GET /banking/accounts`, `POST /banking/sync/{connectionId}`, `GET /banking/sync/{connectionId}/status`, `GET /staging/transactions`, `PUT /staging/transactions/{id}`, and `POST /staging/import` are bearer-protected.
- The backend currently accepts the `mock` provider only; the `nordigen` UI option is present but not yet supported server-side.

### API Changes

**New Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /banking/connect` | POST | Create a user-owned bank connection and return an authorization URL |
| `GET /banking/callback` | GET | Complete OAuth callback, encrypt refresh token, mark connection connected |
| `GET /banking/accounts` | GET | List the authenticated user's bank connections and sync metadata |
| `POST /banking/sync/{connectionId}` | POST | Trigger manual sync for a connection |
| `GET /banking/sync/{connectionId}/status` | GET | Read last sync status and counters |
| `GET /staging/transactions` | GET | List staging transactions with pagination and filters |
| `PUT /staging/transactions/{id}` | PUT | Update staging transaction merchant/category/status |
| `POST /staging/import` | POST | Bulk import reviewed staging transactions into payments |

**Bank Connection Flow:**
1. User opens `/banking` and submits the connection sheet.
2. Backend creates a pending `expenses.bank_connections` row and returns an authorization URL.
3. User completes provider authorization.
4. Backend callback encrypts the refresh token and marks the connection `connected`.
5. Manual sync fetches bank transactions and upserts `expenses.staging_transactions`.
6. User reviews staged rows and imports selected/reviewed items into `expenses.payments`.

### Frontend Changes

1. **Banking Page**: 
    - Connect bank accounts
    - View connected accounts and last sync status
    - Manual sync button

2. **Staging Review UI**:
   - List pending transactions with smart suggestions
   - Bulk edit category/merchant
   - Approve/reject transactions
   - Auto-import rules (future: "always import from this merchant as category X")

3. **Transaction Matching**:
    - Stable bank transaction identifier deduplication
    - Preservation of reviewed/rejected/imported decisions and edited suggestions on resync

### Remaining rollout items
1. Provision `backend-rust-psd2-secrets` in the cluster secret-management path with:
   - `token-encryption-key`
2. Wire a real PSD2 provider behind the current backend provider abstraction.
3. Re-run backend integration tests against reachable PostgreSQL in the local/CI environment.
4. Decide whether to keep or remove the mock-only provider option in production UI.

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
    *   The current Rust implementation already covers connect/callback/sync/staging review/import with per-user ownership.
    *   The backend provider path is mock-only for now; a real PSD2 provider (e.g., **Nordigen** or **GoCardless**) can be wired behind the same abstraction.
    *   Transactions are saved into a staging table and deduplicated by stable bank transaction identifier before review/import.

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
| **2** | PSD2 Integration ✅ | Banking connect/callback/sync/staging review implemented; rollout blocked on secrets | completed in code |
| **3** | Reporting | In-app "Spend by category", "Top merchants" views | 1-2 days |
| **4** | Budgets | Monthly budgets per category, threshold warnings | 2-3 days |
| **5** | Recurring Payments | K8s CronJobs, templates, skip/pause | 2-3 days |
| **6** | CSV Import | Upload wizard, column mapping, dedup, reconciliation | 3-5 days |
| **7** | Data Ownership | user_id in model, Keycloak integration, audit log | 3-5 days |
| **8** | Mobile/PWA | Installable app, offline mode, quick actions | 3-5 days |
| **9** | PSD2 Rollout | Secret provisioning, provider activation, post-deploy validation | blocked |
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
| Category Icons | ✅ | Categories table with icons and colors, icon picker UI, auto-creation |
| PSD2 Banking Integration | ✅ | `bank_connections`, `staging_transactions`, AES-GCM refresh-token storage, staging review/import UI |
