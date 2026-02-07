# GitOps Network Policies - Deployment Guide

## 🔄 Automatic Deployment via ArgoCD

### How It Works

Le NetworkPolicies in `manifest/backend-rust/network-policies.yaml` vengono **automaticamente applicate** da ArgoCD quando:

1. **Commit & Push**: Modifiche al file vengono pushate su GitHub
2. **ArgoCD Detection**: ArgoCD rileva il cambiamento nel repository
3. **Auto-Sync**: Se auto-sync è abilitato, applica automaticamente le modifiche
4. **Manual Sync**: Altrimenti, richiede sync manuale via UI/CLI

### Sync Order (Sync Waves)

ArgoCD applica i manifest in ordine basato su `argocd.argoproj.io/sync-wave`:

```
Wave -1: PreSync Hooks (db-migration-job) → esegue prima di tutto
Wave 5:  Deployments (backend-rust)       → deployment applicazione
Wave 10: NetworkPolicies                  → restrizioni rete dopo pod startup
```

**Perché questo ordine?**
- ✅ Migrations completano prima che l'app parta
- ✅ Pods si avviano senza restrizioni di rete iniziali
- ✅ NetworkPolicies applicate quando i pod sono healthy
- ✅ Nessuna interruzione di connettività durante deployment

### Current ArgoCD Configuration

**Application**: `backend-rust`
```yaml
# In manifest/argocd-apps/helm/values.yaml
backend-rust:
  project: default
  source:
    repoURL: https://github.com/and-mora/expenses-monitor.git
    path: manifest/backend-rust  # ← Monitora questa directory
    targetRevision: HEAD
  destination:
    namespace: expenses-monitor
  syncPolicy:
    syncOptions:
      - CreateNamespace=false
```

**Tutti i file YAML** in `manifest/backend-rust/` vengono applicati:
- ✅ `manifest.yaml` (Deployment, Service, Ingress)
- ✅ `db-migration-job.yaml` (PreSync migration)  
- ✅ `network-policies.yaml` (NetworkPolicies) ← **Nuovo!**

---

## 🚀 Deployment Methods

### Method 1: Auto-Sync (Recommended for Production)

**Enable in ArgoCD UI**:
1. Apps → backend-rust → App Details
2. Sync Policy → Enable Auto-Sync
3. Self Heal: ✅ (reverte drift automaticamente)
4. Prune Resources: ✅ (rimuove risorse obsolete)

**Or via CLI**:
```bash
argocd app set backend-rust \
  --sync-policy automated \
  --self-heal \
  --auto-prune
```

**Behavior**:
- Ogni commit su `master` → auto-deployment in ~3 minuti
- ArgoCD controlla repo ogni 3 minuti per default
- NetworkPolicies applicate automaticamente con sync-wave 10

### Method 2: Manual Sync (Current Setup)

**Via UI**:
1. ArgoCD UI → Apps → backend-rust
2. Status: OutOfSync (giallo)
3. Click "SYNC" button
4. Review changes → Click "SYNCHRONIZE"

**Via CLI**:
```bash
# Sync all resources
argocd app sync backend-rust

# Sync only NetworkPolicies
argocd app sync backend-rust --resource networking.k8s.io:NetworkPolicy:backend-rust-netpol

# Sync with prune (remove deleted resources)
argocd app sync backend-rust --prune
```

**Via CD Pipeline**:
Il workflow `.github/workflows/deploy_backend_rust_argocd.yml` fa già:
```bash
argocd app sync backend-rust --timeout 300
argocd app wait backend-rust --health --timeout 300
```

---

## 🔍 Verify Deployment

### Check ArgoCD Status

```bash
# Check app sync status
argocd app get backend-rust

# Check specific NetworkPolicy sync
argocd app resources backend-rust | grep NetworkPolicy
```

Expected output:
```
GROUP                KIND             NAMESPACE         NAME                      STATUS
networking.k8s.io    NetworkPolicy    expenses-monitor  backend-rust-netpol       Synced
networking.k8s.io    NetworkPolicy    expenses-monitor  frontend-companion-netpol Synced
networking.k8s.io    NetworkPolicy    expenses-monitor  postgresql-netpol         Synced
networking.k8s.io    NetworkPolicy    expenses-monitor  keycloak-netpol           Synced
```

### Check Kubernetes Direct

```bash
# List all NetworkPolicies in namespace
kubectl get networkpolicies -n expenses-monitor

# Describe specific policy
kubectl describe networkpolicy backend-rust-netpol -n expenses-monitor

# Test connectivity (should be restricted)
kubectl exec -it <backend-rust-pod> -n expenses-monitor -- curl http://postgresql:5432
# Expected: Success (allowed by egress rule)

kubectl exec -it <backend-rust-pod> -n expenses-monitor -- curl http://frontend:80
# Expected: Timeout (not in egress rules)
```

---

## 🐛 Troubleshooting

### Issue: NetworkPolicies Not Applied

**Symptom**: File in git, but not deployed to cluster

**Check**:
```bash
# Is ArgoCD synced?
argocd app get backend-rust | grep "Sync Status"

# Are NetworkPolicies detected?
argocd app manifests backend-rust | grep -A 5 "kind: NetworkPolicy"
```

**Fix**:
```bash
# Force sync
argocd app sync backend-rust --force

# Hard refresh (re-fetch from git)
argocd app get backend-rust --hard-refresh
```

### Issue: App OutOfSync After Commit

**Symptom**: Pushed to GitHub, but ArgoCD shows OutOfSync

**Possible Causes**:
1. **Auto-sync disabled** → Enable or manual sync
2. **Webhook not configured** → ArgoCD polls every 3min by default
3. **Wrong branch** → Check `targetRevision: HEAD` points to `master`

**Quick Fix**:
```bash
argocd app sync backend-rust
```

### Issue: Connectivity Broken After NetworkPolicy

**Symptom**: Pods can't reach database/services after applying policies

**Debug**:
```bash
# Check pod labels match selectors
kubectl get pod <backend-rust-pod> -n expenses-monitor --show-labels

# Check NetworkPolicy selectors
kubectl get networkpolicy backend-rust-netpol -n expenses-monitor -o yaml

# Temporarily delete policy to test
kubectl delete networkpolicy backend-rust-netpol -n expenses-monitor
# (ArgoCD will re-create on next sync)
```

**Fix**: Update podSelector labels in network-policies.yaml to match deployment

---

## 📦 Rollback Strategy

### Rollback via Git

```bash
# Revert last commit
git revert HEAD
git push origin master

# ArgoCD will auto-sync revert (if auto-sync enabled)
# Or manual sync
argocd app sync backend-rust
```

### Rollback via ArgoCD

```bash
# View history
argocd app history backend-rust

# Rollback to previous revision
argocd app rollback backend-rust <REVISION_ID>
```

### Emergency: Delete NetworkPolicies

```bash
# Delete all NetworkPolicies (emergency only!)
kubectl delete networkpolicies -n expenses-monitor --all

# Note: ArgoCD will detect drift and re-apply
# To prevent, delete from git first
```

---

## 🔐 Best Practices

### 1. Test NetworkPolicies in Staging First

```bash
# Apply to staging namespace
kubectl apply -f manifest/backend-rust/network-policies.yaml \
  --namespace=expenses-monitor-staging \
  --dry-run=server
```

### 2. Monitor After Deployment

```bash
# Watch pod status
kubectl get pods -n expenses-monitor -w

# Check logs for connection errors
kubectl logs -f <backend-rust-pod> -n expenses-monitor | grep -i "connection\|timeout\|refused"
```

### 3. Use Sync Waves for Complex Dependencies

Current setup:
- `-1`: PreSync Hooks (migrations)
- `0`: Default (services, configmaps)
- `5`: Deployments
- `10`: NetworkPolicies

Add more if needed:
- `15`: Post-deployment tests
- `20`: External service integrations

### 4. Enable Notifications

Configure ArgoCD to send alerts on sync failures:
```yaml
# In argocd-apps values
notifications:
  subscriptions:
    - recipients:
      - slack:YOUR_CHANNEL
      triggers:
      - on-sync-failed
```

---

## 📊 GitOps Workflow Summary

```
Developer
    ↓ (git commit & push)
GitHub Repository
    ↓ (webhook or polling)
ArgoCD Detects Change
    ↓ (sync-wave -1)
Migration Job Runs
    ↓ (sync-wave 5)
Backend Deployment Updates
    ↓ (sync-wave 10)
NetworkPolicies Applied
    ↓
Kubernetes Cluster (Updated)
```

**Result**: Zero manual kubectl commands needed! 🎉

---

## 🔗 References

- [ArgoCD Sync Phases](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/)
- [NetworkPolicy Debugging](https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/)
- [GitOps Best Practices](https://www.gitops.tech/)
