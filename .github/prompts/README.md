# Prompt Files Management

Questa directory contiene file di prompt per guidare l'implementazione di feature complesse tramite AI agents.

## Struttura

- **Root directory**: Prompt attivi in corso di lavorazione
- **completed/**: Archivio prompt completati (mantenuti per documentazione storica)

## Naming Convention

- `plan-<featureName>.prompt.md` - Per planning di nuove features
- `fix-<bugName>.prompt.md` - Per bug fix complessi
- `refactor-<componentName>.prompt.md` - Per refactoring strutturali

## Workflow

1. **Crea** il file di prompt nella root con il plan dettagliato
2. **Lavora** sulla feature usando il prompt come guida
3. **Aggiorna** il file con status e note implementative
4. **Sposta** in `completed/` quando la feature è completata e testata

## Best Practices

- ✅ Non eliminare i prompt completati - servono come documentazione
- ✅ Aggiungi metadata (date, PR link, decisioni) nei prompt completati
- ✅ Mantieni i prompt concisi ma con dettagli sufficienti per context
- ✅ Includi riferimenti a file e linee di codice specifiche
- ✅ Documenta decisioni implementative e trade-off considerati

## Esempio Metadata

```markdown
<!-- STATUS: COMPLETED - 2026-02-02 -->
<!-- RELATED PR: #123 -->
<!-- TESTED: ✅ Backend (44/44 pass) | ✅ Frontend (406/417 pass) -->
```
