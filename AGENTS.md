## Presentazioni HTML

Progetto per creare Presentazioni HTML da dati, con pipeline `analisi.json` + `specifica.json` → validazione sul Catalogo → HTML. Termini del dominio in `CONTEXT.md`; decisione di fondo in `docs/adr/0001-specifica-come-fonte-di-verita.md`.

- Per creare o modificare una Presentazione usa la skill `creare-presentazione`; una nuova parte da `node tools/cli.mjs nuova <nome>`.
- Per aggiungere un Layout, Componente, Tema o lingua leggi `docs/catalogo.md`.
- Comandi: `node tools/cli.mjs <nuova|valida|genera|esporta-singolo|esporta-pdf> <cartella>`; test: `npm test`. Nessuna dipendenza npm. Python solo per gli script `analisi.py`.
- I numeri non li scrive mai l'agente: vengono dall'Analisi (`{{id}}`). Il validatore rifiuta ogni numero scritto a mano che non sia in `numeriAmmessi`.
- Lavora solo con i Layout e i Componenti del Catalogo; se ne serve uno nuovo, proponilo come aggiunta al Catalogo invece di improvvisare nella singola Presentazione.
- Le Presentazioni reali stanno in `presentazioni/` (ignorata da git: dati riservati); l'esempio versionato è `esempi/vendite/`.

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/` (no git remote configured). See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
