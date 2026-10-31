import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RADICE, esegui, esiste, leggi } from './helpers.mjs';

const DEMO = join(RADICE, 'esempi', 'catalogo-demo');
const TEMI = readdirSync(join(RADICE, 'design-system', 'temi'));

function copia() {
  const dir = mkdtempSync(join(tmpdir(), 'demo-'));
  cpSync(DEMO, dir, { recursive: true });
  return dir;
}

test('la demo usa tutti i Layout e tutti i Componenti nuovi', () => {
  const specifica = JSON.parse(readFileSync(join(DEMO, 'specifica.json'), 'utf8'));
  const layout = new Set(specifica.slide.map((s) => s.layout));
  for (const nome of [
    'decisione', 'sommario-esecutivo', 'timeline-milestone', 'stato-avanzamento',
    'rischi-matrice', 'tabella-ampia', 'cartella-appendice', 'esperimento',
  ]) assert.ok(layout.has(nome), `layout non usato: ${nome}`);

  const testo = JSON.stringify(specifica, null, 1);
  for (const nome of [
    'grafico-ciambella', 'grafico-cascata', 'timeline', 'matrice-rischi', 'barra-avanzamento',
    'semaforo', 'opzioni-decisione', 'elenco-azioni', 'scheda-dati', 'criteri-esito',
  ]) assert.ok(testo.includes(`"componente": "${nome}"`), `componente non usato: ${nome}`);
});

for (const tema of TEMI) {
  test(`la demo è valida e si genera con il Tema ${tema}`, () => {
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
  });
}
