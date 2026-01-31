# 📋 Snippet per Integrare expense-companion nella CD Pipeline

## 🎯 Analisi Infrastruttura Esistente

### Struttura Attuale
- **Repository**: `expenses-monitor` (monorepo)
- **Pipeline**: `.github/workflows/cd-pipeline.yml`
- **Deploy**: Kubernetes via ArgoCD
- **Registry**: GHCR (GitHub Container Registry)
- **Pattern**: Semantic versioning per folder

### Componenti Esistenti
1. `backend/` → Java backend
2. `backend-rust/` → Rust backend
3. `frontend/` → Angular frontend (VECCHIO)
4. `database/` → PostgreSQL
5. `monitoring/` → Grafana/Prometheus

---

## 📦 SNIPPET 1: Aggiungere al cd-pipeline.yml

### 1.1 - Aggiungere Semantic Versioning Job

Aggiungi nel job `SemanticVersioning` dopo gli outputs esistenti:

```yaml
# Nel job SemanticVersioning, sotto outputs:
frontend_companion_changed: ${{ steps.frontend-companion-versioning.outputs.changed }}
frontend_companion_version_tag: ${{ steps.frontend-companion-versioning.outputs.version_tag }}
```

E aggiungi lo step dopo `Frontend Version`:

```yaml
      - name: Frontend Companion Version
        id: frontend-companion-versioning
        uses: paulhatch/semantic-version@a8f8f59fd7f0625188492e945240f12d7ad2dca3 #v5.4.0
        with:
          change_path: "expense-companion"
          namespace: frontend-companion
          major_pattern: "breaking"
          minor_pattern: "feat"
```

### 1.2 - Aggiungere Jobs di Release, Build e Deploy

Aggiungi alla fine del file, dopo `ArgoCDAppsDeploy`:

```yaml
  FrontendCompanionRelease:
    needs: SemanticVersioning
    uses: ./.github/workflows/release.yml
    with:
      tag: ${{needs.SemanticVersioning.outputs.frontend_companion_version_tag}}
      enabled: ${{needs.SemanticVersioning.outputs.frontend_companion_changed}}

  FrontendCompanionBuildAndPush:
    needs: [ SemanticVersioning, FrontendCompanionRelease ]
    uses: ./.github/workflows/build-push-workflow.yml
    with:
      version: ${{needs.SemanticVersioning.outputs.frontend_companion_version_tag}}
      enabled: ${{needs.SemanticVersioning.outputs.frontend_companion_changed}}
      folder: expense-companion
    secrets: inherit
```

---

## 📦 SNIPPET 2: Aggiornare build-push-workflow.yml

Nel file `.github/workflows/build-push-workflow.yml`, aggiungi `expense-companion` alle opzioni:

```yaml
      folder:
        description: 'Component'
        required: true
        default: 'backend'
        type: choice
        options:
          - backend
          - frontend
          - backend-rust
          - expense-companion  # <-- AGGIUNGI QUESTA LINEA
```

---

## 📦 SNIPPET 3: Creare Manifest Kubernetes

### 3.1 - Copiare expense-companion nella root del monorepo

```bash
# Dalla root del monorepo expenses-monitor
cp -r /Users/andrea.morabito/IdeaProjects/expense-companion ./expense-companion
```

### 3.2 - Creare manifest/frontend-companion/

```bash
mkdir -p manifest/frontend-companion
```

### File: `manifest/frontend-companion/manifest.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: frontend-companion
  name: frontend-companion
  namespace: expenses-monitor
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend-companion
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: frontend-companion
    spec:
      volumes:
        - configMap:
            name: frontend-companion-nginx-config
          name: nginx-config
      containers:
        - image: ghcr.io/and-mora/expenses-monitor:v0.1.0-expense-companion
          name: frontend-companion
          volumeMounts:
            - mountPath: "/etc/nginx/conf.d"
              name: nginx-config
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
      automountServiceAccountToken: false

---

apiVersion: v1
kind: Service
metadata:
  labels:
    app: frontend-companion
  name: frontend-companion
  namespace: expenses-monitor
spec:
  internalTrafficPolicy: Cluster
  ipFamilies:
    - IPv4
  ipFamilyPolicy: SingleStack
  ports:
    - port: 80
      protocol: TCP
      targetPort: 80
  selector:
    app: frontend-companion
  sessionAffinity: None
  type: ClusterIP

---

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
  name: frontend-companion
  namespace: expenses-monitor
spec:
  ingressClassName: public
  rules:
    - host: expenses.expmonitor.freeddns.org
      http:
        paths:
          - backend:
              service:
                name: frontend-companion
                port:
                  number: 80
            path: /
            pathType: Prefix
  tls:
    - hosts:
      - expenses.expmonitor.freeddns.org
      secretName: frontend-companion-tls
```

### File: `manifest/frontend-companion/default.conf`

Copia la versione ottimizzata già creata:

```bash
cp expense-companion/nginx.conf manifest/frontend-companion/default.conf
```

Oppure usa versione semplificata come il frontend attuale:

```properties
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
    
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    error_page   500 502 503 504  /50x.html;
}
```

### File: `manifest/frontend-companion/kustomization.yaml`

```yaml
namespace: expenses-monitor
resources:
  - manifest.yaml
configMapGenerator:
  - name: frontend-companion-nginx-config
    files:
      - default.conf
generatorOptions:
  disableNameSuffixHash: true
```

---

## 📦 SNIPPET 4: Aggiornare ArgoCD Apps

File: `manifest/argocd-apps/helm/values.yaml`

Aggiungi dopo l'applicazione `frontend`:

```yaml
    frontend-companion:
      project: default
      source:
        repoURL: https://github.com/and-mora/expenses-monitor.git
        path: manifest/frontend-companion
        targetRevision: HEAD
      destination:
        server: https://kubernetes.default.svc
        namespace: expenses-monitor
```

---

## 📦 SNIPPET 5: Aggiornare Dockerfile expense-companion

Assicurati che il Dockerfile sia compatibile con il build-push-workflow (che supporta multi-platform):

File: `expense-companion/Dockerfile`

```dockerfile
# Multi-stage build for expense-companion frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_KEYCLOAK_URL=https://auth.expmonitor.freeddns.org
ARG VITE_KEYCLOAK_REALM=expenses-monitor
ARG VITE_KEYCLOAK_CLIENT_ID=expenses-monitor-frontend
ARG VITE_API_BASE_URL=https://api-rust.expmonitor.freeddns.org
ARG VITE_USE_MOCK_DATA=false
ARG VITE_SOURCEMAPS=false

# Set environment variables for build
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK_DATA=$VITE_USE_MOCK_DATA
ENV VITE_SOURCEMAPS=$VITE_SOURCEMAPS

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine3.20 AS runtime

EXPOSE 80

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check (sarà sovrascritto dalla ConfigMap in K8s)
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
```

---

## 🚀 PROCEDURA DI DEPLOY

### Passo 1: Preparazione Repository

```bash
# 1. Vai alla root del monorepo
cd /Users/andrea.morabito/IdeaProjects/expenses-monitor

# 2. Copia expense-companion nel monorepo
cp -r /Users/andrea.morabito/IdeaProjects/expense-companion ./expense-companion

# 3. Crea directory manifest
mkdir -p manifest/frontend-companion

# 4. Crea i file manifest (usa gli snippet sopra)
```

### Passo 2: Commit e Push

```bash
# Aggiungi i file
git add expense-companion/
git add manifest/frontend-companion/
git add .github/workflows/cd-pipeline.yml
git add .github/workflows/build-push-workflow.yml
git add manifest/argocd-apps/helm/values.yaml

# Commit con convenzione semantic versioning
git commit -m "feat(frontend-companion): add new React frontend with Vite

- Add expense-companion React/Vite frontend
- Configure CD pipeline with semantic versioning
- Add Kubernetes manifests for deployment
- Configure ArgoCD application
- Integrate with existing infrastructure"

# Push
git push origin master
```

### Passo 3: Verifica Pipeline

```bash
# La pipeline partirà automaticamente e:
# 1. Rileverà i cambiamenti in expense-companion/
# 2. Genererà un tag semantico (es: v0.1.0-expense-companion)
# 3. Builderà l'immagine Docker (multi-platform)
# 4. Pushare l'immagine su GHCR
# 5. ArgoCD sincronizzerà il deployment

# Monitora la pipeline su GitHub Actions
# https://github.com/and-mora/expenses-monitor/actions
```

### Passo 4: Verifica Deploy su Kubernetes

```bash
# Verifica che il pod sia running
kubectl get pods -n expenses-monitor -l app=frontend-companion

# Verifica il service
kubectl get svc -n expenses-monitor frontend-companion

# Verifica l'ingress
kubectl get ingress -n expenses-monitor frontend-companion

# Verifica i logs
kubectl logs -n expenses-monitor -l app=frontend-companion --tail=50

# Test healthcheck
kubectl exec -n expenses-monitor -it <pod-name> -- curl localhost/health
```

### Passo 5: Accesso all'Applicazione

```bash
# L'app sarà disponibile su:
# https://expenses.expmonitor.freeddns.org

# Assicurati che il DNS punti al tuo cluster
```

---

## 🔍 DIFFERENZE CON FRONTEND ANGULAR ESISTENTE

| Aspetto | Frontend Angular | Frontend Companion (React) |
|---------|------------------|----------------------------|
| **Framework** | Angular 18 | React 18 + Vite |
| **Path** | `frontend/` | `expense-companion/` |
| **Domain** | expmonitor.freeddns.org | expenses.expmonitor.freeddns.org |
| **Namespace** | frontend | frontend-companion |
| **Tag Pattern** | `v0.11.1-frontend` | `v0.1.0-expense-companion` |
| **Build Tool** | Angular CLI | Vite |
| **Node Version** | 22.14.0 | 20 |

---

## ⚠️ NOTE IMPORTANTI

1. **DNS**: Configura `expenses.expmonitor.freeddns.org` prima del deploy
2. **TLS**: Let's Encrypt genererà automaticamente il certificato
3. **Keycloak**: Assicurati che il client `expenses-monitor-frontend` esista
4. **API**: Backend Rust deve essere raggiungibile da `api-rust.expmonitor.freeddns.org`
5. **Semantic Versioning**: Usa commit messages convenzionali:
   - `feat:` per minor version bump
   - `fix:` per patch version bump
   - `breaking:` per major version bump

---

## 🎯 CHECKLIST PRE-DEPLOY

- [ ] Copiato expense-companion nel monorepo
- [ ] Creati manifest in `manifest/frontend-companion/`
- [ ] Aggiornato `cd-pipeline.yml`
- [ ] Aggiornato `build-push-workflow.yml`
- [ ] Aggiornato `values.yaml` di ArgoCD
- [ ] Verificato Dockerfile multi-platform
- [ ] DNS configurato
- [ ] Keycloak client configurato
- [ ] Test locali passano (`npm test`)
- [ ] Commit con messaggio semantic

---

**Pronto per il deploy! 🚀**
