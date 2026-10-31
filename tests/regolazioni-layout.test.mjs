import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, conSlide, esegui, leggi } from './helpers.mjs';

const barre = { componente: 'grafico-barre', serie: 'ricavi_per_regione' };
const kpi = { componente: 'kpi', voci: [{ etichetta: 'Ricavi', valore: 'ricavi_totale' }] };

const dashboard = (regolazioni, principale = [barre]) => ({
  layout: 'dashboard-analisi',
  zone: { titolo: 'Ricavi in crescita', principale, kpi: [kpi], commento: 'Crescita {{crescita}}' },
  regolazioni,
});
const confronto = (regolazioni) => ({
  layout: 'confronto',
  zone: {
    titolo: 'Prima e dopo',
    'intestazione-sinistra': 'Prima',
    sinistra: ['Lento'],
    'intestazione-destra': 'Dopo',
    destra: ['Veloce'],
  },
  regolazioni,
});
const affiancato = (regolazioni) => ({
  layout: 'confronto-affiancato',
  zone: {
    titolo: 'Due approcci',
    'intestazione-sinistra': 'Prima',
    sinistra: [kpi],
    'intestazione-destra': 'Dopo',
    destra: [kpi],
  },
  regolazioni,
});
const esperimento = (regolazioni, risultato = [barre]) => ({
  layout: 'esperimento',
  zone: { titolo: 'Funziona', ipotesi: 'Ipotesi di prova', metodo: 'Metodo di prova', risultato, conclusione: 'Si procede' },
  regolazioni,
});
const rgc = (regolazioni) => ({
  layout: 'risultato-grafico-commento',
  zone: { titolo: 'Ricavi in crescita', grafico: [barre], commento: 'Crescita {{crescita}}' },
  regolazioni,
});
const griglia = (regolazioni) => ({
  layout: 'griglia-schede',
  zone: {
    titolo: 'Tre concetti',
    schede: [{ componente: 'schede', voci: [{ titolo: 'Uno', testo: 'Primo' }, { titolo: 'Due', testo: 'Secondo' }] }],
  },
  regolazioni,
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

const corpo = (html, classe) => html.slice(html.indexOf(`class="${classe}`));
const prima = (html, a, b) => html.indexOf(a) < html.indexOf(b);

describe('Regolazioni dei Layout: validazione', () => {
  test('ogni Layout accetta i suoi valori e rifiuta gli altri', () => {
    for (const slide of [
      dashboard({ 'rapporto-colonne': '2-1', ordine: 'invertito', densita: 'compatta' }),
      confronto({ 'rapporto-colonne': '3-2', ordine: 'invertito', densita: 'compatta' }),
      affiancato({ 'rapporto-colonne': '2-3', ordine: 'invertito', 'allineamento-verticale': 'alto', densita: 'compatta' }),
      esperimento({ 'allineamento-verticale': 'alto', densita: 'compatta' }),
      rgc({ 'rapporto-colonne': '1-2', ordine: 'invertito', densita: 'compatta' }),
      griglia({ densita: 'compatta' }),
    ]) {
      const r = esegui(['valida', creaPresentazione({ specifica: conSlide(slide) })]);
      assert.equal(r.codice, 0, r.err);
    }
    rifiutata(dashboard({ 'rapporto-colonne': '5-1' }), /regolazione "rapporto-colonne": valore "5-1" non ammesso/);
    rifiutata(confronto({ 'allineamento-verticale': 'alto' }), /regolazione "allineamento-verticale": non prevista da "confronto"/);
    rifiutata(griglia({ ordine: 'invertito' }), /regolazione "ordine": non prevista da "griglia-schede"/);
  });

  test('`rapporto` richiede due componenti nella zona', () => {
    rifiutata(dashboard({ rapporto: '2-1' }), /richiede almeno 2 componenti nella zona "principale" \(presenti: 1\)/);
    rifiutata(esperimento({ rapporto: '1-2' }), /richiede almeno 2 componenti nella zona "risultato" \(presenti: 1\)/);
    const due = esegui(['valida', creaPresentazione({ specifica: conSlide(dashboard({ rapporto: '2-1' }, [barre, barre])) })]);
    assert.equal(due.codice, 0, due.err);
  });
});

describe('Regolazioni dei Layout: markup', () => {
  test('senza Regolazioni nessun attributo e ordine invariato', () => {
    const h = genera(dashboard());
    assert.ok(!h.includes('data-reg-'));
    assert.ok(prima(h, 'dash-principale', 'dash-lato'));
  });

  test('i valori non predefiniti diventano attributi della slide', () => {
    const h = genera(dashboard({ 'rapporto-colonne': '2-1', ordine: 'normale', densita: 'compatta' }));
    assert.match(h, /data-reg-rapporto-colonne="2-1"/);
    assert.match(h, /data-reg-densita="compatta"/);
    assert.ok(!h.includes('data-reg-ordine'));
  });

  test('ordine invertito: il DOM segue l\'ordine visivo (dashboard-analisi)', () => {
    const h = genera(dashboard({ ordine: 'invertito' }));
    assert.ok(prima(corpo(h, 'dash-corpo'), 'dash-lato', 'dash-principale'));
  });

  test('ordine invertito: il DOM segue l\'ordine visivo (confronto, confronto-affiancato, risultato-grafico-commento)', () => {
    const c = genera(confronto({ ordine: 'invertito' }));
    assert.ok(prima(c, '>Dopo<', '>Prima<'));
    assert.ok(prima(genera(confronto({})), '>Prima<', '>Dopo<'));
    const a = genera(affiancato({ ordine: 'invertito' }));
    assert.ok(prima(a, 'affiancato-destra', 'affiancato-sinistra'));
    const r = genera(rgc({ ordine: 'invertito' }));
    assert.ok(prima(corpo(r, 'rgc-corpo'), 'rgc-commento', 'rgc-grafico'));
  });

  test('con la sola zona principale, ordine e rapporto delle colonne non rompono la slide', () => {
    const slide = {
      layout: 'dashboard-analisi',
      zone: { titolo: 'Solo grafico', principale: [barre] },
      regolazioni: { ordine: 'invertito', 'rapporto-colonne': '1-1' },
    };
    assert.match(genera(slide), /dash-corpo dash-solo/);
  });
});

describe('Regolazioni dei Layout: CSS', () => {
  const css = () => {
    const dir = creaPresentazione({ specifica: conSlide(griglia()) });
    esegui(['genera', dir]);
    return leggi(dir, 'dist/assets/presentazione.css');
  };

  test('i rapporti agiscono solo con le colonne affiancate (container ≥ 900px)', () => {
    const c = css();
    const blocco = c.match(/@container \(min-width: 900px\) \{[^@]*?data-reg-rapporto-colonne="2-1"[\s\S]*?\n\}\n/);
    assert.ok(blocco, 'blocco @container min-width mancante');
  });

  test('la densità compatta ha una regola per schermo piccolo, grande e stampa', () => {
    const occorrenze = css().match(/\[data-reg-densita="compatta"\] \.slide-contenuto \{/g) ?? [];
    assert.equal(occorrenze.length, 3);
  });
});
