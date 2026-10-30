# Catalogo

Il Catalogo è l'insieme di Layout, Componenti, Temi e lingue che una Specifica può usare. Aggiungere un elemento non richiede modifiche al motore (`tools/`): basta una cartella con manifest, markup e stile.

Le radici del Catalogo sono `design-system/` e, per prove o estensioni locali, ogni cartella passata con `--catalogo <cartella>` (ripetibile). Ogni radice può contenere `layouts/`, `componenti/`, `temi/` e `lingue/`. Un nome già definito è un errore.

## Componente

`componenti/<nome>/` con `manifest.json`, `render.mjs` (export default) e `stile.css` (opzionale). Il nome usa solo `a-z`, `0-9`, `-`.

```json
{
  "nome": "citazione",
  "scopo": "Una frase in evidenza.",
  "quandoUsarlo": "Per una frase che il pubblico deve ricordare.",
  "props": { "testo": { "tipo": "testo", "obbligatoria": true, "maxParole": 30 } }
}
```

Tipi di prop:

| tipo | Specifica | `render` riceve |
|------|-----------|-----------------|
| `testo` | testo con `{{id}}` | HTML già con segnaposto risolti ed escape |
| `valore` | id di un valore dell'Analisi | `{ etichetta, testo }`, escape già fatto |
| `serie` | id di una serie dell'Analisi | dati grezzi `{ etichetta, punti: [{ etichetta, valore, testo }] }` |
| `lista` | elenco di oggetti con `elementi` (e `min`, `max`) | elenco di oggetti con le prop dell'elemento risolte |

Limiti: `maxParole` (testo), `maxPunti` (serie), `min`/`max` (lista). I limiti sono parte del Catalogo e il validatore li impone.

`render(props, { esc, t, id })` restituisce una stringa HTML. **Le `serie` arrivano grezze: ogni etichetta va passata da `esc`.** `t('chiave')` legge le stringhe della lingua (`lingue/<codice>.json`): nessun testo italiano nei componenti. `id` è univoco per slide e componente (per `aria-labelledby`, ecc.).

## Layout

`layouts/<nome>/` con `manifest.json`, `render.mjs` e `stile.css` (opzionale). Il manifest dichiara `zone`; ogni zona ha `nome` e `tipo`:

- `testo`: `maxParole`;
- `elenco`: `minVoci`, `maxVoci`, `maxParoleVoce`;
- `componenti`: `ammessi` (nomi di componenti), `min`, `max`.

Esattamente una zona ha `"ruolo": "titolo"` (tipo `testo`, obbligatoria): il motore la rende come `<hN id="slide-N-titolo">` (`livelloTitolo`, predefinito 2). `maxParoleSlide` limita il totale della slide. `render({ zone, t, id })` riceve l'HTML di ogni zona (vuoto se assente) e restituisce il contenuto della slide.

Le slide sono contenitori 16:9 con `container-type: inline-size`: dimensiona il testo con `em`/`cqw` e usa `@container` per adattare il layout alla larghezza (vedi `componenti/kpi/stile.css`).

## Tema

`temi/<nome>/tema.json`: `variabili` (proprietà CSS senza `--`, es. `colore-carta`) e `contrasti`, coppie di variabili colore verificate contro WCAG AA (rapporto ≥ 4,5:1). Un Tema sotto soglia è rifiutato dal validatore.

## Lingua

`lingue/<codice>.json`: `ui`, `grafici` e `formato` (`separatoreDecimale`, `separatoreMigliaia`, `separatoreUnita`, `suffissoPercentuale`, `data`). Si seleziona con il campo `lingua` della Specifica.

## Dopo l'aggiunta

Aggiungi un test in `tests/` con `creaCatalogo` (vedi `tests/catalogo-e-export.test.mjs`) e lancia `npm test`.
