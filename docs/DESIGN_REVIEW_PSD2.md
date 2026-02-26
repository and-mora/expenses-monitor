# Design Review — PSD2 / Bank Integration (Staging Import)

Status: Draft
Date: 2026-02-26

## Summary
This design review defines the PSD2 / bank integration feature scoped to importing bank transactions into a staging table for user review and eventual import. It assumes the application will already enforce per-user ownership (see the Multi-user Design Review). This document covers architecture, schema, API, security, token storage, sync behavior, tests, and rollout guidance.

## Scope
- Bank OAuth2 connection management per user
- Secure per-user storage of tokens (refresh tokens encrypted at rest)
- Periodic/manual sync to fetch transactions and save to `expenses.staging_transactions`
- Staging review UI and bulk import into `expenses.payments`
- Deduplication and idempotency handling

## Key Decisions / Assumptions
- Each bank connection and staging row is owned by `user_id` (use Keycloak `sub` claim).
- Refresh tokens are encrypted with AES-GCM using a key stored in a Kubernetes Secret for initial rollout. Future improvements may use KMS/Vault.
- Backend will validate JWT tokens (Keycloak) and derive `user_id` from `sub`.
- All endpoints require Bearer tokens; CORS must be restricted to authorized frontends.

## Database Schema (proposed)
Staging table (from EVOLUTIONS.md):

```sql
CREATE TABLE expenses.staging_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    bank_transaction_id TEXT UNIQUE NOT NULL,
    amount_in_cents BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    booking_date DATE NOT NULL,
    value_date DATE,
    creditor_name TEXT,
    debtor_name TEXT,
    remittance_info TEXT,
    suggested_category TEXT,
    suggested_merchant TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','imported','rejected')),
    imported_payment_id UUID REFERENCES expenses.payments(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staging_user_status ON expenses.staging_transactions(user_id, status);
CREATE INDEX idx_staging_booking_date ON expenses.staging_transactions(booking_date);
```

Bank connection table (per-user credentials storage):

```sql
CREATE TABLE expenses.bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    account_id TEXT, -- optional: bank-provider-specific account identifier
    encrypted_refresh_token BYTEA, -- AES-GCM encrypted
    scopes TEXT[],
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_connections_user ON expenses.bank_connections(user_id);
```

Notes:
- `bank_transaction_id` unique constraint prevents duplicates across syncs.
- Use `user_id` FK/indices for query performance and isolation.

## API Endpoints (examples)
- `POST /banking/connect` — Initiate connection; return provider redirect URL or instruct frontend to redirect.
- `GET  /banking/callback?code=...` — OAuth callback: exchange code for tokens, store `bank_connections` row with encrypted refresh token for the authenticated `user_id`.
- `GET  /banking/accounts` — List connected bank accounts (owner-only).
- `POST /banking/sync/{connectionId}` — Trigger manual sync; validates ownership and schedules/executes sync immediately.
- `POST /banking/sync/{connectionId}/status` — Optional: return last sync status and statistics.
- `GET  /staging/transactions` — Paginated list for authenticated `user_id`, filter by status/date.
- `PUT  /staging/transactions/{id}` — Update suggested category/merchant/status (owner-only).
- `POST /staging/import` — Bulk import approved staging rows into `expenses.payments` with `user_id` set and set `status='imported'`.

Security: all endpoints require `Authorization: Bearer <token>`; OpenAPI spec must mark endpoints as protected.

## OAuth Flow
1. User requests connection; backend returns provider auth URL with `state` and `nonce` tied to authenticated `user_id`.
2. User authorizes at bank provider; provider calls our `/banking/callback` with `code`.
3. Backend exchanges `code` for access/refresh tokens, encrypts refresh token, stores `bank_connections(user_id)`.
4. Backend initiates initial sync or schedules it.

Security notes:
- `state` must bind to `user_id` and expire.
- Do not persist raw refresh tokens unencrypted.
- Use short-lived access tokens for runtime operations; refresh them using the encrypted refresh token.

## Sync Behavior
- Sync is idempotent: deduplicate by `bank_transaction_id` per `user_id`.
- CronJob: Kubernetes CronJob runs periodic syncs per connection or backend has a scheduler reading `bank_connections` and invoking provider APIs.
- Manual sync endpoint triggers immediate sync and returns summary (new/duplicates/errors).
- Rate limiting and backoff per provider to avoid throttling.

## Deduplication & Idempotency
- Use `bank_transaction_id` as canonical external ID; on insert conflict, update `updated_at` and skip creating duplicate staging rows.
- Provide heuristics for matching when provider lacks stable IDs (fallback: hash of booking_date+amount+remittance_info with confidence score).

## Token Storage & Encryption
- AES-GCM encryption using a key read from env, stored in Kubernetes Secret.
- Implement `encrypt_token()` and `decrypt_token()` helpers; never log decrypted tokens.
- Key rotation: support re-encrypting stored tokens with a new key during controlled maintenance.

## Frontend UX
- Banking settings page: connect/disconnect providers, view last sync, manual sync button, remove connection (with confirmation).
- Staging UI: show `pending` transactions with suggested category/merchant, allow bulk edit, approve/reject, and import.
- Import confirmation: show summary of imported rows and any conflicts.

## Tests
- Unit tests for encryption helpers and deduplication logic.
- Integration tests: mock provider or use test harness; tests must validate per-user isolation (requests scoped to `user_id`) and dedup behavior.
- E2E: manual with a sandbox provider or mock endpoint to validate OAuth flow and sync pipeline.

## Observability
- Metrics: `bank_sync_success_total`, `bank_sync_failures_total`, `staging_rows_created_total`, `staging_duplicates_total` with `user_id` as a tag (avoid high-cardinality misuse — only for debugging; aggregate in dashboards).
- Tracing: Trace sync flows end-to-end with OpenTelemetry and include masked user identifiers.
- Logs: redact tokens and PIIs; log sync errors and provider responses (masked) for troubleshooting.

## Rollout & Migration Notes
- This feature requires the multi-user schema to be in place (see Multi-user Design Review). Ensure `user_id` column exists on `payments` before enabling import.
- Migrations:
  - Add `bank_connections` and `staging_transactions` migrations.
  - Backfill not needed for new tables, but ensure indexes are created.
- Feature flag: release PSD2/staging feature behind a feature flag until auth+encryption validated.

## Security Checklist
- No secrets committed. AES key in Kubernetes Secret.
- Use parameterized SQL and `sqlx::query!` macros. No SQL concatenation.
- Enforce strict CORS and validate `state`/`nonce` in OAuth flow.
- Ensure RBAC and K8s secret access controls limit who can read encryption keys.

## Open Questions
- Which providers to support first (Nordigen recommended for EU)?
- How to surface provider errors and quota issues to users (UI and notifications)?
- Long-term token management: migrate to KMS/Vault for key management?

## Next Steps
1. Add migrations for `bank_connections` and `staging_transactions`.
2. Implement token encryption helpers and key retrieval from `configuration.yaml` / env.
3. Implement OAuth callback handler and `banking/connect` flow.
4. Implement sync worker and manual sync endpoint.
5. Add staging review UI and import flow in the frontend.
6. Add integration tests and run full test suites.

---

Document author: GitHub Copilot (pair-programmer mode)
