#!/bin/bash
#
# MicroK8s Upgrade Script: 1.29 → 1.35
# ======================================
# Cluster: expenses-monitor (single-node MicroK8s)
# Autore: generato per expenses-monitor project
# Data: Febbraio 2026
#
# IMPORTANTE: Questo script è pensato per essere eseguito STEP BY STEP.
# NON eseguirlo tutto in una volta. Leggi ogni sezione e lancia i comandi
# manualmente copiandoli nel terminale.
#
# Documentazione di riferimento:
# - https://canonical.com/microk8s/docs/upgrading
# - https://canonical.com/microk8s/docs/setting-snap-channel
# - https://canonical.com/microk8s/docs/release-notes
#
# Vincolo MicroK8s: "skip-level updates are NOT tested.
# Only upgrade through one minor release at a time."
#
# Percorso: 1.29 → 1.30 → 1.31 → 1.32 → 1.33 → 1.34 → 1.35
#
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}=============================================${NC}"
echo -e "${RED} NON ESEGUIRE QUESTO SCRIPT IN AUTOMATICO   ${NC}"
echo -e "${RED} Copia i comandi uno alla volta nel terminale${NC}"
echo -e "${RED}=============================================${NC}"
exit 0

# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              FASE 0 — PREPARAZIONE E BACKUP                       ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

# ── 0.1 Verifica stato attuale ──────────────────────────────────────

# Verifica la versione corrente
snap list microk8s
# Output atteso: microk8s  v1.29.15  8580  latest/stable  canonical

# Verifica che il cluster sia healthy
microk8s status
microk8s kubectl get nodes -o wide
microk8s kubectl get pods -A

# ── 0.2 Annota gli addon abilitati ─────────────────────────────────

# Salva la lista degli addon abilitati (ti servirà dopo)
microk8s status --format short | tee ~/microk8s-addons-backup.txt
# Addon attesi: dns, ingress, hostpath-storage, cert-manager, helm3
# (verifica e annota quelli effettivamente abilitati)

# ── 0.3 Backup dei dati critici ────────────────────────────────────

# Crea una directory per i backup
mkdir -p ~/microk8s-upgrade-backup

# Backup di PostgreSQL (IL PIÙ IMPORTANTE)
# Trova il nome del pod PostgreSQL
microk8s kubectl get pods -n default -l app.kubernetes.io/name=postgresql
# Esegui il dump
microk8s kubectl exec -n default $(microk8s kubectl get pods -n default -l app.kubernetes.io/name=postgresql -o jsonpath='{.items[0].metadata.name}') -- \
  pg_dumpall -U postgres > ~/microk8s-upgrade-backup/postgres-full-dump.sql
echo "PostgreSQL dump completato: $(wc -l ~/microk8s-upgrade-backup/postgres-full-dump.sql) righe"

# Backup di tutti i manifest del cluster
microk8s kubectl get all -A -o yaml > ~/microk8s-upgrade-backup/all-resources.yaml
microk8s kubectl get ingress -A -o yaml > ~/microk8s-upgrade-backup/all-ingresses.yaml
microk8s kubectl get secrets -A -o yaml > ~/microk8s-upgrade-backup/all-secrets.yaml
microk8s kubectl get pv,pvc -A -o yaml > ~/microk8s-upgrade-backup/all-storage.yaml
microk8s kubectl get sealedsecrets -A -o yaml > ~/microk8s-upgrade-backup/all-sealed-secrets.yaml 2>/dev/null || true
microk8s kubectl get clusterissuer -o yaml > ~/microk8s-upgrade-backup/cluster-issuers.yaml 2>/dev/null || true

# Backup delle IngressClass (importante per capire lo stato pre-upgrade)
microk8s kubectl get ingressclass -o yaml > ~/microk8s-upgrade-backup/ingress-classes.yaml

# Backup della configurazione ArgoCD
microk8s kubectl get applications -n argocd -o yaml > ~/microk8s-upgrade-backup/argocd-apps.yaml 2>/dev/null || true

# Raccolta diagnostica
microk8s inspect | tee ~/microk8s-upgrade-backup/inspect-pre-upgrade.log

echo ""
echo "=== Backup completato in ~/microk8s-upgrade-backup/ ==="
ls -la ~/microk8s-upgrade-backup/

# ── 0.4 Blocca gli aggiornamenti automatici ────────────────────────

sudo snap refresh --hold microk8s
# Output atteso: General refreshes of "microk8s" held indefinitely

# ── 0.5 Verifica lo spazio disco ───────────────────────────────────

df -h /var/snap/microk8s/
# Assicurati di avere almeno 5-10 GB liberi

# ── 0.6 Verifica i canali disponibili ──────────────────────────────

snap info microk8s 2>/dev/null | grep -E "1\.(29|30|31|32|33|34|35)/stable"
# Dovrebbe mostrare tutti i track da 1.29 a 1.35


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              STEP 1 — UPGRADE 1.29 → 1.30                        ║
# ║                                                                   ║
# ║  Changelog: dqlite stability fixes, containerd v1.6.28,          ║
# ║  runc v1.1.12. Nessun breaking change per i tuoi workload.       ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

# 1. Esegui l'upgrade
sudo snap refresh microk8s --channel=1.30/stable

# 2. Attendi che il cluster sia pronto (fino a 2-3 minuti)
microk8s status --wait-ready

# 3. Verifica versione
microk8s kubectl get nodes -o wide
# Output atteso: v1.30.x nella colonna VERSION

# 4. Verifica pod di sistema
microk8s kubectl get pods -n kube-system
# Tutti devono essere Running/Completed

# 5. Verifica i tuoi workload
microk8s kubectl get pods -n expenses-monitor
microk8s kubectl get pods -n default
microk8s kubectl get pods -n argocd
microk8s kubectl get pods -n monitoring

# 6. Quick smoke test
microk8s kubectl get ingress -A
# Tutti gli ingress dovrebbero avere un ADDRESS assegnato

# ⚠️ SE QUALCOSA NON FUNZIONA:
#    sudo snap revert microk8s
#    microk8s status --wait-ready
#
# ✅ Se tutto OK, prosegui allo Step 2


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              STEP 2 — UPGRADE 1.30 → 1.31                        ║
# ║                                                                   ║
# ║  Changelog: dqlite performance improvements, helm v3.14.4,       ║
# ║  cert-manager v1.14.5. Nessun breaking change.                   ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

sudo snap refresh microk8s --channel=1.31/stable
microk8s status --wait-ready
microk8s kubectl get nodes -o wide
# Atteso: v1.31.x

microk8s kubectl get pods -n kube-system
microk8s kubectl get pods -n expenses-monitor
microk8s kubectl get pods -n default
microk8s kubectl get pods -n argocd
microk8s kubectl get pods -n monitoring
microk8s kubectl get ingress -A

# ⚠️ ROLLBACK: sudo snap revert microk8s
# ✅ Se tutto OK, prosegui allo Step 3


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              STEP 3 — UPGRADE 1.31 → 1.32                        ║
# ║                                                                   ║
# ║  Changelog: calico v3.28.1, k8s-dqlite v1.3.0 (LTS),            ║
# ║  containerd v1.6.36, runc v1.1.15, cni plugins v1.6.0.          ║
# ║                                                                   ║
# ║  ⚠️ NOTA: flowcontrol.apiserver.k8s.io/v1beta3 rimosso in 1.32  ║
# ║  I tuoi manifest NON lo usano, ma i chart Helm interni           ║
# ║  potrebbero. Se ArgoCD o Prometheus non partono, serve           ║
# ║  upgrade dei chart.                                               ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

sudo snap refresh microk8s --channel=1.32/stable
microk8s status --wait-ready
microk8s kubectl get nodes -o wide
# Atteso: v1.32.x

# Verifica critica: ArgoCD e Prometheus/Grafana
# Questi usano Helm chart che potrebbero avere API deprecate in 1.32
microk8s kubectl get pods -n argocd
microk8s kubectl get pods -n monitoring

# Se qualche pod è in CrashLoopBackOff, verifica i log:
# microk8s kubectl logs -n argocd <pod-name> --previous
# microk8s kubectl logs -n monitoring <pod-name> --previous

# Verifica che i pod della tua applicazione funzionino
microk8s kubectl get pods -n expenses-monitor
microk8s kubectl get pods -n default

# Test endpoint
microk8s kubectl get ingress -A

# ⚠️ ROLLBACK: sudo snap revert microk8s
# ✅ Se tutto OK, prosegui allo Step 4


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              STEP 4 — UPGRADE 1.32 → 1.33                        ║
# ║                                                                   ║
# ║  Changelog: ingress-nginx v1.12.1, cert-manager v1.17.1,         ║
# ║  Go 1.24. Ancora NGINX come ingress.                             ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

sudo snap refresh microk8s --channel=1.33/stable
microk8s status --wait-ready
microk8s kubectl get nodes -o wide
# Atteso: v1.33.x

microk8s kubectl get pods -A | grep -v Running | grep -v Completed
# Se questa riga mostra pod, investiga prima di proseguire

microk8s kubectl get ingress -A
microk8s kubectl get pods -n expenses-monitor
microk8s kubectl get pods -n default
microk8s kubectl get pods -n argocd
microk8s kubectl get pods -n monitoring

# ⚠️ ROLLBACK: sudo snap revert microk8s
# ✅ Se tutto OK, prosegui allo Step 5


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              STEP 5 — UPGRADE 1.33 → 1.34                        ║
# ║                                                                   ║
# ║  Changelog: core base aggiornata a core22, containerd v1.7.28,   ║
# ║  runc v1.3.0, helm v3.18.6, coredns v1.12.3.                    ║
# ║                                                                   ║
# ║  ⚠️ NOTA: cambiamento della core base potrebbe richiedere più    ║
# ║  tempo per il refresh. Sii paziente.                              ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

sudo snap refresh microk8s --channel=1.34/stable
microk8s status --wait-ready
microk8s kubectl get nodes -o wide
# Atteso: v1.34.x

# La core base cambia a core22 — verifica che tutto parta correttamente
microk8s kubectl get pods -A | grep -v Running | grep -v Completed

microk8s kubectl get pods -n expenses-monitor
microk8s kubectl get pods -n default
microk8s kubectl get pods -n argocd
microk8s kubectl get pods -n monitoring
microk8s kubectl get ingress -A

# ⚠️ ROLLBACK: sudo snap revert microk8s
# ✅ Se tutto OK, prosegui allo Step 6 (lo step critico!)


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              STEP 6 — UPGRADE 1.34 → 1.35                        ║
# ║                                                                   ║
# ║  🔴 STEP CRITICO: NGINX Ingress → Traefik                       ║
# ║                                                                   ║
# ║  MicroK8s 1.35 sostituisce NGINX Ingress con Traefik.            ║
# ║  L'addon ingress ora installa Traefik con:                       ║
# ║    - IngressClass "public" (backward compatible)                  ║
# ║    - IngressClass "traefik" (standard)                            ║
# ║    - IngressClass "nginx" (compatibility layer)                   ║
# ║    - Gateway API CRDs (nuovo!)                                    ║
# ║                                                                   ║
# ║  Le tue risorse Ingress con ingressClassName: public              ║
# ║  continueranno a funzionare SENZA modifiche.                     ║
# ║                                                                   ║
# ║  ⚠️ ATTENZIONE: Le annotation nginx.ingress.kubernetes.io/*      ║
# ║  nell'ingress di ArgoCD dovranno essere migrate. Traefik le      ║
# ║  supporta tramite il provider kubernetesIngressNginx, ma         ║
# ║  verifica il comportamento.                                       ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

# ── 6.1 Pre-check: salva lo stato degli ingress ────────────────────

microk8s kubectl get ingress -A -o wide > ~/microk8s-upgrade-backup/ingresses-pre-1.35.txt
microk8s kubectl get ingressclass -o wide > ~/microk8s-upgrade-backup/ingressclass-pre-1.35.txt
cat ~/microk8s-upgrade-backup/ingresses-pre-1.35.txt

# ── 6.2 Disabilita l'addon ingress PRIMA dell'upgrade ──────────────
# (il docs MicroK8s raccomanda disable/re-enable per aggiornare addon)

microk8s disable ingress
# Attendi che NGINX venga rimosso
microk8s kubectl get pods -n ingress 2>/dev/null || echo "Namespace ingress rimosso"
microk8s kubectl get pods -n ingress-nginx 2>/dev/null || echo "Namespace ingress-nginx rimosso"

# NOTA: Gli ingress resource RESTANO nel cluster, solo il controller
# viene rimosso. Il traffico esterno smetterà di funzionare
# temporaneamente fino al re-enable.

# ── 6.3 Esegui l'upgrade a 1.35 ───────────────────────────────────

sudo snap refresh microk8s --channel=1.35/stable
microk8s status --wait-ready
microk8s kubectl get nodes -o wide
# Atteso: v1.35.x

# ── 6.4 AGGIORNA IL REPOSITORY ADDON (CRITICO!) ───────────────────
# ⚠️ SENZA QUESTO COMANDO, l'addon ingress installerà ancora NGINX!
# Il snap refresh aggiorna solo Kubernetes, NON gli addon.
# L'addon repo update scarica il codice Traefik per l'addon ingress.

sudo microk8s addons repo update core

# ── 6.5 Ri-abilita l'addon ingress (ora Traefik) ──────────────────

microk8s enable ingress
# Attendi qualche minuto per il deploy di Traefik

# Verifica che Traefik sia partito
microk8s kubectl get pods -n ingress
# Atteso: pod traefik-xxx Running

# Verifica le IngressClass create
microk8s kubectl get ingressclass
# Atteso: IngressClass "public", "traefik", "nginx"

# ── 6.5 Verifica che gli Ingress funzionino ────────────────────────

microk8s kubectl get ingress -A -o wide
# Tutti gli ingress dovrebbero avere un ADDRESS assegnato

# Verifica che i tuoi servizi rispondano
# (Potrebbe richiedere 1-2 minuti perché i certificati TLS vengano
#  negoziati e le rotte propagate)

# Test di connettività — adatta agli URL del tuo dominio:
echo "Testing backend-rust..."
curl -sk -o /dev/null -w "%{http_code}" https://api-rust.expmonitor.freeddns.org/health
echo ""

echo "Testing frontend-companion..."
curl -sk -o /dev/null -w "%{http_code}" https://expenses.expmonitor.freeddns.org
echo ""

echo "Testing keycloak..."
curl -sk -o /dev/null -w "%{http_code}" https://auth.expmonitor.freeddns.org
echo ""

echo "Testing ArgoCD..."
curl -sk -o /dev/null -w "%{http_code}" https://argocd.expmonitor.freeddns.org
echo ""

echo "Testing Grafana..."
curl -sk -o /dev/null -w "%{http_code}" https://grafana.expmonitor.freeddns.org
echo ""

# ── 6.6 Verifica specifica ArgoCD ──────────────────────────────────
# ArgoCD usa annotation nginx-specific:
#   nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
#   nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
#
# Traefik in MicroK8s 1.35 ha il provider kubernetesIngressNginx
# che dovrebbe gestirle. Ma se ArgoCD non risponde:
#
# OPZIONE A: Traefik le gestisce automaticamente → nessuna azione
# OPZIONE B: Se non funziona, rimuovi le annotation nginx-specific
#            dal values.yaml di ArgoCD e lascia solo cert-manager:
#
#   annotations:
#     cert-manager.io/cluster-issuer: letsencrypt
#
# Poi fai sync da ArgoCD o helm upgrade.

# ── 6.7 Verifica Gateway API CRDs ──────────────────────────────────

microk8s kubectl get crd | grep gateway
# Atteso:
#   gatewayclasses.gateway.networking.k8s.io
#   gateways.gateway.networking.k8s.io
#   httproutes.gateway.networking.k8s.io
#   referencegrants.gateway.networking.k8s.io

# ── 6.8 Verifica tutti i workload ──────────────────────────────────

echo "=== Pod non-Running ==="
microk8s kubectl get pods -A | grep -v Running | grep -v Completed | grep -v NAME

echo ""
echo "=== Ingress ==="
microk8s kubectl get ingress -A

echo ""
echo "=== IngressClass ==="
microk8s kubectl get ingressclass

echo ""
echo "=== PVC ==="
microk8s kubectl get pvc -A

echo ""
echo "=== Certificates (cert-manager) ==="
microk8s kubectl get certificates -A 2>/dev/null || echo "CRD certificates non trovato"

# ⚠️ ROLLBACK: sudo snap revert microk8s
#    Dopo il revert, ri-abilita il vecchio ingress:
#    microk8s enable ingress
#
# ✅ Se tutto OK, prosegui alla Fase 7


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              FASE 7 — POST-UPGRADE: REFRESH ADDON                ║
# ║                                                                   ║
# ║  MicroK8s NON aggiorna gli addon durante l'upgrade snap.         ║
# ║  Serve disable/re-enable per aggiornarli.                        ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

# ── 7.1 Aggiorna i repository addon ────────────────────────────────

sudo microk8s addons repo update core

# ── 7.2 Refresh cert-manager ───────────────────────────────────────
# ⚠️ ATTENZIONE: disabilitare cert-manager NON elimina i certificati
# TLS esistenti (sono Secret che persistono), ma il ClusterIssuer
# "letsencrypt" verrà rimosso e ricreato.

# Prima verifica lo stato corrente
microk8s kubectl get clusterissuer
microk8s kubectl get certificates -A

# Salva la config del ClusterIssuer (se personalizzata)
microk8s kubectl get clusterissuer letsencrypt -o yaml > ~/microk8s-upgrade-backup/clusterissuer-letsencrypt.yaml

# Refresh
microk8s disable cert-manager
sleep 10
microk8s enable cert-manager
sleep 30

# Verifica che il ClusterIssuer sia tornato
microk8s kubectl get clusterissuer
# Se "letsencrypt" non è presente, ricrealo dal backup:
# microk8s kubectl apply -f ~/microk8s-upgrade-backup/clusterissuer-letsencrypt.yaml

# Verifica che i certificati siano validi
microk8s kubectl get certificates -A

# ── 7.3 Refresh DNS (CoreDNS) ──────────────────────────────────────

microk8s disable dns
sleep 10
microk8s enable dns
sleep 15

# Verifica
microk8s kubectl get pods -n kube-system -l k8s-app=kube-dns

# ── 7.4 Refresh hostpath-storage ───────────────────────────────────
# ⚠️ I PVC e i dati persistono. Il disable/enable aggiorna solo
# il controller, non tocca i volumi esistenti.

microk8s disable hostpath-storage
sleep 10
microk8s enable hostpath-storage

# Verifica che i PVC siano tutti Bound
microk8s kubectl get pvc -A


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              FASE 8 — VERIFICA FINALE COMPLETA                    ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝

echo "╔══════════════════════════════════════════╗"
echo "║       VERIFICA FINALE POST-UPGRADE       ║"
echo "╚══════════════════════════════════════════╝"

echo ""
echo "=== 1. Versione cluster ==="
microk8s kubectl version --short 2>/dev/null || microk8s kubectl version

echo ""
echo "=== 2. Nodi ==="
microk8s kubectl get nodes -o wide

echo ""
echo "=== 3. Addon abilitati ==="
microk8s status --format short

echo ""
echo "=== 4. Pod non-Running (dovrebbe essere vuoto) ==="
microk8s kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded | grep -v NAME || echo "Tutti i pod sono OK!"

echo ""
echo "=== 5. Ingress ==="
microk8s kubectl get ingress -A -o wide

echo ""
echo "=== 6. IngressClass ==="
microk8s kubectl get ingressclass

echo ""
echo "=== 7. Gateway API CRDs ==="
microk8s kubectl get crd | grep gateway || echo "Gateway API CRDs non trovati"

echo ""
echo "=== 8. Certificati TLS ==="
microk8s kubectl get certificates -A 2>/dev/null || echo "CRD certificates non installato"

echo ""
echo "=== 9. PVC ==="
microk8s kubectl get pvc -A

echo ""
echo "=== 10. Servizi accessibili ==="
for url in \
  "https://api-rust.expmonitor.freeddns.org/health" \
  "https://expenses.expmonitor.freeddns.org" \
  "https://auth.expmonitor.freeddns.org" \
  "https://argocd.expmonitor.freeddns.org" \
  "https://grafana.expmonitor.freeddns.org"; do
  status=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "TIMEOUT")
  echo "  $url → $status"
done

echo ""
echo "=== 11. Network Policies ==="
microk8s kubectl get networkpolicies -n expenses-monitor

echo ""
echo "=== 12. ArgoCD Applications ==="
microk8s kubectl get applications -n argocd 2>/dev/null || echo "ArgoCD non trovato"

# ── Sblocca gli aggiornamenti automatici ────────────────────────────

# Una volta soddisfatto che tutto funzioni:
sudo snap refresh --unhold microk8s
echo "Aggiornamenti automatici riabilitati per il track 1.35/stable"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    UPGRADE COMPLETATO CON SUCCESSO! 🎉   ║"
echo "║                                          ║"
echo "║    MicroK8s: v1.29 → v1.35              ║"
echo "║    Ingress:  NGINX → Traefik            ║"
echo "║    Nuovo:    Gateway API disponibile     ║"
echo "╚══════════════════════════════════════════╝"


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              APPENDICE A — TROUBLESHOOTING                        ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝
#
# ── Pod in CrashLoopBackOff dopo un upgrade ─────────────────────────
#
#   microk8s kubectl logs -n <namespace> <pod-name> --previous
#   microk8s kubectl describe pod -n <namespace> <pod-name>
#
# ── Ingress non funziona dopo Step 6 (1.35) ────────────────────────
#
# Problema: Le annotation nginx.ingress.kubernetes.io/* non funzionano
# Soluzione: Traefik supporta le annotation nginx tramite il provider
#   kubernetesIngressNginx. Se non funziona:
#
#   1. Per force-ssl-redirect, Traefik fa redirect HTTPS di default
#      se TLS è configurato. Puoi rimuovere l'annotation.
#
#   2. Per backend-protocol: HTTP, Traefik lo gestisce automaticamente.
#      Puoi rimuovere l'annotation.
#
#   3. Se serve annotation Traefik-specific:
#      traefik.ingress.kubernetes.io/router.entrypoints: websecure
#
# ── cert-manager ClusterIssuer non ricreato ─────────────────────────
#
#   microk8s kubectl apply -f ~/microk8s-upgrade-backup/clusterissuer-letsencrypt.yaml
#
# ── Grafana senza IngressClass esplicita ────────────────────────────
#
# La tua config Grafana in manifest/monitoring/values.yaml ha
# ingressClassName commentato. Se Grafana non è raggiungibile:
#
#   1. Aggiungi ingressClassName: public ai values di Grafana
#   2. Fai sync da ArgoCD
#
# ── Network Policy blocca traffico dopo upgrade ─────────────────────
#
# Le tue network policies referenziano il namespace "ingress-nginx".
# Con Traefik, il namespace potrebbe essere "ingress".
# Verifica:
#   microk8s kubectl get pods -A | grep traefik
# Se Traefik è nel namespace "ingress", aggiorna le network policies
# in manifest/backend-rust/network-policies.yaml:
#   namespaceSelector:
#     matchLabels:
#       name: ingress    # era: ingress-nginx
#
# ── Rollback completo ──────────────────────────────────────────────
#
#   sudo snap revert microk8s
#   microk8s status --wait-ready
#   microk8s enable ingress  # se era disabilitato
#   microk8s kubectl get pods -A
#


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              APPENDICE B — POST-UPGRADE: NETWORK POLICIES         ║
# ║                                                                   ║
# ║  Dopo l'upgrade a 1.35, il namespace dell'ingress controller     ║
# ║  potrebbe cambiare da "ingress-nginx" a "ingress".               ║
# ║  Le network policies in backend-rust vanno aggiornate.           ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝
#
# 1. Verifica il namespace di Traefik:
#    microk8s kubectl get pods -A | grep traefik
#
# 2. Verifica le label del namespace:
#    microk8s kubectl get namespace ingress --show-labels
#    microk8s kubectl get namespace ingress-nginx --show-labels 2>/dev/null
#
# 3. Se il namespace è "ingress" (non "ingress-nginx"), aggiorna:
#    manifest/backend-rust/network-policies.yaml
#
#    Cambia:
#      namespaceSelector:
#        matchLabels:
#          name: ingress-nginx
#    Con:
#      namespaceSelector:
#        matchLabels:
#          name: ingress
#
# 4. Applica e committa le modifiche nel repo git
#    ArgoCD sincronizzerà automaticamente.


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                                                                   ║
# ║              APPENDICE C — TEMPO STIMATO                          ║
# ║                                                                   ║
# ╚═══════════════════════════════════════════════════════════════════╝
#
# Fase 0 (Backup):           ~10 minuti
# Step 1 (1.29 → 1.30):      ~5 minuti
# Step 2 (1.30 → 1.31):      ~5 minuti
# Step 3 (1.31 → 1.32):      ~5 minuti (verifica extra per API deprecate)
# Step 4 (1.32 → 1.33):      ~5 minuti
# Step 5 (1.33 → 1.34):      ~5 minuti (core base change, potrebbe essere più lento)
# Step 6 (1.34 → 1.35):      ~15 minuti (cambio ingress NGINX→Traefik)
# Fase 7 (Refresh addon):    ~10 minuti
# Fase 8 (Verifica finale):  ~5 minuti
#
# TOTALE STIMATO: ~65 minuti
# DOWNTIME atteso: ~2-5 minuti per step (traffico interrotto durante restart)
#                  ~10-15 minuti nello Step 6 (cambio ingress)
