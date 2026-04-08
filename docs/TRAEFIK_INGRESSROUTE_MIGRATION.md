# Migration Plan: Kubernetes Ingress → Gateway API (HTTPRoute)

## Executive Summary

Replace all 8 `networking.k8s.io/v1 Ingress` resources with **Kubernetes Gateway API** resources (`gateway.networking.k8s.io/v1`). The Gateway API is the official Kubernetes successor to Ingress, GA since 2023, and natively supported by Traefik v3.x. This provides a standards-based, vendor-neutral migration path with better separation of concerns.

### Why Gateway API over Traefik IngressRoute?

| | IngressRoute (Traefik CRD) | HTTPRoute (Gateway API) |
|-|----------------------------|------------------------|
| **Standard** | Proprietary Traefik | Kubernetes standard (GA) |
| **Vendor lock-in** | Yes — only Traefik | No — portable to Envoy, NGINX, Istio, etc. |
| **Separation of concerns** | No | Yes — `Gateway` (infra) / `HTTPRoute` (app team) |
| **cert-manager integration** | Manual `Certificate` CRDs only | Explicit `ClusterIssuer` + `Certificate` CRDs (GitOps-friendly) |
| **HTTP→HTTPS redirect** | Custom Middleware required | Built-in `RequestRedirect` filter |
| **Traefik support** | Native | Native since Traefik v3.0+ |

### Infrastructure: MicroK8s + ArgoCD

This repository now treats the edge controllers as GitOps-managed infrastructure:
- `manifest/traefik/` — Traefik controller, Gateway API provider, GatewayClass, and LoadBalancer service
- `manifest/cert-manager/` — cert-manager controller with `config.enableGatewayAPI: true`
- `manifest/gateway-api/` — shared Gateways, `ClusterIssuer`, and explicit `Certificate` resources

MicroK8s remains the cluster runtime, but addon state is no longer the source of truth for Traefik or cert-manager.

## Current State Inventory

| # | Resource | Host | Paths | TLS Secret | Namespace | Notes |
|---|----------|------|-------|------------|-----------|-------|
| 1 | `Ingress/backend-rust` | `api-rust.expmonitor.freeddns.org` | `/health` (Exact), `/metrics` (Exact) | `backend-rust-tls` | expenses-monitor | Public endpoints |
| 2 | `Ingress/backend-rust-api` | `api-rust.expmonitor.freeddns.org` | `/api` (Prefix) | `backend-rust-tls` | expenses-monitor | Protected, jwt-auth middleware |
| 3 | `Ingress/keycloak` | `auth.expmonitor.freeddns.org` | `/` (Prefix) | `keycloak-tls` | default | Identity provider |
| 4 | `Ingress/backend` | `api.expmonitor.freeddns.org` | `/` (Prefix) | `backend-tls` | expenses-monitor | Legacy Java backend |
| 5 | `Ingress/frontend-companion` | `expenses.expmonitor.freeddns.org` | `/` (Prefix) | `frontend-companion-tls` | expenses-monitor | React frontend |
| 6 | `Ingress/frontend` | `expmonitor.freeddns.org` | `/` (Prefix) | `frontend-tls` | expenses-monitor | Legacy Angular frontend |
| 7 | ArgoCD (Helm) | `argocd.expmonitor.freeddns.org` | `/` | managed by Helm | argocd | Via Helm `server.ingress` values |
| 8 | Grafana (Helm) | `grafana.expmonitor.freeddns.org` | `/` | `grafana-tls` | monitoring | Via kube-prometheus-stack Helm values |

### Already Migrated to Traefik CRDs
- ✅ `Middleware/jwt-auth` (ForwardAuth → oauth2-proxy) — already uses `traefik.io/v1alpha1`, stays as-is (referenced via `ExtensionRef` in HTTPRoute)
- ✅ NetworkPolicies already reference Traefik in `ingress` namespace

### Cleanup Needed
- ⚠️ ArgoCD Helm values contain stale nginx annotations (`nginx.ingress.kubernetes.io/*`)

---

## Key Differences: Ingress vs Gateway API

| Aspect | Ingress | Gateway API (HTTPRoute) |
|--------|---------|------------------------|
| API | `networking.k8s.io/v1` | `gateway.networking.k8s.io/v1` |
| Architecture | Flat (one resource) | Layered: `GatewayClass` → `Gateway` → `HTTPRoute` |
| TLS via cert-manager | Annotation on Ingress | Explicit `Certificate` CRDs referencing a `ClusterIssuer` |
| Middleware / Filters | Vendor annotations | Standard filters + `ExtensionRef` for vendor extensions |
| Path matching | `pathType: Prefix\|Exact` | `type: PathPrefix\|Exact` in `matches` |
| HTTP→HTTPS redirect | Vendor-specific | Built-in `RequestRedirect` filter |
| Multi-team | No separation | `Gateway` (infra team) / `HTTPRoute` (app team) |

### cert-manager: Auto-Renewal is Preserved

Whether using Ingress annotations, Gateway annotations, or explicit `Certificate` CRDs, cert-manager uses the **same renewal mechanism**: it monitors Certificate resources and renews before expiry.

For this repository, the durable GitOps source of truth is now:

- `manifest/gateway-api/clusterissuer-letsencrypt.yaml`
- `manifest/gateway-api/certificates.yaml`
- Gateway resources that reference those TLS Secrets

This avoids relying on gateway-shim state surviving a cert-manager reinstall.

---

## Pre-Migration Checklist

### 1. Bootstrap the Traefik controller app

Sync the Argo-managed `traefik` application first. The pinned chart installs the Traefik CRDs, the standard Gateway API CRDs, and the `GatewayClass/traefik`.

```bash
microk8s kubectl get crd gatewayclasses.gateway.networking.k8s.io
microk8s kubectl get crd gateways.gateway.networking.k8s.io
microk8s kubectl get crd httproutes.gateway.networking.k8s.io
microk8s kubectl get gatewayclass traefik
```

### 2. Verify Traefik Gateway API Provider

```bash
# Traefik must have the kubernetesGateway provider enabled
# Check Traefik deployment args or Helm values for:
#   --providers.kubernetesgateway=true
microk8s kubectl get deployment -n ingress -l app.kubernetes.io/name=traefik -o yaml | grep -A5 gateway

# Verify GatewayClass exists (Traefik auto-creates it)
microk8s kubectl get gatewayclass
# Expected: NAME=traefik  CONTROLLER=traefik.io/gateway-controller
```

### 3. Verify cert-manager Gateway API Support

```bash
# cert-manager is configured from manifest/cert-manager/values.yaml
# and must run with enableGatewayAPI: true
microk8s kubectl get deployment -n cert-manager cert-manager -o yaml | grep -i gateway
```

### 4. General Checks

- [ ] **Verify cert-manager is running**: `microk8s kubectl get pods -n cert-manager`
- [ ] **Verify current TLS secrets exist**: `microk8s kubectl get secrets -n expenses-monitor | grep tls`
- [ ] **Backup current Ingress resources**: `microk8s kubectl get ingress -A -o yaml > ingress-backup.yaml`
- [ ] **Check Traefik entrypoints**: confirm `web` (port 80) and `websecure` (port 8443, exposed as 443) are configured

---

## Migration Steps

### Phase 0: Sync the controller applications

1. Sync `traefik` from `manifest/traefik/`
2. Sync `cert-manager` from `manifest/cert-manager/`
3. Confirm `GatewayClass/traefik` exists before syncing `manifest/gateway-api/`

---

### Phase 1: Create Gateway and cert-manager Resources

The Gateway resource replaces TLS configuration that was previously on each Ingress, but the TLS lifecycle should remain explicit in Git.

Commit both:

- the shared `ClusterIssuer`
- per-host `Certificate` resources for every Gateway TLS Secret

This keeps TLS durable across controller reinstall or cluster recovery and avoids relying on addon-managed shim state.

#### 1a. Gateway for expenses-monitor namespace

**File**: `manifest/gateway-api/gateway.yaml` — 4 HTTPS listeners (backend-rust, backend, frontend-companion, frontend) + 1 HTTP redirect listener.

> Note: Keycloak has its own Gateway in the `default` namespace (see 1b) because the ArgoCD app for keycloak targets `default`, not `expenses-monitor`.

#### 1b. Gateway for Keycloak (default namespace)

**File**: `manifest/gateway-api/keycloak-gateway.yaml` — 1 HTTPS listener (auth) + 1 HTTP redirect listener.

#### 1c. Gateway for ArgoCD namespace

**File**: `manifest/gateway-api/argocd-gateway.yaml`
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: argocd
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "-1"
spec:
  gatewayClassName: traefik
  listeners:
    - name: https
      hostname: argocd.expmonitor.freeddns.org
      port: 8443
      protocol: HTTPS
      tls:
        mode: Terminate
        certificateRefs:
          - name: argocd-server-tls
      allowedRoutes:
        namespaces:
          from: Same
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: Same
```

#### 1d. Gateway for Monitoring namespace

**File**: `manifest/gateway-api/grafana-gateway.yaml`

---

### Phase 2: Create HTTPRoute Resources

Deploy HTTPRoutes **alongside** existing Ingresses. Traefik handles both simultaneously — zero downtime.

#### 2a. backend-rust

**File**: `manifest/backend-rust/httproutes.yaml` — 2 HTTPRoutes: `backend-rust-public` (Exact /health, /metrics) and `backend-rust-api` (PathPrefix /api with jwt-auth Middleware via ExtensionRef).

> **Note**: The `jwt-auth` Middleware CRD (`traefik.io/v1alpha1`) stays unchanged. It's referenced via the standard Gateway API `ExtensionRef` filter — this is how vendor-specific features integrate with Gateway API.

#### 2b. keycloak

**File**: `manifest/keycloak/httproute.yaml` — in `default` namespace, references the `keycloak` Gateway.

#### 2c. backend (legacy Java)

**File**: `manifest/backend/httproute.yaml`

#### 2d. frontend-companion (React)

**File**: `manifest/frontend-companion/httproute.yaml`

#### 2e. frontend (legacy Angular)

No committed `HTTPRoute` currently exists for the legacy `expmonitor.freeddns.org` host. The shared Gateway still reserves the TLS Secret and listener, but routing that host requires a separate product decision.

---

### Phase 3: HTTP→HTTPS Redirect (Built-in, No Middleware Needed)

Gateway API has a **standard** `RequestRedirect` filter — no Traefik-specific Middleware required.

Each namespace has its own redirect HTTPRoute, referencing the `http` listener on its Gateway:

- `manifest/gateway-api/http-redirect.yaml` — expenses-monitor namespace
- `manifest/keycloak/http-redirect.yaml` — default namespace (keycloak)
- `manifest/argocd/helm/templates/http-redirect.yaml` — argocd (Helm template)
- `manifest/monitoring/templates/http-redirect.yaml` — monitoring (Helm template)

---

### Phase 4: Migrate Helm-Managed Ingresses

#### 4a. ArgoCD

In `manifest/argocd/helm/values.yaml`, disable the built-in Ingress:
```yaml
  server:
    ingress:
      enabled: false   # Disable built-in Ingress
```

The Gateway, HTTPRoute, and HTTP redirect templates have already been created in `manifest/argocd/helm/templates/`.

Also **remove stale nginx annotations** from `values.yaml`:
```yaml
# DELETE these lines:
        nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
        nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
```

> **Note**: The ArgoCD Helm service name is `argocd-argo-cd-server` (release name `argocd` + subchart `argo-cd` + component `server`).

#### 4b. Grafana (kube-prometheus-stack)

In `manifest/monitoring/values.yaml`, disable the built-in Ingress:
```yaml
    ingress:
      enabled: false   # Disable built-in Ingress
```

The Gateway, HTTPRoute, and HTTP redirect templates have already been created in `manifest/monitoring/templates/`.

---

### Phase 5: Test and Remove Old Ingress Resources

1. **Test all endpoints** (see Verification Commands below)
2. **Remove old Ingress resources** from manifest YAML files
3. **Disable Traefik's Kubernetes Ingress provider** (optional, only if no Ingress resources remain):
   ```yaml
   # In Traefik Helm values
   providers:
     kubernetesIngress:
       enabled: false
   ```
4. **Update documentation**: Update docs referencing Ingress resources
5. **Configure ArgoCD health checks**: ArgoCD needs to understand Gateway API resource health
   ```yaml
   # In ArgoCD ConfigMap (argocd-cm)
   resource.customizations.health.gateway.networking.k8s.io_HTTPRoute: |
     hs = {}
     hs.status = "Healthy"
     hs.message = "HTTPRoute is active"
     return hs
   ```

---

## Rollback Strategy

Since ArgoCD manages all deployments via GitOps:

1. **Revert the commit** that introduces Gateway/HTTPRoute resources
2. ArgoCD auto-syncs back to Ingress resources
3. TLS secrets are shared — they persist across Ingress/Gateway

> **Zero-downtime approach**: Deploy Gateway + HTTPRoutes alongside Ingress first. Traefik handles both. Test HTTPRoutes work, then delete Ingress in a second commit.

---

## Recommended Execution Order

| Step | Action | Risk | Downtime |
|------|--------|------|----------|
| 0 | Pre-flight checks (CRDs, cert-manager Gateway API support, backup) | None | None |
| 1 | Install Gateway API CRDs + create GatewayClass | None | None |
| 2 | Deploy Gateway resources, ClusterIssuer, and Certificates | None | None |
| 3 | Deploy HTTPRoutes **alongside** existing Ingresses | Low (Traefik handles both) | None |
| 4 | Deploy HTTP→HTTPS redirect HTTPRoutes | Low | None |
| 5 | Test all endpoints | None | None |
| 6 | Remove old Ingress resources from manifests | Low (if step 5 passed) | None |
| 7 | Migrate Helm-managed Ingresses (ArgoCD, Grafana) | Medium (Helm release change) | Seconds |
| 8 | Cleanup: disable Ingress provider, remove nginx annotations | Low | None |

---

## Verification Commands

```bash
# Verify Gateway API CRDs are installed
microk8s kubectl get crd gatewayclasses.gateway.networking.k8s.io
microk8s kubectl get crd gateways.gateway.networking.k8s.io
microk8s kubectl get crd httproutes.gateway.networking.k8s.io

# Verify GatewayClass is accepted
microk8s kubectl get gatewayclass traefik

# Verify Gateways are programmed
microk8s kubectl get gateway -A
microk8s kubectl describe gateway expenses-monitor -n expenses-monitor
microk8s kubectl describe gateway keycloak -n default

# Verify HTTPRoutes are attached
microk8s kubectl get httproute -A
microk8s kubectl describe httproute backend-rust-api -n expenses-monitor

# Verify the declared Certificates reconcile successfully
microk8s kubectl get certificates -n expenses-monitor
microk8s kubectl get certificates -n default
microk8s kubectl get certificates -n argocd
microk8s kubectl get certificates -n monitoring

# Verify Traefik sees the routes
microk8s kubectl logs -n ingress -l app.kubernetes.io/name=traefik --tail=50

# Test each endpoint
curl -I https://api-rust.expmonitor.freeddns.org/health
curl -I https://api-rust.expmonitor.freeddns.org/api/payments  # Should 401 without token
curl -I https://auth.expmonitor.freeddns.org/
curl -I https://expenses.expmonitor.freeddns.org/
curl -I https://expmonitor.freeddns.org/
curl -I https://argocd.expmonitor.freeddns.org/
curl -I https://grafana.expmonitor.freeddns.org/

# Test HTTP→HTTPS redirect
curl -I http://expenses.expmonitor.freeddns.org/
# Expected: 301 Moved Permanently, Location: https://...

# Verify no old Ingresses remain (after cleanup)
microk8s kubectl get ingress -A
```

---

## Files Changed Summary

### New Files (already created)

| File | Description |
|------|-------------|
| `manifest/traefik/Chart.yaml` | Argo-managed Traefik Helm wrapper |
| `manifest/traefik/values.yaml` | Traefik Gateway API configuration and listener port mapping |
| `manifest/cert-manager/Chart.yaml` | Argo-managed cert-manager Helm wrapper |
| `manifest/cert-manager/values.yaml` | cert-manager controller configuration with Gateway API enabled |
| `manifest/gateway-api/gateway.yaml` | Gateway for expenses-monitor ns (4 HTTPS + 1 HTTP listener) |
| `manifest/gateway-api/http-redirect.yaml` | HTTP→HTTPS redirect for expenses-monitor |
| `manifest/backend-rust/httproutes.yaml` | 2 HTTPRoutes (public + protected with jwt-auth) |
| `manifest/gateway-api/keycloak-gateway.yaml` | Gateway for default/keycloak ns (1 HTTPS + 1 HTTP listener) |
| `manifest/keycloak/httproute.yaml` | HTTPRoute for Keycloak |
| `manifest/gateway-api/keycloak-http-redirect.yaml` | HTTP→HTTPS redirect for Keycloak |
| `manifest/backend/httproute.yaml` | HTTPRoute for legacy Java backend |
| `manifest/frontend-companion/httproute.yaml` | HTTPRoute for React frontend |
| `manifest/gateway-api/gateway.yaml` | Shared Gateway listener for the legacy `expmonitor.freeddns.org` TLS secret |
| `manifest/gateway-api/argocd-gateway.yaml` | Gateway for ArgoCD ns |
| `manifest/gateway-api/argocd-http-redirect.yaml` | HTTP→HTTPS redirect for ArgoCD |
| `manifest/gateway-api/grafana-gateway.yaml` | Gateway for monitoring ns |
| `manifest/monitoring/templates/grafana-httproute.yaml` | HTTPRoute for Grafana (Helm template) |
| `manifest/gateway-api/grafana-http-redirect.yaml` | HTTP→HTTPS redirect for monitoring |

### Modified Files (already done)

| File | Change |
|------|--------|
| `manifest/argocd-apps/helm/values.yaml` | Added ordered ArgoCD Applications for `traefik`, `cert-manager`, and `gateway-api` |
| `manifest/argocd/helm/values.yaml` | Added `server.httproute` (native chart support) for ArgoCD HTTPRoute |

### Changes Pending (Phase 5 — after testing)

| File | Change |
|------|--------|
| `manifest/backend-rust/manifest.yaml` | Remove 2 Ingress resources |
| `manifest/keycloak/manifest.yaml` | Remove 1 Ingress resource |
| `manifest/backend/manifest.yaml` | Remove 1 Ingress resource |
| `manifest/frontend-companion/manifest.yaml` | Remove 1 Ingress resource |
| `manifest/frontend/manifest.yaml` | Remove 1 Ingress resource |
| `manifest/argocd/helm/values.yaml` | Disable Ingress, remove nginx annotations |
| `manifest/monitoring/values.yaml` | Disable Grafana Ingress |

### Unchanged

| File | Reason |
|------|--------|
| `manifest/oauth2-proxy/middleware.yaml` | Already Traefik CRD, referenced via ExtensionRef ✅ |
| `manifest/backend-rust/network-policies.yaml` | Already references Traefik ✅ |

---

## Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │            GatewayClass: traefik         │
                    │   controllerName: traefik.io/gateway     │
                    └───────────────┬─────────────────────────┘
                                    │
       ┌────────────┬───────────────┼───────────────┬────────────┐
       │            │               │               │            │
┌──────▼──────┐ ┌───▼────┐  ┌──────▼──────┐ ┌──────▼──────┐ ┌───▼──────┐
│   Gateway   │ │Gateway │  │   Gateway   │ │   Gateway   │ │  (Helm)  │
│  expenses-  │ │keycloak│  │  (Helm)     │ │  (Helm)     │ │          │
│  monitor    │ │(default│  │  argocd     │ │ monitoring  │ │          │
│ (4 HTTPS +  │ │  ns)   │  │             │ │             │ │          │
│  1 HTTP)    │ │(1+1)   │  │  (1+1)      │ │  (1+1)      │ │          │
└──────┬──────┘ └───┬────┘  └──────┬──────┘ └──────┬──────┘ └──────────┘
       │            │              │               │
 ┌─────┼─────┐  ┌──▼──────┐  ┌────▼────┐    ┌─────▼─────┐
 │     │     │  │HTTPRoute│  │HTTPRoute│    │ HTTPRoute │
 │     │     │  │keycloak │  │ argocd  │    │  grafana  │
 │     │     │  └──┬──────┘  └────┬────┘    └─────┬─────┘
 │     │     │     │              │               │
 ▼     ▼     ▼     ▼              ▼               ▼
HTTPRoutes:     keycloak      argocd-argo-    grafana svc
- backend-rust    svc         cd-server svc
  -public
- backend-rust
  -api ──► Middleware/jwt-auth (Traefik CRD)
- backend                │
- frontend-      oauth2-proxy ──► Keycloak JWKS
  companion
- frontend
```
