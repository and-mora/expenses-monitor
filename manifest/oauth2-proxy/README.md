# oauth2-proxy - JWT Validation for backend-rust

## Overview

oauth2-proxy validates JWT Bearer tokens from Keycloak before requests reach backend-rust.
Traefik ForwardAuth middleware sends each `/api/*` request to oauth2-proxy for validation.

## Architecture

```
Browser (Bearer token) → Traefik → oauth2-proxy (validate JWT) → backend-rust
                                         ↕
                                    Keycloak JWKS
```

## Prerequisites

### Why no Keycloak client is needed

oauth2-proxy with `--skip-jwt-bearer-tokens=true` validates Bearer tokens using
only the **public JWKS endpoint** (`/protocol/openid-connect/certs`).  
No client credentials grant is performed — the JWKS is unauthenticated.

The existing `frontend` public client ID is reused in the Deployment manifest
solely because oauth2-proxy requires a non-empty `--client-id` at startup.
The `--client-secret` is set to a dummy string for the same reason.

### Create the SealedSecret

The only real secret needed is a random `cookie-secret` (oauth2-proxy requires it
for session cookie encryption — even though we don't use cookie sessions).

The SealedSecret is versioned in `manifest/oauth2-proxy/sealed-secret.yaml` and
deployed automatically by ArgoCD, following the same pattern as Keycloak and
PostgreSQL secrets.

To generate (or regenerate) it on the VM:

```bash
# 1. Generate a random cookie secret
COOKIE_SECRET=$(openssl rand -base64 32 | head -c 32)

# 2. Create a plain Secret (dry-run, never applied)
microk8s kubectl create secret generic oauth2-proxy-secrets \
  --namespace=expenses-monitor \
  --from-literal=cookie-secret="$COOKIE_SECRET" \
  --dry-run=client -o yaml > /tmp/oauth2-proxy-secret.yaml

# 3. Seal it with the cluster's public key
kubeseal --format=yaml \
  < /tmp/oauth2-proxy-secret.yaml \
  > manifest/oauth2-proxy/sealed-secret.yaml

# 4. Clean up plaintext
rm /tmp/oauth2-proxy-secret.yaml

# 5. Commit and push — ArgoCD will create the real Secret
git add manifest/oauth2-proxy/sealed-secret.yaml
git commit -m "chore: add oauth2-proxy sealed secret"
git push
```

## Deployment

### Deploy via ArgoCD (automatic)

The ArgoCD application is configured in `manifest/argocd-apps/helm/values.yaml`.
After pushing to git, ArgoCD will sync automatically.

### Deploy manually (for testing)

```bash
# 1. Create the secret first (see above)

# 2. Apply oauth2-proxy
microk8s kubectl apply -f manifest/oauth2-proxy/

# 3. Verify
microk8s kubectl get pods -n expenses-monitor -l app=oauth2-proxy
microk8s kubectl logs -n expenses-monitor -l app=oauth2-proxy
```

## Testing

```bash
# 1. Health check (public, should work without token)
curl -sk https://api-rust.expmonitor.freeddns.org/health
# Expected: 200

# 2. Metrics (public, should work without token)
curl -sk https://api-rust.expmonitor.freeddns.org/metrics
# Expected: 200

# 3. API without token (should be rejected)
curl -sk -o /dev/null -w "%{http_code}" \
  https://api-rust.expmonitor.freeddns.org/api/payments
# Expected: 401

# 4. Get a valid token from Keycloak
TOKEN=$(curl -sk -X POST \
  "https://auth.expmonitor.freeddns.org/realms/expenses-monitor/protocol/openid-connect/token" \
  -d "client_id=frontend" \
  -d "username=<YOUR_USER>" \
  -d "password=<YOUR_PASSWORD>" \
  -d "grant_type=password" | jq -r '.access_token')

# 5. API with valid token (should work)
curl -sk -H "Authorization: Bearer $TOKEN" \
  https://api-rust.expmonitor.freeddns.org/api/payments
# Expected: 200 + JSON data

# 6. API with invalid token (should be rejected)
curl -sk -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer invalid.token.here" \
  https://api-rust.expmonitor.freeddns.org/api/payments
# Expected: 401
```

## Endpoint Protection Map

| Endpoint | Auth Required | Reason |
|---|---|---|
| `/health` | No | Kubernetes probes |
| `/metrics` | No | Prometheus scraping |
| `/api/payments` | **Yes** | Business data |
| `/api/payments/categories` | **Yes** | Business data |
| `/api/balance` | **Yes** | Business data |
| `/api/wallets` | **Yes** | Business data |

## Troubleshooting

### oauth2-proxy won't start
```bash
microk8s kubectl describe pod -n expenses-monitor -l app=oauth2-proxy
microk8s kubectl logs -n expenses-monitor -l app=oauth2-proxy
```
Common issues: missing cookie-secret, wrong Keycloak URL, JWKS endpoint unreachable.

### API returns 401 when it shouldn't
```bash
# Check oauth2-proxy logs for token validation errors
microk8s kubectl logs -n expenses-monitor -l app=oauth2-proxy -f

# Decode your token to check issuer/audience
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq .
```

### ForwardAuth middleware not applied
```bash
# Verify the Middleware CRD exists
microk8s kubectl get middleware -n expenses-monitor

# Check Traefik sees the middleware
microk8s kubectl logs -n ingress -l app.kubernetes.io/name=traefik
```

## Rollback

To disable JWT auth immediately (makes APIs public again):

```bash
# Remove the middleware annotation from the API ingress
microk8s kubectl annotate ingress backend-rust-api \
  traefik.ingress.kubernetes.io/router.middlewares- \
  -n expenses-monitor
```

To restore: re-apply the manifests from git.
