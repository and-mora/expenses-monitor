# Expenses Monitor - AI Agent Instructions

## Hard Invariants

- `backend-rust/` is the primary backend. Prefer it for all backend work unless the user explicitly asks for `backend/`.
- `backend/` is legacy. Do not use it as the default implementation target.
- Every code change MUST include appropriate tests.
- Every code change that affects public behavior, APIs, workflows, or architecture MUST update the relevant documentation in `docs/`.
- Security issues are deployment blockers.
- Never commit secrets such as `.env.local`, API keys, passwords, or local `configuration.yaml`.

## Mandatory Policies

### Testing

- ALWAYS add tests for new logic and bug fixes.
- Backend changes MUST include unit tests for business logic and integration tests for routes, database behavior, and service integration.
- Frontend changes MUST include unit or component tests using Vitest and React Testing Library.
- ALWAYS run the full relevant suite, not just targeted tests:
  - Backend: `cd backend-rust && cargo test`
  - Frontend: `cd expense-companion && npm test`
- Backend changes MUST also pass:
  - `cd backend-rust && cargo fmt`
  - `cd backend-rust && cargo clippy`
- Frontend changes MUST also pass:
  - `cd expense-companion && npm run lint`
- Frontend linting is not complete until errors and warnings are fixed.
- Never treat a task as complete until tests were written, executed, and verified.

### Security

- NEVER interpolate user-controlled values directly in GitHub Actions `run:` blocks.
- In GitHub Actions, pass external values through `env:` first, then reference shell variables inside `run:`.
- Direct interpolation is allowed in safe contexts only: `if:`, `with:`, `uses:`, and action input fields such as `commit-message:`, `title:`, and `body:`.
- Validate and sanitize backend inputs before processing.
- Use `sqlx::query!` or another compile-time checked, parameterized `sqlx` API. NEVER build SQL with string concatenation.
- Every protected backend endpoint MUST validate the Keycloak JWT.
- CORS origins in `backend-rust/src/startup.rs` MUST be explicitly whitelisted. NEVER use `*`.
- Use Kubernetes secrets for production secrets and gitignored local configuration for local development.
- Keep dependency and image scanning in place with `cargo audit`, `npm audit`, Dependabot, and Trivy where applicable.
- Kubernetes workloads should default to `automountServiceAccountToken: false` unless a token is explicitly required.

### Documentation

- Any REST API change MUST update `docs/openapi.yaml`.
- Any material feature, roadmap, platform, or architecture change MUST update `docs/EVOLUTIONS.md`.
- Update other affected docs such as `docs/FUNCTIONAL_ANALYSIS.md` and `docs/TESTING_INTEGRATION.md` when implementation changes make them inaccurate.
- Before finishing a task, verify that referenced files, routes, workflows, and behaviors in `docs/` still match the codebase.

### Frontend UX Consistency

- Use Sonner only for toasts: `import { toast } from 'sonner'`.
- NEVER use the shadcn/ui `useToast` hook.
- Use `toast.success`, `toast.error`, and `toast.info` for user feedback.
- Use `lucide-react` for icons.
- Default icon sizes:
  - inline icons: `h-4 w-4`
  - icon buttons: `h-5 w-5`
- Prefer theme tokens such as `text-primary`, `text-muted-foreground`, and `text-destructive` over hardcoded colors.
- Prefer `Sheet` for mobile-first forms and workflows. Use `Dialog` for desktop-centric centered modals.
- Show validation feedback inline with `<FormMessage>`. Use toasts for action outcomes, not field-level validation.

## Repository Priority Map

### Primary Targets

- `backend-rust/` - Actix-web REST API, PostgreSQL access, migrations, auth, observability
- `expense-companion/` - React + Vite frontend with Keycloak auth
- `manifest/` - Kubernetes manifests and ArgoCD deployment state
- `.github/workflows/` - CI/CD and security workflows
- `docs/` - OpenAPI, evolution tracking, functional and testing docs

### Reference Targets

- `backend/` - legacy Spring Boot backend; consult only when explicitly requested
- `postman/` - manual API artifacts
- `monitoring/` - Grafana and monitoring assets

## Domain Playbooks

### Backend Rust (`backend-rust/`)

- Use `backend-rust/src/routes/` for handlers and `backend-rust/src/startup.rs` for route registration and CORS.
- Follow domain validation patterns from `backend-rust/src/domain/`, such as `WalletName::parse()`.
- Money MUST remain integer cents using `amount_in_cents`.
- SQL MUST use the `expenses.` schema prefix.
- Use `sqlx::query!` where possible and keep `DATABASE_URL` or offline metadata ready for `sqlx` compilation.
- Create migrations in `backend-rust/migrations/` with the format `YYYYMMDDHHMMSS_description.sql`.
- Route changes MUST add integration tests in `backend-rust/tests/api/` using `spawn_app()` from `backend-rust/tests/api/helpers.rs`.
- Domain logic changes MUST add unit tests with `#[cfg(test)]`.
- REST changes MUST update `docs/openapi.yaml`.
- Material backend changes MUST also update `docs/EVOLUTIONS.md`.

### Frontend React (`expense-companion/`)

- Keep routes in `expense-companion/src/App.tsx` and preserve `<AuthGuard>` where needed.
- Keep auth behavior aligned with `expense-companion/src/contexts/AuthContext.tsx`, including automatic token refresh.
- Route backend calls through `expense-companion/src/lib/api.ts`.
- Reuse patterns from `expense-companion/src/components/dashboard/` and `expense-companion/src/components/ui/`.
- Reference `expense-companion/src/components/dashboard/Dashboard.tsx` and `expense-companion/src/components/dashboard/EditPaymentDialog.tsx` for existing Sonner and Sheet patterns.
- For local development, keep `.env.local` out of version control and use `VITE_API_BASE_URL=http://localhost:8080` when needed.
- Material frontend changes MUST also update `docs/EVOLUTIONS.md`.

### DevSecOps (`.github/workflows/`, `manifest/`)

- Preserve independent semantic versioning for `backend`, `backend-rust`, and `expense-companion`.
- ArgoCD deploys from `manifest/`; keep deployments reversible.
- Database migrations run before deploy through `manifest/backend-rust/db-migration-job.yaml`.
- Keep Trivy scans active for built images.
- Preserve metrics at `/metrics`, logs through Loki, and traces through the OTLP collector on port `4317`.
- Material workflow, deployment, or observability changes MUST also update `docs/EVOLUTIONS.md` and any affected architecture docs.

## Common High-Risk Changes

### Add or Change a REST Endpoint

1. Implement or update the handler in `backend-rust/src/routes/`.
2. Register it in `backend-rust/src/startup.rs`.
3. Add integration tests in `backend-rust/tests/api/` using `spawn_app()`.
4. Update `docs/openapi.yaml`.
5. Update `expense-companion/src/lib/api.ts` if the frontend consumes the endpoint.
6. Run backend and frontend verification as needed.

### Add or Change a Payment Category

1. Update `get_categories()` in `backend-rust/src/routes/payment.rs`.
2. Update the matching mock data in `expense-companion/src/lib/api.ts`.
3. Add or update tests on both sides if behavior changes.

### Change CORS or Authentication

1. Update allowed origins only in `backend-rust/src/startup.rs`.
2. Keep origin matching exact by protocol, host, and port.
3. Preserve Keycloak JWT validation on protected endpoints.
4. Re-test affected backend and frontend flows.

### Change Workflows or Deployment Logic

1. Review every affected GitHub Actions `run:` block for unsafe interpolation.
2. Keep env-var indirection in shell contexts.
3. Preserve ArgoCD rollback safety, migration ordering, and Trivy scanning.
4. Update affected docs in `docs/` if the delivery flow changed.

## Final Checklist

- Targeted the correct project area (`backend-rust/`, `expense-companion/`, `manifest/`, `.github/workflows/`, `docs/`)
- Avoided using `backend/` unless explicitly requested
- Added and ran the required tests
- Ran required formatting or linting
- Preserved security rules
- Updated `docs/openapi.yaml` if REST behavior changed
- Updated `docs/EVOLUTIONS.md` and other affected docs when behavior or architecture changed
- Did not commit secrets or local-only files
