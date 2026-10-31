import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RADICE, analisiBase, creaPresentazione, creaCatalogo, conSlide, esegui, leggi } from './helpers.mjs';

// Nessun layout del Catalogo di partenza ammette questi Componenti: un layout di prova in un catalogo aggiuntivo li ospita.
const catalogoProva = () =>
  creaCatalogo({
    'layouts/prova-tabellare/manifest.json': {
      nome: 'prova-tabellare',
      scopo: 'Layout di prova per i componenti tabellari.',
      quandoUsarlo: 'Solo nei test.',
      zone: [
        { nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true },
        {
          nome: 'corpo',
          tipo: 'componenti',
          obbligatoria: true,
          ammessi: ['semaforo', 'opzioni-decisione', 'elenco-azioni', 'scheda-dati', 'criteri-esito'],
          min: 1,
          max: 2,
        },
      ],
    },
    'layouts/prova-tabellare/render.mjs':
      'export default ({ zone }) => `${zone.titolo}<div class="prova-corpo">${zone.corpo}</div><!--fine-->`;',
  });

const provenienza = { file: 'dati/progetto.csv', colonna: 'scadenza', operazione: 'prima' };
const analisi = () => {
  const a = analisiBase();
  a.valori.scadenza_a = { etichetta: 'Scadenza A', formato: { tipo: 'data' }, valore: '2024-05-10', provenienza };
  a.valori.scadenza_b = { etichetta: 'Scadenza B', formato: { tipo: 'data' }, valore: '2024-06-30', provenienza };
  return a;
};

function slide(...componenti) {
  return { layout: 'prova-tabellare', zone: { titolo: 'Prova dei componenti', corpo: componenti } };
}

function genera(...componenti) {
  const dir = creaPresentazione({ analisi: analisi(), specifica: conSlide(slide(...componenti)) });
  const r = esegui(['genera', dir, '--catalogo', catalogoProva()]);
  assert.equal(r.codice, 0, r.err);
  const html = leggi(dir, 'dist/index.html');
  const corpo = html.match(/<div class="prova-corpo">([\s\S]*?)<\/div><!--fine-->/);
  assert.ok(corpo, 'corpo della slide non trovato');
  return { html, corpo: corpo[1], css: leggi(dir, 'dist/assets/presentazione.css') };
}

function rifiutata(componente, atteso) {
  const dir = creaPresentazione({ analisi: analisi(), specifica: conSlide(slide(componente)) });
  const r = esegui(['valida', dir, '--catalogo', catalogoProva()]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}`);
  assert.match(r.err, atteso);
}

const testoVisibile = (html) =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');

const voceSemaforo = (n, extra = {}) => ({ etichetta: `Area ${'uno due tre quattro cinque sei sette otto nove'.split(' ')[n]}`, stato: 'in-linea', ...extra });
const opzione = (n, extra = {}) => ({ titolo: `Scelta ${'uno due tre quattro cinque'.split(' ')[n]}`, vantaggi: 'Costa meno', svantaggi: 'Richiede tempo', ...extra });
const azione = (n, extra = {}) => ({ azione: `Preparare il passo ${'uno due tre quattro cinque sei sette'.split(' ')[n]}`, responsabile: 'Ufficio acquisti', scadenza: 'scadenza_a', ...extra });
const datoScheda = (n, extra = {}) => ({ etichetta: `Campo ${'uno due tre quattro cinque sei sette otto nove'.split(' ')[n]}`, valore: 'Valore breve', ...extra });
const criterio = (n, extra = {}) => ({ criterio: `Requisito ${'uno due tre quattro cinque sei sette'.split(' ')[n]}`, soglia: 'Almeno la soglia', risultato: 'crescita', esito: 'superato', ...extra });
const serie = (fabbrica, n) => Array.from({ length: n }, (_, i) => fabbrica(i));

describe('semaforo', () => {
  test('rende una riga per voce con badge dello stato, etichetta e nota', () => {
    const { corpo, css } = genera({
      componente: 'semaforo',
      voci: [
        { etichetta: 'Piattaforma dati', stato: 'a-rischio', nota: 'Crescita {{crescita}} sopra le attese' },
        { etichetta: 'Formazione', stato: 'non-avviato' },
      ],
    });
    assert.match(corpo, /<ul class="semaforo" role="list" aria-label="Stato">/);
    assert.match(corpo, /<li class="semaforo-riga" data-stato="a-rischio"><span class="semaforo-stato"><span class="stato" data-stato="a-rischio"><svg [^>]*aria-hidden="true"/);
    assert.match(corpo, /<span class="stato-testo">A rischio<\/span>/);
    assert.match(corpo, /<span class="semaforo-etichetta">Piattaforma dati<\/span><span class="semaforo-nota">Crescita 12,3% sopra le attese<\/span>/);
    assert.match(corpo, /<span class="stato-testo">Non avviato<\/span><\/span><\/span><span class="semaforo-etichetta">Formazione<\/span><\/li>/);
    assert.match(css, /\.semaforo-riga/);
  });

  test('l\'etichetta con markup è escapata', () => {
    const { corpo } = genera({ componente: 'semaforo', voci: [{ etichetta: '<script>alert(x)</script>', stato: 'in-linea' }] });
    assert.ok(!corpo.includes('<script>'));
    assert.ok(corpo.includes('&lt;script&gt;'));
  });

  test('oltre 8 voci è rifiutato', () => {
    rifiutata({ componente: 'semaforo', voci: serie((i) => voceSemaforo(i), 9) }, /9 voci, massimo 8/);
  });

  test('uno stato fuori vocabolario è rifiutato', () => {
    rifiutata({ componente: 'semaforo', voci: [voceSemaforo(0, { stato: 'giallo' })] }, /"giallo" non ammesso/);
  });

  test('un\'etichetta di troppe parole e una nota con numeri a mano sono rifiutate', () => {
    rifiutata({ componente: 'semaforo', voci: [voceSemaforo(0, { etichetta: 'una due tre quattro cinque sei sette' })] }, /parole/);
    rifiutata({ componente: 'semaforo', voci: [voceSemaforo(0, { nota: 'Siamo al 73 per cento' })] }, /73/);
  });
});

describe('opzioni-decisione', () => {
  test('evidenzia la raccomandata e tratta come alternativa l\'opzione senza ruolo', () => {
    const { corpo } = genera({
      componente: 'opzioni-decisione',
      opzioni: [
        opzione(0, { ruolo: 'raccomandata', vantaggi: 'Crescita {{crescita}} garantita' }),
        opzione(1),
        opzione(2, { ruolo: 'alternativa' }),
      ],
    });
    assert.match(corpo, /<ul class="opzioni" role="list" style="--colonne:3">/);
    assert.match(corpo, /<li class="opzione" data-ruolo="raccomandata">[\s\S]*?<span class="opzione-ruolo"><svg [^>]*aria-hidden="true"[\s\S]*?<span>Raccomandata<\/span>/);
    assert.equal(corpo.match(/data-ruolo="alternativa"/g).length, 2);
    assert.equal(corpo.match(/<span>Alternativa<\/span>/g).length, 2);
    assert.equal(corpo.match(/<span>Vantaggi<\/span>/g).length, 3);
    assert.equal(corpo.match(/<span>Svantaggi<\/span>/g).length, 3);
    assert.ok(corpo.includes('Crescita 12,3% garantita'));
  });

  test('il titolo con markup è escapato', () => {
    const { corpo } = genera({ componente: 'opzioni-decisione', opzioni: [opzione(0, { titolo: '<script>x</script>' }), opzione(1)] });
    assert.ok(!corpo.includes('<script>'));
    assert.ok(corpo.includes('&lt;script&gt;'));
  });

  test('meno di 2 o più di 4 opzioni è rifiutato', () => {
    rifiutata({ componente: 'opzioni-decisione', opzioni: [opzione(0)] }, /almeno 2 voci/);
    rifiutata({ componente: 'opzioni-decisione', opzioni: serie((i) => opzione(i), 5) }, /5 voci, massimo 4/);
  });

  test('un ruolo non ammesso è rifiutato', () => {
    rifiutata({ componente: 'opzioni-decisione', opzioni: [opzione(0, { ruolo: 'obbligata' }), opzione(1)] }, /"obbligata" non ammesso/);
  });

  test('vantaggi troppo lunghi o mancanti sono rifiutati', () => {
    const lungo = Array.from({ length: 21 }, () => 'parola').join(' ');
    rifiutata({ componente: 'opzioni-decisione', opzioni: [opzione(0, { vantaggi: lungo }), opzione(1)] }, /parole/);
    const senza = opzione(0);
    delete senza.svantaggi;
    rifiutata({ componente: 'opzioni-decisione', opzioni: [senza, opzione(1)] }, /svantaggi/);
  });
});

describe('elenco-azioni', () => {
  test('rende una tabella con intestazioni, scadenza formattata e colonna stato', () => {
    const { corpo } = genera({
      componente: 'elenco-azioni',
      azioni: [azione(0, { stato: 'in-ritardo' }), azione(1, { scadenza: 'scadenza_b' })],
    });
    assert.match(corpo, /<table class="azioni"><thead><tr><th scope="col" class="azioni-azione">Azione<\/th><th scope="col" class="azioni-responsabile">Responsabile<\/th><th scope="col" class="azioni-scadenza">Scadenza<\/th><th scope="col" class="azioni-stato">Stato<\/th>/);
    assert.match(corpo, /<th scope="row" class="azioni-azione" data-etichetta="Azione">Preparare il passo uno<\/th>/);
    assert.match(corpo, /<td class="azioni-scadenza" data-etichetta="Scadenza">10\/05\/2024<\/td>/);
    assert.match(corpo, /<td class="azioni-scadenza" data-etichetta="Scadenza">30\/06\/2024<\/td>/);
    assert.match(corpo, /<span class="stato-testo">In ritardo<\/span>/);
    assert.match(corpo, /<td class="azioni-stato" data-etichetta="Stato"><\/td>/);
  });

  test('senza alcuno stato la colonna stato non c\'è', () => {
    const { corpo } = genera({ componente: 'elenco-azioni', azioni: [azione(0)] });
    assert.ok(!corpo.includes('azioni-stato'));
  });

  test('il responsabile con markup è escapato', () => {
    const { corpo } = genera({ componente: 'elenco-azioni', azioni: [azione(0, { responsabile: '<script>x</script>' })] });
    assert.ok(!corpo.includes('<script>'));
    assert.ok(corpo.includes('&lt;script&gt;'));
  });

  test('oltre 6 azioni è rifiutato', () => {
    rifiutata({ componente: 'elenco-azioni', azioni: serie((i) => azione(i), 7) }, /7 voci, massimo 6/);
  });

  test('una scadenza che non è un valore dell\'Analisi è rifiutata', () => {
    rifiutata({ componente: 'elenco-azioni', azioni: [azione(0, { scadenza: 'domani' })] }, /domani/);
  });

  test('responsabile di troppe parole e stato non ammesso sono rifiutati', () => {
    rifiutata({ componente: 'elenco-azioni', azioni: [azione(0, { responsabile: 'uno due tre quattro cinque' })] }, /parole/);
    rifiutata({ componente: 'elenco-azioni', azioni: [azione(0, { stato: 'superato' })] }, /"superato" non ammesso/);
  });
});

describe('scheda-dati', () => {
  test('rende una lista di definizioni con etichette e valori', () => {
    const { corpo } = genera({
      componente: 'scheda-dati',
      voci: [datoScheda(0, { valore: 'Crescita {{crescita}}' }), datoScheda(1, { etichetta: 'Responsabile', valore: 'Maria Rossi' })],
    });
    assert.match(corpo, /<div class="scheda-dati" role="group" aria-label="Scheda dati"><dl>/);
    assert.match(corpo, /<div class="scheda-dati-voce"><dt>Campo uno<\/dt><dd>Crescita 12,3%<\/dd><\/div>/);
    assert.match(corpo, /<dt>Responsabile<\/dt><dd>Maria Rossi<\/dd>/);
  });

  test('etichetta e valore con markup sono escapati', () => {
    const { corpo } = genera({
      componente: 'scheda-dati',
      voci: [datoScheda(0, { etichetta: '<script>a</script>' }), datoScheda(1, { valore: '<script>b</script>' })],
    });
    assert.ok(!corpo.includes('<script>'));
    assert.equal(corpo.match(/&lt;script&gt;/g).length, 2);
  });

  test('meno di 2 o più di 8 voci è rifiutato', () => {
    rifiutata({ componente: 'scheda-dati', voci: [datoScheda(0)] }, /almeno 2 voci/);
    rifiutata({ componente: 'scheda-dati', voci: serie((i) => datoScheda(i), 9) }, /9 voci, massimo 8/);
  });

  test('etichetta o valore troppo lunghi sono rifiutati', () => {
    rifiutata({ componente: 'scheda-dati', voci: [datoScheda(0, { etichetta: 'uno due tre quattro' }), datoScheda(1)] }, /parole/);
    rifiutata({ componente: 'scheda-dati', voci: [datoScheda(0, { valore: 'uno due tre quattro cinque sei sette otto nove' }), datoScheda(1)] }, /parole/);
  });
});

describe('criteri-esito', () => {
  test('rende una tabella con soglia, risultato dall\'Analisi ed esito con icona e testo', () => {
    const { corpo } = genera({
      componente: 'criteri-esito',
      criteri: [criterio(0), criterio(1, { risultato: 'ricavi_totale', esito: 'parziale' }), criterio(2, { esito: 'non-superato' })],
    });
    assert.match(corpo, /<table class="criteri"><thead><tr><th scope="col" class="criteri-criterio">Criterio<\/th><th scope="col" class="criteri-soglia">Soglia<\/th><th scope="col" class="criteri-risultato">Risultato<\/th><th scope="col" class="criteri-esito">Esito<\/th>/);
    assert.match(corpo, /<th scope="row" class="criteri-criterio" data-etichetta="Criterio">Requisito uno<\/th>/);
    assert.match(corpo, /<td class="criteri-risultato" data-etichetta="Risultato">12,3%<\/td>/);
    assert.match(corpo, /<td class="criteri-risultato" data-etichetta="Risultato">1\.234,5\u00a0€<\/td>/);
    for (const [stato, testo] of [['superato', 'Superato'], ['parziale', 'Parziale'], ['non-superato', 'Non superato']]) {
      assert.match(corpo, new RegExp(`<span class="stato" data-stato="${stato}"><svg [^>]*aria-hidden="true"[\\s\\S]*?<span class="stato-testo">${testo}</span>`));
    }
  });

  test('il criterio con markup è escapato', () => {
    const { corpo } = genera({ componente: 'criteri-esito', criteri: [criterio(0, { criterio: '<script>x</script>' })] });
    assert.ok(!corpo.includes('<script>'));
    assert.ok(corpo.includes('&lt;script&gt;'));
  });

  test('oltre 6 criteri è rifiutato', () => {
    rifiutata({ componente: 'criteri-esito', criteri: serie((i) => criterio(i), 7) }, /7 voci, massimo 6/);
  });

  test('un esito di un altro vocabolario è rifiutato', () => {
    rifiutata({ componente: 'criteri-esito', criteri: [criterio(0, { esito: 'in-linea' })] }, /"in-linea" non ammesso/);
  });

  test('una soglia con numeri scritti a mano è rifiutata', () => {
    rifiutata({ componente: 'criteri-esito', criteri: [criterio(0, { soglia: 'Almeno 95' })] }, /95/);
  });
});

describe('numeri a schermo', () => {
  test('a schermo compaiono solo cifre dei testi dell\'Analisi', () => {
    const { corpo } = genera(
      {
        componente: 'semaforo',
        voci: [
          { etichetta: 'Area uno', stato: 'completato', nota: 'Valore {{ricavi_totale}}' },
          { etichetta: 'Area due', stato: 'in-ritardo' },
        ],
      },
      {
        componente: 'criteri-esito',
        criteri: [criterio(0), criterio(1, { risultato: 'data_chiusura', esito: 'parziale' })],
      },
    );
    const ammessi = new Set(['1.234,5', '12,3', '07/03/2024']);
    const trovati = testoVisibile(corpo).match(/\d[\d.,/]*\d|\d/g) ?? [];
    assert.ok(trovati.length >= 3);
    for (const numero of trovati) assert.ok(ammessi.has(numero), `numero inatteso a schermo: ${numero}`);
  });

  test('anche con azioni e opzioni non compare alcuna cifra oltre a quelle dell\'Analisi', () => {
    const { corpo } = genera(
      { componente: 'elenco-azioni', azioni: [azione(0, { stato: 'a-rischio' }), azione(1, { scadenza: 'scadenza_b' })] },
      { componente: 'opzioni-decisione', opzioni: [opzione(0, { ruolo: 'raccomandata' }), opzione(1)] },
    );
    const ammessi = new Set(['10/05/2024', '30/06/2024']);
    const trovati = testoVisibile(corpo).match(/\d[\d.,/]*\d|\d/g) ?? [];
    assert.equal(trovati.length, 2);
    for (const numero of trovati) assert.ok(ammessi.has(numero), `numero inatteso a schermo: ${numero}`);
  });
});

describe('stili', () => {
  test('i CSS usano le variabili di forma del Tema e non colori scritti a mano', () => {
    const { css } = genera({ componente: 'scheda-dati', voci: [datoScheda(0), datoScheda(1)] });
    for (const nome of ['semaforo', 'opzioni-decisione', 'elenco-azioni', 'scheda-dati', 'criteri-esito']) {
      const sorgente = leggi(RADICE, `design-system/componenti/${nome}/stile.css`);
      assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(sorgente), `${nome}: colore scritto a mano`);
      assert.match(sorgente, /@media print/);
      assert.match(sorgente, /@container \(max-width: 600px\)/);
      assert.ok(css.includes(sorgente.split('\n')[0]), `${nome}: stile non incluso nel CSS generato`);
    }
  });
});
