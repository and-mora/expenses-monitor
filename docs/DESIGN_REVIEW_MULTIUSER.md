# Design Review — Multi-user Foundation

Status: Draft
Date: 2026-02-26

## Purpose
Provide a complete design for converting the application from a global/single-tenant data model to per-user data isolation. This document lists functional and non-functional requirements, schema changes, migration strategy, authentication/authorization design, testing strategy, rollout plan, security controls, operational considerations, and open questions.

## Context and motivation
Current code and migrations do not include `user_id` on domain tables. The frontend already uses Keycloak and sends Bearer tokens, but the backend lacks JWT validation and per-user scoping. PSD2-style bank integrations, staging imports, and any per-user sensitive data require per-user ownership to be reliable and secure.

## Goals
- Enforce per-user ownership for all core domain entities (`payments`, `wallets`, `payment_tags`, optionally `categories`).
- Authenticate requests and map to an immutable `user_id` (Keycloak `sub` claim).
- Prevent cross-user data access and data leakage.
- Provide safe, reversible, zero-downtime migrations from current schema to user-scoped schema.
- Add auditability (who did what) and GDPR-friendly deletion paths.

## Non-Goals
- Multi-tenant isolation at the infrastructure level (separate DBs) — this design keeps a shared DB with row-level owner scoping.
- Complete PSD2 implementation (covered in separate design).

## Requirements
Functional:
- All read/write operations on core resources must be scoped to authenticated `user_id`.
- New resources must store `user_id` on creation, derived from validated token.
- Admins may need tools to inspect or migrate legacy data but must not bypass owner scoping in the normal API.

Non-functional:
- Minimal performance overhead for per-user queries (indexes, prepared statements).
- Low operational risk during migration (nullable→backfill→NOT NULL).
- Test coverage: unit + integration + migration verification.

Security:
- Authentication is enforced at the API gateway (Keycloak/OIDC). The gateway must validate tokens (signature, `iss`, `aud`, `exp`) and only forward requests that passed validation.
- The backend trusts the gateway for token validation and will only decode the forwarded JWT to extract the `sub` claim; backend will not re-verify signatures unless the transport is not secured.
- No secrets in source control; keys in Kubernetes Secrets (later KMS/Vault).
- Parameterized SQL only (no string concatenation).

Privacy & Compliance:
- Provide per-user data export and deletion flows compliant with GDPR.

Auditing:
- Record who performed destructive operations (user id from token) and timestamp.

Scalability:
- Design indexes to support per-user filters; consider partitioning/sharding if user base grows extremely large.

## Data model changes (detailed)
The minimal change set adds `user_id` columns to existing tables and introduces ownership-aware constraints and indexes.

Suggested DDL examples (high-level):

1) Add `user_id` columns (nullable) and indexes — Migration A

```sql
ALTER TABLE expenses.payments ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON expenses.payments(user_id);

ALTER TABLE expenses.wallets ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON expenses.wallets(user_id);

ALTER TABLE expenses.payment_tags ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payment_tags_user_id ON expenses.payment_tags(user_id);
```

Notes:
- Add columns as NULLABLE so the system remains operational.
- Indexes support efficient WHERE user_id = ? queries.

2) Backfill strategy (scripted/controlled)

Options:
- Map all existing rows to a single sentinel user (e.g., `legacy`) — simplest, lowest risk.
- Attempt automated mapping based on existing UI/account mappings (complex, error-prone).

Example backfill to `legacy`:

```sql
UPDATE expenses.payments SET user_id = 'legacy' WHERE user_id IS NULL;
UPDATE expenses.wallets SET user_id = 'legacy' WHERE user_id IS NULL;
UPDATE expenses.payment_tags SET user_id = 'legacy' WHERE user_id IS NULL;
```

3) Make `user_id` NOT NULL, add FK and constraints — Migration B

```sql
ALTER TABLE expenses.payments ALTER COLUMN user_id SET NOT NULL;
-- Optionally add FK if users table exists:
-- ALTER TABLE expenses.payments ADD CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES expenses.users(id);

-- Repeat for wallets, payment_tags
```

If you do not have a `expenses.users` table, keep `user_id` as plain text and consider adding a `users` table later for additional metadata.

## Domain model updates
- Add `user_id: String` to domain structs (e.g., `Payment`, `Wallet`) in `backend-rust/src/domain/`.
- DTOs: Requests creating resources should not accept arbitrary `user_id`; server assigns `user_id` from authenticated context.
- Responses: include owner `user_id` only when appropriate; avoid exposing it when unnecessary.

## Authentication & Authorization design
Authentication & Authorization (gateway-trust model):

Gateway responsibilities (must):
- Fully validate incoming JWTs (signature, `iss`, `aud`, `exp`, `nbf`) and reject invalid tokens.
- Strip any client-provided identity headers (do not forward `x-auth-*` headers from the client).
- Forward the original `Authorization: Bearer <jwt>` header to the backend on successful validation.

Backend responsibilities (minimal validation):
- Require `Authorization` header present; decode the JWT (no signature verification) to extract the `sub` claim as `user_id`.
- Perform lightweight claim checks locally: ensure `exp` (and `nbf` if present) are valid and reject expired tokens.
- Optionally check `iss`/`aud` semantically (useful to detect token mix-ups), but note these are not signature-verified in this trust model.
- Enforce owner scoping: all data-access queries must include `WHERE user_id = $1` for reads and set `user_id` for writes; reject cross-user access with 403.

Middleware considerations:
- Implement a simple `AuthenticatedUser` extractor that decodes the JWT from the forwarded `Authorization` header and returns `{ sub: String }` (and optionally roles if present).
- Ensure handlers never accept client-supplied identity headers as a substitute for the forwarded JWT.

## API design changes (examples)
- Existing endpoints remain but must be scoped. Example:
  - `GET /payments` → must accept `?wallet_id=` but server only returns rows where `user_id = authenticated_user.sub`.
  - `POST /wallets` → server sets `user_id` on created wallet from token.

Admin APIs
- Create admin-only endpoints for migration support (backfill scripts, data inspection). Require elevated roles and audit logging.

## Testing strategy
Unit tests:
- Domain unit tests for models and validation.
- Encryption helpers (if any) and utility functions.

Integration tests:
- Update `tests/api/helpers.rs::spawn_app()` to optionally provide a mock JWKS endpoint and test tokens.
- Add tests that simulate two users (two tokens) creating resources and asserting isolation.
- Add migration tests that run the migrations against a test DB, run backfill script, and validate constraints.

E2E / Manual tests:
- Manual Keycloak login flow to ensure `sub` mapping.

CI requirements:
- `cargo fmt`, `cargo clippy`, `cargo test` (full suite), `cargo sqlx prepare` where necessary.

## Operational considerations
Feature flags:
- Gate migration-sensitive behavior behind feature flags where reasonable (e.g., strict `user_id` enforcement toggled until backfill complete).

Backups & restores:
- Backfill and migration steps must be snapshot-safe. Take DB snapshots before backfill and provide rollback instructions.

Audit & logging:
- Log operations that change ownership or perform destructive actions with `actor_sub`, operation, and timestamp.

Monitoring & observability:
- Add metrics for unauthorized access attempts, per-user query latencies, and migration progress.
- Avoid high-cardinality labels (do NOT add `user_id` as a metric label in production dashboards). Use sampled traces for user-specific debugging.

## Performance
- Index `user_id` in all frequently queried tables. Consider compound indexes (e.g., `(user_id, created_at)` for timeline queries).
- For very large user base consider partitioning by `user_id` prefix or using per-tenant sharding.

## Security & secrets
- Store encryption keys in Kubernetes Secrets; document rotation.
- Use environment variables to reference secrets in `configuration.yaml` (avoid direct interpolation in CI `run:` blocks per security policy).

## GDPR / Data deletion
- Implement `DELETE /users/{id}` that performs a controlled cascade or anonymization for the user's data. Provide export before deletion.
- Consider soft-delete with `deleted_at` and eventual permanent purge.

## Admin migration tooling
- Small CLI/tool to run backfill steps with dry-run and reporting modes. Require strong auth or run as CI job.

## Rollout plan (summary)
1. Migration A: add nullable `user_id` columns + indexes; deploy code that sets `user_id` for new writes but reads legacy rows.
2. Run backfill job with dry-run, inspect output, then run for real during maintenance window.
3. Migration B: add NOT NULL constraints and remove legacy compatibility code.
4. Remove feature flags and finalize tests.

## Open questions / decisions to resolve
- Backfill mapping strategy (legacy sentinel vs attempt mapping).
- Whether `categories` are global or per-user.
- Whether to add a `users` table to normalize `sub` and store metadata.

---

Document author: GitHub Copilot (pair-programmer mode)

---

Document author: GitHub Copilot (pair-programmer mode)

