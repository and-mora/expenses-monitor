# Server-Side Filters Implementation Plan

## Overview
Implementazione di filtri server-side per la pagina Transactions, sostituendo l'attuale approccio client-side che opera solo sui dati della pagina corrente.

### Obiettivi
- Permettere ricerca e filtro su tutto il database, non solo sui 50 record caricati
- Migliorare le performance con query SQL ottimizzate e indici
- Mantenere backward compatibility con API esistente
- UX fluida con debounce e loading states

### Limitazioni Attuali
- Filtri operano solo su max 50 transazioni per pagina
- Impossibile cercare/filtrare nell'intero storico
- Paginazione non sensibile ai filtri attivi

---

## Backend Tasks (Rust)

### 1. Definire struttura query parameters
**File**: `backend-rust/src/routes/payment.rs`

**Obiettivo**: Creare struttura per deserializzare parametri query da HTTP request

**Implementazione**:
```rust
#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PaymentQueryParams {
    #[serde(default)]
    page: i64,
    #[serde(default = "default_page_size")]
    size: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    search: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    wallet: Option<String>,
}

fn default_page_size() -> i64 {
    50
}
```

**Test**:
- Deserializzazione corretta con tutti i parametri
- Deserializzazione con parametri opzionali mancanti
- CamelCase conversion (searchQuery → search)

---

### 2. Modificare query SQL con filtri dinamici
**File**: `backend-rust/src/routes/payment.rs` - funzione `get_recent_payments_from_db`

**Obiettivo**: Costruire query SQL dinamica con WHERE clause basata sui filtri attivi

**Implementazione**:
```rust
async fn get_recent_payments_from_db(
    connection_pool: &PgPool,
    params: &PaymentQueryParams,
) -> Result<Vec<PaymentResponseDto>, Error> {
    let mut query = String::from(
        "SELECT p.id, p.category, p.description, p.merchant_name, 
                p.accounting_date, p.amount, w.name as wallet_name
         FROM expenses.payments p
         LEFT JOIN expenses.wallets w ON p.wallet_id = w.id"
    );
    
    let mut conditions = Vec::new();
    
    // Search filter (merchant_name OR description ILIKE)
    if let Some(search) = &params.search {
        conditions.push(format!(
            "(p.merchant_name ILIKE '%{}%' OR p.description ILIKE '%{}%')", 
            search, search
        ));
    }
    
    // Category filter
    if let Some(category) = &params.category {
        conditions.push(format!("p.category = '{}'", category));
    }
    
    // Wallet filter
    if let Some(wallet) = &params.wallet {
        conditions.push(format!("w.name = '{}'", wallet));
    }
    
    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }
    
    query.push_str(" ORDER BY p.accounting_date DESC LIMIT $1 OFFSET $2");
    
    // Execute with sqlx::query!
    // ... rest of implementation
}
```

**Considerazioni**:
- Usare parametri bound ($1, $2, etc.) invece di string interpolation per SQL injection safety
- ILIKE per case-insensitive search (PostgreSQL specific)
- LEFT JOIN con wallets per permettere filtro per nome wallet
- Mantenere ORDER BY accounting_date DESC

**Test**:
- Query senza filtri (comportamento default)
- Search filter solo
- Category filter solo
- Wallet filter solo
- Combinazioni multiple di filtri
- Case-insensitivity della search
- SQL injection attempts (security)

---

### 3. Aggiornare endpoint handler
**File**: `backend-rust/src/routes/payment.rs` - funzione `get_recent_payments`

**Obiettivo**: Modificare signature per accettare nuovi parametri e passarli al database

**Implementazione**:
```rust
#[tracing::instrument(name = "Retrieve recent payments", skip(connection_pool))]
pub async fn get_recent_payments(
    params: web::Query<PaymentQueryParams>,
    connection_pool: web::Data<PgPool>,
) -> impl Responder {
    let offset = params.page * params.size;

    match get_recent_payments_from_db(connection_pool.deref(), &params).await {
        Ok(payments) => {
            let response = PagedResponse {
                content: payments,
                page: params.page,
                size: params.size,
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            tracing::error!("Failed to execute query: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
```

**Test**:
- Endpoint risponde correttamente a tutti i parametri
- Logging appropriato con tracing
- Error handling per query fallite

---

### 4. Test integrazione filtri
**File**: `backend-rust/tests/api/payments.rs`

**Obiettivo**: Verificare funzionamento end-to-end dei filtri

**Test Cases**:
```rust
#[tokio::test]
async fn test_filter_by_category() {
    // Setup: create payments with different categories
    // Act: GET /api/payments?category=food
    // Assert: only food category returned
}

#[tokio::test]
async fn test_filter_by_wallet() {
    // Setup: create payments in different wallets
    // Act: GET /api/payments?wallet=Main%20Account
    // Assert: only payments from Main Account
}

#[tokio::test]
async fn test_search_by_merchant() {
    // Setup: create payments with different merchants
    // Act: GET /api/payments?search=supermarket
    // Assert: merchants matching search returned
}

#[tokio::test]
async fn test_search_case_insensitive() {
    // Setup: payment with merchant "SuperMarket"
    // Act: GET /api/payments?search=supermarket
    // Assert: payment found despite case difference
}

#[tokio::test]
async fn test_combined_filters() {
    // Act: GET /api/payments?category=food&wallet=Main&search=super
    // Assert: only records matching ALL filters
}

#[tokio::test]
async fn test_pagination_with_filters() {
    // Setup: 100 records, 60 in "food" category
    // Act: page 0, page 1 with category=food, size=50
    // Assert: correct pagination of filtered results
}
```

**Helper**: Usare `spawn_app()` esistente per setup test DB

---

### 5. Aggiungere indici database
**File**: `backend-rust/migrations/YYYYMMDDHHMMSS_add_payment_indexes.sql`

**Obiettivo**: Ottimizzare performance delle query con filtri

**Migration SQL**:
```sql
-- Index for category filter
CREATE INDEX idx_payments_category ON expenses.payments(category);

-- Index for merchant_name search (supports ILIKE with pg_trgm)
CREATE INDEX idx_payments_merchant_name ON expenses.payments USING gin(merchant_name gin_trgm_ops);

-- Index for description search
CREATE INDEX idx_payments_description ON expenses.payments USING gin(description gin_trgm_ops);

-- Composite index for common query pattern (date DESC for ordering)
CREATE INDEX idx_payments_date_desc ON expenses.payments(accounting_date DESC);

-- Index for wallet_id (already exists via FK, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_payments_wallet_id ON expenses.payments(wallet_id);
```

**Considerazioni**:
- GIN index con pg_trgm per ILIKE performance su text fields
- Potrebbe richiedere estensione PostgreSQL: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- Monitorare impatto su INSERT/UPDATE performance (trade-off)

**Test**:
- Migration up/down funziona correttamente
- EXPLAIN ANALYZE mostra uso degli indici nelle query

---

## Frontend Tasks (React)

### 6. Aggiornare API client
**File**: `expense-companion/src/lib/api.ts` - metodo `getPayments`

**Obiettivo**: Costruire query string con parametri di filtro

**Implementazione**:
```typescript
async getPayments(
  page = 0, 
  size = 50,
  filters?: {
    search?: string;
    category?: string;
    wallet?: string;
  }
): Promise<{ content: Payment[], page: number, size: number }> {
  if (USE_MOCK_DATA) {
    // Mock filtering logic
    let filtered = [...mockPayments];
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.merchantName.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters?.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    
    if (filters?.wallet) {
      filtered = filtered.filter(p => p.wallet === filters.wallet);
    }
    
    const sorted = filtered.sort((a, b) => 
      new Date(b.accountingDate).getTime() - new Date(a.accountingDate).getTime()
    );
    
    const start = page * size;
    const end = start + size;
    return {
      content: sorted.slice(start, end),
      page,
      size,
    };
  }
  
  // Build query string
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.wallet) params.append('wallet', filters.wallet);
  
  return this.fetch<{ content: Payment[], page: number, size: number }>(
    `/api/payments?${params.toString()}`
  );
}
```

**Test**:
- Query string costruita correttamente
- Mock data filtering funziona in development
- Encoding corretto per caratteri speciali

---

### 7. Modificare hook usePayments
**File**: `expense-companion/src/hooks/use-api.ts`

**Obiettivo**: Passare filtri all'API e includerli nella query key

**Implementazione**:
```typescript
export function usePayments(
  page = 0, 
  size = 50,
  filters?: {
    search?: string;
    category?: string;
    wallet?: string;
  }
) {
  return useQuery({
    queryKey: ['payments', page, size, filters?.search, filters?.category, filters?.wallet],
    queryFn: () => apiClient.getPayments(page, size, filters),
    staleTime: 30000, // 30 seconds
  });
}
```

**Considerazioni**:
- Query key include tutti i filtri per cache invalidation corretta
- Ogni cambio di filtro trigghera nuova query
- StaleTime previene richieste eccessive durante navigazione

**Test**:
- Cache invalidation quando cambiano filtri
- Query non duplicata con stessi parametri
- Loading state gestito correttamente

---

### 8. Refactoring pagina Transactions
**File**: `expense-companion/src/pages/Transactions.tsx`

**Obiettivo**: Rimuovere filtri client-side e passare parametri a usePayments

**Implementazione**:
```typescript
const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);

  // Prepare filters object (convert 'all' to undefined)
  const filters = {
    search: searchQuery || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    wallet: selectedWallet !== 'all' ? selectedWallet : undefined,
  };

  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(
    currentPage, 
    PAGE_SIZE, 
    filters
  );
  
  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();

  const payments = paymentsData?.content || [];

  // REMOVE: filteredPayments useMemo - no longer needed!
  
  // Reset page to 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory, selectedWallet]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedWallet('all');
    setCurrentPage(0);
  };

  // ... rest of component uses `payments` directly instead of `filteredPayments`
}
```

**Modifiche**:
- ❌ Rimuovere `filteredPayments` useMemo
- ✅ Passare filtri direttamente a `usePayments`
- ✅ Reset page a 0 quando cambiano filtri (useEffect)
- ✅ Usare `payments` direttamente nel render

**Test**:
- Filtri applicati correttamente
- Paginazione resetta quando cambiano filtri
- Clear filters funziona
- Loading state visualizzato durante fetch

---

### 9. Debounce per search input
**File**: `expense-companion/src/pages/Transactions.tsx` (o nuovo hook `useDebounce`)

**Obiettivo**: Evitare API calls eccessive durante digitazione

**Implementazione**:
```typescript
// Custom hook (optional, può essere inline)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// In Transactions component:
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 400); // 400ms delay

const filters = {
  search: debouncedSearch || undefined, // Use debounced value
  category: selectedCategory !== 'all' ? selectedCategory : undefined,
  wallet: selectedWallet !== 'all' ? selectedWallet : undefined,
};
```

**UX Enhancement**:
- Mostrare spinner/indicatore nel search input durante debounce
- Clear button nel search input
- Visual feedback quando filtri sono attivi

**Test**:
- Debounce funziona (no API call per ogni keystroke)
- API chiamata dopo delay corretto
- Clear search resetta debounce
- Loading indicator appare durante ricerca

---

### 10. Aggiornare tests
**File**: `expense-companion/src/pages/Transactions.test.tsx`

**Obiettivo**: Verificare che filtri vengano passati all'API invece di applicati client-side

**Modifiche**:
```typescript
// Mock apiClient.getPayments con parametri filtro
vi.mocked(apiClient.getPayments).mockImplementation(
  async (page, size, filters) => {
    // Mock implementation che rispetta i filtri
    let data = [...mockPayments];
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      data = data.filter(p => 
        p.merchantName.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters?.category) {
      data = data.filter(p => p.category === filters.category);
    }
    
    return {
      content: data.slice(page * size, (page + 1) * size),
      page,
      size,
    };
  }
);

// Test che verifica chiamata API con parametri corretti
it('should pass search query to API', async () => {
  renderTransactions();
  
  const searchInput = screen.getByPlaceholderText(/search/i);
  await user.type(searchInput, 'supermarket');
  
  await waitFor(() => {
    expect(apiClient.getPayments).toHaveBeenCalledWith(
      0, 
      50, 
      expect.objectContaining({ search: 'supermarket' })
    );
  });
});
```

**Test Cases**:
- Search query passata all'API
- Category filter passata all'API
- Wallet filter passata all'API
- Filtri combinati passati insieme
- Page reset quando cambiano filtri
- Debounce funziona nei test (fake timers)

---

## Documentazione

### 11. Aggiornare OpenAPI specification
**File**: `docs/openapi.yaml`

**Obiettivo**: Documentare nuovi query parameters nell'endpoint payments

**Aggiornamento**:
```yaml
/api/payments:
  get:
    summary: Get paginated payments with optional filters
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 0
        description: Page number (0-indexed)
      - name: size
        in: query
        schema:
          type: integer
          default: 50
        description: Number of items per page
      - name: search
        in: query
        schema:
          type: string
        description: Case-insensitive search in merchant name and description
      - name: category
        in: query
        schema:
          type: string
        description: Filter by exact category match
      - name: wallet
        in: query
        schema:
          type: string
        description: Filter by wallet name
    responses:
      200:
        description: Paginated list of payments
        content:
          application/json:
            schema:
              type: object
              properties:
                content:
                  type: array
                  items:
                    $ref: '#/components/schemas/Payment'
                page:
                  type: integer
                size:
                  type: integer
```

**Note**:
- Filters use AND logic (all must match)
- Search is case-insensitive (ILIKE)
- Empty/missing filters are ignored
- Pagination works with filtered results

---

## Testing End-to-End

### 12. Test manuali completi
**Obiettivo**: Verificare funzionamento completo in ambiente realistico

**Scenari di Test**:

1. **Dataset Grande**
   - Setup: Database con >1000 transazioni
   - Test: Performance di ricerca e filtri
   - Aspettativa: Risposta < 500ms

2. **Filtro Singolo**
   - Search: "super" → trova "Supermarket", "Super Store"
   - Category: "food" → solo transazioni food
   - Wallet: "Main Account" → solo da quel wallet

3. **Filtri Combinati**
   - Category=food + Search="restaurant"
   - Category=transport + Wallet="Cash"
   - Tutti e 3 i filtri insieme

4. **Edge Cases**
   - Search con caratteri speciali: "café", "50% off"
   - Category inesistente → nessun risultato
   - Wallet con spazi nel nome
   - Search string molto lunga (>100 chars)

5. **UX/Performance**
   - Debounce search: digitare velocemente, 1 sola API call
   - Loading indicator appare durante fetch
   - Paginazione funziona con filtri attivi
   - Clear filters resetta tutto correttamente
   - Browser back/forward con query params (future)

6. **Accessibility**
   - Screen reader annuncia risultati filtrati
   - Keyboard navigation funziona
   - Focus management appropriato

**Checklist**:
- [ ] Performance accettabile con 1000+ records
- [ ] Case-insensitive search funziona
- [ ] Filtri combinati AND logic corretta
- [ ] Pagination con filtri attivi corretta
- [ ] Loading states chiari
- [ ] Error handling (API down, query timeout)
- [ ] Mobile responsive
- [ ] Browser compatibility (Chrome, Firefox, Safari)

---

## Rollout Plan

### Fase 1: Backend (1-2 giorni)
1. Implementare query params e SQL dinamica
2. Aggiungere test integrazione
3. Deploy su staging
4. Verify con Postman/curl

### Fase 2: Database (0.5 giorni)
1. Creare migration per indici
2. Testare su staging database
3. Monitorare performance con EXPLAIN ANALYZE
4. Deploy su production (off-peak hours)

### Fase 3: Frontend (1-2 giorni)
1. Aggiornare API client e hooks
2. Refactoring pagina Transactions
3. Implementare debounce
4. Aggiornare test

### Fase 4: Testing & Deploy (1 giorno)
1. Test end-to-end su staging
2. Performance testing con dataset reale
3. Smoke test su production
4. Monitor logs e metriche (Grafana)

### Fase 5: Documentation (0.5 giorni)
1. Aggiornare OpenAPI spec
2. Update README se necessario
3. Add migration guide per API consumers

**Tempo Totale Stimato**: 5-6 giorni lavorativi

---

## Metriche di Successo

### Performance
- Query time con filtri < 500ms (p95)
- Time to interactive < 2s
- API response size < 100KB per page

### Functional
- Ricerca trova tutte le transazioni nel DB (non solo pagina corrente)
- Filtri applicabili a dataset di 10,000+ transazioni
- Zero regressioni nei test esistenti

### UX
- Debounce riduce API calls del 70%+
- Loading states chiari in < 100ms
- Feedback visivo per filtri attivi

---

## Rischi e Mitigazioni

### Rischio 1: Performance degradation con dataset molto grandi
**Mitigazione**: 
- Indici database appropriati
- Limite hard-coded su result set (max 10,000?)
- Monitoring query performance in production

### Rischio 2: SQL injection via search parameter
**Mitigazione**:
- Usare parametri bound in sqlx (già safe)
- Input validation/sanitization
- Security audit prima del deploy

### Rischio 3: Breaking change per API consumers
**Mitigazione**:
- Parametri sono opzionali (backward compatible)
- Versioning API se necessario
- Communication con team che usano API

### Rischio 4: Cache invalidation issues
**Mitigazione**:
- Query keys corrette in React Query
- Test coverage per cache behavior
- Monitoring cache hit rate

---

## Future Enhancements

1. **Date Range Filter**
   - From/To date inputs
   - Preset ranges (last 7 days, this month, etc.)

2. **Advanced Search**
   - Search in tags
   - Amount range filter
   - Multiple categories (OR logic)

3. **Saved Filters**
   - User can save filter combinations
   - Quick access to common filters

4. **URL Query Params**
   - Filters reflected in URL
   - Shareable filtered views
   - Browser back/forward support

5. **Export Filtered Results**
   - CSV/PDF export di risultati filtrati
   - Include metadata (filters applied, date range)

6. **Full-Text Search**
   - PostgreSQL ts_vector/ts_query
   - Fuzzy matching con Levenshtein distance

---

## Notes

- Questo documento sarà aggiornato durante l'implementazione
- Ogni task completato va marcato con ✅ nella todo list
- Issues/blockers vanno documentati in sezione dedicata
- Performance metrics raccolte durante testing vanno aggiunte

**Status**: 📋 Planning Phase
**Last Updated**: 2026-02-01
**Owner**: Development Team
