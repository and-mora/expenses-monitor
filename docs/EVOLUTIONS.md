# Evoluzioni Future - Expenses Monitor

Basandosi sull'analisi architetturale e funzionale del sistema attuale, sono stati identificati alcuni pain point e aree di miglioramento. Di seguito vengono proposte soluzioni e nuove feature per evolvere l'applicazione.

## 1. Pain Points Attuali

*   **Inserimento Dati Manuale**: L'utente deve registrare ogni singola spesa manualmente. Questo è oneroso ("friction") e soggetto a errori o dimenticanze.
*   **Analisi "Reattiva"**: Le dashboard mostrano cosa è successo in passato, ma non aiutano proattivamente a pianificare il futuro o a evitare di sforare il budget prima che accada.
*   **Mancanza di Automazione**: Spese ricorrenti (affitto, abbonamenti) devono essere inserite ogni volta o gestite manualmente.

## 2. Proposte di Evoluzione

### A. Automazione e Integrazione Dati (Obiettivo: Zero Manual Entry)
Ridurre drasticamente il tempo dedicato all'inserimento dati.

*   **Integrazione Conti Bancari (PSD2)**:
    *   Utilizzare un provider Open Banking (es. **GoCardless** o **Nordigen**) che offre API gratuite per developer.
    *   Il backend Rust, tramite un job schedulato su Kubernetes, interroga l'API bancaria periodicamente per scaricare le nuove transazioni.
    *   Le transazioni vengono salvate in una tabella di "staging" per essere riviste o importate direttamente se riconosciute.

*   **Importazione CSV Intelligente**:
    *   Implementare un endpoint per l'upload di estratti conto (CSV/XLSX).
    *   **Smart Matching**: Un algoritmo classifica le righe importate suggerendo Categoria e Merchant basandosi sullo storico.
    *   Interfaccia di "Riconciliazione" nel frontend per confermare le proposte.

*   **Gestione Ricorrenze**:
    *   Sfruttare **K8s CronJobs** per generare automaticamente transazioni periodiche (es. affitto, abbonamenti) senza intervento manuale.

### B. Esperienza Utente (UX/UI)
Migliorare l'accessibilità e la velocità d'uso.

*   **Mobile First / PWA**: Ottimizzare il frontend per l'uso da smartphone, permettendo l'inserimento "al volo".
*   **Quick Actions**: Widget per inserire spese frequenti con un solo tap.

### C. Intelligenza Artificiale
Utilizzare i dati storici per fornire insight.

*   **Smart Categorization**: Suggerire automaticamente la categoria e il merchant quando si inserisce una nuova spesa.

### D. Architettura
Sfruttare l'infrastruttura Kubernetes esistente per aggiungere valore.

*   **K8s CronJobs**: Implementare le spese ricorrenti e i backup tramite CronJob nativi di Kubernetes.
*   **Scalabilità**: Definire Horizontal Pod Autoscalers (HPA) anche se il carico è basso, a scopo didattico.
*   **GitOps**: Continuare a migliorare le automazioni di deploy (ArgoCD è già menzionato nelle dashboard).

## 3. Roadmap Consigliata

1.  **Fase 1 (Automation)**: Gestione Spese Ricorrenti su K8s.
2.  **Fase 2 (UX)**: Ottimizzazione Mobile e PWA.
3.  **Fase 3 (Data Entry)**: Import CSV con Smart Matching.
4.  **Fase 4 (Advanced)**: Integrazione PSD2 (Open Banking).
