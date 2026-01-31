# Expenses Monitor - AI Agent Instructions

## Project Overview
Personal finance tracking application with multiple frontends (Angular legacy, React companion), dual backend (Java Spring Boot being replaced by Rust Actix), PostgreSQL database, and full observability stack (Prometheus, Grafana, Loki, Tempo). Deployed on Kubernetes via ArgoCD GitOps.

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

**Database work**: Always create migrations in [backend-rust/migrations/](backend-rust/migrations/) with naming `YYYYMMDDHHMMSS_description.sql`. Use `sqlx::query!` macro (compile-time checked SQL).

### Frontend Companion
```bash
cd expense-companion
npm run dev                   # Vite dev server on port 5173
npm test                      # Vitest with React Testing Library
npm run lint                  # ESLint check
```

**Environment**: Never commit `.env.local`. Production defaults are ARG in [Dockerfile](expense-companion/Dockerfile#L3-L8). For local dev, copy `.env.example` and override `VITE_API_BASE_URL=http://localhost:8080`.

### CI/CD Pipeline
- **Semantic versioning**: Each module (backend, backend-rust, frontend, expense-companion) has independent version tags with suffixes
- **Deployment**: ArgoCD syncs from [manifest/](manifest/) on master push. See [.github/workflows/cd-pipeline.yml](.github/workflows/cd-pipeline.yml#L13-L32) for change detection logic
- **Security**: Trivy scans run on all Docker images

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

### Database Schema
- Schema name: `expenses` (not public)
- Money stored as `amount_in_cents` (INTEGER) to avoid floating point issues
- Wallets have unique names, payments optionally reference wallet_id (nullable FK)

## Common Tasks

**Add new payment category**: Update hardcoded list in both [backend-rust/src/routes/payment.rs](backend-rust/src/routes/payment.rs#L267) `get_categories()` and frontend [api.ts](expense-companion/src/lib/api.ts#L15-L24) mock data.

**Add new API endpoint**: 
1. Create route function in [backend-rust/src/routes/](backend-rust/src/routes/)
2. Register in [startup.rs](backend-rust/src/startup.rs#L86-L95) routes
3. Add test in [backend-rust/tests/api/](backend-rust/tests/api/) using `spawn_app()` helper
4. Update frontend API client in [expense-companion/src/lib/api.ts](expense-companion/src/lib/api.ts)

**Database migration**: Run [scripts/init_db.sh](backend-rust/scripts/init_db.sh) to apply migrations. CI uses `cargo sqlx prepare` to cache query metadata.

**CORS issues**: Add origins in [startup.rs](backend-rust/src/startup.rs#L62-L75) allowed_origin() calls. Localhost ports for dev, production domains for prod.

## Observability

- **Logs**: Rust uses `tracing` crate, sent to Loki. Set `RUST_LOG=debug` for verbose output
- **Metrics**: Exposed at `/metrics` endpoint using Prometheus crate
- **Traces**: OpenTelemetry configured via [configuration.yaml](backend-rust/configuration.yaml#L11-L13) otlp section
- **Dashboards**: Grafana connects directly to PostgreSQL for business metrics

## Testing Strategy

- **Backend**: Integration tests in [tests/api/](backend-rust/tests/api/) spin up real Postgres with test DB per test
- **Frontend**: Vitest for unit tests, focus on business logic. UI component tests use Testing Library
- **E2E**: Not currently implemented (future consideration)

## Warnings

⚠️ **Never use floating point for money** - Always `amountInCents` as INTEGER  
⚠️ **Schema prefix required** - All queries must use `expenses.table_name`  
⚠️ **Token refresh critical** - Frontend has automatic refresh; backend validates JWT on every request  
⚠️ **CORS must match exactly** - Protocol, domain, and port all checked  
⚠️ **Sqlx requires DATABASE_URL** - Set for local dev or use `sqlx prepare` offline mode
