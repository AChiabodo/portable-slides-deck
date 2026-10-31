import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analisiBase, creaPresentazione, conSlide, esegui, leggi } from './helpers.mjs';

const provenienza = { file: 'dati/progetto.csv', colonna: 'valore', operazione: 'somma' };

function analisiProgetto() {
  const analisi = analisiBase();
  analisi.valori.avanzamento_a = {
    etichetta: 'Avanzamento indicizzazione',
    formato: { tipo: 'percentuale', decimali: 0 },
    valore: 80,
    provenienza,
  };
  analisi.valori.data_avvio = { etichetta: 'Avvio', formato: { tipo: 'data' }, valore: '2026-01-12', provenienza };
  return analisi;
}

function genera(...slide) {
  const dir = creaPresentazione({ analisi: analisiProgetto(), specifica: conSlide(...slide) });
  const r = esegui(['genera', dir]);
  return { r, html: r.codice === 0 ? leggi(dir, 'dist/index.html') : '' };
}

function rifiutata(slide, atteso) {
  const dir = creaPresentazione({ analisi: analisiProgetto(), specifica: conSlide(slide) });
  const r = esegui(['valida', dir]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}`);
  assert.match(r.err, atteso);
}

const LESSICO = 'documenti ricerca risposte archivio pilota utenti qualità fonti indice modello tempi costi rischi piano team regole'.split(' ');
const parole = (n, da = 0) => Array.from({ length: n }, (_, i) => LESSICO[(i + da) % LESSICO.length]).join(' ');

const kpi = (...voci) => ({ componente: 'kpi', voci: voci.map(([etichetta, valore]) => ({ etichetta, valore })) });
const schedaDati = (n) => ({
  componente: 'scheda-dati',
  voci: Array.from({ length: n }, (_, i) => ({ etichetta: LESSICO[i], valore: LESSICO[i + 4] })),
});
const nota = (testo = 'Un promemoria') => ({ componente: 'nota', etichetta: 'Nota', testo });
const semaforo = (n) => ({
  componente: 'semaforo',
  voci: Array.from({ length: n }, (_, i) => ({ etichetta: LESSICO[i], stato: 'in-linea', nota: 'Tutto procede' })),
});
const barre = { componente: 'barra-avanzamento', voci: [{ etichetta: 'Indicizzazione', valore: 'avanzamento_a', stato: 'in-linea' }] };
const timeline = (n = 3) => ({
  componente: 'timeline',
  voci: Array.from({ length: n }, (_, i) => ({ titolo: LESSICO[i], data: i % 2 ? 'data_chiusura' : 'data_avvio', stato: 'completato' })),
});
const azioni = {
  componente: 'elenco-azioni',
  azioni: [{ azione: 'Chiudere il pilota', responsabile: 'Marta Rossi', scadenza: 'data_chiusura', stato: 'in-linea' }],
};
const opzioni = (n, parTitolo = 2, parTesto = 4) => ({
  componente: 'opzioni-decisione',
  opzioni: Array.from({ length: n }, (_, i) => ({
    titolo: parole(parTitolo, i),
    ...(i === 1 ? { ruolo: 'raccomandata' } : {}),
    vantaggi: parole(parTesto, i + 1),
    svantaggi: parole(parTesto, i + 3),
  })),
});

describe('layout decisione', () => {
  const zoneComplete = () => ({
    occhiello: 'Decisione richiesta',
    titolo: 'Come estendere il pilota',
    richiesta: 'Si chiede di approvare l\'estensione a tutti i reparti.',
    contesto: 'Il pilota ha dato una crescita del {{crescita}}.',
    evidenze: [kpi(['Crescita', 'crescita'], ['Ricavi', 'ricavi_totale'])],
    opzioni: [opzioni(3)],
    raccomandazione: 'Procedere per ondate successive.',
  });

  test('genera la slide con richiesta, contesto, evidenze, opzioni e raccomandazione', () => {
    const { r, html } = genera({ layout: 'decisione', zone: zoneComplete() });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<section class="slide slide-decisione" id="slide-2"/);
    assert.match(html, /<h2 id="slide-2-titolo">Come estendere il pilota<\/h2>/);
    assert.match(html, /<p class="dec-richiesta">Si chiede di approvare/);
    assert.match(html, /<p class="dec-testo">Il pilota ha dato una crescita del 12,3%\.<\/p>/);
    assert.match(html, /class="kpi-valore">12,3%</);
    assert.equal((html.match(/<li class="opzione"/g) ?? []).length, 3);
    assert.equal((html.match(/data-ruolo="raccomandata"/g) ?? []).length, 1);
    assert.match(html, /<section class="dec-raccomandazione pannello">/);
  });

  test('senza contesto, evidenze, occhiello e raccomandazione rende solo il necessario', () => {
    const { r, html } = genera({
      layout: 'decisione',
      zone: { titolo: 'Scelta del modello', richiesta: 'Approvare il modello ospitato in sede.', opzioni: [opzioni(2)] },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<p class="dec-richiesta">/);
    assert.doesNotMatch(html, /dec-quadro|dec-contesto|dec-evidenze|dec-raccomandazione|class="occhiello"/);
    assert.equal((html.match(/<li class="opzione"/g) ?? []).length, 2);
  });

  test('il solo contesto o le sole evidenze occupano tutta la larghezza', () => {
    const { html } = genera({
      layout: 'decisione',
      zone: { titolo: 'Scelta', richiesta: 'Approvare il piano.', contesto: 'Un solo contesto.', opzioni: [opzioni(2)] },
    });
    assert.match(html, /class="dec-quadro dec-solo"/);
  });

  test('con più di quattro voci la scheda-dati diventa compatta', () => {
    const { r, html } = genera({
      layout: 'decisione',
      zone: { titolo: 'Scelta', richiesta: 'Approvare il piano.', evidenze: [schedaDati(6)], opzioni: [opzioni(2)] },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="dec-evidenze dec-molte"/);
  });

  test('il testo scritto dall\'utente è escapato', () => {
    const { r, html } = genera({
      layout: 'decisione',
      zone: {
        titolo: 'A <script>alert(x)</script> B',
        richiesta: 'Richiesta <b>grassetto</b>',
        opzioni: [{ componente: 'opzioni-decisione', opzioni: [{ titolo: '<img src=x>', vantaggi: 'ok', svantaggi: 'meno' }, { titolo: 'Altra', vantaggi: 'ok', svantaggi: 'meno' }] }],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<script>alert|<b>grassetto|<img src=x>/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /&lt;img src=x&gt;/);
  });

  test('richiesta mancante o troppo lunga è rifiutata', () => {
    rifiutata({ layout: 'decisione', zone: { titolo: 'Scelta', opzioni: [opzioni(2)] } }, /zona "richiesta" obbligatoria e mancante/);
    rifiutata(
      { layout: 'decisione', zone: { titolo: 'Scelta', richiesta: parole(21), opzioni: [opzioni(2)] } },
      /21 parole, massimo 20/,
    );
  });

  test('contesto e raccomandazione oltre il limite sono rifiutati', () => {
    rifiutata(
      { layout: 'decisione', zone: { titolo: 'Scelta', richiesta: 'Approvare.', contesto: parole(31), opzioni: [opzioni(2)] } },
      /31 parole, massimo 30/,
    );
    rifiutata(
      { layout: 'decisione', zone: { titolo: 'Scelta', richiesta: 'Approvare.', raccomandazione: parole(25), opzioni: [opzioni(2)] } },
      /25 parole, massimo 24/,
    );
  });

  test('il limite di parole della slide comprende il testo delle opzioni', () => {
    rifiutata(
      {
        layout: 'decisione',
        zone: {
          titolo: parole(12),
          richiesta: parole(20),
          contesto: parole(30),
          raccomandazione: parole(24),
          opzioni: [opzioni(4, 2, 6)],
        },
      },
      /parole in totale, massimo 130 per il layout "decisione"/,
    );
  });

  test('opzioni mancanti, doppie o di un altro tipo sono rifiutate', () => {
    rifiutata({ layout: 'decisione', zone: { titolo: 'Scelta', richiesta: 'Approvare.' } }, /zona "opzioni" obbligatoria e mancante/);
    rifiutata(
      { layout: 'decisione', zone: { titolo: 'Scelta', richiesta: 'Approvare.', opzioni: [opzioni(2), opzioni(2)] } },
      /2 componenti, massimo 1/,
    );
    rifiutata(
      { layout: 'decisione', zone: { titolo: 'Scelta', richiesta: 'Approvare.', opzioni: [kpi(['Crescita', 'crescita'])] } },
      /componente "kpi" non ammesso nella zona/,
    );
  });

  test('nelle evidenze sono ammessi solo kpi e scheda-dati, al massimo uno', () => {
    rifiutata(
      { layout: 'decisione', zone: { titolo: 'Scelta', richiesta: 'Approvare.', evidenze: [nota()], opzioni: [opzioni(2)] } },
      /componente "nota" non ammesso nella zona/,
    );
    rifiutata(
      {
        layout: 'decisione',
        zone: { titolo: 'Scelta', richiesta: 'Approvare.', evidenze: [kpi(['Crescita', 'crescita']), schedaDati(2)], opzioni: [opzioni(2)] },
      },
      /2 componenti, massimo 1/,
    );
  });
});

describe('layout sommario-esecutivo', () => {
  const zoneComplete = () => ({
    occhiello: 'Sommario',
    titolo: 'Il pilota funziona',
    identita: [schedaDati(3)],
    kpi: [kpi(['Crescita', 'crescita'], ['Ricavi', 'ricavi_totale'])],
    messaggi: ['Le risposte sono corrette.', 'I tempi sono accettabili.', 'La crescita è del {{crescita}}.'],
    raccomandazione: 'Estendere il servizio per ondate.',
  });

  test('genera la slide con messaggi numerati, kpi, identità e raccomandazione', () => {
    const { r, html } = genera({ layout: 'sommario-esecutivo', zone: zoneComplete() });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<section class="slide slide-sommario-esecutivo" id="slide-2"/);
    assert.match(html, /<h2 id="slide-2-titolo">Il pilota funziona<\/h2>/);
    assert.match(html, /<ol class="somm-messaggi"><li>Le risposte sono corrette\.<\/li>/);
    assert.match(html, /<li>La crescita è del 12,3%\.<\/li>/);
    assert.match(html, /class="somm-kpi"><ul class="kpi-riga"/);
    assert.match(html, /class="somm-identita"/);
    assert.match(html, /<section class="somm-raccomandazione">/);
  });

  test('con le sole zone obbligatorie omette identità, raccomandazione e occhiello', () => {
    const { r, html } = genera({
      layout: 'sommario-esecutivo',
      zone: { titolo: 'Sommario', kpi: [kpi(['Crescita', 'crescita'])], messaggi: ['Primo messaggio.', 'Secondo messaggio.'] },
    });
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /somm-identita|somm-raccomandazione|class="occhiello"/);
    assert.match(html, /class="somm-kpi"/);
  });

  test('con più di quattro voci l\'identità diventa compatta', () => {
    const { html } = genera({ layout: 'sommario-esecutivo', zone: { ...zoneComplete(), identita: [schedaDati(6)] } });
    assert.match(html, /class="somm-identita somm-molte"/);
  });

  test('il testo scritto dall\'utente è escapato', () => {
    const { r, html } = genera({
      layout: 'sommario-esecutivo',
      zone: {
        titolo: 'Titolo <script>alert(x)</script>',
        kpi: [kpi(['<i>Crescita</i>', 'crescita'])],
        messaggi: ['Messaggio <script>x</script>', 'Altro "messaggio" & oltre'],
        raccomandazione: '<u>Sottolineato</u>',
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<script>alert|<script>x|<i>Crescita|<u>Sottolineato/);
    assert.match(html, /<li>Messaggio &lt;script&gt;x&lt;\/script&gt;<\/li>/);
    assert.match(html, /Altro &quot;messaggio&quot; &amp; oltre/);
  });

  test('messaggi fuori da 2-4 voci o troppo lunghi sono rifiutati', () => {
    const base = { titolo: 'Sommario', kpi: [kpi(['Crescita', 'crescita'])] };
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, messaggi: Array(5).fill('Un messaggio.') } }, /5 voci, massimo 4/);
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, messaggi: ['Uno solo.'] } }, /almeno 2 voci/);
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, messaggi: [parole(19), 'Breve.'] } }, /19 parole, massimo 18/);
    rifiutata({ layout: 'sommario-esecutivo', zone: { titolo: 'Sommario', messaggi: ['Uno.', 'Due.'] } }, /zona "kpi" obbligatoria e mancante/);
  });

  test('raccomandazione e titolo oltre il limite sono rifiutati', () => {
    const base = { kpi: [kpi(['Crescita', 'crescita'])], messaggi: ['Uno.', 'Due.'] };
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, titolo: 'Sommario', raccomandazione: parole(27) } }, /27 parole, massimo 26/);
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, titolo: parole(15) } }, /15 parole, massimo 14/);
  });

  test('il limite di parole della slide è applicato', () => {
    rifiutata(
      {
        layout: 'sommario-esecutivo',
        zone: {
          occhiello: parole(4),
          titolo: parole(14),
          identita: [{ componente: 'scheda-dati', voci: Array.from({ length: 8 }, (_, i) => ({ etichetta: parole(3, i), valore: parole(3, i + 3) })) }],
          kpi: [kpi(['Crescita', 'crescita'], ['Ricavi', 'ricavi_totale'])],
          messaggi: [parole(18), parole(18, 3), parole(18, 6), parole(18, 9)],
          raccomandazione: parole(26),
        },
      },
      /parole in totale, massimo 150 per il layout "sommario-esecutivo"/,
    );
  });

  test('componenti non ammessi nelle zone sono rifiutati', () => {
    const base = { titolo: 'Sommario', kpi: [kpi(['Crescita', 'crescita'])], messaggi: ['Uno.', 'Due.'] };
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, kpi: [nota()] } }, /componente "nota" non ammesso nella zona/);
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, identita: [kpi(['Crescita', 'crescita'])] } }, /componente "kpi" non ammesso nella zona/);
    rifiutata({ layout: 'sommario-esecutivo', zone: { ...base, identita: [schedaDati(2), schedaDati(2)] } }, /2 componenti, massimo 1/);
  });
});

describe('layout timeline-milestone', () => {
  test('genera la slide con introduzione, timeline e dettaglio', () => {
    const { r, html } = genera({
      layout: 'timeline-milestone',
      zone: {
        occhiello: 'Piano',
        titolo: 'Il piano è rispettato',
        introduzione: 'Le prime milestone sono chiuse.',
        timeline: [timeline(3)],
        dettaglio: [nota('Chiudere il pilota entro luglio.'), barre],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<section class="slide slide-timeline-milestone" id="slide-2"/);
    assert.match(html, /<h2 id="slide-2-titolo">Il piano è rispettato<\/h2>/);
    assert.match(html, /<p class="introduzione">Le prime milestone sono chiuse\.<\/p>/);
    assert.equal((html.match(/class="tl-voce/g) ?? []).length, 3);
    assert.match(html, /12\/01\/2026/);
    assert.match(html, /07\/03\/2024/);
    assert.match(html, /<div class="tlm-dettaglio"><[^>]*class="nota/);
    assert.match(html, /class="barra-avanzamento"/);
  });

  test('con la sola timeline omette introduzione e dettaglio', () => {
    const { r, html } = genera({ layout: 'timeline-milestone', zone: { titolo: 'Piano', timeline: [timeline(2)] } });
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /tlm-dettaglio|class="introduzione"|class="occhiello"/);
    assert.match(html, /<div class="tlm-corpo">/);
  });

  test('accetta le prossime azioni nel dettaglio', () => {
    const { r, html } = genera({ layout: 'timeline-milestone', zone: { titolo: 'Piano', timeline: [timeline(4)], dettaglio: [azioni] } });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<div class="tlm-dettaglio">/);
    assert.match(html, /Chiudere il pilota/);
  });

  test('il testo scritto dall\'utente è escapato', () => {
    const { r, html } = genera({
      layout: 'timeline-milestone',
      zone: {
        titolo: 'Piano <script>alert(x)</script>',
        introduzione: '<b>Intro</b> & oltre',
        timeline: [
          {
            componente: 'timeline',
            voci: [
              { titolo: '<img src=x>', data: 'data_avvio', stato: 'completato' },
              { titolo: 'Fine', data: 'data_chiusura', stato: 'completato' },
            ],
          },
        ],
        dettaglio: [nota('<script>x</script>')],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<script>alert|<script>x|<b>Intro|<img src=x>/);
    assert.match(html, /&lt;b&gt;Intro&lt;\/b&gt; &amp; oltre/);
  });

  test('titolo e introduzione oltre il limite sono rifiutati', () => {
    rifiutata({ layout: 'timeline-milestone', zone: { titolo: parole(13), timeline: [timeline(2)] } }, /13 parole, massimo 12/);
    rifiutata(
      { layout: 'timeline-milestone', zone: { titolo: 'Piano', introduzione: parole(25), timeline: [timeline(2)] } },
      /25 parole, massimo 24/,
    );
  });

  test('la timeline è obbligatoria e unica', () => {
    rifiutata({ layout: 'timeline-milestone', zone: { titolo: 'Piano' } }, /zona "timeline" obbligatoria e mancante/);
    rifiutata({ layout: 'timeline-milestone', zone: { titolo: 'Piano', timeline: [timeline(2), timeline(2)] } }, /2 componenti, massimo 1/);
    rifiutata(
      { layout: 'timeline-milestone', zone: { titolo: 'Piano', timeline: [barre] } },
      /componente "barra-avanzamento" non ammesso nella zona/,
    );
  });

  test('il dettaglio ammette al massimo due componenti dei tipi previsti', () => {
    rifiutata(
      { layout: 'timeline-milestone', zone: { titolo: 'Piano', timeline: [timeline(2)], dettaglio: [nota(), barre, azioni] } },
      /3 componenti, massimo 2/,
    );
    rifiutata(
      { layout: 'timeline-milestone', zone: { titolo: 'Piano', timeline: [timeline(2)], dettaglio: [kpi(['Crescita', 'crescita'])] } },
      /componente "kpi" non ammesso nella zona/,
    );
  });
});

describe('layout stato-avanzamento', () => {
  const zoneComplete = () => ({
    occhiello: 'Stato',
    titolo: 'Il progetto è in linea',
    complessivo: [semaforo(3)],
    workstream: [barre],
    kpi: [kpi(['Crescita', 'crescita'], ['Ricavi', 'ricavi_totale'])],
    commento: 'Il ritardo dell\'interfaccia si recupera a luglio.',
    nota: [nota('Dipende dagli utenti.')],
  });

  test('genera la slide con workstream, stato complessivo, kpi, commento e nota', () => {
    const { r, html } = genera({ layout: 'stato-avanzamento', zone: zoneComplete() });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<section class="slide slide-stato-avanzamento" id="slide-2"/);
    assert.match(html, /<h2 id="slide-2-titolo">Il progetto è in linea<\/h2>/);
    assert.match(html, /<div class="sta-workstream">.*class="barra-avanzamento"/);
    assert.match(html, /<section class="sta-complessivo"><h3 class="sta-intestazione">[^<]+<\/h3>/);
    assert.match(html, /class="sta-kpi"/);
    assert.match(html, /<p class="sta-commento pannello">Il ritardo/);
    assert.match(html, /<div class="sta-nota"><[^>]*class="nota/);
    assert.match(html, /80%/);
  });

  test('con il solo workstream rende una colonna sola', () => {
    const { r, html } = genera({ layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [semaforo(2)] } });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="sta-corpo sta-solo"/);
    assert.doesNotMatch(html, /sta-lato|sta-complessivo|sta-kpi|sta-commento|sta-nota|class="occhiello"/);
  });

  test('due componenti nel workstream si affiancano e le righe numerose stringono il testo', () => {
    const { r, html } = genera({
      layout: 'stato-avanzamento',
      zone: { titolo: 'Stato', workstream: [semaforo(3), barre], complessivo: [semaforo(4)] },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="sta-workstream sta-doppio"/);
    assert.match(html, /class="sta-lato sta-densa"/);
    const fitta = genera({ layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [semaforo(7)] } });
    assert.match(fitta.html, /class="sta-workstream sta-fitta"/);
  });

  test('il testo scritto dall\'utente è escapato', () => {
    const { r, html } = genera({
      layout: 'stato-avanzamento',
      zone: {
        titolo: 'Stato <script>alert(x)</script>',
        workstream: [{ componente: 'semaforo', voci: [{ etichetta: '<img src=x>', stato: 'a-rischio', nota: '<b>nota</b>' }] }],
        commento: 'Commento <script>x</script> & oltre',
        nota: [nota('<u>x</u>')],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<script>alert|<script>x|<img src=x>|<b>nota<\/b>|<u>x<\/u>/);
    assert.match(html, /Commento &lt;script&gt;x&lt;\/script&gt; &amp; oltre/);
  });

  test('titolo e commento oltre il limite sono rifiutati', () => {
    rifiutata({ layout: 'stato-avanzamento', zone: { titolo: parole(13), workstream: [barre] } }, /13 parole, massimo 12/);
    rifiutata({ layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [barre], commento: parole(25) } }, /25 parole, massimo 24/);
  });

  test('il workstream è obbligatorio e ammette al massimo due componenti', () => {
    rifiutata({ layout: 'stato-avanzamento', zone: { titolo: 'Stato' } }, /zona "workstream" obbligatoria e mancante/);
    rifiutata(
      { layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [barre, semaforo(2), semaforo(2)] } },
      /3 componenti, massimo 2/,
    );
  });

  test('componenti non ammessi nelle zone sono rifiutati', () => {
    rifiutata(
      { layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [timeline(2)] } },
      /componente "timeline" non ammesso nella zona/,
    );
    rifiutata(
      { layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [barre], complessivo: [barre] } },
      /componente "barra-avanzamento" non ammesso nella zona/,
    );
    rifiutata(
      { layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [barre], kpi: [nota()] } },
      /componente "nota" non ammesso nella zona/,
    );
    rifiutata(
      { layout: 'stato-avanzamento', zone: { titolo: 'Stato', workstream: [barre], nota: [kpi(['Crescita', 'crescita'])] } },
      /componente "kpi" non ammesso nella zona/,
    );
  });

  test('il limite di parole della slide è applicato', () => {
    rifiutata(
      {
        layout: 'stato-avanzamento',
        zone: {
          occhiello: parole(4),
          titolo: parole(12),
          complessivo: [{ componente: 'semaforo', voci: Array.from({ length: 4 }, (_, i) => ({ etichetta: parole(3, i), stato: 'in-linea', nota: parole(8, i) })) }],
          workstream: [{ componente: 'semaforo', voci: Array.from({ length: 5 }, (_, i) => ({ etichetta: parole(3, i), stato: 'in-linea', nota: parole(8, i) })) }],
          commento: parole(24),
          nota: [nota(parole(20))],
        },
      },
      /parole in totale, massimo 150 per il layout "stato-avanzamento"/,
    );
  });
});
