# Expenses Monitor - AI Agent Instructions

## Project Overview
Personal finance tracking application with multiple frontends (Angular legacy, React companion), dual backend (Java Spring Boot being replaced by Rust Actix), PostgreSQL database, and full observability stack (Prometheus, Grafana, Loki, Tempo). Deployed on Kubernetes via ArgoCD GitOps.

## 🚨 MANDATORY TESTING POLICY

**CRITICAL**: Every code change, feature, or bug fix MUST include appropriate tests. This is non-negotiable.

### Requirements
1. **Unit Tests**: Always create unit tests for new functions, methods, or business logic
2. **Integration Tests**: Required for new API endpoints, database operations, or service integrations
3. **Test Execution**: Run **full test suite** (not just new tests) to verify correctness and non-regression
4. **Test Coverage**: Aim for meaningful test coverage of happy paths and edge cases

### Workflow
```
Implement feature → Write tests → Run tests → Verify passing → Commit
```

**Never** consider a task complete without:
- ✅ Tests written and committed
- ✅ Tests executed successfully
- ✅ Test output verified

If tests fail, fix the implementation or tests before proceeding.

## 🔒 MANDATORY SECURITY POLICY

**CRITICAL**: Security is a top priority and must be considered in every code change, especially in CI/CD workflows and user input handling. This is non-negotiable.

### GitHub Actions Security

**NEVER interpolate user-controlled inputs directly in `run:` blocks**. This causes script injection vulnerabilities.

❌ **VULNERABLE** (Script Injection):
```yaml
- name: Deploy
  run: |
    echo "Deploying ${{ inputs.version }}"
    if [ "${{ inputs.component }}" == "backend" ]; then
      # Attacker could inject: component="backend; rm -rf /"
```

✅ **SAFE** (Environment Variables):
```yaml
- name: Deploy
  env:
    VERSION: ${{ inputs.version }}
    COMPONENT: ${{ inputs.component }}
  run: |
    echo "Deploying ${VERSION}"
    if [ "${COMPONENT}" == "backend" ]; then
      # Inputs are treated as literal strings, not executed
```

**Safe contexts** (no injection risk):
- `if:` conditions
- `with:` parameters in actions
- `uses:` directives
- Action inputs (`commit-message:`, `title:`, `body:`)

**Vulnerable contexts** (require env vars):
- `run:` bash/shell scripts
- SSH scripts (`appleboy/ssh-action`)
- Any direct command execution

### Application Security

1. **Input Validation**: Always validate and sanitize user inputs in backend routes before processing
2. **SQL Injection**: Use `sqlx::query!` macro (compile-time checked) or parameterized queries - NEVER string concatenation
3. **Authentication**: Every protected endpoint must validate JWT token from Keycloak
4. **CORS**: Only whitelist known origins in [startup.rs](backend-rust/src/startup.rs) - never use `*`
5. **Secrets Management**: 
   - Never commit secrets (`.env.local`, API keys, passwords)
   - Use Kubernetes secrets for production
   - Use `configuration.yaml` (gitignored) for local dev
6. **Dependencies**: 
   - Run `cargo audit` (Rust) and `npm audit` (frontend) regularly
   - Keep dependencies up-to-date
   - Review Dependabot/Trivy security alerts

### Deployment Security

- **Container Images**: All images scanned with Trivy in CI
- **Database Migrations**: Reviewed for backward compatibility and data safety
- **Rollback Plan**: Every deployment must be reversible via ArgoCD
- **Least Privilege**: Pods run with `automountServiceAccountToken: false` unless explicitly needed

### Security Checklist

Before merging any PR:
- [ ] No direct input interpolation in workflow `run:` blocks
- [ ] All user inputs validated on backend
- [ ] No SQL string concatenation (use `sqlx::query!`)
- [ ] No secrets in code or config files
- [ ] CORS origins explicitly whitelisted
- [ ] Dependencies have no known vulnerabilities
- [ ] Trivy scan passes on Docker images

**Security issues are deployment blockers** - fix immediately before proceeding.

## Architecture

### Service Boundaries
- **backend-rust/** (primary) - Actix-web REST API on port 8080, actively developed
- **backend/** (legacy) - Spring Boot WebFlux, being phased out
- **expense-companion/** - Modern React+Vite frontend with Keycloak auth
- **frontend/** - Legacy Angular frontend
- **database/** - PostgreSQL with schema `expenses` (wallets, payments, tags)

### Key Data Flows
1. User → React UI → Keycloak OAuth2 → Rust backend → PostgreSQL
2. Backend exposes metrics at `/metrics` → Prometheus scrapes → Grafana dashboards
3. OpenTelemetry traces sent to Tempo via OTLP collector on port 4317

### Critical Integration Points
- **CORS**: Backend allows origins from [backend-rust/src/startup.rs](backend-rust/src/startup.rs#L62-L75) (localhost:5173 for Vite dev, production domains)
- **Auth**: Keycloak OIDC with automatic token refresh every 60s in [expense-companion/src/contexts/AuthContext.tsx](expense-companion/src/contexts/AuthContext.tsx#L21-L22)
- **API**: Rust backend is API-compatible with Java version (see [backend-rust/MIGRATION_COMPLETED.md](backend-rust/MIGRATION_COMPLETED.md#L50-L58) for endpoint mapping)

## Development Workflows

### Backend Rust
```bash
# Use configuration.yaml for local settings (gitignored for secrets)
cd backend-rust
cargo test                    # Integration tests use spawn_app helper
cargo run                     # Starts on port 8080
cargo fmt && cargo clippy     # Required before commit (CI checks)
```

**Testing Workflow**:
1. Write unit tests in `src/` modules using `#[cfg(test)]` mod tests
2. Write integration tests in `tests/api/` for HTTP endpoints
3. Run specific test during development: `cargo test <test_name>`
4. **Run FULL test suite**: `cargo test` (no filters)
5. **Format code**: `cargo fmt` (ensures consistent code style)
6. **Run linter**: `cargo clippy` (checks for common mistakes and improvements)
7. **Verify ALL tests pass** (including existing ones for non-regression) and code is formatted before considering work complete

**Database work**: Always create migrations in [backend-rust/migrations/](backend-rust/migrations/) with naming `YYYYMMDDHHMMSS_description.sql`. Use `sqlx::query!` macro (compile-time checked SQL). Create integration tests that verify migration effects.

### Frontend Companion
```bash
cd expense-companion
npm run dev                   # Vite dev server on port 5173
npm test                      # Vitest with React Testing Library
npm run lint                  # ESLint check
```

**Testing Workflow**:
1. Write unit tests for utilities and hooks in `*.test.ts(x)` files
2. Write component tests using React Testing Library
3. Test user interactions, not implementation details
4. Run tests during development: `npm run test:watch`
5. **Run FULL test suite**: `npm test` (no filters)
6. **Run linter**: `npm run lint` and fix all errors before commit
7. **Verify ALL tests pass and NO lint errors** (including existing ones for non-regression) before completing work

**Environment**: Never commit `.env.local`. Production defaults are ARG in [Dockerfile](expense-companion/Dockerfile#L3-L8). For local dev, copy `.env.example` and override `VITE_API_BASE_URL=http://localhost:8080`.

### CI/CD Pipeline
- **Semantic versioning**: Each module (backend, backend-rust, frontend, expense-companion) has independent version tags with suffixes
- **Deployment**: ArgoCD syncs from [manifest/](manifest/) on master push. See [.github/workflows/cd-pipeline.yml](.github/workflows/cd-pipeline.yml#L13-L32) for change detection logic
- **Security**: Trivy scans run on all Docker images
- **Workflow Security**: Always use environment variables in `run:` blocks instead of direct input interpolation to prevent script injection vulnerabilities

## Project Conventions

### Rust Backend Patterns
- Domain models in [src/domain/](backend-rust/src/domain/) with validation (e.g., `WalletName::parse()`)
- Routes return `impl Responder`, map errors with `.map_err(|e| {log error; actix_web::error})`
- DTOs suffixed with `Dto` for requests, `ResponseDto` for responses
- Tags are key-value pairs linked via junction table `expenses.payment_tags`

### React Frontend Patterns
- **State management**: TanStack Query for server state, context for auth/global UI
- **Components**: shadcn/ui in [src/components/ui/](expense-companion/src/components/ui/), feature components in [src/components/dashboard/](expense-companion/src/components/dashboard/)
- **API client**: Centralized in [src/lib/api.ts](expense-companion/src/lib/api.ts) with mock data fallback
- **Routing**: All routes in [App.tsx](expense-companion/src/App.tsx#L32-L35), wrapped in `<AuthGuard>`

### UI/UX Consistency Guidelines

**CRITICAL**: Every new frontend feature MUST maintain visual and behavioral consistency with existing components.

#### Toast Notifications
- **Library**: Use **Sonner only** (`import { toast } from 'sonner'`) for all toast notifications
- **Never mix**: Do not use shadcn/ui `useToast` hook - causes inconsistent positioning and styling
- **Success toasts**: `toast.success("Message")` - appears top-center with green styling
- **Error toasts**: `toast.error("Message")` - appears top-center with red styling
- **Info toasts**: `toast.info("Message")` - appears top-center with blue styling
- **Reference**: See [Dashboard.tsx](expense-companion/src/components/dashboard/Dashboard.tsx) and [EditPaymentDialog.tsx](expense-companion/src/components/dashboard/EditPaymentDialog.tsx) for correct usage

#### Icon Consistency
- **Library**: Use **lucide-react** exclusively for icons
- **Size**: Standard icon size is `h-4 w-4` (16px) for inline icons, `h-5 w-5` (20px) for buttons
- **Colors**: Use theme colors via Tailwind classes (e.g., `text-primary`, `text-muted-foreground`, `text-destructive`)
- **Interactive states**: Add hover effects consistently (e.g., `hover:text-primary` for clickable icons)
- **Spacing**: Use consistent spacing around icons (`mr-2` for icon-before-text, `ml-2` for icon-after-text)

#### Button Styles
- **Primary actions**: `<Button variant="default">` (blue background)
- **Secondary actions**: `<Button variant="outline">` (border with transparent bg)
- **Destructive actions**: `<Button variant="destructive">` (red background)
- **Ghost actions**: `<Button variant="ghost">` (no background, hover effect)
- **Sizes**: Use `size="sm"` for compact UIs, `size="default"` for standard forms, `size="lg"` for prominent CTAs

#### Modal/Dialog Patterns
- **Mobile-first**: Use `Sheet` component for mobile-friendly modals that slide from bottom/side
- **Desktop dialogs**: Use `Dialog` for desktop-centric modals that appear centered
- **Responsive**: Prefer `Sheet` for forms and actions that benefit from full-screen mobile experience
- **Close behavior**: Always include close button and handle Escape key
- **Reference**: See [EditPaymentDialog.tsx](expense-companion/src/components/dashboard/EditPaymentDialog.tsx) for Sheet usage

#### Form Validation Feedback
- **Inline errors**: Show validation errors below input fields using `<FormMessage>` from shadcn/ui
- **Toast for actions**: Use toast notifications for form submission success/failure, not inline
- **Error style**: Red text (`text-destructive`) with clear error message
- **Required fields**: Mark with asterisk (*) or "Required" label

#### Color Palette
- **Stick to theme**: Use Tailwind theme colors defined in [tailwind.config.js](expense-companion/tailwind.config.js)
- **Semantic colors**: `primary` (blue), `destructive` (red), `success` (green), `muted` (gray)
- **Avoid hardcoded colors**: Do not use arbitrary values like `#FF0000`, use theme colors instead

#### Before Implementing New UI
1. **Search existing components**: Check if similar UI already exists in codebase
2. **Reuse patterns**: Copy styling and behavior from existing components (e.g., if adding toast, check existing toast usage)
3. **Verify libraries**: Confirm you're using the same libraries as existing code (Sonner for toasts, lucide-react for icons)
4. **Test cross-component**: Verify your new UI doesn't clash with existing components on the same page
5. **Responsive check**: Test on mobile (viewport < 768px) and desktop to ensure consistent experience

### Database Schema
- Schema name: `expenses` (not public)
- Money stored as `amount_in_cents` (INTEGER) to avoid floating point issues
- Wallets have unique names, payments optionally reference wallet_id (nullable FK)

## Common Tasks

**Add new payment category**: Update hardcoded list in both [backend-rust/src/routes/payment.rs](backend-rust/src/routes/payment.rs#L267) `get_categories()` and frontend [api.ts](expense-companion/src/lib/api.ts#L15-L24) mock data.

**Add new API endpoint**: 
1. Create route function in [backend-rust/src/routes/](backend-rust/src/routes/)
2. Register in [startup.rs](backend-rust/src/startup.rs#L86-L95) routes
3. **MANDATORY**: Update OpenAPI specification in [docs/openapi.yaml](docs/openapi.yaml) with new endpoint, request/response schemas, status codes
4. **MANDATORY**: Add integration test in [backend-rust/tests/api/](backend-rust/tests/api/) using `spawn_app()` helper
   - Test happy path (200/201 responses)
   - Test validation errors (400 responses)
   - Test edge cases
5. **Run FULL test suite**: Execute `cargo test` (no filters) and verify ALL tests pass
6. Update frontend API client in [expense-companion/src/lib/api.ts](expense-companion/src/lib/api.ts)
7. **Add frontend tests**: Test API client integration and component usage
8. **Run linter**: Execute `npm run lint` and fix all errors
9. **Run FULL frontend suite**: Execute `npm test` and verify all pass

**Database migrations**: 
- **Local development**: Run [scripts/init_db.sh](backend-rust/scripts/init_db.sh) to start PostgreSQL and apply migrations, or use `cargo sqlx migrate run` if DB is already running
- **Production (Kubernetes)**: Migrations run **automatically before deployment** via Kubernetes Job with ArgoCD PreSync hook ([manifest/backend-rust/db-migration-job.yaml](manifest/backend-rust/db-migration-job.yaml))
- **Creating new migrations**: `cd backend-rust && cargo sqlx migrate add <description>` creates timestamped SQL file in [migrations/](backend-rust/migrations/)
- **CI**: Uses `cargo sqlx prepare` to cache query metadata for offline compilation
- **Deployment behavior**: If migrations fail, deployment is rolled back automatically (zero risk)

**CORS issues**: Add origins in [startup.rs](backend-rust/src/startup.rs#L62-L75) allowed_origin() calls. Localhost ports for dev, production domains for prod.

**Update REST API**: Any change to REST endpoints (new endpoint, modified request/response, status codes) MUST be documented in [docs/openapi.yaml](docs/openapi.yaml). Keep specification in sync with implementation.

## Observability

- **Logs**: Rust uses `tracing` crate, sent to Loki. Set `RUST_LOG=debug` for verbose output
- **Metrics**: Exposed at `/metrics` endpoint using Prometheus crate
- **Traces**: OpenTelemetry configured via [configuration.yaml](backend-rust/configuration.yaml#L11-L13) otlp section
- **Dashboards**: Grafana connects directly to PostgreSQL for business metrics

## Testing Strategy

### Backend (Rust)
- **Integration tests** in [tests/api/](backend-rust/tests/api/) spin up real Postgres with test DB per test
- **Unit tests** within modules using `#[cfg(test)]` for business logic, domain validations, utilities
- **Test structure**: Use `spawn_app()` helper from [tests/api/helpers.rs](backend-rust/tests/api/helpers.rs) for integration tests
- **Coverage**: Every route handler must have integration test, every domain model validation must have unit test
- **Execution**: Run `cargo test` (full suite, no filters) after every change to verify non-regression

### Frontend (React)
- **Vitest** for unit tests, focus on business logic and hooks
- **React Testing Library** for component tests (user behavior, not implementation)
- **Test location**: Co-locate tests with source (e.g., `Component.test.tsx` next to `Component.tsx`)
- **Coverage**: Test user interactions, state changes, API integration, error handling
- **Linting**: Run `npm run lint` after every change - fix all errors and warnings before commit
- **Execution**: Run `npm test` (full suite, no filters) after every change to verify non-regression

### Test-First Mindset
When implementing new features:
1. Write failing test first (optional but recommended)
2. Implement feature
3. **Run test and verify it passes**
4. Refactor if needed
5. **Re-run tests**

### E2E
Not currently implemented (future consideration)

### When to Skip Tests
**NEVER**. Even small changes need verification. Minimal acceptable test:
- For bug fix: Test that reproduces bug + verifies fix
- For new function: Test happy path
- For new endpoint: Test successful request/response

## Warnings

⚠️ **Never use floating point for money** - Always `amountInCents` as INTEGER  
⚠️ **Schema prefix required** - All queries must use `expenses.table_name`  
⚠️ **Token refresh critical** - Frontend has automatic refresh; backend validates JWT on every request  
⚠️ **CORS must match exactly** - Protocol, domain, and port all checked  
⚠️ **Sqlx requires DATABASE_URL** - Set for local dev or use `sqlx prepare` offline mode  
⚠️ **Tests are MANDATORY** - No code changes without tests. Run FULL test suite (no filters) to ensure non-regression  
⚠️ **Linting is MANDATORY** - Frontend changes require `npm run lint` with zero errors before commit  
⚠️ **OpenAPI must be updated** - Any REST API change requires updating [docs/openapi.yaml](docs/openapi.yaml)  
⚠️ **GitHub Actions Security** - NEVER interpolate inputs directly in `run:` blocks, always use environment variables to prevent script injection
