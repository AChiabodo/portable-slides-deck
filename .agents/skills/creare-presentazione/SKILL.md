---
name: creare-presentazione
description: Creare o modificare una Presentazione HTML da dati (CSV/Excel/JSON) con analisi, Specifica, validazione, verifica ed esportazione. Usare quando l'utente chiede una presentazione, delle slide o un'analisi commentata.
---

Una Presentazione vive in `presentazioni/<nome>/` (dati riservati, non versionata). L'esempio completo da copiare è `esempi/vendite/`. Termini in `CONTEXT.md`.

## Flusso

1. **Dati e Analisi.** Metti i dati grezzi in `dati/`. Scrivi `analisi.py` (pandas) che calcola ogni numero e scrive `analisi.json`; esegui `python analisi.py`. Ogni valore e ogni serie dichiarano `etichetta`, `formato` (`numero` | `percentuale` | `data`, `decimali`, `unita`) e `provenienza` (`file`, `colonna`, `operazione`). Leggi l'`analisi.json` generato prima di scrivere il Commento: è l'unica fonte dei numeri.
2. **Catalogo.** Leggi i `manifest.json` in `design-system/layouts/` e `design-system/componenti/`: dicono scopo, quando usarli, zone, props e limiti. Usa solo quelli. Se serve altro, fermati e proponi l'aggiunta al Catalogo (vedi `docs/catalogo.md`) invece di improvvisare.
3. **Specifica.** Scrivi `specifica.json` come `esempi/vendite/specifica.json`: `titolo`, `slide[]` con `layout` e `zone`. Il titolo di una slide d'analisi afferma il risultato; il Commento spiega il perché.
4. **Numeri.** Nel testo scrivi `{{id}}` per ogni numero o data dell'Analisi. Cifre scritte a mano sono rifiutate; se un numero è legittimo (es. un anno) aggiungilo come testo a `numeriAmmessi`.
5. **Valida.** `node tools/cli.mjs valida presentazioni/<nome>`. Correggi la Specifica finché non passa; non toccare i limiti del Catalogo per far passare una slide. È obbligatorio prima di ogni esportazione.
6. **Verifica visiva.** `node tools/cli.mjs genera presentazioni/<nome>`, apri `dist/index.html` nel browser (o headless Edge) a 1280×720 e a 390 di larghezza; scorri ogni slide con le frecce e controlla che non ci sia testo tagliato.
7. **Esporta.** `esporta-singolo` produce `dist/presentazione.html` autonomo; `esporta-pdf` produce `dist/presentazione.pdf` (Edge; imposta `EDGE_PATH` se non è nel percorso standard).

## Regole

- Lingua predefinita `it`; nessun nome aziendale nei Temi o nei componenti.
- Nessuna risorsa esterna: font di sistema o `.woff2` locali, mai CDN.
- Non modificare `dist/`: è un artefatto generato.
