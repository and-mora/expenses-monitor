# Future Evolutions - Expenses Monitor

Based on the architectural and functional analysis of the current system, several pain points and improvement areas have been identified. Below are proposed solutions and new features to evolve the application.

## 1. Current Pain Points

*   **Manual Data Entry**: Users must record each expense manually. This is time-consuming (“friction”) and prone to errors or omissions.
*   **Reactive Analytics**: Dashboards show what happened in the past, but they do not proactively help plan ahead or avoid exceeding the budget before it happens.
*   **Lack of Automation**: Recurring expenses (rent, subscriptions) must be entered each time or managed manually.
*   **Implicit Income/Expense Semantics**: At the moment, income vs expense is inferred from the sign of the amount (negative = expense, positive = income). This is simple and works for basic flows, but it becomes ambiguous for refunds, chargebacks, and especially transfers between wallets.
*   **Missing Core Finance Flows**: Common scenarios are not first-class (income vs expense, transfers between wallets, refunds, split transactions).
*   **Data Quality Issues Over Time**: Merchant naming drift/duplicates, accidental double entries, inconsistent categories/tags, and low searchability reduce the value of the dataset.
*   **Budgeting and Alerts Are Not Built-In**: Users cannot set category/wallet budgets, get warnings before overspending, or forecast month-end results.
*   **Limited In-App Reporting**: Grafana is great for dashboards, but users often need quick filters, exports, and ad-hoc breakdowns directly in the UI.
*   **Identity and Data Ownership Model**: If Keycloak/OIDC is used, the platform needs clear per-user (or multi-tenant) ownership and access control across wallets/payments/tags.
*   **Operational Gaps**: Import jobs, migrations, backups, and post-deploy checks are not described as a full operational lifecycle.

## 2. Evolution Proposals

### A. Automation and Data Integration (Goal: Zero Manual Entry)
Drastically reduce the time spent on data entry.

*   **Bank Account Integration (PSD2)**:
    *   Use an Open Banking provider (e.g., **GoCardless** or **Nordigen**) that offers developer-friendly APIs.
    *   The Rust backend, via a Kubernetes-scheduled job, periodically queries the bank API to download new transactions.
    *   Transactions are saved into a “staging” table to be reviewed or auto-imported when recognized.

*   **Smart CSV Import**:
    *   Implement an endpoint for uploading statements (CSV/XLSX).
    *   Provide a mapping + preview workflow (column mapping, date/amount parsing, locale/currency).
    *   **Smart Matching**: Classify imported rows and suggest Category and Merchant based on historical data.
    *   Add deduplication (e.g., hash on date/amount/merchant) and idempotency keys to avoid duplicates on retries.
    *   Provide a “Reconciliation” UI in the frontend to confirm suggestions and resolve conflicts.

*   **Recurring Payments Management**:
    *   Use **K8s CronJobs** to automatically generate recurring transactions (e.g., rent, subscriptions) with no manual intervention.
    *   Add recurrence templates (active/paused), exception handling (“skip next occurrence”), and a predictable “next run” schedule.

### B. User Experience (UX/UI)
Improve accessibility and speed of use.

*   **Mobile First / PWA**: Optimize the frontend for smartphone usage, enabling quick “on-the-go” entry.
*   **Quick Actions**: Widgets to enter frequent expenses with a single tap.

### C. Artificial Intelligence
Leverage historical data to provide insights.

*   **Smart Categorization**: Automatically suggest category and merchant when entering a new expense.

### D. Core Finance Model
Make the platform handle real-world money flows reliably.

*   **Transaction Types**: Introduce first-class types such as `expense`, `income`, `transfer`, `refund`.
    *   Backward compatible approach: keep the current “sign = direction” convention as the default, and introduce an optional `type` field for cases where the sign is not enough (e.g., refunds, chargebacks, transfers).
*   **Transfers Between Wallets**: Model transfers as linked transactions (or a single transfer entity) to keep balances consistent.
*   **Split Transactions**: Allow splitting one payment into multiple category lines (useful for supermarket receipts).

### E. Budgeting and Proactive Insights
Help users avoid overspending, not just analyze it afterwards.

*   **Budgets**: Monthly budgets by category and/or wallet.
*   **Alerts**: Threshold notifications (e.g., 80% / 100%), with optional hard warnings in UI.
*   **Forecast**: Simple month-end forecast based on current spending + historic seasonality.

### F. Data Quality, Search, and Reporting
Increase the long-term usefulness of the dataset.

*   **Merchant Normalization**: Canonical merchants + aliases; merge duplicates.
*   **Better Search**: Filter by date range, wallet, category, merchant, tags; saved filters/views.
*   **Exports**: CSV export for a date range, category, or tag.
*   **In-App Summaries**: “Spend by category”, “Top merchants”, “Month-over-month” views (Grafana remains available for advanced dashboards).

### G. Security and Data Ownership
Make identity integration operationally complete.

*   **Ownership**: Add `user_id` (or tenant id) to wallets/payments/tags; enforce it in queries.
*   **Access Control**: Minimal RBAC (user/admin) if needed.
*   **Audit Log**: Track destructive operations (delete wallet/payment), including who did what and when.

### H. Architecture and Operations
Leverage the existing Kubernetes infrastructure to add value.

*   **K8s CronJobs**: Implement recurring expenses and backups using native Kubernetes CronJobs.
*   **Migrations Lifecycle**: Run DB migrations as a dedicated job/init step in the deployment pipeline.
*   **Backups/Restore**: Document and test a restore procedure (especially before introducing imports/automation).
*   **Post-Deploy Smoke Checks**: Automate basic health checks and API smoke tests after deployments.
*   **Scalability**: Define Horizontal Pod Autoscalers (HPA) even if load is low, for educational purposes.
*   **GitOps**: Continue improving deployment automation (ArgoCD is already mentioned in dashboards).

## 3. Suggested Roadmap

1.  **Phase 1 (Foundation)**: Core finance model (income/transfer/refund) + data ownership model (Keycloak/user_id).
2.  **Phase 2 (Automation)**: Recurring expenses via K8s CronJobs, with pause/skip and predictable scheduling.
3.  **Phase 3 (Reporting & Budgeting)**: In-app filters/exports + budgets + threshold alerts.
4.  **Phase 4 (Data Entry)**: CSV import wizard with reconciliation, dedup, and idempotency.
5.  **Phase 5 (Mobile UX)**: Mobile-first improvements + PWA/offline-ready quick entry.
6.  **Phase 6 (Advanced Integration)**: PSD2 integration (Open Banking) + staging review flow.
7.  **Phase 7 (AI Enhancements)**: Better categorization suggestions and (optionally) receipt OCR.
