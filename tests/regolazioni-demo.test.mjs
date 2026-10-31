import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RADICE, esegui, esiste, leggi } from './helpers.mjs';

const DEMO = join(RADICE, 'esempi', 'regolazioni-demo');
const TEMI = readdirSync(join(RADICE, 'design-system', 'temi'));

function copia() {
  const dir = mkdtempSync(join(tmpdir(), 'reg-demo-'));
  cpSync(DEMO, dir, { recursive: true });
  return dir;
}

test('la demo mostra Regolazioni di Layout, di Componente e i Layout a colonne', () => {
  const specifica = JSON.parse(readFileSync(join(DEMO, 'specifica.json'), 'utf8'));
  const layout = new Set(specifica.slide.map((s) => s.layout));
  for (const nome of ['due-colonne', 'tre-colonne', 'dashboard-analisi', 'risultato-grafico-commento']) {
    assert.ok(layout.has(nome), `layout non usato: ${nome}`);
  }
  assert.ok(specifica.slide.every((s) => s.regolazioni), 'ogni slide della demo ha almeno una Regolazione');
  assert.match(JSON.stringify(specifica), /"evidenzia"/);
});

for (const tema of TEMI) {
  test(`la demo delle Regolazioni è valida e si genera con il Tema ${tema}`, () => {
    const dir = copia();
    const percorso = join(dir, 'specifica.json');
    const specifica = JSON.parse(readFileSync(percorso, 'utf8'));
    specifica.tema = tema;
    writeFileSync(percorso, JSON.stringify(specifica, null, 2));

    const valida = esegui(['valida', dir]);
    assert.equal(valida.codice, 0, valida.err + valida.out);
    const genera = esegui(['genera', dir]);
    assert.equal(genera.codice, 0, genera.err);
    assert.ok(esiste(dir, 'dist/index.html'));
    const html = leggi(dir, 'dist/index.html');
    assert.equal((html.match(/<section[^>]*class="slide/g) || []).length, specifica.slide.length);
    assert.match(html, /data-reg-ordine="3-1-2"/);
  });
}
