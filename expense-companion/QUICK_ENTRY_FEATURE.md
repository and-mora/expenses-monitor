# Quick Entry Feature - Inserimento Veloce Spese

## Descrizione
Feature implementata per velocizzare l'inserimento di multiple spese con gli stessi parametri (tag, categoria, wallet).

## Caso d'uso
Perfetto per inserire spese di un viaggio che hanno tutte lo stesso tag per identificare il viaggio. Evita di dover reinserire ripetutamente gli stessi dati.

## Come funziona

### Due modalità di submit:

1. **"Add Transaction"** (comportamento normale)
   - Inserisce la spesa
   - Chiude il dialog
   - Reset completo del form
   
2. **"Add & Add Another"** (nuovo - inserimento veloce)
   - Inserisce la spesa
   - **Mantiene il dialog aperto**
   - **Preserva**: tag, categoria, wallet, tipo (expense/income)
   - **Resetta**: merchant name, amount, description, data (imposta oggi)

## Esempio di utilizzo

### Scenario: Inserimento spese viaggio
1. Apri il dialog "Add Transaction"
2. Seleziona categoria "travel"
3. Aggiungi tag "viaggio-parigi"
4. Inserisci prima spesa: "Hotel - €150"
5. Clicca **"Add & Add Another"** 👈
6. Il dialog resta aperto con categoria e tag preservati
7. Inserisci seconda spesa: "Ristorante - €45"
8. Clicca **"Add & Add Another"** 👈
9. Continua ad inserire altre spese...
10. Quando hai finito, clicca "Add Transaction" per chiudere

## Benefici
- ⚡ Riduce drasticamente il tempo per inserire multiple spese simili
- 🎯 Mantiene consistenza nei tag e categorie
- 🔄 Flusso di lavoro fluido senza interruzioni
- ✨ Esperienza utente migliorata

## File modificati
- `src/components/dashboard/AddPaymentDialog.tsx` - Implementazione logica
- `src/components/dashboard/AddPaymentDialog.test.tsx` - Test coverage completo

## Testing
Tutti i test passano, inclusi:
- Preservazione di tag, categoria e wallet con "Add & Add Another"
- Inserimento sequenziale di multiple spese
- Comportamento normale con "Add Transaction"
