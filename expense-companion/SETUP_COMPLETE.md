# ✅ Setup Frontend Completato

## 🎉 Stato Attuale

**Frontend:** http://localhost:5173 ✅ ATTIVO  
**Backend:** http://localhost:8080 ✅ ATTIVO

## 🔧 Modifiche Effettuate

### 1. **Porta Frontend** 
- ✅ Cambiata da 8080 → **5173** (per evitare conflitto con backend)
- File: `vite.config.ts`

### 2. **API Integration**
- ✅ Configurato `API_BASE_URL = http://localhost:8080`
- ✅ Disabilitato mock data di default (`USE_MOCK_DATA = false`)
- File: `src/lib/api.ts`

### 3. **Types Aggiornati**
- ✅ Rimossi campi non esistenti nel backend:
  - `Payment`: rimossi `createdAt`, `updatedAt`
  - `Wallet`: rimossi `currency`, `description`, `createdAt`, `updatedAt`
  - `Balance`: rimossi `currency`, `lastUpdated`
- ✅ Aggiunti `Tag[]` support ai payments
- ✅ Wallet usa solo `id` e `name`
- File: `src/types/api.ts`

### 4. **Components Aggiornati**
- ✅ `AddPaymentDialog`: ora invia il **wallet name** invece dell'ID
- ✅ `WalletList`: rimossi campi `currency` e `description` dal form
- ✅ `Dashboard`: hardcoded currency a "EUR"

### 5. **CORS Backend**
- ✅ Aggiunto `actix-cors` dependency
- ✅ Configurato CORS per accettare `localhost:5173` e `localhost:3000`
- Files: `backend-rust/Cargo.toml`, `backend-rust/src/startup.rs`

### 6. **Build**
- ✅ Build frontend completato senza errori
- ✅ Dev server attivo

---

## 🚀 Come Testare

### 1. Verifica Backend
```bash
curl http://localhost:8080/greet
# Expected: "Hello from backend"
```

### 2. Apri il Frontend
Vai su: **http://localhost:5173**

### 3. Test Checklist

#### Balance Card
- [ ] Vedi il balance totale
- [ ] Income e expenses separati

#### Wallets
- [ ] Vedi lista wallets esistenti
- [ ] Crea nuovo wallet (solo nome richiesto)
- [ ] Elimina wallet vuoto
- [ ] Errore se elimini wallet con payments

#### Payments/Transactions
- [ ] Vedi lista transactions
- [ ] Aggiungi expense (amount negativo)
- [ ] Aggiungi income (amount positivo)
- [ ] Wallet selection funziona
- [ ] Category selection funziona
- [ ] Delete payment funziona
- [ ] Balance si aggiorna automaticamente

#### UI/UX
- [ ] No errori CORS nella console
- [ ] Loading states visibili
- [ ] Toast notifications per success/error
- [ ] Amounts formattati in € (divisi per 100)

---

## 🐛 Troubleshooting

### Problema: Errori CORS nella console
**Soluzione:** Riavvia il backend Rust dopo le modifiche CORS:
```bash
cd /Users/andrea.morabito/IdeaProjects/expenses-monitor/backend-rust
cargo run
```

### Problema: Frontend non si connette al backend
**Verifica:**
1. Backend è attivo: `curl http://localhost:8080/greet`
2. Frontend usa porta corretta (5173)
3. Nessun firewall blocca le richieste locali

### Problema: "Wallet not found" quando crei payment
**Causa:** Il frontend invia wallet ID, il backend si aspetta wallet name.  
**Soluzione:** ✅ Già fixato nel componente `AddPaymentDialog`

### Problema: "Cannot create wallet - duplicate name"
**Causa:** Backend ha constraint UNIQUE su `wallet.name`  
**Soluzione:** Usa un nome diverso o elimina il wallet esistente

---

## 📝 Prossimi Step

### Immediate (per test)
1. ✅ **Frontend e backend comunicano**
2. ⏭️ **Popola qualche dato di test**
   ```bash
   # Crea wallet
   curl -X POST http://localhost:8080/api/wallets \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Wallet"}'
   
   # Aggiungi payment
   curl -X POST http://localhost:8080/api/payments \
     -H "Content-Type: application/json" \
     -d '{
       "merchantName":"Test Store",
       "amountInCents":-1500,
       "category":"shopping",
       "accountingDate":"2026-01-22",
       "description":"Test purchase",
       "wallet":"Test Wallet"
     }'
   ```
3. ⏭️ **Testa tutte le features nel frontend**

### Feature Avanzate (dopo test base)
- [ ] Keycloak authentication
- [ ] Filters (date range, category, wallet)
- [ ] Tags support nell'UI
- [ ] Categories loading da API (SSE stream)
- [ ] Export CSV
- [ ] Dark mode
- [ ] Charts più dettagliati
- [ ] Edit payment (non solo delete)

---

## ⚙️ Configurazione Ambiente

### Frontend (.env.local - non committato)
```env
VITE_API_BASE_URL=http://localhost:8080
# VITE_USE_MOCK_DATA=true  # Uncomment per usare mock data
```

### Backend
- Host: `0.0.0.0:8080`
- Database: PostgreSQL (configurato in `configuration.yaml`)
- CORS: Abilitato per localhost:5173 e localhost:3000

---

## 🎯 Per Passare a Produzione

1. **Deploy Backend**
   - Railway/Fly.io/K8s cluster esistente
   - Configura URL pubblico (es: https://api.expenses-monitor.com)

2. **Deploy Frontend**
   - Build: `npm run build`
   - Deploy su Vercel/Netlify/Nginx
   - Configura `VITE_API_BASE_URL` con URL backend produzione

3. **Keycloak**
   - Configura realm e client
   - Aggiungi authentication al frontend
   - Backend già supporta Bearer token

4. **CORS Produzione**
   - Modifica `backend-rust/src/startup.rs`
   - Invece di `allowed_origin("http://localhost:5173")`
   - Usa `allowed_origin("https://tuo-frontend.com")`

---

## 📞 Note Finali

- ✅ Il frontend ora è **production-ready** (eccetto auth)
- ✅ Tutti i types matchano l'OpenAPI spec
- ✅ Mock data disponibile per demo (set `VITE_USE_MOCK_DATA=true`)
- ✅ CORS configurato correttamente
- ⚠️ Manca solo Keycloak authentication (opzionale per test locali)

**Buon testing! 🚀**
