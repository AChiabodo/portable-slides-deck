import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RADICE, creaPresentazione, conSlide, esegui, leggi } from './helpers.mjs';

const voci = (n, testo = 'Punto') => Array.from({ length: n }, (_, i) => `${testo} ${'uno due tre quattro cinque sei sette'.split(' ')[i]}`);

function genera(specifica) {
  const dir = creaPresentazione({ specifica });
  const r = esegui(['genera', dir]);
  return { r, dir, html: r.codice === 0 ? leggi(dir, 'dist/index.html') : '' };
}

function rifiutata(slide, atteso) {
  const dir = creaPresentazione({ specifica: conSlide(slide) });
  const r = esegui(['valida', dir]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}`);
  assert.match(r.err, atteso);
}

describe('layout sezione', () => {
  test('mostra titolo e sottotitolo opzionale', () => {
    const { r, html } = genera(conSlide({ layout: 'sezione', zone: { titolo: 'Risultati commerciali', sottotitolo: 'Primo semestre' } }));
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<h2 id="slide-2-titolo">Risultati commerciali<\/h2>/);
    assert.match(html, /class="sezione-sottotitolo">Primo semestre</);
  });

  test('il sottotitolo si può omettere', () => {
    const { r, html } = genera(conSlide({ layout: 'sezione', zone: { titolo: 'Risultati commerciali' } }));
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /sezione-sottotitolo/);
  });
});

describe('layout indice', () => {
  test('rende un elenco numerato di voci', () => {
    const { r, html } = genera(conSlide({ layout: 'indice', zone: { titolo: 'Di cosa parliamo', voci: ['Contesto', 'Risultati', 'Prossimi passi'] } }));
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<ol class="indice-voci"><li>Contesto<\/li><li>Risultati<\/li><li>Prossimi passi<\/li><\/ol>/);
  });

  test('oltre 6 voci è rifiutato', () => {
    rifiutata({ layout: 'indice', zone: { titolo: 'Di cosa parliamo', voci: voci(7, 'Tema') } }, /7 voci, massimo 6/);
  });

  test('una voce con più di 6 parole è rifiutata', () => {
    rifiutata({ layout: 'indice', zone: { titolo: 'Indice', voci: ['uno due tre quattro cinque sei sette'] } }, /7 parole, massimo 6/);
  });
});

describe('layout punti-chiave', () => {
  test('rende i punti con i valori dell\'Analisi', () => {
    const { r, html } = genera(
      conSlide({ layout: 'punti-chiave', zone: { titolo: 'Cosa abbiamo visto', punti: ['Crescita a {{crescita}}', 'Ricavi a {{ricavi_totale}}'] } }),
    );
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<ul class="punti-elenco"><li>Crescita a 12,3%<\/li><li>Ricavi a 1\.234,5\u00a0€<\/li><\/ul>/);
  });

  test('un solo punto non basta: servono almeno 2 voci', () => {
    rifiutata({ layout: 'punti-chiave', zone: { titolo: 'Cosa abbiamo visto', punti: ['Solo uno'] } }, /almeno 2 voci/);
  });

  test('più di 5 punti è rifiutato', () => {
    rifiutata({ layout: 'punti-chiave', zone: { titolo: 'Cosa abbiamo visto', punti: voci(6) } }, /6 voci, massimo 5/);
  });
});

describe('layout confronto', () => {
  const zone = {
    titolo: 'Prima e dopo',
    'intestazione-sinistra': 'Prima',
    sinistra: ['Processo manuale', 'Dati dispersi'],
    'intestazione-destra': 'Dopo',
    destra: ['Processo guidato', 'Dati centralizzati'],
  };

  test('affianca due colonne ciascuna con intestazione ed elenco', () => {
    const { r, html } = genera(conSlide({ layout: 'confronto', zone }));
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<h3 class="confronto-intestazione">Prima<\/h3><ul class="confronto-elenco"><li>Processo manuale<\/li><li>Dati dispersi<\/li><\/ul>/);
    assert.match(html, /<h3 class="confronto-intestazione">Dopo<\/h3><ul class="confronto-elenco"><li>Processo guidato<\/li><li>Dati centralizzati<\/li><\/ul>/);
  });

  test('entrambe le colonne sono obbligatorie', () => {
    const { destra, ...senzaDestra } = zone;
    rifiutata({ layout: 'confronto', zone: senzaDestra }, /zona "destra" obbligatoria e mancante/);
  });

  test('più di 4 voci per colonna è rifiutato', () => {
    rifiutata({ layout: 'confronto', zone: { ...zone, sinistra: voci(5) } }, /5 voci, massimo 4/);
  });
});

describe('layout messaggio', () => {
  test('mette in evidenza una frase con etichetta e fonte', () => {
    const { r, html } = genera(
      conSlide({ layout: 'messaggio', zone: { titolo: 'In sintesi', messaggio: 'Le vendite crescono del {{crescita}}', fonte: 'Analisi vendite' } }),
    );
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /<h2 id="slide-2-titolo">In sintesi<\/h2>/);
    assert.match(html, /<p class="messaggio-testo">Le vendite crescono del 12,3%<\/p>/);
    assert.match(html, /<p class="messaggio-fonte">Analisi vendite<\/p>/);
  });

  test('il messaggio è obbligatorio e limitato a 25 parole', () => {
    rifiutata({ layout: 'messaggio', zone: { titolo: 'In sintesi' } }, /zona "messaggio" obbligatoria e mancante/);
    rifiutata({ layout: 'messaggio', zone: { titolo: 'In sintesi', messaggio: Array(26).fill('parola').join(' ') } }, /26 parole, massimo 25/);
  });
});

describe('Tema cobalto', () => {
  test('si seleziona dalla Specifica e le sue variabili finiscono nel CSS', () => {
    const { r, dir, html } = genera({ ...conSlide(), tema: 'cobalto' });
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /data-tema="cobalto"/);
    assert.match(leggi(dir, 'dist/assets/presentazione.css'), /--colore-accento: #[0-9a-f]{6};/i);
  });

  test('tutti i Temi del sistema di design definiscono le stesse variabili', () => {
    const base = join(RADICE, 'design-system', 'temi');
    const chiavi = readdirSync(base).map((nome) => [nome, Object.keys(JSON.parse(readFileSync(join(base, nome, 'tema.json'), 'utf8')).variabili).sort()]);
    assert.ok(chiavi.length >= 2);
    for (const [nome, k] of chiavi) assert.deepEqual(k, chiavi[0][1], `il tema "${nome}" ha variabili diverse da "${chiavi[0][0]}"`);
  });
});
