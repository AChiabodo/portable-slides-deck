import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, creaCatalogo, analisiBase, conSlide, esegui, leggi } from './helpers.mjs';

const COMPONENTI = ['grafico-ciambella', 'grafico-cascata', 'timeline', 'matrice-rischi', 'barra-avanzamento'];
const MALEVOLA = '<script>alert("x")</script>';

// Il Catalogo di partenza non ha un Layout che ammetta questi Componenti: ne basta uno di prova, locale al test.
const catalogoProva = creaCatalogo({
  'layouts/prova-grafici/manifest.json': {
    nome: 'prova-grafici',
    scopo: 'Layout di prova per i Componenti grafici.',
    quandoUsarlo: 'Solo nei test.',
    livelloTitolo: 2,
    maxParoleSlide: 200,
    zone: [
      { nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true, maxParole: 20 },
      { nome: 'contenuto', tipo: 'componenti', obbligatoria: true, ammessi: COMPONENTI, min: 1, max: 3 },
    ],
  },
  'layouts/prova-grafici/render.mjs': 'export default ({ zone }) => `${zone.titolo}<div class="prova">${zone.contenuto}</div>`;\n',
});

const provenienza = () => ({ file: 'dati/progetto.csv', colonna: 'valore', operazione: 'somma' });
const valoreAnalisi = (etichetta, valore, formato) => ({ etichetta, formato, valore, provenienza: provenienza() });
const serieAnalisi = (etichetta, punti, formato = { tipo: 'numero', decimali: 0 }) => ({ etichetta, formato, punti, provenienza: provenienza() });

function analisi() {
  const base = analisiBase();
  return {
    valori: {
      ...base.valori,
      totale_budget: valoreAnalisi('Budget totale', 100, { tipo: 'numero', decimali: 0, unita: '€' }),
      data_avvio: valoreAnalisi('Avvio', '2024-01-10', { tipo: 'data' }),
      data_pilota: valoreAnalisi('Pilota', '2024-03-20', { tipo: 'data' }),
      data_rilascio: valoreAnalisi('Rilascio', '2024-11-05', { tipo: 'data' }),
      avanz_a: valoreAnalisi('Avanzamento A', 65, { tipo: 'percentuale', decimali: 0 }),
      avanz_b: valoreAnalisi('Avanzamento B', 140, { tipo: 'percentuale', decimali: 0 }),
      avanz_c: valoreAnalisi('Avanzamento C', 12, { tipo: 'numero', decimali: 0, unita: 'gg' }),
    },
    serie: {
      ...base.serie,
      quote: serieAnalisi('Quote', [
        { etichetta: 'Nord', valore: 50 },
        { etichetta: 'Centro', valore: 30 },
        { etichetta: 'Sud', valore: 20 },
        { etichetta: 'Estero', valore: 0 },
      ]),
      quote_ostili: serieAnalisi(MALEVOLA, [
        { etichetta: MALEVOLA, valore: 60 },
        { etichetta: 'Altro', valore: 40 },
      ]),
      ponte: serieAnalisi('Ponte ricavi', [
        { etichetta: 'Iniziale', valore: 1000 },
        { etichetta: 'Nuovi clienti', valore: 200 },
        { etichetta: 'Perdite', valore: -150 },
        { etichetta: 'Prezzi', valore: 50 },
        { etichetta: 'Finale', valore: 1100 },
      ]),
      ponte_ostile: serieAnalisi('Ponte', [
        { etichetta: MALEVOLA, valore: 10 },
        { etichetta: 'Finale', valore: 12 },
      ]),
      troppi_punti: serieAnalisi(
        'Troppi',
        Array.from({ length: 9 }, (_, i) => ({ etichetta: `Voce ${'a b c d e f g h i'.split(' ')[i]}`, valore: i + 1 })),
      ),
    },
  };
}

const slide = (...componenti) => ({ layout: 'prova-grafici', zone: { titolo: 'Prova dei grafici', contenuto: componenti } });

function genera(analisiProva, ...componenti) {
  const dir = creaPresentazione({ analisi: analisiProva ?? analisi(), specifica: conSlide(slide(...componenti)) });
  const r = esegui(['genera', dir, '--catalogo', catalogoProva]);
  assert.equal(r.codice, 0, `${r.out}${r.err}`);
  const html = leggi(dir, 'dist/index.html');
  const inizio = html.indexOf('<section class="slide slide-prova-grafici"');
  return { html: html.slice(inizio, html.indexOf('</section>', inizio)), dir };
}

function rifiutata(componente, atteso, analisiProva) {
  const dir = creaPresentazione({ analisi: analisiProva ?? analisi(), specifica: conSlide(slide(componente)) });
  const r = esegui(['valida', dir, '--catalogo', catalogoProva]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}${r.err}`);
  assert.match(r.err, atteso);
}

const voceTimeline = (titolo, data, stato = 'in-linea', extra = {}) => ({ titolo, data, stato, ...extra });
const rischio = (titolo, probabilita, impatto) => ({ titolo, probabilita, impatto });

describe('grafico-ciambella', () => {
  test('disegna un arco per ogni valore positivo, con legenda e totale al centro', () => {
    const { html } = genera(null, { componente: 'grafico-ciambella', serie: 'quote', totale: 'totale_budget' });
    assert.equal(html.match(/<circle class="fetta fetta-/g).length, 3);
    assert.match(html, /stroke-dasharray="49\.300 50\.700" stroke-dashoffset="0\.000"/);
    assert.match(html, /stroke-dasharray="29\.300 70\.700" stroke-dashoffset="-50\.000"/);
    assert.match(html, /<text class="totale-valore"[^>]*>100\u00a0€<\/text>/);
    assert.match(html, /<text class="totale-etichetta"[^>]*><tspan[^>]*>Budget<\/tspan><tspan[^>]*>totale<\/tspan><\/text>/);
    assert.match(html, /<span class="ciambella-nome">Centro<\/span><span class="ciambella-valore">30<\/span>/);
    assert.match(html, /aria-labelledby="[^"]+-t [^"]+-d"/);
    assert.match(html, /Grafico a ciambella/);
  });

  test('i valori non positivi restano in legenda ma non hanno arco', () => {
    const { html } = genera(null, { componente: 'grafico-ciambella', serie: 'quote' });
    assert.match(html, /<li class="ciambella-voce fetta-4 senza-arco">/);
    assert.doesNotMatch(html, /fetta fetta-4/);
    assert.doesNotMatch(html, /totale-valore/);
  });

  test('oltre 6 punti è rifiutato', () => {
    rifiutata({ componente: 'grafico-ciambella', serie: 'troppi_punti' }, /9 punti, massimo 6/);
  });

  test('senza serie è rifiutato', () => {
    rifiutata({ componente: 'grafico-ciambella' }, /serie/);
  });
});

describe('grafico-cascata', () => {
  test('disegna barre flottanti con raccordi e segni per le variazioni', () => {
    const { html } = genera(null, { componente: 'grafico-cascata', serie: 'ponte' });
    assert.equal(html.match(/<rect class="barra /g).length, 5);
    assert.equal(html.match(/<line class="raccordo"/g).length, 4);
    assert.equal(html.match(/<rect class="barra estremo"/g).length, 2);
    assert.match(html, /<rect class="barra su"/);
    assert.match(html, /<rect class="barra giu"/);
    assert.match(html, /<polygon class="segno su"/);
    assert.match(html, /<polygon class="segno giu"/);
    for (const testo of ['1.000', '200', '-150', '50', '1.100']) assert.match(html, new RegExp(`class="valore [a-z]+"[^>]*>${testo.replace('.', '\\.')}</text>`));
    assert.match(html, /Grafico a cascata/);
  });

  test('oltre 8 punti è rifiutato', () => {
    rifiutata({ componente: 'grafico-cascata', serie: 'troppi_punti' }, /9 punti, massimo 8/);
  });
});

describe('timeline', () => {
  const voci = [
    voceTimeline('Rilascio finale', 'data_rilascio', 'non-avviato', { nota: 'Messa in produzione' }),
    voceTimeline('Avvio progetto', 'data_avvio', 'completato'),
    voceTimeline('Pilota con utenti', 'data_pilota', 'a-rischio'),
  ];

  test('ordina per data, posiziona in proporzione e mostra stato a testo', () => {
    const { html } = genera(null, { componente: 'timeline', voci });
    const titoli = [...html.matchAll(/<strong class="tl-titolo">([^<]+)</g)].map((m) => m[1]);
    assert.deepEqual(titoli, ['Avvio progetto', 'Pilota con utenti', 'Rilascio finale']);
    const posizioni = [...html.matchAll(/--pos:([\d.]+)%/g)].map((m) => Number(m[1]));
    assert.ok(posizioni[0] < posizioni[1] && posizioni[1] < posizioni[2], posizioni.join(','));
    // 70 giorni su 300: il pilota sta prima del centro.
    assert.ok(posizioni[1] < (posizioni[0] + posizioni[2]) / 2, posizioni.join(','));
    assert.match(html, /<span class="tl-data">10\/01\/2024<\/span>/);
    assert.match(html, /<span class="stato-testo">A rischio<\/span>/);
    assert.match(html, /<span class="stato-testo">Completato<\/span>/);
    assert.match(html, /<ol class="timeline" aria-label="Timeline delle milestone"/);
    assert.match(html, /class="tl-voce sopra"[^>]*>.*?class="tl-voce sotto"/s);
  });

  test('con date uguali o senza date distribuisce in modo uniforme', () => {
    const { html } = genera(
      null,
      { componente: 'timeline', voci: [voceTimeline('Prima tappa', 'data_avvio'), voceTimeline('Seconda tappa', 'data_avvio'), voceTimeline('Terza tappa', 'data_avvio')] },
      { componente: 'timeline', voci: [voceTimeline('Tappa uno', 'crescita'), voceTimeline('Tappa due', 'ricavi_totale')] },
    );
    const posizioni = [...html.matchAll(/--pos:([\d.]+)%/g)].map((m) => Number(m[1]));
    assert.equal(posizioni.length, 5);
    assert.ok(Math.abs(posizioni[1] - (posizioni[0] + posizioni[2]) / 2) < 0.01, posizioni.join(','));
    assert.ok(posizioni[3] < posizioni[4]);
  });

  test('date vicine sono distanziate: le etichette alternate non si sovrappongono', () => {
    const { html } = genera(null, {
      componente: 'timeline',
      voci: [voceTimeline('Uno', 'data_avvio'), voceTimeline('Due', 'data_avvio'), voceTimeline('Tre', 'data_avvio'), voceTimeline('Quattro', 'data_rilascio')],
    });
    const posizioni = [...html.matchAll(/--pos:([\d.]+)%/g)].map((m) => Number(m[1]));
    const larghezza = Number(html.match(/--larghezza:(\d+)%/)[1]);
    for (let i = 2; i < posizioni.length; i++) assert.ok(posizioni[i] - posizioni[i - 2] >= larghezza - 0.01, posizioni.join(','));
  });

  test('una sola voce, otto voci, stato fuori vocabolario e titolo troppo lungo sono rifiutati', () => {
    rifiutata({ componente: 'timeline', voci: [voceTimeline('Sola tappa', 'data_avvio')] }, /almeno 2 voci/);
    rifiutata({ componente: 'timeline', voci: Array.from({ length: 8 }, (_, i) => voceTimeline(`Tappa ${'a b c d e f g h'.split(' ')[i]}`, 'data_avvio')) }, /8 voci, massimo 7/);
    rifiutata({ componente: 'timeline', voci: [voceTimeline('Uno', 'data_avvio', 'finito'), voceTimeline('Due', 'data_pilota')] }, /finito/);
    rifiutata({ componente: 'timeline', voci: [voceTimeline('Uno due tre quattro cinque sei sette', 'data_avvio'), voceTimeline('Due', 'data_pilota')] }, /parole/);
  });
});

describe('matrice-rischi', () => {
  const rischi = [
    rischio('Ritardo fornitore', 'alto', 'alto'),
    rischio('Budget insufficiente', 'medio', 'alto'),
    rischio('Turnover del team', 'basso', 'basso'),
    rischio('Dati incompleti', 'alto', 'alto'),
  ];

  test('colloca i rischi nelle celle per gravità e li elenca a testo', () => {
    const { html } = genera(null, { componente: 'matrice-rischi', rischi });
    assert.equal(html.match(/class="mr-cella /g).length, 9);
    assert.equal(html.match(/class="mr-cella gravita-alta"/g).length, 3);
    assert.equal(html.match(/<span class="mr-segno" style="--n:\d"><\/span>/g).length, 4);
    assert.match(html, /<ol class="mr-legenda" role="list">/);
    assert.match(html, /<span class="mr-titolo">Budget insufficiente<\/span><span class="mr-dettaglio">Probabilità: Medio · Impatto: Alto<\/span>/);
    // Probabilità alta in alto: la prima riga contiene le celle dei due rischi alto/alto, nell'ultima colonna.
    const prima = html.match(/<div class="mr-griglia"[^>]*>.*?<span class="mr-livello mr-livello-y">Alto<\/span>(.*?)<span class="mr-livello mr-livello-y">Medio/s)[1];
    const celle = prima.match(/<div class="mr-cella [^]*?<\/div>/g);
    assert.equal(celle.length, 3);
    assert.match(celle[2], /--n:1.*--n:4/s);
    assert.match(html, /mr-asse mr-asse-y">Probabilità</);
    assert.match(html, /mr-asse mr-asse-x">Impatto</);
  });

  test('oltre 8 rischi e livelli fuori vocabolario sono rifiutati', () => {
    rifiutata({ componente: 'matrice-rischi', rischi: Array.from({ length: 9 }, (_, i) => rischio(`Rischio ${'a b c d e f g h i'.split(' ')[i]}`, 'basso', 'basso')) }, /9 voci, massimo 8/);
    rifiutata({ componente: 'matrice-rischi', rischi: [rischio('Rischio unico', 'estremo', 'basso')] }, /estremo/);
  });
});

describe('barra-avanzamento', () => {
  test('riempie la barra solo per le percentuali, limitando a 0-100', () => {
    const { html } = genera(null, {
      componente: 'barra-avanzamento',
      voci: [
        { etichetta: 'Sviluppo', valore: 'avanz_a', stato: 'in-linea' },
        { etichetta: 'Collaudo', valore: 'avanz_b' },
        { etichetta: 'Formazione', valore: 'avanz_c', stato: 'in-ritardo' },
      ],
    });
    assert.match(html, /style="width:65\.00%"/);
    assert.match(html, /style="width:100\.00%"/);
    assert.equal(html.match(/class="ba-riempimento"/g).length, 2);
    assert.match(html, /<li class="ba-voce senza-barra" data-stato="in-ritardo">/);
    assert.match(html, /<span class="ba-valore">12\u00a0gg<\/span>/);
    assert.match(html, /<span class="ba-valore">140%<\/span>/);
    assert.match(html, /<span class="stato-testo">In linea<\/span>/);
    assert.match(html, /<ul class="barra-avanzamento" role="list" aria-label="Avanzamento">/);
  });

  test('oltre 6 voci e stato fuori vocabolario sono rifiutati', () => {
    const voce = { etichetta: 'Attività', valore: 'avanz_a' };
    rifiutata({ componente: 'barra-avanzamento', voci: Array(7).fill(voce) }, /7 voci, massimo 6/);
    rifiutata({ componente: 'barra-avanzamento', voci: [{ ...voce, stato: 'finito' }] }, /finito/);
  });
});

describe('sicurezza e numeri', () => {
  test('le etichette delle serie e dei valori sono escapate', () => {
    const dati = analisi();
    dati.valori.totale_budget.etichetta = MALEVOLA;
    const { html } = genera(
      dati,
      { componente: 'grafico-ciambella', serie: 'quote_ostili', totale: 'totale_budget' },
      { componente: 'grafico-cascata', serie: 'ponte_ostile' },
    );
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  });

  test('il testo dei componenti con liste è escapato', () => {
    const { html } = genera(
      null,
      { componente: 'timeline', voci: [voceTimeline(MALEVOLA, 'data_avvio'), voceTimeline('Seconda', 'data_pilota')] },
      { componente: 'matrice-rischi', rischi: [rischio(MALEVOLA, 'alto', 'basso')] },
      { componente: 'barra-avanzamento', voci: [{ etichetta: MALEVOLA, valore: 'avanz_a' }] },
    );
    assert.doesNotMatch(html, /<script>alert/);
  });

  test('a schermo compaiono solo numeri dell\'Analisi', () => {
    const { html } = genera(
      null,
      { componente: 'grafico-ciambella', serie: 'quote', totale: 'totale_budget' },
      { componente: 'grafico-cascata', serie: 'ponte' },
      { componente: 'timeline', voci: [voceTimeline('Avvio', 'data_avvio'), voceTimeline('Rilascio', 'data_rilascio')] },
    );
    const { html: altri } = genera(
      null,
      { componente: 'matrice-rischi', rischi: [rischio('Uno', 'alto', 'alto'), rischio('Due', 'basso', 'medio')] },
      { componente: 'barra-avanzamento', voci: [{ etichetta: 'Sviluppo', valore: 'avanz_a', stato: 'in-linea' }] },
    );
    const ammessi = new Set(['50', '30', '20', '0', '100', '1', '000', '200', '150', '1', '100', '10', '01', '2024', '05', '11', '65']);
    for (const pezzo of [html, altri]) {
      const testo = pezzo.replace(/<(title|desc)[^>]*>.*?<\/\1>/gs, ' ').replace(/<[^>]*>/g, ' ');
      for (const numero of testo.match(/\d+/g) ?? []) assert.ok(ammessi.has(numero), `numero non previsto a schermo: ${numero}`);
    }
    assert.doesNotMatch(altri, /<span class="mr-segno"[^>]*>\s*\d/);
  });
});
