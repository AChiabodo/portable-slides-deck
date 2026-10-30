import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, creaCatalogo, conSlide, esegui, leggi } from './helpers.mjs';

// Componente di prova: stampa la scelta tradotta e il valore grezzo che il motore passa al render.
const catalogoProva = (props = {}) =>
  creaCatalogo({
    'componenti/prova/manifest.json': {
      nome: 'prova',
      scopo: 'Prova delle prop scelta e valore.',
      props: {
        stato: { tipo: 'scelta', obbligatoria: true, opzioni: ['verde', 'rosso'], vocabolario: 'stato-prova' },
        valore: { tipo: 'valore', obbligatoria: true },
        ...props,
      },
    },
    'componenti/prova/render.mjs':
      'export default ({ stato, valore }) => `<p class="prova" data-stato="${stato.valore}" data-numero="${valore.numero}" data-formato="${valore.formato}">${stato.testo}|${valore.testo}</p>`;',
    'layouts/prova/manifest.json': {
      nome: 'prova',
      scopo: 'Titolo e un componente di prova.',
      zone: [
        { nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true },
        { nome: 'corpo', tipo: 'componenti', ammessi: ['prova'], min: 1, max: 1 },
      ],
    },
    'layouts/prova/render.mjs': 'export default ({ zone }) => `${zone.titolo}${zone.corpo}`;',
    'lingue/xx.json': {
      codice: 'xx',
      scelte: { 'stato-prova': { verde: 'Tutto <ok>', rosso: 'Problema' } },
      formato: { separatoreDecimale: ',', separatoreMigliaia: '.', separatoreUnita: ' ', suffissoPercentuale: '%', data: 'dd/MM/yyyy' },
    },
  });

const slideProva = (stato, valore = 'ricavi_totale') =>
  conSlide({ layout: 'prova', zone: { titolo: 'Prova', corpo: [{ componente: 'prova', stato, valore }] } });

const specificaLingua = (stato, valore) => ({ ...slideProva(stato, valore), lingua: 'xx' });

describe('prop scelta', () => {
  test('un valore dell\'elenco è reso con l\'etichetta della lingua, con escape', () => {
    const dir = creaPresentazione({ specifica: specificaLingua('verde') });
    const r = esegui(['genera', dir, '--catalogo', catalogoProva()]);
    assert.equal(r.codice, 0, r.err);
    assert.ok(leggi(dir, 'dist/index.html').includes('data-stato="verde"'));
    assert.ok(leggi(dir, 'dist/index.html').includes('Tutto &lt;ok&gt;|'));
  });

  test('un valore fuori dall\'elenco è rifiutato dal validatore', () => {
    const dir = creaPresentazione({ specifica: specificaLingua('giallo') });
    const r = esegui(['valida', dir, '--catalogo', catalogoProva()]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /"stato".*"giallo" non ammesso \(ammessi: "verde", "rosso"\)/);
  });

  test('un manifest con opzioni o vocabolario mancanti è rifiutato', () => {
    const rotto = creaCatalogo({
      'componenti/rotto/manifest.json': {
        nome: 'rotto',
        scopo: 'scelta senza opzioni',
        props: { stato: { tipo: 'scelta', opzioni: ['solo-una'] } },
      },
      'componenti/rotto/render.mjs': 'export default () => "";',
    });
    const r = esegui(['valida', creaPresentazione(), '--catalogo', rotto]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /componente "rotto".*"stato".*almeno 2 valori/);
    assert.match(r.err, /componente "rotto".*"stato".*"vocabolario"/);
  });

  test('un tipo di prop sconosciuto nel manifest è rifiutato', () => {
    const rotto = creaCatalogo({
      'componenti/esotico/manifest.json': { nome: 'esotico', scopo: 'tipo inventato', props: { x: { tipo: 'magia' } } },
      'componenti/esotico/render.mjs': 'export default () => "";',
    });
    const r = esegui(['valida', creaPresentazione(), '--catalogo', rotto]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /componente "esotico".*tipo di proprietà non valido/);
  });
});

describe('prop valore', () => {
  test('il render riceve anche il numero grezzo e il formato, oltre al testo formattato', () => {
    const dir = creaPresentazione({ specifica: specificaLingua('rosso', 'crescita') });
    const r = esegui(['genera', dir, '--catalogo', catalogoProva()]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.ok(html.includes('data-numero="12.34" data-formato="percentuale"'));
    assert.ok(html.includes('|12,3%'));
  });

  test('una data arriva come testo AAAA-MM-GG con formato data', () => {
    const dir = creaPresentazione({ specifica: specificaLingua('verde', 'data_chiusura') });
    const r = esegui(['genera', dir, '--catalogo', catalogoProva()]);
    assert.equal(r.codice, 0, r.err);
    assert.ok(leggi(dir, 'dist/index.html').includes('data-numero="2024-03-07" data-formato="data"'));
  });
});
