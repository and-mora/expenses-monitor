# Testing Frontend-Backend Integration

## 🎯 Problema

Il frontend su Lovable (HTTPS cloud) non può comunicare con il backend su localhost:8080 per:
- **Same-origin policy** del browser
- **Mixed content** (HTTPS → HTTP non permesso)

## ✅ Soluzioni

---

## OPZIONE 1: Tunnel con ngrok ⭐ RACCOMANDATO

Esponi temporaneamente il backend localhost a internet.

### 1. Installa ngrok

```bash
# macOS
brew install ngrok

# Oppure scarica da https://ngrok.com/download
```

### 2. Registrati e autentica

```bash
# Vai su https://dashboard.ngrok.com/signup
# Copia il tuo authtoken
ngrok config add-authtoken <YOUR_TOKEN>
```

### 3. Avvia il backend Rust

```bash
cd backend-rust

# Avvia il server
cargo run

# Il server dovrebbe essere su http://localhost:8080
```

### 4. Crea il tunnel

```bash
# In un nuovo terminale
ngrok http 8080
```

Output:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8080
```

### 5. Configura Lovable

Nel progetto Lovable, configura la variabile d'ambiente:

```
VITE_API_BASE_URL=https://abc123.ngrok.io
```

### 6. Configura CORS nel backend

Il backend deve accettare richieste dall'origin di Lovable.

File: `backend-rust/src/startup.rs`

La configurazione attuale usa una allowlist esplicita, non un `allow_any_origin()`.
Se devi testare da un origin diverso, aggiungilo in modo esplicito:

```rust
use actix_cors::Cors;

// In run() function
let app = App::new()
    .wrap(
        Cors::default()
            .allowed_origin("http://localhost:5173")
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("https://expenses.expmonitor.freeddns.org")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                http::header::AUTHORIZATION,
                http::header::ACCEPT,
                http::header::CONTENT_TYPE,
            ])
            .max_age(3600)
    )
    // ... rest of config
```

**IMPORTANTE:** Dopo ogni riavvio di ngrok, l'URL cambia! Dovrai aggiornare `VITE_API_BASE_URL`.

### 7. Testa

```bash
# Verifica che il tunnel funzioni
curl https://abc123.ngrok.io/greet

# Dovrebbe rispondere: "Hello from backend"
```

### Pro/Contro

✅ **Pro:**
- Setup rapido (5 minuti)
- No sync/deploy necessario
- Vedi i log in tempo reale nel tuo terminale

❌ **Contro:**
- URL cambia ad ogni riavvio di ngrok
- Limitazioni free tier (40 connessioni/minuto)
- Devi tenere il tunnel attivo

---

## OPZIONE 2: Sviluppo in locale (Sync da Lovable)

Scarica il codice da Lovable e fallo girare localmente.

### 1. Scarica il progetto da Lovable

Su Lovable:
- Click su **"Download"** o **"Export to GitHub"**
- Scarica lo ZIP o clona il repo GitHub

### 2. Setup locale

```bash
# Vai nella directory del frontend
cd /path/to/lovable-project

# Installa dipendenze
npm install

# Configura env locale
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local

# Avvia frontend in dev mode
npm run dev
```

Il frontend sarà su `http://localhost:5173` (o simile)

### 3. Avvia backend

```bash
cd /path/to/backend-rust
cargo run
```

### 4. Configura CORS per localhost

File: `backend-rust/src/startup.rs`

```rust
use actix_cors::Cors;

let app = App::new()
    .wrap(
        Cors::default()
            .allowed_origin("http://localhost:5173")
            .allowed_origin("http://localhost:5174")
            .allowed_origin("http://127.0.0.1:5173")
            .allowed_origin("http://127.0.0.1:5174")
            .allowed_origin("https://expenses.expmonitor.freeddns.org")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT, http::header::CONTENT_TYPE])
            .max_age(3600)
    )
    // ... rest
```

### 5. Sviluppo

Ora puoi:
- Modificare il frontend localmente
- Vedere le modifiche in tempo reale
- Debuggare con Chrome DevTools
- Vedere i log del backend nel terminale

### 6. Sync con Lovable (opzionale)

Se vuoi riportare le modifiche su Lovable:
- Puoi copiare/incollare il codice manualmente
- O usare GitHub come intermediario

### Pro/Contro

✅ **Pro:**
- Controllo totale
- Nessun tunnel necessario
- Debug più facile
- No limiti di rate

❌ **Contro:**
- Devi sincronizzare manualmente le modifiche da/per Lovable
- Setup più lungo
- Perdi il live preview di Lovable

---

## OPZIONE 3: Deploy Backend su Cloud (per testing prolungato)

Deploy temporaneo del backend su un server pubblico.

### Opzioni Cloud

**A. Railway.app (Più semplice per Rust)**

```bash
# Installa Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend-rust
railway up
```

Railway ti darà un URL pubblico: `https://your-app.railway.app`

**B. Fly.io**

```bash
# Installa Fly CLI
brew install flyctl

# Login
fly auth login

# Deploy
cd backend-rust
fly launch
```

**C. Render.com**

- Web UI molto semplice
- Connetti il repo GitHub
- Auto-deploy ad ogni push

### Configura Lovable

```
VITE_API_BASE_URL=https://your-app.railway.app
```

### Pro/Contro

✅ **Pro:**
- URL stabile, non cambia
- Sempre disponibile
- Simula ambiente production

❌ **Contro:**
- Setup più complesso
- Potenziale costo (anche se tier free esistono)
- Devi ri-deployare per ogni modifica backend

---

## 🎯 Raccomandazione per Te

### **Per Testing Rapido (1-2 giorni):**
➡️ **OPZIONE 1 - ngrok**
- Velocissimo da configurare
- Basta tenere il tunnel attivo mentre lavori con Lovable

### **Per Sviluppo Intenso (> 1 settimana):**
➡️ **OPZIONE 2 - Sviluppo locale**
- Scarica da Lovable
- Sviluppa in locale
- Usa Lovable solo per generare nuovi componenti

### **Per Demo/Staging:**
➡️ **OPZIONE 3 - Deploy cloud**
- Backend sempre disponibile
- Puoi condividere il link Lovable con altri

---

## 🧪 Checklist di Test

Una volta collegati frontend e backend, testa:

### 1. Balance
```bash
# Nel browser console
fetch('https://your-ngrok-url.ngrok.io/api/balance', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(console.log)
```

### 2. Wallets
- [ ] Lista wallets si carica
- [ ] Crea nuovo wallet
- [ ] Errore su nome duplicato (23505)
- [ ] Elimina wallet vuoto
- [ ] Errore su wallet con payments (23503)

### 3. Payments
- [ ] Lista payments si carica
- [ ] Aggiungi expense (amount negativo)
- [ ] Aggiungi income (amount positivo)
- [ ] Le categorie si caricano dall'API
- [ ] Elimina payment
- [ ] Balance si aggiorna dopo create/delete

### 4. UI/UX
- [ ] Loading states mostrati
- [ ] Errori mostrati con toast
- [ ] Conferme prima del delete
- [ ] Amounts formattati in € (divisi per 100)
- [ ] Date nel formato italiano

### 5. CORS
- [ ] No errori CORS nella console
- [ ] Preflight requests (OPTIONS) funzionano

### 6. PSD2 / Banking
- [ ] `POST /banking/connect` returns an authorization URL for the `mock` provider
- [ ] `GET /banking/callback` stores the encrypted refresh token and marks the connection connected
- [ ] `POST /banking/sync/{connectionId}` creates or updates staging rows
- [ ] `GET /staging/transactions` filters by status/date/connection as expected
- [ ] `PUT /staging/transactions/{id}` preserves reviewed/rejected/imported decisions
- [ ] `POST /staging/import` imports reviewed rows and returns imported payment IDs

---

## ✅ Current validation status

- Frontend validation passed: `npm run lint`, `npm test`
- Platform YAML validation passed
- Backend validation passed: `cargo fmt --all --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `cargo test`
- Rollout remains blocked until `backend-rust-psd2-secrets` is provisioned with `token-encryption-key` and the runtime can reach the Keycloak discovery/JWKS endpoints

---

## 🐛 Troubleshooting

### Errore: "CORS policy: No 'Access-Control-Allow-Origin'"

**Soluzione:** Configura CORS nel backend (vedi sopra)

### Errore: "net::ERR_CONNECTION_REFUSED"

**Soluzione:** 
- Verifica che il backend sia in esecuzione
- Verifica che ngrok punti alla porta corretta
- Controlla `VITE_API_BASE_URL` in Lovable

### Errore 401 Unauthorized

**Soluzione:**
- Usa un Bearer token valido emesso da Keycloak
- Verifica `jwt-issuer`, `jwt-audience` (client ID expected in `aud` or `azp`) e che il backend possa raggiungere `/.well-known/openid-configuration` e il `jwks_uri` restituito da Keycloak
- Controlla che il client invii sempre `Authorization: Bearer <token>`

### ngrok URL cambia sempre

**Soluzione:**
- Upgrade a ngrok paid plan (URL fisso)
- O passa all'Opzione 2 (sviluppo locale)
- O usa Opzione 3 (deploy cloud)

---

## 📝 Script Helper

### start-dev-environment.sh

```bash
#!/bin/bash

# Start backend
cd backend-rust
cargo run &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start ngrok tunnel
ngrok http 8080 &
NGROK_PID=$!

echo "✅ Backend running (PID: $BACKEND_PID)"
echo "✅ Ngrok tunnel active (PID: $NGROK_PID)"
echo ""
echo "🌐 Get your ngrok URL:"
echo "   curl http://localhost:4040/api/tunnels | jq '.tunnels[0].public_url'"
echo ""
echo "⚙️  Configure in Lovable:"
echo "   VITE_API_BASE_URL=<ngrok-url>"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C
trap "kill $BACKEND_PID $NGROK_PID; exit" INT

wait
```

Uso:
```bash
chmod +x start-dev-environment.sh
./start-dev-environment.sh
```

---

## 🔐 Security Note

⚠️ **IMPORTANTE:** 
- ngrok espone il tuo localhost a internet
- Chiunque con l'URL può accedere al backend
- NON usare dati sensibili reali durante i test
- NON committare token/secrets nel codice
- Chiudi il tunnel quando non lo usi

Per produzione, implementa:
- Keycloak authentication
- Rate limiting
- Input validation
- HTTPS con certificati validi

---

## 📞 Next Steps

1. Scegli l'opzione (raccomando ngrok per iniziare)
2. Segui la guida step-by-step
3. Testa l'integrazione con la checklist
4. Se funziona, procedi con l'Iterazione 2 del prompt Lovable
5. Una volta stabile, aggiungi Keycloak (Iterazione 3)

Buon testing! 🚀
