---
status: accepted
---

# Stati ed esiti sono giudizi dichiarati con una prop `scelta`, non dati calcolati

Nelle presentazioni di avanzamento e di PoC compaiono stati (in linea, a rischio, in ritardo…) ed esiti (superato, parziale, non superato). Non sono numeri dell'Analisi: sono giudizi di chi presenta. La Specifica li dichiara con un nuovo tipo di prop, `scelta`, che nel manifest del componente ha un elenco chiuso di `opzioni` e un `vocabolario` per le etichette in lingua; il validatore rifiuta ogni altro valore. I dati su cui il giudizio si appoggia (date delle milestone, percentuali di avanzamento, risultati misurati) restano valori dell'Analisi, con la provenienza obbligatoria dell'ADR 0001.

Abbiamo scartato di calcolare lo stato dall'Analisi con soglie (es. «rosso se in ritardo di oltre N giorni»): le soglie sono scelte di governo del progetto, non del motore, e un semaforo che sembra un dato ma nasconde una regola è più difficile da difendere di un giudizio dichiarato. Si potrà aggiungere in seguito come prop calcolata senza rompere le Specifiche esistenti. Abbiamo scartato anche il testo libero senza controllo, perché lascia passare stati che nessun componente sa disegnare.

Per poter disegnare barre e posizionare date senza stampare cifre nuove, le prop `valore` consegnano al render anche `numero` e `formato`, oltre al testo già formattato.

## Consequences

- Ogni stato ed esito ha una forma propria (icona) oltre al colore e all'etichetta testuale: il significato non dipende solo dal colore (accessibilità, stampa in bianco e nero).
- I Temi definiscono `colore-stato-ok`, `colore-stato-attenzione`, `colore-stato-critico` e `colore-stato-neutro`, verificate WCAG AA come le altre coppie di colori.
- I vocabolari (`stato`, `esito`, `livello`, `ruolo-opzione`) vivono in `lingue/<codice>.json` alla voce `scelte`; una nuova lingua li deve tradurre tutti (un test lo verifica).
- Nessun numero stampato dai grafici nuovi è calcolato dal render: proporzioni e posizioni sono solo geometria.
