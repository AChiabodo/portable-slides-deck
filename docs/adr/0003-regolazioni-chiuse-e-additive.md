---
status: accepted
---

# Layout e Componenti si personalizzano con Regolazioni: elenchi chiusi, dichiarati nel manifest, additive

Per dare più controllo sulla singola slide (larghezze delle colonne, ordine, altezza dei grafici) un Layout o un Componente dichiara nel manifest le sue `regolazioni`: ciascuna ha un elenco chiuso di `valori` e un `predefinito` che riproduce l'aspetto di prima. La Specifica le scrive in un campo `regolazioni` separato da `zone` e dai contenuti, sulla slide e sul Componente. Il validatore rifiuta ogni valore fuori elenco e ogni Regolazione non dichiarata; senza `regolazioni` l'HTML generato è identico a quello precedente.

Abbiamo scartato i Layout dedicati per ogni variante (es. `dashboard-analisi-2-1`): il Catalogo crescerebbe in modo combinatorio. Abbiamo scartato i valori liberi (percentuali, pixel): il validatore non potrebbe più garantire che la slide regga a 16:9, sotto 900px e in stampa. Abbiamo scartato di riusare la prop `scelta`: richiede un `vocabolario` tradotto in ogni lingua, mentre una Regolazione non è testo mostrato. Le Regolazioni stanno in un campo a parte, non tra le prop, per tenere separati contenuto e aspetto.

## Consequences

- Una tantum il motore cambia (validatore, render, tipo `regolazione` nel manifest); dopo, ogni Layout o Componente può aderire senza toccare `tools/`.
- Le Regolazioni dipendenti dal contenuto (es. `rapporto` tra due componenti) dichiarano `richiede` nel manifest e il validatore le rifiuta se la condizione non è soddisfatta.
- `ordine` riordina anche il DOM, così lettura da tastiera e da screen reader seguono l'ordine visivo, anche sotto 900px.
- I limiti di contenuto (`maxParole`, ecc.) non dipendono dalla Regolazione: sono tarati sul valore più stretto.
- Aggiungere un valore a una Regolazione non rompe le Specifiche esistenti; toglierne uno sì.
- Mai il solo colore come segno (es. `evidenzia`) e nessuna Regolazione cambia numeri: la scala degli assi non è regolabile.
