import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RADICE, creaPresentazione, conSlide, esegui, leggi } from './helpers.mjs';

const DIR_TEMI = join(RADICE, 'design-system', 'temi');
const temi = Object.fromEntries(
  readdirSync(DIR_TEMI).map((nome) => [nome, JSON.parse(readFileSync(join(DIR_TEMI, nome, 'tema.json'), 'utf8'))]),
);
const NUOVI = ['istituzionale', 'laboratorio', 'programma', 'officina'];
const FORMA = ['raggio-scheda', 'spessore-filetto', 'bordo-scheda-accento', 'trasformazione-etichetta', 'famiglia-numeri', 'trama-sfondo'];
const STATI = ['colore-stato-ok', 'colore-stato-attenzione', 'colore-stato-critico', 'colore-stato-neutro'];

describe('Temi del sistema di design', () => {
  test('ci sono i tre Temi di partenza e i quattro nuovi', () => {
    for (const nome of ['quiet-editorial', 'cobalto', 'executive', ...NUOVI]) assert.ok(temi[nome], `manca il tema "${nome}"`);
  });

  test('ogni Tema definisce variabili di stato e di forma, e le verifica a WCAG AA', () => {
    for (const [nome, tema] of Object.entries(temi)) {
      for (const v of [...STATI, ...FORMA]) assert.ok(tema.variabili[v] !== undefined, `"${nome}" non definisce ${v}`);
      for (const stato of STATI) {
        assert.ok(tema.contrasti.some(([a, b]) => a === stato && b === 'colore-carta'), `"${nome}": ${stato} non verificato su carta`);
        assert.ok(tema.contrasti.some(([a, b]) => a === stato && b === 'colore-superficie'), `"${nome}": ${stato} non verificato su superficie`);
      }
    }
  });

  test('i Temi di partenza hanno la forma neutra che riproduce l\'aspetto precedente', () => {
    for (const nome of ['quiet-editorial', 'cobalto', 'executive']) {
      const v = temi[nome].variabili;
      assert.deepEqual(
        FORMA.map((k) => v[k]),
        ['1', '1px', '1', 'uppercase', 'var(--font-mono)', 'none'],
        `"${nome}" ha una forma diversa da quella neutra`,
      );
    }
  });

  test('i Temi nuovi si distinguono per struttura, non solo per colore', () => {
    const firma = (nome) => JSON.stringify(FORMA.map((k) => temi[nome].variabili[k]));
    const firme = new Set(NUOVI.map(firma));
    assert.equal(firme.size, NUOVI.length, 'due Temi nuovi hanno la stessa forma');
    for (const nome of NUOVI) assert.notEqual(firma(nome), firma('executive'), `"${nome}" ha la forma di "executive"`);
    assert.notEqual(temi.laboratorio.variabili['trama-sfondo'], 'none');
    assert.notEqual(temi.officina.variabili['trama-sfondo'], 'none');
  });

  test('officina è scuro anche nelle slide di contenuto', () => {
    const { 'colore-carta': carta, 'colore-inchiostro': inchiostro } = temi.officina.variabili;
    const luce = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).reduce((a, b) => a + b, 0);
    assert.ok(luce(carta) < luce(inchiostro), 'la carta di officina deve essere più scura dell\'inchiostro');
  });
});

describe('Temi nuovi: generazione', () => {
  for (const nome of NUOVI) {
    test(`"${nome}" è selezionabile, valido e finisce nel CSS`, () => {
      const dir = creaPresentazione({ specifica: { ...conSlide(), tema: nome } });
      assert.equal(esegui(['valida', dir]).codice, 0);
      const r = esegui(['genera', dir]);
      assert.equal(r.codice, 0, r.err);
      assert.match(leggi(dir, 'dist/index.html'), new RegExp(`data-tema="${nome}"`));
      const css = leggi(dir, 'dist/assets/presentazione.css');
      assert.ok(css.includes(`--colore-stato-ok: ${temi[nome].variabili['colore-stato-ok']};`));
      assert.ok(css.includes(`--raggio-scheda: ${temi[nome].variabili['raggio-scheda']};`));
    });
  }
});
