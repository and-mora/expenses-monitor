# 🔧 Gestione Variabili d'Ambiente - expense-companion

## 📋 Riepilogo

Con **Vite**, le variabili d'ambiente sono **compilate nel bundle JavaScript** al momento del build - non sono variabili runtime.

## ✅ Strategia Adottata: ARG Defaults nel Dockerfile

### Source of Truth Unica
Tutti i defaults di produzione sono definiti nel **Dockerfile**:

```dockerfile
ARG VITE_KEYCLOAK_URL=https://auth.expmonitor.freeddns.org
ARG VITE_KEYCLOAK_REALM=expenses-monitor
ARG VITE_KEYCLOAK_CLIENT_ID=expenses-monitor-frontend
ARG VITE_API_BASE_URL=https://api.expmonitor.freeddns.org
ARG VITE_USE_MOCK_DATA=false
ARG VITE_SOURCEMAPS=false
```

### Vantaggi
- ✅ Una sola source of truth
- ✅ Build Docker e locale usano stessi defaults
- ✅ Nessuna duplicazione di configurazione
- ✅ Meno file da mantenere

## 🎯 Come Funziona

### 1. Build Docker (Produzione)
```bash
# Usa i defaults dal Dockerfile
docker build -t expense-companion .

# Oppure override specifici
docker build \
  --build-arg VITE_API_BASE_URL=https://staging-api.example.com \
  -t expense-companion:staging .
```

### 2. Sviluppo Locale
```bash
# Crea .env.local per override locali
cp .env.example .env.local

# Modifica per il tuo ambiente
# VITE_API_BASE_URL=http://localhost:8080
# VITE_USE_MOCK_DATA=true

npm run dev
```

### 3. Build Locale
```bash
# Usa .env.local se presente, altrimenti usa defaults interni di Vite
npm run build

# Per simulare produzione
npm run build --mode production
```

## 📊 Gerarchia di Precedenza

Quando fai `npm run build`:

1. **Hardcoded in Vite** (se presenti in `vite.config.ts`)
2. **.env.local** (se esiste, gitignored)
3. **.env** (se esiste)
4. **Defaults in codice** (fallback in `src/lib/env.ts`)

Quando fai `docker build`:

1. **--build-arg** (massima precedenza)
2. **ARG defaults nel Dockerfile** (se --build-arg non passato)
3. **Nessun altro file** (.env.* sono ignorati in Docker)

## 🚫 File Rimossi

- ❌ `.env.production` - Rimosso per evitare duplicazione
- ❌ Configurazione separata per produzione

## ✅ File Mantenuti

- ✅ `.env.example` - Template per sviluppatori
- ✅ `.env.local` - Solo per sviluppo locale (gitignored)
- ✅ `Dockerfile` ARG - Defaults di produzione

## 🔄 Workflow Tipici

### Developer che inizia
```bash
# 1. Clone repo
git clone ...

# 2. Copia template per sviluppo locale
cp .env.example .env.local

# 3. Personalizza per ambiente locale
vim .env.local

# 4. Start development
npm run dev
```

### Build Docker per Deploy
```bash
# Pipeline CI/CD fa automaticamente
docker build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/and-mora/expenses-monitor:v0.1.0-expense-companion \
  ./expense-companion

# Usa i defaults dal Dockerfile
```

### Override per Staging
```bash
# Build separato per staging con valori diversi
docker build \
  --build-arg VITE_API_BASE_URL=https://staging-api.expmonitor.freeddns.org \
  -t expense-companion:staging \
  .
```

## ⚠️ Nota Importante: Vite Build-Time Variables

Le variabili `VITE_*` sono **sostituite nel codice** durante il build:

```typescript
// Questo codice:
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// Diventa dopo il build:
const apiUrl = "https://api.expmonitor.freeddns.org";
```

**Conseguenze**:
- ✅ Non servono variabili d'ambiente a runtime
- ✅ Bundle è self-contained
- ❌ Non puoi cambiare config dopo il build
- ❌ ConfigMap K8s non funziona per variabili Vite

## 🎯 Best Practices

### ✅ Fai
- Usa `.env.local` per sviluppo locale
- Commita `.env.example` come documentazione
- Configura ARG defaults nel Dockerfile per produzione
- Usa `--build-arg` per override quando necessario

### ❌ Non Fare
- Non creare `.env.production` (duplicazione inutile)
- Non mettere secrets nei defaults (usa secrets management)
- Non aspettarti che ConfigMap K8s cambi variabili Vite
- Non commitare `.env.local` (è gitignored)

## 🔐 Gestione Secrets

Per secrets (API keys, tokens):
- ✅ Usa Kubernetes Secrets
- ✅ Passa via --build-arg in pipeline sicure
- ✅ Usa secret management tools (Vault, etc.)
- ❌ Non metterli mai in defaults pubblici

## 📚 Riferimenti

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker ARG vs ENV](https://docs.docker.com/engine/reference/builder/#arg)
- [12-Factor App Config](https://12factor.net/config)

---

**Strategia**: Semplice, chiara, una sola source of truth! 🎯
