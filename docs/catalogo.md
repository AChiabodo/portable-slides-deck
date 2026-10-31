# Catalogo

Il Catalogo è l'insieme di Layout, Componenti, Temi e lingue che una Specifica può usare. Aggiungere un elemento non richiede modifiche al motore (`tools/`): basta una cartella con manifest, markup e stile.

Le radici del Catalogo sono `design-system/` e, per prove o estensioni locali, ogni cartella passata con `--catalogo <cartella>` (ripetibile). Ogni radice può contenere `layouts/`, `componenti/`, `temi/` e `lingue/`. Un nome già definito è un errore.

## Catalogo di partenza

| Layout | Quando usarlo | Zone principali |
|--------|---------------|-----------------|
| `copertina` | prima slide | titolo, sottotitolo |
| `indice` | agenda subito dopo la copertina | titolo, voci (2-6, max 6 parole) |
| `sezione` | separatore tra le parti | titolo, sottotitolo |
| `risultato-grafico-commento` | evidenza dei dati: KPI, grafico, commento | titolo, kpi, grafico, commento |
| `punti-chiave` | argomento senza grafico | titolo, punti (2-5) |
| `confronto` | due situazioni affiancate | titolo, intestazione e voci (1-4) per sinistra e destra |
| `messaggio` | una frase da ricordare | titolo (etichetta), messaggio, fonte |
| `chiusura` | ultima slide, decisioni | titolo, passi (1-5) |
| `dashboard-analisi` | cruscotto: grafico o tabella con KPI laterali, commento e nota | occhiello, titolo, principale (1-2), kpi, commento, nota |
| `griglia-schede` | 2-6 concetti in schede numerate | occhiello, titolo, introduzione, schede, nota |
| `percorso-fasi` | processo in fasi consecutive | occhiello, titolo, introduzione, fasi (flusso), dettaglio |
| `confronto-affiancato` | due pannelli ricchi di componenti | titolo, intestazione e componenti per sinistra e destra, conclusione |
| `sintesi` | conclusioni: messaggio e KPI su pannello scuro, punti numerati | occhiello, titolo, messaggio, kpi, punti (2-5) |
| `sommario-esecutivo` | prima pagina per chi decide: messaggi, KPI, raccomandazione | occhiello, titolo, identita (scheda-dati), kpi, messaggi (2-4), raccomandazione |
| `decisione` | una scelta da approvare, con opzioni e raccomandazione | occhiello, titolo, richiesta, contesto, evidenze (kpi, scheda-dati), opzioni (opzioni-decisione), raccomandazione |
| `stato-avanzamento` | stato di un progetto: semafori, workstream, KPI | occhiello, titolo, complessivo (semaforo), workstream (semaforo, barra-avanzamento; 1-2), kpi, commento, nota |
| `timeline-milestone` | milestone nel tempo con azioni aperte | occhiello, titolo, introduzione, timeline, dettaglio (nota, barra-avanzamento, elenco-azioni; 0-2) |
| `rischi-matrice` | rischi per probabilità e impatto, con mitigazioni | occhiello, titolo, matrice (matrice-rischi), mitigazioni (2-5) |
| `tabella-ampia` | una tabella a tutta larghezza (dati, criteri, azioni) | occhiello, titolo, tabella (tabella-serie, criteri-esito, elenco-azioni), nota, fonte |
| `esperimento` | PoC o prova: ipotesi, metodo, risultato, conclusione | occhiello, titolo, ipotesi, metodo, risultato (1-2 tra grafici, criteri-esito, kpi, tabella-serie), conclusione, dati (scheda-dati) |
| `cartella-appendice` | apertura scura dell'appendice, con l'elenco dei contenuti | titolo, sottotitolo, contenuti (1-6); l'occhiello è fisso |

Componenti: `kpi`, `grafico-barre`, `grafico-linee` (1-3 linee), `tabella-serie` (1-5 colonne, una serie ciascuna), `schede` (2-6), `flusso` (2-5 passi), `nota`, più i componenti per avanzamento, decisioni e report:

| Componente | Che cosa mostra | Convenzione |
|------------|-----------------|-------------|
| `grafico-ciambella` | composizione di un totale (max 6 punti) | archi proporzionali ai soli valori positivi; si stampa il `testo` dell'Analisi, mai una percentuale ricalcolata |
| `grafico-cascata` | dal valore iniziale al finale tramite variazioni (max 8 punti) | primo punto = iniziale, ultimo = finale, in mezzo le variazioni; il segno non è solo colore |
| `timeline` | 2-7 milestone su un asse in scala di data | le date sono valori di tipo `data` dell'Analisi; sotto 600px diventa verticale |
| `matrice-rischi` | 1-8 rischi su griglia 3x3 | probabilità e impatto sono `scelta` `livello`; la gravità si legge anche dai numeri e dalla legenda |
| `barra-avanzamento` | 1-6 avanzamenti | la barra si riempie solo se il valore ha formato `percentuale` |
| `semaforo` | 1-8 voci con stato e nota | stato sempre con icona e testo |
| `opzioni-decisione` | 2-4 opzioni con vantaggi e svantaggi | una sola `raccomandata` (convenzione di stile, non vincolo del motore) |
| `elenco-azioni` | 1-6 azioni con responsabile, scadenza e stato | la scadenza è un valore `data` dell'Analisi |
| `scheda-dati` | 2-8 coppie etichetta-valore (identità di progetto o esperimento) | testo libero; per i numeri usare `kpi` |
| `criteri-esito` | 1-6 criteri con soglia, risultato misurato ed esito | il risultato è un valore dell'Analisi; l'esito è un giudizio dichiarato |

Temi: `quiet-editorial` (carta e grazie), `cobalto` (bianco e blu, senza grazie), `executive` (fondo grigio-blu, schede bianche, accento petrolio, copertina blu notte), `istituzionale` (serif, blu scuro e oro, spigoli netti), `laboratorio` (indaco, trama a griglia, numeri in monospazio), `programma` (verde petrolio, angoli molto arrotondati), `officina` (scuro, accento ciano, trama a griglia; in PDF è stampato scuro). Ogni slide di contenuto ha una cornice comune: barra in alto e piè di pagina con titolo della Presentazione (`data-titolo` sulla `<section>`) e numero. I limiti esatti sono nei `manifest.json`.

La Presentazione dimostrativa `esempi/catalogo-demo/` usa ogni Layout e ogni Componente nuovo: serve da riferimento per le Specifiche e da prova visiva dei Temi.

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
| `valore` | id di un valore dell'Analisi | `{ etichetta, testo, numero, formato }`, escape già fatto; `numero` è il valore grezzo (per le date, la stringa AAAA-MM-GG) e `formato` è `numero`, `percentuale` o `data` |
| `serie` | id di una serie dell'Analisi | dati grezzi `{ etichetta, punti: [{ etichetta, valore, testo }] }` |
| `scelta` | una delle `opzioni` del manifest (con `vocabolario`) | `{ valore, testo }`, con il testo tradotto da `scelte.<vocabolario>.<opzione>` |
| `lista` | elenco di oggetti con `elementi` (e `min`, `max`) | elenco di oggetti con le prop dell'elemento risolte |

Limiti: `maxParole` (testo), `maxPunti` (serie), `min`/`max` (lista). I limiti sono parte del Catalogo e il validatore li impone.

Una `scelta` si dichiara come `{ "tipo": "scelta", "opzioni": ["a", "b"], "vocabolario": "stato" }` (almeno 2 opzioni) e il validatore rifiuta ogni valore fuori elenco. Vocabolari: `stato` (completato, in-linea, a-rischio, in-ritardo, non-avviato), `esito` (superato, parziale, non-superato), `livello` (basso, medio, alto), `ruolo-opzione` (raccomandata, alternativa). Le etichette stanno in `lingue/<codice>.json` sotto `scelte`; ogni nuova opzione le richiede in tutte le lingue (un test lo verifica). Gli stati si disegnano con `assets/stato.mjs` (`badgeStato`, `iconaStato`): mai solo colore, sempre icona e testo. Sono giudizi dichiarati dall'autore, non calcolati (vedi `docs/adr/0002-stati-come-giudizi-dichiarati.md`).

`render(props, { esc, t, id })` restituisce una stringa HTML. **Le `serie` arrivano grezze: ogni etichetta va passata da `esc`.** `t('chiave')` legge le stringhe della lingua (`lingue/<codice>.json`): nessun testo italiano nei componenti. `id` è univoco per slide e componente (per `aria-labelledby`, ecc.).

## Layout

`layouts/<nome>/` con `manifest.json`, `render.mjs` e `stile.css` (opzionale). Il manifest dichiara `zone`; ogni zona ha `nome` e `tipo`:

- `testo`: `maxParole`;
- `elenco`: `minVoci`, `maxVoci`, `maxParoleVoce`;
- `componenti`: `ammessi` (nomi di componenti), `min`, `max`.

Esattamente una zona ha `"ruolo": "titolo"` (tipo `testo`, obbligatoria): il motore la rende come `<hN id="slide-N-titolo">` (`livelloTitolo`, predefinito 2). `maxParoleSlide` limita il totale della slide. `render({ zone, t, id })` riceve l'HTML di ogni zona (vuoto se assente) e restituisce il contenuto della slide.

Le slide sono contenitori 16:9 con `container-type: inline-size`: dimensiona il testo con `em`/`cqw` e usa `@container` per adattare il layout alla larghezza (vedi `componenti/kpi/stile.css`).

## Regolazioni

Una **Regolazione** è una scelta da elenco chiuso che cambia disposizione, ordine o dimensione di un Layout o di un Componente senza toccare contenuto o numeri (vedi `docs/adr/0003-regolazioni-chiuse-e-additive.md`). Il manifest le dichiara in `regolazioni`:

```json
"regolazioni": {
  "rapporto-colonne": { "valori": ["3-2", "1-1", "2-1"], "predefinito": "3-2" },
  "rapporto": { "valori": ["1-1", "2-1"], "predefinito": "1-1", "richiede": { "zona": "principale", "min": 2 } }
}
```

- `valori` (almeno 2, solo `a-z`, `0-9`, `-`) e `predefinito`: il predefinito deve riprodurre l'aspetto che il Layout o il Componente aveva prima della Regolazione.
- `richiede` (solo Layout): la Regolazione ha senso solo se la zona di componenti indicata ne contiene almeno `min`. Il validatore rifiuta un valore diverso dal predefinito se la condizione non è soddisfatta.
- Non servono traduzioni: una Regolazione non è testo mostrato. `regolazioni` è un nome riservato e non può essere una prop.

La Specifica le scrive in un campo `regolazioni`, separato da `zone` e dalle prop, sulla slide e sul Componente:

```json
{ "layout": "dashboard-analisi",
  "regolazioni": { "rapporto-colonne": "2-1" },
  "zone": { "principale": [{ "componente": "grafico-barre", "serie": "…", "regolazioni": { "altezza": "alta" } }] } }
```

Il validatore rifiuta le Regolazioni non dichiarate e i valori fuori elenco. Senza `regolazioni` l'HTML generato è identico a quello di prima.

Nel codice: `render({ zone, regolazioni, t, id })` per i Layout e `render(props, { esc, t, id, regolazioni })` per i Componenti ricevono sempre tutti i valori, con i predefiniti dove la Specifica tace. Per le Regolazioni solo CSS, il motore aggiunge alla `<section>` l'attributo `data-reg-<nome>="<valore>"` **solo** se il valore non è il predefinito: il CSS del Layout lo aggancia con `.slide-<layout>[data-reg-<nome>="<valore>"]`. Se la Regolazione cambia l'**ordine**, il `render` deve riordinare il markup e non usare `order` nel CSS, così lettura da tastiera e da screen reader seguono l'ordine visivo. I limiti di contenuto non dipendono dalla Regolazione: vanno tarati sul valore più stretto.

### Regolazioni dei Layout

| Layout | Regolazione (predefinito in grassetto) | Note |
|---|---|---|
| `dashboard-analisi` | `rapporto-colonne`: **`3-2`**, `1-1`, `2-1`, `1-2` · `ordine`: **`normale`**, `invertito` · `rapporto`: **`1-1`**, `2-1`, `1-2` · `densita`: **`comoda`**, `compatta` | `rapporto-colonne` è principale:laterale; `rapporto` tra i due componenti della zona `principale` (richiede 2 componenti) |
| `confronto`, `confronto-affiancato` | `rapporto-colonne`: **`1-1`**, `3-2`, `2-3`, `2-1`, `1-2` · `ordine`: **`normale`**, `invertito` · `densita` (+ `allineamento-verticale`: **`centro`**, `alto` solo su `confronto-affiancato`) | `rapporto-colonne` è da sinistra a destra; in `confronto` l'evidenza resta sulla colonna «destra» anche se invertita |
| `esperimento` | `rapporto`: **`1-1`**, `2-1`, `1-2` (richiede 2 componenti in `risultato`) · `allineamento-verticale` · `densita` | |
| `risultato-grafico-commento` | `rapporto-colonne` (grafico:commento) · `ordine` · `densita` | |
| `griglia-schede` | `densita` | |

`ordine: invertito` riordina anche il markup, quindi anche l'impilamento sotto i 900px. `densita: compatta` riduce il corpo del testo (CSS condiviso in `base.css`).

## Tema

`temi/<nome>/tema.json`: `variabili` (proprietà CSS senza `--`, es. `colore-carta`) e `contrasti`, coppie di variabili colore verificate contro WCAG AA (rapporto ≥ 4,5:1). Un Tema sotto soglia è rifiutato dal validatore. Un nuovo Tema deve definire le stesse variabili degli altri (un test lo controlla), comprese `colore-accento-tenue`, `colore-accento-secondario`, `colore-positivo` e `ombra-scheda` usate da cornice e schede: copia `executive` o `quiet-editorial` e cambia i valori.

Variabili di stato: `colore-stato-ok`, `-attenzione`, `-critico`, `-neutro`, con contrasto AA su carta e superficie (sono nei `contrasti`). Variabili di forma, con valori neutri nei Temi di base: `raggio-scheda` (fattore: `calc(0.5em * var(--raggio-scheda))`), `spessore-filetto`, `bordo-scheda-accento` (fattore della barra laterale; 0 = nessuna), `trasformazione-etichetta`, `famiglia-numeri` e `trama-sfondo` (applicata dalla slide, non dai componenti). I CSS di Layout e Componenti usano queste variabili invece di valori fissi.

## Lingua

`lingue/<codice>.json`: `ui`, `grafici` (`barre`, `linee`) e `formato` (`separatoreDecimale`, `separatoreMigliaia`, `separatoreUnita`, `suffissoPercentuale`, `data`). Si seleziona con il campo `lingua` della Specifica.

## Dopo l'aggiunta

Aggiungi un test in `tests/` con `creaCatalogo` (vedi `tests/catalogo-e-export.test.mjs`) e lancia `npm test`.
