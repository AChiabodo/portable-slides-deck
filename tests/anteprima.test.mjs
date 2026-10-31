import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { RADICE, esegui, esiste } from './helpers.mjs';
import { trovaEdge } from '../tools/lib/esporta-pdf.mjs';

const DEMO = join(RADICE, 'esempi', 'regolazioni-demo');
const senzaEdge = trovaEdge() ? false : 'Edge non disponibile';

function copia() {
  const dir = mkdtempSync(join(tmpdir(), 'anteprima-'));
  cpSync(DEMO, dir, { recursive: true, filter: (origine) => !origine.includes(`${sep}dist`) });
  return dir;
}

test('--slide deve essere un intero da 1, anche senza Edge', () => {
  for (const valore of ['0', '-2', 'x', '1.5']) {
    const r = esegui(['anteprima', DEMO, `--slide=${valore}`]);
    assert.equal(r.codice, 1, valore);
    assert.match(r.err, /--slide vuole un numero intero da 1/);
  }
});

test('anteprima senza cartella mostra l\'uso con il comando', () => {
  const r = esegui(['anteprima']);
  assert.equal(r.codice, 2);
  assert.match(r.err, /anteprima/);
});

test('anteprima produce un PNG per ogni slide e rimuove il profilo temporaneo', { skip: senzaEdge }, () => {
  const dir = copia();
  const r = esegui(['anteprima', dir]);
  assert.equal(r.codice, 0, r.err);
  const png = readdirSync(join(dir, 'dist', 'anteprime')).sort();
  assert.deepEqual(png, ['slide-01.png', 'slide-02.png', 'slide-03.png', 'slide-04.png']);
  for (const f of png) assert.ok(statSync(join(dir, 'dist', 'anteprime', f)).size > 5000, `${f} è vuoto`);
  assert.ok(!esiste(dir, 'dist/.profilo-edge'), 'il profilo temporaneo di Edge va rimosso');
});

test('anteprima --slide N produce solo quella slide e rifiuta una slide inesistente', { skip: senzaEdge }, () => {
  const dir = copia();
  const r = esegui(['anteprima', dir, '--slide', '3']);
  assert.equal(r.codice, 0, r.err);
  assert.deepEqual(readdirSync(join(dir, 'dist', 'anteprime')), ['slide-03.png']);

  const fuori = esegui(['anteprima', dir, '--slide', '9']);
  assert.equal(fuori.codice, 1);
  assert.match(fuori.err, /la slide 9 non esiste \(la Presentazione ne ha 4\)/);
});

test('anteprima non produce immagini se la Specifica non è valida', { skip: senzaEdge }, () => {
  const dir = copia();
  writeFileSync(join(dir, 'specifica.json'), '{ "titolo": ');
  const r = esegui(['anteprima', dir]);
  assert.equal(r.codice, 1);
  assert.ok(!esiste(dir, 'dist/anteprime'));
});
