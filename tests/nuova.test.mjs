import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { esegui, leggi } from './helpers.mjs';

const nuovaCartella = () => join(mkdtempSync(join(tmpdir(), 'nuova-')), 'mia-presentazione');

describe('nuova: scaffold di una Presentazione', () => {
  test('crea la struttura base e il risultato è subito valido', () => {
    const dir = nuovaCartella();
    const r = esegui(['nuova', dir]);
    assert.equal(r.codice, 0, r.err);
    for (const rel of ['dati', 'analisi.py', 'analisi.json', 'specifica.json']) {
      assert.ok(existsSync(join(dir, rel)), `manca ${rel}`);
    }
    assert.match(leggi(dir, 'analisi.py'), /provenienza/);
    const specifica = JSON.parse(readFileSync(join(dir, 'specifica.json'), 'utf8'));
    assert.equal(specifica.slide[0].layout, 'copertina');
    assert.equal(esegui(['valida', dir]).codice, 0);
    assert.equal(esegui(['genera', dir]).codice, 0);
  });

  test('rifiuta una cartella già esistente senza toccarla', () => {
    const dir = nuovaCartella();
    mkdirSync(dir);
    const r = esegui(['nuova', dir]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /già esistente/);
    assert.equal(existsSync(join(dir, 'specifica.json')), false);
  });

  test('rifiuta un nome non valido', () => {
    const r = esegui(['nuova', 'Nome Sbagliato']);
    assert.equal(r.codice, 1);
    assert.match(r.err, /nome non valido/);
  });
});
