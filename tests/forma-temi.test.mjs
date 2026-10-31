import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RADICE, creaPresentazione, esegui, leggi } from './helpers.mjs';

const NEUTRI = {
  'raggio-scheda': '1',
  'spessore-filetto': '1px',
  'bordo-scheda-accento': '1',
  'trasformazione-etichetta': 'uppercase',
  'famiglia-numeri': 'var(--font-mono)',
  'trama-sfondo': 'none',
};

for (const tema of ['quiet-editorial', 'cobalto', 'executive']) {
  test(`il Tema ${tema} definisce le variabili di forma con i valori neutri`, () => {
    const { variabili } = JSON.parse(readFileSync(join(RADICE, 'design-system', 'temi', tema, 'tema.json'), 'utf8'));
    for (const [nome, valore] of Object.entries(NEUTRI)) assert.equal(variabili[nome], valore, nome);
  });
}

test('i CSS del Catalogo usano le variabili di forma dei Temi', () => {
  const dir = creaPresentazione();
  const r = esegui(['genera', dir]);
  assert.equal(r.codice, 0, r.err);
  const css = leggi(dir, 'dist/assets/presentazione.css');
  for (const nome of Object.keys(NEUTRI)) assert.ok(css.includes(`var(--${nome})`), `manca var(--${nome})`);
});
