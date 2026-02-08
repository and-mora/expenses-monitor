# Backend Rust

Rust web service developed with Actix framework.
Based on the original Java backend.

## Installation requirements

refer to the [java backend README](../backend/README.md) for detailed information.

## Database Migrations

This project uses [sqlx](https://github.com/launchbadge/sqlx) for compile-time verified queries and database migrations.

### Local Development

To run migrations locally during development:

```bash
# Make sure PostgreSQL is running and DATABASE_URL is set
export DATABASE_URL="postgres://user:password@localhost:5432/expenses-monitor"

# Run migrations
cargo sqlx migrate run

# Or use the init script (starts Docker + applies migrations)
./scripts/init_db.sh
```

### Production (Kubernetes)

Migrations are **automatically executed before each deployment** using a Kubernetes Job with ArgoCD PreSync hook.

**How it works:**
1. CI/CD pipeline builds two Docker images:
   - `expenses-monitor:vX.Y.Z-backend-rust` (application)
   - `expenses-monitor:vX.Y.Z-backend-rust-migrate` (migration job)
2. ArgoCD detects manifest changes and triggers sync
3. **PreSync hook** runs the migration Job first ([manifest/backend-rust/db-migration-job.yaml](../manifest/backend-rust/db-migration-job.yaml))
4. If migrations succeed → deployment proceeds
5. If migrations fail → **deployment is rolled back** (no downtime)

**No manual intervention required!** This replaces the automatic Liquibase migrations from the Java backend.

### Creating New Migrations

```bash
# Create a new migration file
cd backend-rust
cargo sqlx migrate add <description>

# Example: Add new column
cargo sqlx migrate add add_category_icon_column

# Edit the generated file in migrations/YYYYMMDDHHMMSS_<description>.sql
# Then run migrations locally to test
cargo sqlx migrate run
```

**Important:** Migrations must be idempotent and backward-compatible to support zero-downtime deployments.

## Deploy k8s

```bash
kubectl create ns expenses-monitor
kubectl apply -f manifest/backend-rust/
```

The deployment includes:
- `manifest.yaml` - Application deployment, service, and ingress
- `db-migration-job.yaml` - PreSync migration job (runs automatically via ArgoCD)
