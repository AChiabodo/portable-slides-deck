import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, conSlide, esegui, leggi } from './helpers.mjs';

const kpi = (etichetta, valore) => ({ componente: 'kpi', voci: [{ etichetta, valore }] });
const nota = { componente: 'nota', etichetta: 'Nota', testo: 'Testo di nota' };
const barre = { componente: 'grafico-barre', serie: 'ricavi_per_regione' };
const ciambella = { componente: 'grafico-ciambella', serie: 'ricavi_per_regione' };

const due = (regolazioni, extra = {}) => ({
  layout: 'due-colonne',
  zone: {
    titolo: 'Due letture',
    'intestazione-1': 'Prima lettura',
    'colonna-1': [ciambella],
    'intestazione-2': 'Seconda lettura',
    'colonna-2': [kpi('Ricavi', 'ricavi_totale'), kpi('Crescita', 'crescita')],
    commento: 'Crescita {{crescita}}',
    ...extra,
  },
  ...(regolazioni && { regolazioni }),
});
const tre = (regolazioni, extra = {}) => ({
  layout: 'tre-colonne',
  zone: {
    titolo: 'Tre letture',
    'intestazione-1': 'Uno',
    'colonna-1': [kpi('Ricavi', 'ricavi_totale')],
    'intestazione-2': 'Due',
    'colonna-2': [kpi('Crescita', 'crescita')],
    'intestazione-3': 'Tre',
    'colonna-3': [nota],
    ...extra,
  },
  ...(regolazioni && { regolazioni }),
});

function genera(slide) {
  const dir = creaPresentazione({ specifica: conSlide(slide) });
  const r = esegui(['genera', dir]);
  assert.equal(r.codice, 0, r.err + r.out);
  return leggi(dir, 'dist/index.html');
}

function rifiutata(slide, atteso) {
  const r = esegui(['valida', creaPresentazione({ specifica: conSlide(slide) })]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}${r.err}`);
  assert.match(r.err, atteso);
}

const prima = (html, a, b) => html.indexOf(a) < html.indexOf(b);

describe('due-colonne', () => {
  test('senza Regolazioni disegna le colonne nell\'ordine della Specifica, senza attributi', () => {
    const h = genera(due());
    assert.ok(prima(h, 'Prima lettura', 'Seconda lettura'));
    assert.ok(h.includes('class="col-corpo" style="--colonne:2"'));
    assert.doesNotMatch(h, /data-reg-/);
  });

  test('ordine invertito riordina il markup, non solo la grafica', () => {
    const h = genera(due({ ordine: 'invertito' }));
    assert.ok(prima(h, 'Seconda lettura', 'Prima lettura'));
    assert.match(h, /data-reg-ordine="invertito"/);
  });

  test('rapporto-colonne e allineamento-verticale diventano attributi solo se non predefiniti', () => {
    const h = genera(due({ 'rapporto-colonne': '2-1', 'allineamento-verticale': 'centro', densita: 'comoda' }));
    assert.match(h, /data-reg-rapporto-colonne="2-1"/);
    assert.match(h, /data-reg-allineamento-verticale="centro"/);
    assert.doesNotMatch(h, /data-reg-densita/);
  });

  test('le intestazioni e il commento sono facoltativi', () => {
    const slide = due(undefined, { 'intestazione-1': undefined, 'intestazione-2': undefined, commento: undefined });
    const h = genera(slide);
    assert.doesNotMatch(h, /<h3 class="col-intestazione/);
    assert.doesNotMatch(h, /<p class="col-commento/);
  });

  test('i grafici a barre non sono ammessi: in una colonna stretta sarebbero illeggibili', () => {
    rifiutata(due(undefined, { 'colonna-1': [barre] }), /componente "grafico-barre" non ammesso nella zona/);
  });

  test('i valori fuori elenco sono rifiutati', () => {
    rifiutata(due({ 'rapporto-colonne': '1-1-1' }), /valore "1-1-1" non ammesso \(ammessi: .*3-2/);
  });

  test('i numeri scritti a mano restano vietati e i riferimenti all\'Analisi funzionano', () => {
    rifiutata(due(undefined, { commento: 'Crescita del 12%' }), /numero scritto a mano/);
    assert.match(genera(due()), /Crescita 12,3%/);
  });
});

describe('tre-colonne', () => {
  test('ordine accetta le sei permutazioni e riordina il markup', () => {
    const h = genera(tre({ ordine: '3-1-2' }));
    assert.ok(prima(h, '>Tre<', '>Uno<') && prima(h, '>Uno<', '>Due<'));
    assert.match(h, /data-reg-ordine="3-1-2"/);
    for (const ordine of ['1-3-2', '2-1-3', '2-3-1', '3-2-1']) assert.match(genera(tre({ ordine })), new RegExp(`data-reg-ordine="${ordine}"`));
  });

  test('rapporto-colonne a tre valori', () => {
    assert.match(genera(tre({ 'rapporto-colonne': '1-2-1' })), /data-reg-rapporto-colonne="1-2-1"/);
    rifiutata(tre({ 'rapporto-colonne': '1-1' }), /valore "1-1" non ammesso/);
  });

  test('ammette solo componenti adatti a colonne strette', () => {
    rifiutata(tre(undefined, { 'colonna-1': [barre] }), /componente "grafico-barre" non ammesso nella zona/);
  });

  test('le tre colonne sono obbligatorie', () => {
    rifiutata(tre(undefined, { 'colonna-3': undefined }), /colonna-3.*obbligatoria/);
  });
});
