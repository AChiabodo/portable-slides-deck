---
status: accepted
---

# La Specifica JSON è la fonte di verità; l'HTML è un artefatto generato

L'agente non scrive HTML: scrive una Specifica JSON (slide, layout, componenti, riferimenti all'Analisi) che uno script valida contro il Catalogo e renderizza in HTML puro. Le cifre nel Commento sono riferimenti ai valori dell'Analisi e il validatore rifiuta numeri scritti a mano (salvo un'allow-list), così i numeri non passano dall'LLM. Abbiamo scartato l'HTML scritto a mano (non validabile meccanicamente) e un'app React/TypeScript compilata (build e superficie d'errore aggiuntive, nessun file singolo da consegnare).

## Consequences

- Le modifiche manuali all'HTML generato si perdono alla rigenerazione: si modifica sempre la Specifica.
- Il Catalogo deve dichiarare per ogni layout e componente i dati richiesti e i limiti di contenuto, perché il validatore li applica.
- Il formato è JSON (nessuna dipendenza e validabile con schema) e gli strumenti sono in Node senza pacchetti npm esterni.
- Ogni valore di `analisi.json` riporta la provenienza (file, colonna, operazione); lo script Python dell'Analisi resta nella cartella della presentazione come prova dei calcoli.
