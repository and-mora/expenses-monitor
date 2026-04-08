# TLS certificates

TLS is GitOps-managed in-cluster with cert-manager and Traefik.

## Source of truth

- `manifest/cert-manager/values.yaml`
- `manifest/traefik/values.yaml`
- `manifest/gateway-api/clusterissuer-letsencrypt.yaml`
- `manifest/gateway-api/certificates.yaml`
- `manifest/gateway-api/*.yaml` Gateways referencing the TLS Secrets

## Controller ownership

- the `cert-manager` Argo application installs cert-manager and enables `config.enableGatewayAPI`
- the `traefik` Argo application installs the Gateway controller and exposes the required port 80 HTTP entrypoint
- the `gateway-api` Argo application owns the shared `ClusterIssuer`, explicit `Certificate` resources, and namespace Gateways

## Prerequisites

1. ArgoCD has synced `traefik`, `cert-manager`, and `gateway-api`
2. Public DNS records point at the cluster
3. Public HTTP port 80 is reachable for ACME HTTP-01 validation

## Issuance model

- `ClusterIssuer/letsencrypt` uses ACME HTTP-01
- cert-manager creates temporary `HTTPRoute` solver resources on the target Gateway
- explicit `Certificate` resources keep the TLS Secrets renewed in:
  - `expenses-monitor`
  - `default`
  - `argocd`
  - `monitoring`
- Traefik must accept Gateway listeners on port 80, so the controller chart is pinned with `web.port: 80`

## Useful checks

```bash
microk8s kubectl get gatewayclass
microk8s kubectl get clusterissuer
microk8s kubectl get certificates -A
microk8s kubectl get certificaterequest,order,challenge,httproute -A
microk8s kubectl logs -n cert-manager deploy/cert-manager --since=15m
microk8s kubectl logs -n ingress deploy/traefik --since=15m
```

## Troubleshooting

If issuance is stuck:

1. verify the relevant Gateway has an HTTP listener on port 80
2. verify cert-manager is running with `enableGatewayAPI: true`
3. confirm Traefik is serving Gateway API resources and accepts the listener ports declared in the Gateway manifests
4. confirm the hostname resolves publicly and port 80 reaches the cluster
