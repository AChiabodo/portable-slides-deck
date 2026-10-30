import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RADICE, esegui, esiste, leggi } from './helpers.mjs';

test('l\'esempio "vendite" è valido e si genera con i numeri dell\'Analisi', () => {
  const dir = mkdtempSync(join(tmpdir(), 'esempio-'));
  cpSync(join(RADICE, 'esempi', 'vendite'), dir, { recursive: true });
  const r = esegui(['esporta-singolo', dir]);
  assert.equal(r.codice, 0, r.err);
  assert.ok(esiste(dir, 'dist/presentazione.html'));
  const html = leggi(dir, 'dist/presentazione.html');
  assert.match(html, /<h1 id="slide-1-titolo">Vendite del primo semestre<\/h1>/);
  assert.match(html, /\d{1,3}(\.\d{3})+\u00a0€/);
  assert.match(html, /Il Nord pesa per \d+,\d%/);
});
