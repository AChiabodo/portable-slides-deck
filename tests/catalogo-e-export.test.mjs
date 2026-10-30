import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  creaPresentazione,
  creaCatalogo,
  analisiBase,
  conSlide,
  slideKpi,
  esegui,
  esiste,
  leggi,
} from './helpers.mjs';

function rifiutata(opzioni, atteso, extra = []) {
  const dir = creaPresentazione(opzioni);
  const r = esegui(['valida', dir, ...extra]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}${r.err}`);
  assert.match(r.err, atteso);
}

describe('valida: Analisi', () => {
  test('ogni valore deve dichiarare la provenienza', () => {
    const analisi = analisiBase();
    delete analisi.valori.crescita.provenienza;
    rifiutata({ analisi }, /analisi\.json.*"crescita".*provenienza/);
  });

  test('provenienza incompleta, numero non finito, formato sconosciuto', () => {
    const analisi = analisiBase();
    delete analisi.valori.ricavi_totale.provenienza.operazione;
    analisi.valori.crescita.valore = 'molto';
    analisi.valori.data_chiusura.formato = { tipo: 'esotico' };
    const dir = creaPresentazione({ analisi });
    const r = esegui(['valida', dir]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /"ricavi_totale".*provenienza.*operazione/);
    assert.match(r.err, /"crescita".*numero/);
    assert.match(r.err, /"data_chiusura".*formato/);
  });

  test('serie senza punti e identificatori non validi', () => {
    const analisi = analisiBase();
    analisi.serie.ricavi_per_regione.punti = [];
    analisi.valori['id non valido'] = analisi.valori.crescita;
    const dir = creaPresentazione({ analisi });
    const r = esegui(['valida', dir]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /serie "ricavi_per_regione".*almeno un punto/);
    assert.match(r.err, /identificatore "id non valido"/);
  });
});

describe('valida: Tema', () => {
  test('un Tema con contrasto sotto WCAG AA è rifiutato', () => {
    const catalogo = creaCatalogo({
      'temi/debole/tema.json': {
        nome: 'debole',
        variabili: { 'colore-carta': '#ffffff', 'colore-tenue': '#999999' },
        contrasti: [['colore-tenue', 'colore-carta']],
      },
    });
    rifiutata(
      { specifica: { ...conSlide(), tema: 'debole' } },
      /tema "debole".*contrasto 2[.,]\d+:1.*"colore-tenue".*"colore-carta".*4,5:1/,
      ['--catalogo', catalogo],
    );
  });

  test('un contrasto che cita una variabile non definita è un errore', () => {
    const catalogo = creaCatalogo({
      'temi/rotto/tema.json': {
        nome: 'rotto',
        variabili: { 'colore-carta': '#ffffff' },
        contrasti: [['colore-fantasma', 'colore-carta']],
      },
    });
    rifiutata({ specifica: { ...conSlide(), tema: 'rotto' } }, /tema "rotto".*"colore-fantasma".*non definit/, ['--catalogo', catalogo]);
  });

  test('il Tema di partenza rispetta WCAG AA', () => {
    const dir = creaPresentazione();
    assert.equal(esegui(['valida', dir]).codice, 0);
  });
});

describe('Catalogo estendibile', () => {
  const citazione = () =>
    creaCatalogo({
      'componenti/citazione/manifest.json': {
        nome: 'citazione',
        scopo: 'Una frase in evidenza.',
        props: { testo: { tipo: 'testo', obbligatoria: true, maxParole: 30 } },
      },
      'componenti/citazione/render.mjs': 'export default ({ testo }) => `<blockquote class="citazione">${testo}</blockquote>`;',
      'componenti/citazione/stile.css': '.citazione { font-style: italic; }',
      'layouts/solo-citazione/manifest.json': {
        nome: 'solo-citazione',
        scopo: 'Titolo e una citazione.',
        zone: [
          { nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true },
          { nome: 'citazione', tipo: 'componenti', ammessi: ['citazione'], min: 1, max: 1 },
        ],
      },
      'layouts/solo-citazione/render.mjs': 'export default ({ zone }) => `${zone.titolo}<div>${zone.citazione}</div>`;',
    });
  const specifica = () =>
    conSlide({
      layout: 'solo-citazione',
      zone: { titolo: 'Dicono di noi', citazione: [{ componente: 'citazione', testo: 'Ricavi a {{ricavi_totale}}' }] },
    });

  test('un componente e un layout aggiunti con manifest, markup e stile sono usabili senza toccare il motore', () => {
    const dir = creaPresentazione({ specifica: specifica() });
    const r = esegui(['genera', dir, '--catalogo', citazione()]);
    assert.equal(r.codice, 0, r.err);
    assert.ok(leggi(dir, 'dist/index.html').includes('<blockquote class="citazione">Ricavi a 1.234,5\u00a0€</blockquote>'));
    assert.match(leggi(dir, 'dist/assets/presentazione.css'), /\.citazione \{ font-style: italic; \}/);
  });

  test('senza il catalogo aggiuntivo gli stessi elementi sono fuori dal Catalogo', () => {
    rifiutata({ specifica: specifica() }, /layout "solo-citazione" non presente nel Catalogo/);
  });

  test('un manifest incompleto o un nome già usato sono segnalati', () => {
    const incompleto = creaCatalogo({
      'componenti/senza-scopo/manifest.json': { nome: 'senza-scopo', props: {} },
      'componenti/senza-scopo/render.mjs': 'export default () => "";',
    });
    rifiutata({}, /componente "senza-scopo".*manifest non valido.*scopo/, ['--catalogo', incompleto]);
    const duplicato = creaCatalogo({
      'componenti/kpi/manifest.json': { nome: 'kpi', scopo: 'doppione', props: {} },
      'componenti/kpi/render.mjs': 'export default () => "";',
    });
    rifiutata({}, /componente "kpi".*già definito/, ['--catalogo', duplicato]);
  });
});

describe('Catalogo: Temi e lingue', () => {
  test('un Tema o una lingua con nome già definito, o senza nome, sono segnalati', () => {
    const tema = { variabili: { 'colore-carta': '#ffffff' }, contrasti: [] };
    rifiutata({}, /tema "doppione".*nome "quiet-editorial" già definito/, [
      '--catalogo',
      creaCatalogo({ 'temi/doppione/tema.json': { ...tema, nome: 'quiet-editorial' } }),
    ]);
    rifiutata({}, /tema "senza-nome".*nome mancante o non valido/, [
      '--catalogo',
      creaCatalogo({ 'temi/senza-nome/tema.json': tema }),
    ]);
    rifiutata({}, /lingua "it".*già definita/, [
      '--catalogo',
      creaCatalogo({ 'lingue/it.json': { codice: 'it' } }),
    ]);
  });
});

describe('Lingua', () => {
  const inglese = () =>
    creaCatalogo({
      'lingue/en.json': {
        codice: 'en',
        ui: { saltaAlContenuto: 'Skip to content', avanzamento: 'Progress', schermoIntero: 'Full screen' },
        grafici: { barre: 'Bar chart' },
        formato: {
          separatoreDecimale: '.',
          separatoreMigliaia: ',',
          separatoreUnita: '\u00a0',
          suffissoPercentuale: '%',
          data: 'MM/dd/yyyy',
        },
      },
    });

  test('formati e testi dell\'interfaccia vengono dalla lingua, non dai componenti', () => {
    const specifica = {
      ...conSlide(
        slideKpi([{ etichetta: 'Revenue', valore: 'ricavi_totale' }, { etichetta: 'Closing', valore: 'data_chiusura' }], {
          grafico: [{ componente: 'grafico-barre', serie: 'ricavi_per_regione' }],
        }),
      ),
      lingua: 'en',
    };
    const dir = creaPresentazione({ specifica });
    const r = esegui(['genera', dir, '--catalogo', inglese()]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.match(html, /<html lang="en"/);
    assert.ok(html.includes('1,234.5\u00a0€'));
    assert.ok(html.includes('03/07/2024'));
    assert.match(html, /Full screen/);
    assert.match(html, /Bar chart: Nord: 5,200\u00a0€/);
    assert.doesNotMatch(html, /Schermo intero|Grafico a barre/);
  });
});

describe('esporta-singolo', () => {
  test('produce un unico file HTML senza riferimenti a file esterni', () => {
    const dir = creaPresentazione({ specifica: conSlide(slideKpi([{ etichetta: 'Ricavi', valore: 'ricavi_totale' }])) });
    const r = esegui(['esporta-singolo', dir]);
    assert.equal(r.codice, 0, r.err);
    assert.ok(esiste(dir, 'dist/presentazione.html'));
    const html = leggi(dir, 'dist/presentazione.html');
    assert.doesNotMatch(html, /<link\b/);
    assert.doesNotMatch(html, /<script[^>]*\bsrc=/);
    assert.match(html, /<style>[\s\S]*--colore-carta:[\s\S]*<\/style>/);
    assert.match(html, /<script>[\s\S]*keydown[\s\S]*<\/script>/);
    assert.ok(html.includes('1.234,5\u00a0€'));
  });

  test('non esporta una Specifica non valida', () => {
    const dir = creaPresentazione({ specifica: conSlide({ layout: 'inesistente', zone: {} }) });
    const r = esegui(['esporta-singolo', dir]);
    assert.equal(r.codice, 1);
    assert.equal(esiste(dir, 'dist/presentazione.html'), false);
  });
});
