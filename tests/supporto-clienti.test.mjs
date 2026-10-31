import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RADICE, esegui, leggi } from './helpers.mjs';

test('l\'esempio "supporto-clienti" è valido e usa Regolazioni, colonne e sfondo enfasi', () => {
  const dir = mkdtempSync(join(tmpdir(), 'supporto-'));
  cpSync(join(RADICE, 'esempi', 'supporto-clienti'), dir, { recursive: true, filter: (o) => !o.includes('dist') });
  const valida = esegui(['valida', dir]);
  assert.equal(valida.codice, 0, valida.err + valida.out);
  const genera = esegui(['genera', dir]);
  assert.equal(genera.codice, 0, genera.err);
  const html = leggi(dir, 'dist/index.html');
  assert.equal((html.match(/<section[^>]*class="slide/g) || []).length, 8);
  assert.equal((html.match(/data-reg-sfondo="enfasi"/g) || []).length, 1, 'una sola slide in enfasi');
  assert.match(html, /slide-due-colonne/);
  assert.match(html, /slide-tre-colonne[^>]*data-reg-ordine="2-1-3"/);
  assert.match(html, /La chat è già il primo canale, con il 40,4% dei ticket/);
});
