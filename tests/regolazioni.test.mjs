import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { creaPresentazione, creaCatalogo, conSlide, esegui, leggi, RADICE } from './helpers.mjs';

const RENDER_LAYOUT =
  'export default ({ zone, regolazioni }) => `${zone.titolo}<div class="due" data-ordine="${regolazioni.ordine}" data-rapporto="${regolazioni.rapporto}">${zone.corpo}</div>`;';
const RENDER_COMPONENTE =
  'export default ({ testo }, { regolazioni }) => `<blockquote data-altezza="${regolazioni.altezza}">${testo}</blockquote>`;';

const catalogoRegolabile = () =>
  creaCatalogo({
    'componenti/citazione/manifest.json': {
      nome: 'citazione',
      scopo: 'Una frase.',
      props: { testo: { tipo: 'testo', obbligatoria: true } },
      regolazioni: { altezza: { valori: ['compatta', 'standard', 'alta'], predefinito: 'standard' } },
    },
    'componenti/citazione/render.mjs': RENDER_COMPONENTE,
    'layouts/due-box/manifest.json': {
      nome: 'due-box',
      scopo: 'Titolo e uno o due componenti.',
      zone: [
        { nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true },
        { nome: 'corpo', tipo: 'componenti', ammessi: ['citazione'], min: 1, max: 2 },
      ],
      regolazioni: {
        ordine: { valori: ['normale', 'invertito'], predefinito: 'normale' },
        rapporto: { valori: ['1-1', '2-1'], predefinito: '1-1', richiede: { zona: 'corpo', min: 2 } },
      },
    },
    'layouts/due-box/render.mjs': RENDER_LAYOUT,
  });

const citazione = (extra = {}) => ({ componente: 'citazione', testo: 'Una frase', ...extra });
const slide = (extra = {}, corpo = [citazione()]) => ({
  layout: 'due-box',
  zone: { titolo: 'Titolo', corpo },
  ...extra,
});

function rifiutata(specifica, atteso) {
  const r = esegui(['valida', creaPresentazione({ specifica }), '--catalogo', catalogoRegolabile()]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}${r.err}`);
  assert.match(r.err, atteso);
}

function html(specifica) {
  const dir = creaPresentazione({ specifica });
  const r = esegui(['genera', dir, '--catalogo', catalogoRegolabile()]);
  assert.equal(r.codice, 0, r.err);
  return leggi(dir, 'dist/index.html');
}

describe('Regolazioni: validazione', () => {
  test('un valore dell\'elenco è accettato sulla slide e sul Componente', () => {
    const spec = conSlide(slide({ regolazioni: { ordine: 'invertito' } }, [citazione({ regolazioni: { altezza: 'alta' } })]));
    const r = esegui(['valida', creaPresentazione({ specifica: spec }), '--catalogo', catalogoRegolabile()]);
    assert.equal(r.codice, 0, r.err);
  });

  test('un valore fuori elenco è rifiutato con gli ammessi', () => {
    rifiutata(conSlide(slide({ regolazioni: { ordine: 'sottosopra' } })), /slide 2 › regolazione "ordine": valore "sottosopra" non ammesso \(ammessi: "normale", "invertito"\)/);
    rifiutata(conSlide(slide({}, [citazione({ regolazioni: { altezza: 'enorme' } })])), /componente 1 \(citazione\) › regolazione "altezza": valore "enorme" non ammesso/);
  });

  test('una Regolazione non dichiarata è rifiutata', () => {
    rifiutata(conSlide(slide({ regolazioni: { colore: 'rosso' } })), /regolazione "colore": non prevista da "due-box" \(previste: "ordine", "rapporto"\)/);
    rifiutata(
      conSlide({ layout: 'copertina', zone: { titolo: 'T' }, regolazioni: { ordine: 'normale' } }),
      /non prevista da "copertina" \(nessuna Regolazione disponibile\)/,
    );
  });

  test('regolazioni deve essere un oggetto', () => {
    rifiutata(conSlide(slide({ regolazioni: ['ordine'] })), /regolazioni: deve essere un oggetto/);
  });

  test('"richiede": una Regolazione dipendente dal contenuto è rifiutata se la zona ha meno componenti', () => {
    rifiutata(conSlide(slide({ regolazioni: { rapporto: '2-1' } })), /regolazione "rapporto": richiede almeno 2 componenti nella zona "corpo" \(presenti: 1\)/);
    const spec = conSlide(slide({ regolazioni: { rapporto: '2-1' } }, [citazione(), citazione()]));
    assert.equal(esegui(['valida', creaPresentazione({ specifica: spec }), '--catalogo', catalogoRegolabile()]).codice, 0);
  });

  test('il valore predefinito non ha bisogno del contenuto richiesto', () => {
    const spec = conSlide(slide({ regolazioni: { rapporto: '1-1' } }));
    assert.equal(esegui(['valida', creaPresentazione({ specifica: spec }), '--catalogo', catalogoRegolabile()]).codice, 0);
  });
});

describe('Regolazioni: manifest', () => {
  const conManifest = (regolazioni, extra = {}) =>
    creaCatalogo({
      'componenti/x/manifest.json': { nome: 'x', scopo: 'x', props: {}, regolazioni, ...extra },
      'componenti/x/render.mjs': 'export default () => "";',
    });
  const errori = (catalogo) => esegui(['valida', creaPresentazione(), '--catalogo', catalogo]).err;

  test('predefinito fuori elenco, valori insufficienti o duplicati sono segnalati', () => {
    assert.match(errori(conManifest({ a: { valori: ['uno', 'due'], predefinito: 'tre' } })), /regolazione "a": "predefinito" deve essere uno dei valori/);
    assert.match(errori(conManifest({ a: { valori: ['uno'], predefinito: 'uno' } })), /regolazione "a": "valori" deve elencare almeno 2 valori/);
    assert.match(errori(conManifest({ a: { valori: ['uno', 'uno'], predefinito: 'uno' } })), /duplicati/);
  });

  test('"richiede" è previsto solo per i Layout e deve citare una zona di componenti', () => {
    const richiede = { zona: 'corpo', min: 2 };
    assert.match(errori(conManifest({ a: { valori: ['uno', 'due'], predefinito: 'uno', richiede } })), /"richiede" è previsto solo per i Layout/);
    const layout = creaCatalogo({
      'layouts/y/manifest.json': {
        nome: 'y',
        scopo: 'y',
        zone: [{ nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true }],
        regolazioni: { a: { valori: ['uno', 'due'], predefinito: 'uno', richiede: { zona: 'titolo', min: 2 } } },
      },
      'layouts/y/render.mjs': 'export default () => "";',
    });
    assert.match(errori(layout), /"richiede" deve citare una zona di tipo componenti/);
  });

  test('"regolazioni" è un nome riservato tra le proprietà', () => {
    const catalogo = creaCatalogo({
      'componenti/x/manifest.json': { nome: 'x', scopo: 'x', props: { regolazioni: { tipo: 'testo' } } },
      'componenti/x/render.mjs': 'export default () => "";',
    });
    assert.match(errori(catalogo), /"regolazioni" è un nome riservato/);
  });
});

describe('Regolazioni: render', () => {
  test('il render riceve i predefiniti se la Specifica non indica nulla', () => {
    const h = html(conSlide(slide()));
    assert.match(h, /data-ordine="normale" data-rapporto="1-1"/);
    assert.match(h, /<blockquote data-altezza="standard">/);
  });

  test('il render riceve i valori scelti; solo quelli non predefiniti diventano attributi della slide', () => {
    const h = html(conSlide(slide({ regolazioni: { ordine: 'invertito', rapporto: '1-1' } }, [citazione({ regolazioni: { altezza: 'alta' } })])));
    assert.match(h, /data-ordine="invertito"/);
    assert.match(h, /<blockquote data-altezza="alta">/);
    assert.match(h, /<section class="slide slide-due-box"[^>]* data-reg-ordine="invertito">/);
    assert.ok(!h.includes('data-reg-rapporto'));
  });

  test('esplicitare i valori predefiniti non cambia l\'HTML', () => {
    const senza = html(conSlide(slide()));
    const esplicite = html(conSlide(slide({ regolazioni: { ordine: 'normale', rapporto: '1-1' } }, [citazione({ regolazioni: { altezza: 'standard' } })])));
    assert.equal(esplicite, senza);
  });
});

describe('Regolazioni: compatibilità', () => {
  // La verifica byte per byte con la baseline è stata fatta a mano al passo 1; qui resta la garanzia strutturale.
  for (const nome of ['vendite', 'catalogo-demo']) {
    test(`l'esempio ${nome} si genera senza errori e senza attributi di Regolazione`, () => {
      const dir = join(mkdtempSync(join(tmpdir(), 'regr-')), nome);
      cpSync(join(RADICE, 'esempi', nome), dir, { recursive: true });
      const r = esegui(['genera', dir]);
      assert.equal(r.codice, 0, r.err);
      assert.ok(!leggi(dir, 'dist/index.html').includes('data-reg-'));
    });
  }
});
