# Presentazioni

Creazione assistita di presentazioni aziendali professionali: un agente AI trasforma dati da analizzare e commentare in una presentazione completa, componendo solo elementi già pronti e riutilizzabili.

## Language

**Presentazione**:
Il prodotto finale: una sequenza ordinata di slide che racconta l'analisi di un insieme di dati.
_Avoid_: Deck, slideshow, report

**Slide**:
Una singola schermata della presentazione, con una sola idea.
_Avoid_: Pagina, diapositiva

**Layout**:
La disposizione di una slide (es. copertina, due colonne, divisore di sezione), che definisce le zone in cui inserire componenti.
_Avoid_: Template, modello di slide

**Componente**:
Un elemento visivo riutilizzabile e predefinito (es. KPI, grafico, callout) che occupa una zona di un layout.
_Avoid_: Widget, blocco, modulo

**Catalogo**:
L'insieme di layout e componenti ammessi, ciascuno con regole su quando usarlo e quali dati richiede. L'agente compone solo da qui; aggiungerne di nuovi è un'operazione prevista.
_Avoid_: Libreria, kit

**Regolazione**:
Una scelta da elenco chiuso, dichiarata dal Layout o dal Componente che la offre, che ne cambia disposizione, ordine o dimensione (es. rapporto tra colonne, altezza di un grafico) senza cambiare contenuto né numeri. Se non è indicata vale il predefinito, che coincide con l'aspetto di prima.
_Avoid_: Variante, opzione, impostazione

**Specifica**:
La descrizione strutturata di una presentazione (quali slide, con quali layout, componenti e riferimenti all'Analisi) da cui questa viene generata. È la fonte di verità; la presentazione non si modifica a mano.
_Avoid_: Sorgente, bozza, configurazione

**Tema**:
L'identità visiva applicata a una presentazione (colori, tipografia, spaziature). Si può sostituire senza toccare i componenti.
_Avoid_: Skin, stile, brand

**Analisi**:
Il risultato verificabile dei calcoli sui dati in ingresso, da cui nascono numeri e grafici. L'agente non inventa né ricalcola a mano i numeri.
_Avoid_: Risultati, output dei dati

**Commento**:
Il testo interpretativo scritto dall'agente sopra i numeri dell'Analisi.
_Avoid_: Narrazione, didascalia

**Grafico**:
Una rappresentazione visiva dei numeri dell'Analisi (barre, linee, torta/donut, KPI), generata dai dati e non disegnata a mano.
_Avoid_: Chart, immagine

**Esportazione singola**:
La presentazione impacchettata in un unico file autosufficiente, pronta da inviare senza asset a corredo.
_Avoid_: Bundle, build

**Stato**:
Il giudizio dichiarato da chi presenta su un elemento di progetto (milestone, filone di lavoro, azione): completato, in linea, a rischio, in ritardo, non avviato. Non è un dato dell'Analisi e non si calcola: si sceglie da un elenco chiuso e si mostra sempre con icona e testo, mai solo con il colore.
_Avoid_: Semaforo (è il componente che lo mostra), RAG, status

**Esito**:
Il giudizio su un criterio di un esperimento o PoC: superato, parziale, non superato. Come lo Stato, è una scelta da elenco chiuso; il risultato misurato che lo motiva è invece un valore dell'Analisi.
_Avoid_: Verdetto, pass/fail
