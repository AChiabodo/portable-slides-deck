import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RADICE, creaCatalogo, creaPresentazione, conSlide, esegui, leggi } from './helpers.mjs';
import { rapportoContrasto, SOGLIA_AA } from '../tools/lib/contrasto.mjs';

// Valuta le regole `sfondo: enfasi` di base.css sui colori di ogni Tema, senza duplicare le formule nel test.
const CSS = readFileSync(join(RADICE, 'design-system', 'assets', 'base.css'), 'utf8');
const dichiarazioni = (corpo) =>
  Object.fromEntries(
    corpo.split(';').map((r) => r.trim()).filter((r) => r.startsWith('--')).map((r) => {
      const i = r.indexOf(':');
      return [r.slice(2, i).trim(), r.slice(i + 1).trim()];
    }),
  );
const radice = Object.assign({}, ...[...CSS.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => dichiarazioni(m[1])));
const enfasi = dichiarazioni(CSS.match(/\.slide\[data-reg-sfondo="enfasi"\]\s*\{([^}]*)\}/)[1]);

const TEMI = readdirSync(join(RADICE, 'design-system', 'temi')).map((nome) =>
  JSON.parse(readFileSync(join(RADICE, 'design-system', 'temi', nome, 'tema.json'), 'utf8')),
);

function argomenti(testo) {
  const parti = [];
  let livello = 0;
  let corrente = '';
  for (const c of testo) {
    if (c === '(') livello++;
    if (c === ')') livello--;
    if (c === ',' && livello === 0) {
      parti.push(corrente.trim());
      corrente = '';
    } else corrente += c;
  }
  return [...parti, corrente.trim()];
}

function valuta(espressione, tema, ambito) {
  const e = espressione.trim();
  if (e.startsWith('#')) {
    const pieno = e.length === 4 ? [...e.slice(1)].map((c) => c + c).join('') : e.slice(1);
    return [0, 2, 4].map((i) => parseInt(pieno.slice(i, i + 2), 16));
  }
  const variabile = e.match(/^var\(--([\w-]+)\)$/);
  if (variabile) {
    const nome = variabile[1];
    if (ambito === 'enfasi' && nome in enfasi) return valuta(enfasi[nome], tema, 'enfasi');
    if (nome in radice) return valuta(radice[nome], tema, 'radice');
    assert.ok(nome in tema.variabili, `variabile --${nome} non definita`);
    return valuta(tema.variabili[nome], tema, 'radice');
  }
  const miscela = e.match(/^color-mix\(in srgb,(.*)\)$/s);
  assert.ok(miscela, `espressione non gestita dal test: ${e}`);
  const [a, b] = argomenti(miscela[1]).map((arg) => {
    const m = arg.match(/^(.*?)(?:\s+([\d.]+)%)?$/s);
    return { colore: valuta(m[1], tema, ambito), percentuale: m[2] === undefined ? undefined : Number(m[2]) };
  });
  const pa = a.percentuale ?? (b.percentuale === undefined ? 50 : 100 - b.percentuale);
  const pb = b.percentuale ?? 100 - pa;
  return a.colore.map((v, i) => Math.round((v * pa + b.colore[i] * pb) / (pa + pb)));
}

const esadecimale = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const colore = (tema, nome) => esadecimale(valuta(`var(--${nome})`, tema, 'enfasi'));

const SEMANTICI = [
  'accento-secondario', 'positivo', 'negativo', 'stato-ok', 'stato-attenzione', 'stato-critico', 'stato-neutro',
];
const COPPIE = [
  ['inchiostro', 'carta'], ['inchiostro', 'superficie'], ['inchiostro', 'accento-tenue'],
  ['tenue', 'carta'], ['tenue', 'superficie'],
  ['accento', 'carta'], ['accento', 'superficie'], ['accento', 'accento-tenue'],
  ...SEMANTICI.flatMap((s) => [[s, 'carta'], [s, 'superficie']]),
];

describe('Regolazione sfondo: enfasi', () => {
  for (const tema of TEMI) {
    test(`testo, accenti e Stati restano leggibili (WCAG AA) con il Tema ${tema.nome}`, () => {
      for (const [primo, secondo] of COPPIE) {
        const a = colore(tema, `colore-${primo}`);
        const b = colore(tema, `colore-${secondo}`);
        const rapporto = rapportoContrasto(a, b);
        assert.ok(
          rapporto >= SOGLIA_AA,
          `${tema.nome}: colore-${primo} (${a}) su colore-${secondo} (${b}) ha contrasto ${rapporto.toFixed(2)}:1, sotto ${SOGLIA_AA}:1`,
        );
      }
    });
  }
});

const LAYOUT_CON_SFONDO = [
  'dashboard-analisi', 'risultato-grafico-commento', 'griglia-schede', 'due-colonne', 'tre-colonne',
];

describe('Regolazione sfondo: dichiarazione e validazione', () => {
  test('i Layout che la offrono la dichiarano con standard come predefinito', () => {
    for (const nome of LAYOUT_CON_SFONDO) {
      const m = JSON.parse(readFileSync(join(RADICE, 'design-system', 'layouts', nome, 'manifest.json'), 'utf8'));
      assert.deepEqual(m.regolazioni.sfondo, { valori: ['standard', 'enfasi'], predefinito: 'standard' }, nome);
    }
  });

  const slide = (regolazioni) => ({
    layout: 'risultato-grafico-commento',
    zone: {
      titolo: 'Ricavi in crescita',
      kpi: [{ componente: 'kpi', voci: [{ etichetta: 'Ricavi', valore: 'ricavi_totale' }] }],
    },
    ...(regolazioni && { regolazioni }),
  });
  const genera = (s) => {
    const dir = creaPresentazione({ specifica: conSlide(s) });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    return leggi(dir, 'dist/index.html');
  };

  test('enfasi aggiunge solo l\'attributo data-reg-sfondo; standard e assenza non cambiano nulla', () => {
    assert.match(genera(slide({ sfondo: 'enfasi' })), /data-reg-sfondo="enfasi"/);
    assert.equal(genera(slide({ sfondo: 'standard' })), genera(slide()));
    assert.doesNotMatch(genera(slide()), /data-reg-sfondo/);
  });

  test('un valore fuori elenco è rifiutato', () => {
    const r = esegui(['valida', creaPresentazione({ specifica: conSlide(slide({ sfondo: 'scuro' })) })]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /valore "scuro" non ammesso \(ammessi: .*enfasi/);
  });

  test('un Layout senza la Regolazione la rifiuta', () => {
    const copertina = { layout: 'copertina', zone: { titolo: 'Vendite' }, regolazioni: { sfondo: 'enfasi' } };
    const r = esegui(['valida', creaPresentazione({ specifica: { ...conSlide(), slide: [copertina] } })]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /regolazione "sfondo".*non prevista/);
  });
});

describe('Regolazione sfondo: Componenti non compatibili', () => {
  const catalogo = (incompatibileCon) =>
    creaCatalogo({
      'componenti/mappa/manifest.json': {
        nome: 'mappa',
        scopo: 'Un componente con colori fissi.',
        props: { testo: { tipo: 'testo', obbligatoria: true } },
        ...(incompatibileCon && { incompatibileCon }),
      },
      'componenti/mappa/render.mjs': 'export default ({ testo }) => `<p>${testo}</p>`;',
      'layouts/vetrina/manifest.json': {
        nome: 'vetrina',
        scopo: 'Titolo e componenti.',
        zone: [
          { nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true },
          { nome: 'corpo', tipo: 'componenti', ammessi: ['mappa'], min: 1, max: 2 },
        ],
        regolazioni: { sfondo: { valori: ['standard', 'enfasi'], predefinito: 'standard' } },
      },
      'layouts/vetrina/render.mjs': 'export default ({ zone }) => `<h2>${zone.titolo}</h2>${zone.corpo}`;',
    });
  const spec = (regolazioni) =>
    conSlide({
      layout: 'vetrina',
      zone: { titolo: 'Titolo', corpo: [{ componente: 'mappa', testo: 'Testo' }] },
      ...(regolazioni && { regolazioni }),
    });
  const valida = (cat, regolazioni) => esegui(['valida', creaPresentazione({ specifica: spec(regolazioni) }), '--catalogo', cat]);

  test('il validatore rifiuta la combinazione dichiarata nel manifest', () => {
    const r = valida(catalogo({ sfondo: ['enfasi'] }), { sfondo: 'enfasi' });
    assert.equal(r.codice, 1);
    assert.match(r.err, /componente 1 \(mappa\).*non compatibile con la Regolazione "sfondo: enfasi"/);
  });

  test('lo stesso Componente resta valido sullo sfondo standard o senza Regolazione', () => {
    assert.equal(valida(catalogo({ sfondo: ['enfasi'] }), { sfondo: 'standard' }).codice, 0);
    assert.equal(valida(catalogo({ sfondo: ['enfasi'] })).codice, 0);
  });

  test('senza dichiarazione il Componente è compatibile', () => {
    assert.equal(valida(catalogo(), { sfondo: 'enfasi' }).codice, 0);
  });

  test('una dichiarazione malformata nel manifest è segnalata', () => {
    for (const sbagliata of ['enfasi', { sfondo: 'enfasi' }, { sfondo: [] }, { sfondo: [1] }]) {
      const r = valida(catalogo(sbagliata), { sfondo: 'enfasi' });
      assert.equal(r.codice, 1, JSON.stringify(sbagliata));
      assert.match(r.err, /incompatibileCon/);
    }
  });
});

