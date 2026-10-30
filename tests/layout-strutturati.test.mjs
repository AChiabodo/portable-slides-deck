import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, conSlide, esegui, leggi } from './helpers.mjs';

function genera(...slide) {
  const dir = creaPresentazione({ specifica: conSlide(...slide) });
  const r = esegui(['genera', dir]);
  return { r, dir, html: r.codice === 0 ? leggi(dir, 'dist/index.html') : '' };
}

function rifiutata(slide, atteso) {
  const dir = creaPresentazione({ specifica: conSlide(slide) });
  const r = esegui(['valida', dir]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}`);
  assert.match(r.err, atteso);
}

const schede = (n) => ({
  componente: 'schede',
  voci: Array.from({ length: n }, (_, i) => ({ titolo: `Titolo ${'uno due tre quattro cinque sei sette'.split(' ')[i]}`, testo: 'Spiegazione breve' })),
});

describe('cornice delle slide', () => {
  test('ogni slide riporta il titolo della presentazione per il piè di pagina', () => {
    const { r, html } = genera({ layout: 'sezione', zone: { titolo: 'Risultati' } });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<section class="slide slide-sezione" id="slide-2"[^>]* data-titolo="Vendite del periodo">/);
  });

  test('il titolo della presentazione è escapato nell\'attributo', () => {
    const dir = creaPresentazione({ specifica: { ...conSlide(), titolo: 'Utili "netti" & ricavi' } });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    assert.match(leggi(dir, 'dist/index.html'), /data-titolo="Utili &quot;netti&quot; &amp; ricavi"/);
  });
});

describe('tema executive', () => {
  test('è selezionabile e definisce le variabili della cornice', () => {
    const dir = creaPresentazione({ specifica: { ...conSlide(), tema: 'executive' } });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.match(html, /data-tema="executive"/);
    const css = leggi(dir, 'dist/assets/presentazione.css');
    assert.match(css, /--colore-accento-tenue: #[0-9a-f]{6};/);
    assert.match(css, /--ombra-scheda:/);
  });
});

describe('layout griglia-schede', () => {
  test('rende le schede numerate con evidenza opzionale', () => {
    const { r, html } = genera({
      layout: 'griglia-schede',
      zone: {
        occhiello: 'Il modello',
        titolo: 'Tre idee da ricordare',
        introduzione: 'Sono indipendenti.',
        schede: [
          {
            componente: 'schede',
            voci: [
              { titolo: 'Crescita', evidenza: '{{crescita}}', testo: 'Rispetto all\'anno scorso' },
              { titolo: 'Ricavi', testo: 'Totale del periodo' },
            ],
          },
        ],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<h2 id="slide-2-titolo">Tre idee da ricordare<\/h2>/);
    assert.match(html, /class="occhiello">Il modello</);
    assert.match(html, /<span class="scheda-numero">01<\/span><h3 class="scheda-titolo">Crescita<\/h3><p class="scheda-evidenza">12,3%<\/p>/);
    assert.match(html, /<span class="scheda-numero">02<\/span><h3 class="scheda-titolo">Ricavi<\/h3><p class="scheda-testo">/);
  });

  test('oltre 6 schede è rifiutato', () => {
    rifiutata({ layout: 'griglia-schede', zone: { titolo: 'Troppe schede', schede: [schede(7)] } }, /7 voci, massimo 6/);
  });

  test('un numero scritto a mano in un\'evidenza è rifiutato', () => {
    rifiutata(
      {
        layout: 'griglia-schede',
        zone: { titolo: 'Una scheda', schede: [{ componente: 'schede', voci: [{ titolo: 'Uno', evidenza: '35×', testo: 'a' }, { titolo: 'Due', testo: 'b' }] }] },
      },
      /35/,
    );
  });
});

describe('layout percorso-fasi', () => {
  test('rende le fasi come flusso ordinato con dettaglio', () => {
    const { r, html } = genera({
      layout: 'percorso-fasi',
      zone: {
        titolo: 'Come funziona',
        fasi: [
          {
            componente: 'flusso',
            passi: [
              { etichetta: 'Ingresso', titolo: 'Raccolta', testo: 'Dati grezzi' },
              { titolo: 'Analisi' },
            ],
          },
        ],
        dettaglio: [{ componente: 'nota', etichetta: 'Nota', testo: 'Crescita {{crescita}}' }],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<ol class="flusso"><li class="passo"><span class="passo-etichetta">Ingresso<\/span><span class="passo-titolo">Raccolta<\/span><span class="passo-testo">Dati grezzi<\/span><\/li><li class="passo"><span class="passo-titolo">Analisi<\/span><\/li><\/ol>/);
    assert.match(html, /<aside class="nota"><span class="nota-etichetta">Nota<\/span><p class="nota-testo">Crescita 12,3%<\/p><\/aside>/);
  });

  test('un solo passo è rifiutato', () => {
    rifiutata(
      { layout: 'percorso-fasi', zone: { titolo: 'Un passo', fasi: [{ componente: 'flusso', passi: [{ titolo: 'Solo' }] }] } },
      /"passi": almeno 2 voci/,
    );
  });
});

describe('layout dashboard-analisi', () => {
  const linee = [
    { nome: 'Ricavi', serie: 'ricavi_per_regione' },
    { nome: 'Confronto', serie: 'ricavi_per_regione' },
  ];

  test('rende cruscotto con grafico a linee, kpi, commento e nota', () => {
    const { r, html } = genera({
      layout: 'dashboard-analisi',
      zone: {
        occhiello: 'Risultati',
        titolo: 'Crescita a {{crescita}}',
        principale: [{ componente: 'grafico-linee', titolo: 'Per regione', linee }],
        kpi: [{ componente: 'kpi', voci: [{ etichetta: 'Crescita', valore: 'crescita' }] }],
        commento: 'Ricavi totali {{ricavi_totale}}.',
        nota: [{ componente: 'nota', etichetta: 'Attenzione', testo: 'Stime preliminari' }],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<h2 id="slide-2-titolo">Crescita a 12,3%<\/h2>/);
    assert.match(html, /<figure class="grafico grafico-linee"><figcaption>Per regione<\/figcaption><ul class="legenda">/);
    assert.equal(html.match(/<polyline class="linea linea-\d"/g).length, 2);
    assert.match(html, /class="dash-commento pannello">Ricavi totali 1\.234,5\u00a0€\./);
    assert.match(html, /<div class="dash-nota"><aside class="nota">/);
  });

  test('rende la tabella con una colonna per serie e righe dalle etichette', () => {
    const { r, html } = genera({
      layout: 'dashboard-analisi',
      zone: {
        titolo: 'Dettaglio per regione',
        principale: [
          {
            componente: 'tabella-serie',
            intestazione: 'Regione',
            colonne: [
              { titolo: 'Ricavi', serie: 'ricavi_per_regione' },
              { titolo: 'Controllo', serie: 'ricavi_per_regione' },
            ],
          },
        ],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<th scope="col">Regione<\/th><th scope="col">Ricavi<\/th><th scope="col">Controllo<\/th>/);
    assert.match(html, /<tr><th scope="row">Nord<\/th><td><span class="cella-valore">5\.200\u00a0€<\/span>/);
    assert.equal(html.match(/<tr><th scope="row">/g).length, 3);
    assert.match(html, /<i style="width:100\.0%"><\/i>/);
  });

  test('una serie inesistente nella tabella è rifiutata', () => {
    rifiutata(
      {
        layout: 'dashboard-analisi',
        zone: { titolo: 'Tabella', principale: [{ componente: 'tabella-serie', intestazione: 'Regione', colonne: [{ titolo: 'X', serie: 'non_esiste' }] }] },
      },
      /non_esiste/,
    );
  });

  test('senza kpi né commento il pannello occupa tutta la larghezza', () => {
    const { r, html } = genera({
      layout: 'dashboard-analisi',
      zone: { titolo: 'Solo grafico', principale: [{ componente: 'grafico-barre', serie: 'ricavi_per_regione' }] },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="dash-corpo dash-solo"/);
    assert.doesNotMatch(html, /dash-lato/);
  });
});

describe('layout confronto-affiancato', () => {
  test('rende due pannelli con intestazione e componenti', () => {
    const { r, html } = genera({
      layout: 'confronto-affiancato',
      zone: {
        titolo: 'Prima e dopo',
        'intestazione-sinistra': 'Prima',
        sinistra: [{ componente: 'flusso', passi: [{ titolo: 'Uno' }, { titolo: 'Due' }] }],
        'intestazione-destra': 'Dopo',
        destra: [{ componente: 'nota', etichetta: 'Esito', testo: 'Crescita {{crescita}}' }],
        conclusione: [{ componente: 'nota', etichetta: 'Sintesi', testo: 'Meglio dopo' }],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<h3 class="affiancato-intestazione">Prima<\/h3><div class="affiancato-contenuto"><ol class="flusso">/);
    assert.match(html, /<h3 class="affiancato-intestazione">Dopo<\/h3><div class="affiancato-contenuto"><aside class="nota">/);
    assert.match(html, /<div class="affiancato-conclusione"><aside class="nota">/);
  });
});

describe('layout sintesi', () => {
  test('rende messaggio, kpi e punti numerabili', () => {
    const { r, html } = genera({
      layout: 'sintesi',
      zone: {
        occhiello: 'Conclusioni',
        titolo: 'Si può crescere ancora',
        messaggio: 'Crescita a {{crescita}}.',
        kpi: [{ componente: 'kpi', voci: [{ etichetta: 'Ricavi', valore: 'ricavi_totale' }] }],
        punti: ['Primo punto', 'Secondo punto'],
      },
    });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<p class="sintesi-messaggio">Crescita a 12,3%\.<\/p>/);
    assert.match(html, /<ol class="sintesi-punti"><li>Primo punto<\/li><li>Secondo punto<\/li><\/ol>/);
  });

  test('un solo punto è rifiutato', () => {
    rifiutata({ layout: 'sintesi', zone: { titolo: 'Sintesi', punti: ['Solo uno'] } }, /"punti": almeno 2 voci/);
  });
});
