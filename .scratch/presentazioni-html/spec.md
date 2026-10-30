Status: ready-for-agent

# Presentazioni HTML assistite da agente: slice verticale minimo

## Problem Statement

Chi deve produrre presentazioni aziendali professionali a partire da dati da analizzare e commentare oggi o parte da zero ogni volta, o si affida a un agente AI che scrive HTML libero. Il risultato è disomogeneo, difficile da controllare e, soprattutto, i numeri nel testo possono essere sbagliati o inventati. Non esiste un insieme di elementi visivi riutilizzabili, né un modo meccanico per verificare che una presentazione rispetti le regole di stile, accessibilità e correttezza dei dati.

## Solution

Un sistema in cui l'agente non scrive HTML: scrive una **Specifica** (JSON) che descrive le slide, i layout e i componenti scelti dal **Catalogo**, con riferimenti ai valori di un'**Analisi** calcolata da script a partire dai dati. Uno strumento da riga di comando valida la Specifica contro il Catalogo e l'Analisi e, se valida, genera una **Presentazione** in HTML puro (CSS e JS locali, senza dipendenze), esportabile anche come **Esportazione singola** e come PDF. Vedi ADR 0001.

Questa spec copre solo lo **slice verticale minimo**: una presentazione di esempio end-to-end con un dataset piccolo, tre layout, due componenti, un tema neutro e un validatore base. Il Catalogo si allargherà in seguito, e l'estendibilità è un requisito di progetto fin da ora.

## User Stories

1. As a autore di presentazioni, I want fornire un file di dati (CSV, Excel o JSON) e ottenere un'Analisi con valori calcolati da uno script, so that i numeri siano verificabili e non scritti a mano dall'agente
2. As a autore, I want che ogni valore dell'Analisi riporti etichetta, unità, formato e provenienza (file, colonna, operazione), so that possa risalire a come è stato calcolato
3. As a autore, I want che lo script di calcolo resti accanto ai dati, so that i calcoli si possano rieseguire e ispezionare
4. As an agente AI, I want descrivere la presentazione in una Specifica strutturata invece che in HTML, so that il risultato sia validabile meccanicamente
5. As an agente AI, I want un Catalogo che dichiara per ogni layout e componente quando usarlo, quali dati richiede e i suoi limiti di contenuto, so that io componga solo elementi ammessi
6. As an agente AI, I want scrivere nel Commento riferimenti ai valori dell'Analisi invece di cifre, so that i numeri mostrati siano sempre quelli calcolati
7. As an agente AI, I want un messaggio d'errore chiaro e localizzato quando la Specifica non è valida, so that possa correggerla senza indovinare
8. As an agente AI, I want una via esplicita per proporre un nuovo componente quando nel Catalogo non ce n'è uno adatto, so that non improvvisi HTML nella singola presentazione
9. As an agente AI, I want inserire testo libero solo dentro i componenti previsti per ospitarlo, so that la flessibilità non aggira il Catalogo
10. As a autore, I want un layout di copertina, so that la presentazione abbia un frontespizio coerente
11. As a autore, I want un layout "titolo che afferma il risultato + grafico + commento", so that l'analisi dei dati sia presentata nel modo più diretto
12. As a autore, I want un layout di chiusura / prossimi passi, so that la presentazione finisca con una conclusione chiara
13. As a autore, I want un componente riga di KPI, so that i numeri chiave si leggano a colpo d'occhio
14. As a autore, I want un componente grafico a barre generato dai dati, so that i confronti siano accurati e non disegnati a mano
15. As a autore, I want che il Grafico sia prodotto da script a partire dall'Analisi, so that nessun numero passi dalla "fantasia" dell'agente
16. As a autore, I want che i numeri siano formattati secondo le convenzioni italiane (es. `1.234,5`) e le date in formato locale, so that la presentazione sia professionale in italiano
17. As a autore, I want che nessun testo italiano sia cablato nei componenti, so that in futuro si possano supportare altre lingue
18. As a autore, I want un Tema neutro "quiet editorial" (carta, inchiostro, un accento strutturale, tipografia con grazie per i titoli), so that il risultato sia pulito e professionale senza identità aziendale
19. As a autore, I want che colori, font e spaziature siano token sostituibili, so that in futuro possa aggiungere un Tema aziendale senza toccare i componenti
20. As a autore, I want che i font siano di sistema o file locali, so that la presentazione funzioni offline e in reti aziendali
21. As a presentatore, I want navigare le slide da tastiera, so that possa presentare dal vivo
22. As a presentatore, I want un indicatore di avanzamento, so that sappia a che punto sono
23. As a presentatore, I want la modalità schermo intero, so that la presentazione occupi tutto lo schermo
24. As a presentatore, I want slide 16:9 su desktop, so that il formato sia quello atteso in sala
25. As a lettore da telefono, I want che le slide diventino sezioni scorrevoli in verticale su schermi piccoli, so that la lettura sia comoda
26. As a lettore, I want titoli semantici, focus visibile da tastiera e testi alternativi per i grafici, so that la presentazione sia accessibile
27. As a autore, I want un contrasto di colore conforme a WCAG AA nel Tema, so that il testo sia leggibile
28. As a autore, I want che non ci siano animazioni automatiche, so that nulla distragga dal contenuto
29. As a autore, I want esportare la presentazione in PDF tramite i CSS di stampa, so that possa distribuirla in formato fisso
30. As a autore, I want una Esportazione singola in un unico file HTML autosufficiente, so that possa inviarla via email senza asset a corredo
31. As a autore, I want che la Presentazione generata non carichi nulla da risorse esterne, so that sia sicura e funzioni offline
32. As a autore, I want un validatore che rifiuti i numeri scritti a mano nel Commento, so that le cifre siano sempre derivate dall'Analisi
33. As a autore, I want un'allow-list esplicita per i numeri ammessi (anni, ordinali, "3 priorità"), so that il controllo non blocchi casi legittimi
34. As a autore, I want che il validatore rifiuti riferimenti a valori inesistenti nell'Analisi, so that non compaiano segnaposto irrisolti
35. As a autore, I want che il validatore rifiuti layout e componenti non presenti nel Catalogo, so that la presentazione resti uniforme
36. As a autore, I want che il validatore applichi i limiti di contenuto dichiarati dal Catalogo (es. numero massimo di KPI, parole per slide), so that le slide restino pulite
37. As a autore, I want che il validatore sia un passo obbligatorio prima di ogni generazione ed esportazione, so that non si distribuisca una presentazione non conforme
38. As a autore, I want che gli errori di validazione sfocino in un codice di uscita non nullo, so that l'agente e gli automatismi rilevino il fallimento
39. As a manutentore, I want aggiungere un nuovo layout o componente seguendo una procedura documentata e dichiarandone il manifest, so that il Catalogo cresca senza modificare il validatore o il motore di generazione
40. As a manutentore, I want che la modifica del Tema non richieda di toccare componenti né Specifiche esistenti, so that i temi siano sostituibili
41. As an agente AI, I want una skill nel repository e un file di istruzioni che descrivano il flusso (dati, Analisi, Specifica, validazione, generazione, verifica visiva), so that il processo sia ripetibile
42. As an agente AI, I want verificare visivamente la Presentazione con uno screenshot in un browser, so that individui problemi di impaginazione non rilevabili dal validatore
43. As un utente con dati riservati, I want che le presentazioni di lavoro risiedano in una cartella esclusa dal controllo di versione, so that i dati aziendali non finiscano nel repository
44. As a manutentore, I want una presentazione di esempio inclusa nel repository con dati fittizi, so that serva da riferimento e da fixture di test
45. As a autore, I want che il sistema funzioni con Node senza pacchetti npm esterni e con Python per l'Analisi, so that l'installazione sia minima

## Implementation Decisions

- **Architettura a pipeline**: dati → Analisi (script Python per presentazione) → Specifica (JSON, scritta dall'agente) → validazione contro Catalogo e Analisi → generazione HTML → export (file singolo, PDF). La Specifica è l'unica fonte di verità e l'HTML è un artefatto rigenerabile (ADR 0001).
- **Strumenti**: Node senza dipendenze npm esterne per validazione, generazione ed esportazioni. Python (pandas/openpyxl, già disponibili) solo per scrivere gli script di Analisi.
- **Interfaccia da riga di comando**: un unico punto d'ingresso con comandi per validare, generare, esportare in file singolo ed esportare in PDF. Ogni comando prende la cartella della presentazione e restituisce codice di uscita non nullo in caso di errore; la generazione non procede se la validazione fallisce.
- **Analisi**: file JSON con schema fisso. Ogni valore ha identificatore, etichetta, tipo/unità, formato e provenienza (file, colonna, operazione). Include anche le serie di dati usate dai Grafici. Lo script che la produce resta nella cartella della presentazione.
- **Specifica**: JSON validabile con schema. Contiene metadati (titolo, lingua, tema) e un elenco ordinato di slide; ogni slide dichiara un layout e, per ciascuna zona, i componenti con i loro contenuti. Il testo (Commento) usa riferimenti ai valori dell'Analisi.
- **Riferimenti nel testo**: sintassi a segnaposto che il motore sostituisce con il valore già formattato. Il validatore rifiuta cifre scritte a mano nel Commento, salvo quelle in un'allow-list esplicita per presentazione (anni, ordinali, conteggi come "3 priorità").
- **Catalogo**: ogni layout e componente ha un manifest dichiarativo con scopo, indicazioni d'uso, dati richiesti, zone (per i layout) e limiti di contenuto. Layout e componenti sono concetti distinti: il layout definisce le zone, il componente ne occupa una. Aggiungere un elemento significa aggiungere manifest, markup e stile, senza modificare il motore.
- **Catalogo dello slice**: layout copertina, "risultato + grafico + commento" e chiusura / prossimi passi; componenti riga di KPI e grafico a barre. Il resto del Catalogo concordato (divisore di sezione, titolo+testo, due colonne, linee, torta/donut, tabella, callout, citazione, elenco puntato) è fuori da questo slice.
- **Grafici**: SVG generati dallo script di generazione a partire dall'Analisi, senza librerie. Ogni Grafico ha un testo alternativo derivato dai dati.
- **Formattazione**: numeri e date secondo convenzioni italiane (es. `1.234,5`) applicati dal motore; nessun testo italiano cablato nei componenti; l'attributo di lingua del documento deriva dalla Specifica.
- **Tema**: un tema neutro "quiet editorial" con token di design (colori, tipografia, spaziature) in un unico punto; font di sistema o file locali, mai da CDN; nessun nome o logo aziendale. Il tema è un livello sostituibile, scelto dalla Specifica.
- **Comportamento a runtime**: navigazione da tastiera, indicatore di avanzamento, schermo intero. Slide 16:9 su desktop e sezioni scorrevoli in verticale su schermi piccoli. Nessuna animazione automatica. Stampa/PDF tramite CSS di stampa. Panoramica e note del relatore sono estensioni future.
- **Qualità**: accessibilità (contrasto WCAG AA, titoli semantici, focus visibile, testi alternativi) e limiti di contenuto per layout e componente applicati dal validatore.
- **Esportazione singola**: un unico HTML con CSS, JS e asset inlined. **PDF**: generato in modalità headless con il browser Edge disponibile sulla macchina.
- **Organizzazione del repository**: sistema di design (tema, asset, Catalogo), strumenti a riga di comando e presentazioni sono separati. Le presentazioni di lavoro stanno in una cartella ignorata dal controllo di versione; una presentazione di esempio con dati fittizi è versionata. Il repository va inizializzato con git.
- **Istruzioni all'agente**: una skill nel repository e `AGENTS.md` descrivono il flusso e la regola "solo Catalogo per default": se manca un componente, l'agente ne propone l'aggiunta al Catalogo invece di improvvisare nella singola presentazione.
- **Glossario e decisioni**: i termini sono in `CONTEXT.md` e vanno usati in codice, messaggi di errore e documentazione.

## Testing Decisions

- **Un solo punto di test (seam)**: la pipeline da riga di comando. Input: una cartella di presentazione con Analisi e Specifica. Output: esito di validazione (messaggi leggibili e codice di uscita) e, se valida, l'HTML generato. Nessun test sui moduli interni.
- **Cosa rende buono un test**: verifica solo comportamento esterno osservabile, usando fixture; non dipende da dettagli implementativi come nomi di funzioni o struttura interna dell'HTML oltre ai contratti dichiarati (valori formattati presenti, titoli semantici, assenza di risorse esterne).
- **Casi da coprire**:
  - Specifica valida: l'HTML contiene i valori dell'Analisi formattati in italiano, ha titoli semantici e testo alternativo per i Grafici, e non contiene riferimenti a risorse esterne.
  - Specifica non valida: layout o componente fuori Catalogo; riferimento a valore inesistente nell'Analisi; numero scritto a mano nel Commento (con e senza allow-list); limiti di contenuto superati; campo obbligatorio mancante. In ogni caso un errore con motivo e codice di uscita non nullo.
  - Esportazione singola: un unico file senza riferimenti a file esterni.
  - Aggiunta di un componente di prova al Catalogo: viene accettato e renderizzato senza modifiche al motore.
- **Fuori dai test automatici**: screenshot e PDF con Edge restano una verifica guidata dall'agente, non un punto di test.
- **Prior art**: nessuna nel repository (è vuoto di codice). Il progetto di riferimento citato dall'utente (duiliocirino/Studio) non ha test; ne prende solo il design system e il formato dei template.
- **Dati di test**: la presentazione di esempio con dati fittizi funge anche da fixture.

## Out of Scope

- Il Catalogo completo (altri layout e componenti oltre a quelli dello slice).
- Export PPTX.
- Panoramica a miniature e note del relatore.
- Temi aziendali e qualsiasi nome o logo aziendale.
- Infrastruttura di traduzione e altre lingue.
- Animazioni e transizioni.
- Strumento di analisi generico: l'Analisi è sempre uno script per presentazione.
- Librerie di grafici esterne (eventuale valutazione per casi complessi, in futuro).
- Editor visuale o modifica manuale dell'HTML generato.
- Test visivi automatici (screenshot a confronto).

## Further Notes

- Il progetto di riferimento è [duiliocirino/Studio](https://github.com/duiliocirino/Studio): se ne prende l'impostazione (HTML/CSS/JS vanilla, token di design, tema sostituibile, layout 16:9 con ripiego verticale su schermi piccoli, print CSS), non il codice. Il suo catalogo è descritto solo in prosa; qui diventa dichiarativo e validabile.
- Rischio principale: far dipendere la qualità dalla capacità dell'agente di leggere regole in prosa. Mitigazione: Catalogo dichiarativo + validatore + verifica visiva.
- Ambiente verificato: Node 26, Python 3.14 con pandas/openpyxl/numpy, Edge disponibile (Chrome no).
- Dopo questa spec, il passo naturale è scomporla in ticket verticali (uno per fetta end-to-end) in `.scratch/presentazioni-html/issues/`.
