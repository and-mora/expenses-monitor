<!-- STATUS: COMPLETED -->
<!-- NOTE: Questo prompt ha guidato modifiche iniziali. Alcune features sono state completate in altri prompt successivi. -->

# Plan: Modifiche Frontend Expense-Companion

Tre miglioramenti per expense-companion: correzione bug reset data, nuova pagina Transactions con filtri, e fix calcolo bilancio corretto dalla homepage.

## Steps

1. **Correggere il reset della data in "Add Another"** - In [expense-companion/src/components/dashboard/QuickEntry.tsx](expense-companion/src/components/dashboard/QuickEntry.tsx#L140), modificare la logica alla riga 140 per preservare `accountingDate` invece di resettarla a `new Date()` quando si clicca "Add & Add Another"

2. **Creare la pagina Transactions** - Aggiungere route `/transactions` in [App.tsx](expense-companion/src/App.tsx#L32-L35), creare nuovo componente `Transactions.tsx` in [pages/](expense-companion/src/pages/), e rendere funzionale il `NavItem` "Transactions" in [Header.tsx](expense-companion/src/components/layout/Header.tsx#L37) collegandolo alla nuova route

3. **Implementare filtri e ricerca nella pagina Transactions** - Nel nuovo componente Transactions, aggiungere UI per filtri (date range, categoria, wallet), search input per merchant/description, e riutilizzare [TransactionList](expense-companion/src/components/dashboard/TransactionList.tsx) per visualizzare i risultati con tags già supportati tramite [PaymentTags](expense-companion/src/components/dashboard/PaymentTags.tsx)

4. **Correggere il calcolo del bilancio nella Dashboard** - In [Dashboard.tsx](expense-companion/src/components/dashboard/Dashboard.tsx#L107-L111), utilizzare `balance.totalInCents` dal hook `useBalance()` invece del `totalInCents` calcolato localmente dalle 50 transazioni recenti per mostrare il bilancio totale corretto

5. **Gestire la paginazione** - Nella nuova pagina Transactions, implementare controlli di paginazione utilizzando i parametri `page` e `size` dell'API `/api/payments` esistente

## Further Considerations

1. **Finestra temporale bilancio** - Vuoi che la homepage mostri il bilancio totale dall'inizio (usando `/api/balance`) o preferisci aggiungere un filtro per gli ultimi 30 giorni? L'API attuale restituisce il totale completo.

2. **Income/Expenses cards** - Nella Dashboard, mantenere il calcolo di income/expenses dalle 50 transazioni recenti per le statistiche "Recent Activity", o calcolarli anche loro sul totale/periodo filtrato?

3. **Backend filtri** - L'API `/api/payments` potrebbe richiedere estensioni per supportare filtri avanzati (date range, categoria, wallet, search). Verificare se questi filtri esistono già nel backend Rust o vanno implementati?
