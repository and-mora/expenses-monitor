# Analisi Funzionale - Expenses Monitor

## 1. Introduzione
**Expenses Monitor** è un'applicazione web progettata per il tracciamento e l'analisi delle spese personali. Il sistema permette all'utente di registrare transazioni finanziarie, organizzarle tramite wallet e categorie, e visualizzare analisi dettagliate sull'andamento delle proprie finanze attraverso dashboard dedicate.

L'architettura attuale prevede un frontend web (Angular), un backend (in migrazione da Java Spring Boot a Rust Actix), un database relazionale (PostgreSQL) e un sistema di monitoraggio e analytics basato su Prometheus e Grafana.

## 2. Attori e User Personas
*   **Utente Finale**: L'unico attore principale interagisce con il sistema per inserire dati e consultare report.
    *   **Obiettivo**: Tenere traccia delle spese quotidiane, categorizzarle e monitorare il budget mensile e l'andamento del risparmio.

## 3. Moduli Funzionali

### 3.1 Gestione Accessi e Sicurezza
Il sistema protegge i dati utente tramite autenticazione.
*   **Login**: Accesso tramite credenziali. Il sistema supporta l'integrazione con Keycloak per la gestione dell'identità (OAuth2/OIDC) o autenticazione Basic (in fase di deprecazione/migrazione).
*   **Logout**: Terminazione sicura della sessione.

### 3.2 Gestione Wallet (Portafogli)
L'utente può gestire diversi "contenitori" finanziari per segregare le spese o i fondi.
*   **Creazione Wallet**: Possibilità di creare nuovi portafogli (es. "Contante", "Banca Intesa", "PayPal").
    *   *Dati*: Nome del wallet (univoco).
*   **Visualizzazione**: Lista dei wallet attivi.
*   **Eliminazione**: Rimozione di un wallet (con controllo di integrità se contiene pagamenti).

### 3.3 Tracciamento Spese (Payments)
Il core dell'applicazione è l'inserimento delle transazioni.
*   **Inserimento Pagamento**: Registrazione di una nuova spesa.
    *   *Dati*: Descrizione, Importo, Categoria, Merchant (Esercente), Data Contabile, Wallet di riferimento, Tag opzionali.
*   **Lista Movimenti**: Visualizzazione paginata delle ultime spese inserite.
*   **Saldo Totale**: Visualizzazione immediata del saldo complessivo calcolato dalla somma algebrica di tutte le transazioni.

### 3.4 Dashboard e Analytics (Grafana)
Il sistema delega la business intelligence a Grafana, che interroga direttamente i dati o le metriche esposte.
*   **Andamento Generale**: Visione d'insieme delle finanze nel tempo.
*   **Mese Corrente**: Focus sulle spese del mese in corso, probabilmente con breakdown per categoria per monitorare il budget.
*   **Dashboard Tematiche**:
    *   *Mezzi di Trasporto*: Analisi specifica per spese di mobilità.
    *   *Viaggi*: Aggregazione di spese legate a vacanze o trasferte.
    *   *Ticket Welfare*: Tracciamento specifico per benefit aziendali/buoni pasto.

## 4. Flusso Dati

1.  **Input**: L'utente inserisce i dati tramite l'interfaccia Angular.
2.  **Processing**: Il Backend (Rust/Java) riceve i dati, valida le regole di business (es. unicità nomi, validità date) e persiste tutto su PostgreSQL.
3.  **Storage**: PostgreSQL funge da "Source of Truth" per tutti i dati transazionali.
4.  **Analytics**: Grafana si collega alle sorgenti dati (probabilmente via query SQL dirette su Postgres o tramite esportazione di metriche) per generare grafici e report in tempo reale.

## 5. Aspetti Tecnici Rilevanti
*   **Migrazione Backend**: Il sistema è in fase di transizione verso Rust per migliorare le performance e ridurre il footprint di risorse. Le funzionalità sono state allineate per garantire che il Frontend continui a funzionare trasparentemente.
*   **Infrastruttura**: Supporto nativo per deployment su Kubernetes (k8s), con configurazioni per Secret, ConfigMap e Ingress.
*   **Monitoring Tecnico**: Oltre ai dati di business, il sistema monitora se stesso (metriche container, nodi, ArgoCD) per garantire affidabilità.
