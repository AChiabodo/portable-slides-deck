---
name: creare-presentazione
description: Creare o modificare una Presentazione HTML da dati (CSV/Excel/JSON) con analisi, Specifica, validazione, verifica ed esportazione. Usare quando l'utente chiede una presentazione, delle slide o un'analisi commentata.
---

Una Presentazione vive in `presentazioni/<nome>/` (dati riservati, non versionata) e si crea con `node tools/cli.mjs nuova <nome>`. L'esempio completo è `esempi/vendite/`. Termini in `CONTEXT.md`.

## Flusso

0. **Crea la Presentazione.** `node tools/cli.mjs nuova <nome>` crea `presentazioni/<nome>/` (il nome usa `a-z`, `0-9`, `-`) con `dati/`, un `analisi.py` da completare, un `analisi.json` vuoto e una `specifica.json` con la sola copertina: è già valida. Non creare a mano queste cartelle e non copiare l'esempio: parti sempre dallo scaffold. Se la cartella esiste già, il comando rifiuta e non tocca nulla: in quel caso modifica i file esistenti.
1. **Dati e Analisi.** Metti i dati grezzi in `dati/`. Completa `analisi.py` (pandas) perché calcoli ogni numero e scriva `analisi.json`; esegui `python analisi.py`. Ogni valore e ogni serie dichiarano `etichetta`, `formato` (`numero` | `percentuale` | `data`, `decimali`, `unita`) e `provenienza` (`file`, `colonna`, `operazione`). Leggi l'`analisi.json` generato prima di scrivere il Commento: è l'unica fonte dei numeri.
2. **Catalogo.** Leggi i `manifest.json` in `design-system/layouts/` e `design-system/componenti/`: dicono scopo, quando usarli, zone, props e limiti (elenco in `docs/catalogo.md`). Usa solo quelli. Se serve altro, fermati e proponi l'aggiunta al Catalogo invece di improvvisare.
3. **Specifica.** Estendi `specifica.json` (modello completo: `esempi/vendite/specifica.json`): `titolo`, `tema` (uno dei Temi in `design-system/temi/`), `slide[]` con `layout` e `zone`. Il titolo di una slide d'analisi afferma il risultato; il Commento spiega il perché. Una presentazione tipica: copertina, indice, una o più slide d'analisi, messaggio o punti-chiave, chiusura.
3b. **Regolazioni (facoltative).** Parti dall'aspetto predefinito: aggiungi una Regolazione solo quando serve davvero a leggere meglio (un grafico più alto, una colonna più larga, un ordine diverso). Si scrivono nel campo `regolazioni` della slide o del Componente, mai tra le prop: es. `"regolazioni": { "rapporto-colonne": "2-1", "ordine": "invertito" }`. Le ammesse sono nel `manifest.json` (`regolazioni`) e in `docs/catalogo.md#regolazioni`: elenchi chiusi, il validatore rifiuta il resto. Per colonne a larghezza o ordine liberi usa `due-colonne` / `tre-colonne` (senza grafici a barre e linee in `due-colonne`, senza grafici in `tre-colonne`: la colonna è stretta). `"sfondo": "enfasi"` evidenzia una slide chiave con i colori di copertina: usala per una o due slide, non per tutte. `evidenzia` mette in risalto un punto di un grafico (l'etichetta deve esistere nella serie). Non servono per far entrare più contenuto: i limiti dei manifest restano.
4. **Numeri.** Nel testo scrivi `{{id}}` per ogni numero o data dell'Analisi. Cifre scritte a mano sono rifiutate; se un numero è legittimo (es. un anno) aggiungilo come testo a `numeriAmmessi`.
5. **Valida.** `node tools/cli.mjs valida presentazioni/<nome>`. Correggi la Specifica finché non passa; non toccare i limiti del Catalogo per far passare una slide. È obbligatorio prima di ogni esportazione.
6. **Verifica visiva.** `node tools/cli.mjs anteprima presentazioni/<nome>` genera `dist/anteprime/slide-NN.png` con Edge headless (1280×760, com'è in presentazione); `--slide=N` rifà una sola slide. **Guarda le immagini**: cerca testo tagliato, grafici illeggibili, colonne troppo strette; se una Regolazione peggiora la slide, tornane al predefinito. Per la lettura a 390 di larghezza apri `dist/index.html` nel browser (o headless Edge).
7. **Esporta.** `esporta-singolo` produce `dist/presentazione.html` autonomo; `esporta-pdf` produce `dist/presentazione.pdf` (Edge; imposta `EDGE_PATH` se non è nel percorso standard).

## Regole

- Lingua predefinita `it`; nessun nome aziendale nei Temi o nei componenti.
- Nessuna risorsa esterna: font di sistema o `.woff2` locali, mai CDN.
- Non modificare `dist/`: è un artefatto generato.
