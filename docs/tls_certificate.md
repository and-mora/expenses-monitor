# TLS certificates

TLS is managed in-cluster with cert-manager, not with manual Certbot flows.

## Source of truth

- `manifest/gateway-api/clusterissuer-letsencrypt.yaml`
- `manifest/gateway-api/certificates.yaml`
- `manifest/gateway-api/*.yaml` Gateways referencing the TLS Secrets

## Prerequisites

1. `microk8s enable cert-manager`
2. Gateway API CRDs installed in the cluster
3. cert-manager configured with Gateway API support enabled
4. Traefik Gateway API provider enabled
5. Public DNS records pointing at the cluster
6. Public HTTP port 80 reachable for ACME HTTP-01 validation

## Issuance model

- `ClusterIssuer/letsencrypt` uses ACME HTTP-01
- cert-manager creates temporary `HTTPRoute` solver resources on the target Gateway
- explicit `Certificate` resources keep the TLS Secrets renewed in:
  - `expenses-monitor`
  - `default`
  - `argocd`
  - `monitoring`

## Useful checks

```bash
microk8s kubectl get clusterissuer
microk8s kubectl get certificates -A
microk8s kubectl get certificaterequest,order,challenge,httproute -A
microk8s kubectl logs -n cert-manager deploy/cert-manager --since=15m
```

## Troubleshooting

If issuance is stuck:

1. verify the relevant Gateway has an HTTP listener on port 80
2. verify cert-manager Gateway API support is enabled on the controller
3. confirm Traefik is serving Gateway API resources
4. confirm the hostname resolves publicly and port 80 reaches the cluster
