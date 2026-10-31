import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, creaCatalogo, conSlide, esegui, leggi } from './helpers.mjs';

const kpi = (regolazioni) => ({ componente: 'kpi', voci: [{ etichetta: 'Ricavi', valore: 'ricavi_totale' }], regolazioni });
const barre = (regolazioni) => ({ componente: 'grafico-barre', serie: 'ricavi_per_regione', regolazioni });
const ciambella = (regolazioni) => ({ componente: 'grafico-ciambella', serie: 'ricavi_per_regione', regolazioni });
const linee = (regolazioni, n = 1) => ({
  componente: 'grafico-linee',
  linee: Array.from({ length: n }, (_, i) => ({ nome: ['Prima', 'Seconda', 'Terza'][i], serie: 'ricavi_per_regione' })),
  regolazioni,
});

const slide = (componente) => ({
  layout: 'esperimento',
  zone: { titolo: 'Funziona', ipotesi: 'Ipotesi di prova', metodo: 'Metodo di prova', risultato: [componente], conclusione: 'Si procede' },
});

function genera(componente) {
  const dir = creaPresentazione({ specifica: conSlide(slide(componente)) });
  const r = esegui(['genera', dir]);
  assert.equal(r.codice, 0, r.err + r.out);
  return leggi(dir, 'dist/index.html');
}

function rifiutato(componente, atteso) {
  const r = esegui(['valida', creaPresentazione({ specifica: conSlide(slide(componente)) })]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}${r.err}`);
  assert.match(r.err, atteso);
}

const altezzaViewBox = (html) => Number(/viewBox="0 0 \d+ (\d+)"/.exec(html.slice(html.indexOf('grafico-'))).at(1));
const prima = (html, a, b) => html.indexOf(a) < html.indexOf(b);

describe('Regolazioni dei Componenti: predefiniti', () => {
  test('indicare i predefiniti produce lo stesso HTML di non indicare nulla', () => {
    const coppie = [
      [kpi(), kpi({ dimensione: 'standard' })],
      [barre(), barre({ altezza: 'standard', ordinamento: 'dato', orientamento: 'orizzontale', valori: 'mostra' })],
      [ciambella(), ciambella({ altezza: 'standard', ordinamento: 'dato', valori: 'mostra' })],
      [linee(), linee({ altezza: 'standard', valori: 'mostra', legenda: 'mostra' })],
    ];
    for (const [senza, con] of coppie) assert.equal(genera(senza), genera(con), senza.componente);
  });
});

describe('grafico-barre', () => {
  test('ordinamento riordina barre e descrizione senza cambiare i valori', () => {
    const crescente = genera(barre({ ordinamento: 'crescente' }));
    assert.ok(prima(crescente, '>Sud<', '>Nord<'));
    assert.match(crescente, /Sud: 1\.800\s€; Centro: 3\.100\s€; Nord: 5\.200\s€/);
    const decrescente = genera(barre({ ordinamento: 'decrescente' }));
    assert.ok(prima(decrescente, '>Nord<', '>Sud<'));
  });

  test('altezza cambia la proporzione del grafico', () => {
    const compatta = altezzaViewBox(genera(barre({ altezza: 'compatta' })));
    const standard = altezzaViewBox(genera(barre()));
    const alta = altezzaViewBox(genera(barre({ altezza: 'alta' })));
    assert.ok(compatta < standard && standard < alta, `${compatta} ${standard} ${alta}`);
  });

  test('orientamento verticale disegna colonne con etichette sotto', () => {
    const h = genera(barre({ orientamento: 'verticale' }));
    assert.doesNotMatch(h, /text-anchor="end"/);
    assert.match(h, /<title>Nord<\/title>/);
    assert.match(h, /viewBox="0 0 800 320"/);
    assert.equal((h.match(/<rect class="barra/g) ?? []).length, 3);
  });

  test('valori nascondi toglie le etichette dei valori ma non dalla descrizione', () => {
    for (const orientamento of ['orizzontale', 'verticale']) {
      const h = genera(barre({ valori: 'nascondi', orientamento }));
      assert.doesNotMatch(h, /class="valore"/);
      assert.match(h, /Nord: 5\.200\s€/);
    }
  });

  test('evidenzia usa un segno non cromatico: contorno, grassetto e testo nella descrizione', () => {
    const h = genera(barre({ evidenzia: 'Centro' }));
    assert.equal((h.match(/class="barra evidenziata"/g) ?? []).length, 1);
    assert.equal((h.match(/class="barra attenuata"/g) ?? []).length, 2);
    assert.match(h, /<text class="etichetta evidenziata"[^>]*>Centro</);
    assert.match(h, /Evidenziato: Centro/);
  });

  test('evidenzia deve citare un punto della serie', () => {
    rifiutato(barre({ evidenzia: 'Est' }), /punto "Est" non presente nella serie "ricavi_per_regione" \(punti: .*Nord/);
  });

  test('valori fuori elenco sono rifiutati con quelli ammessi', () => {
    rifiutato(barre({ orientamento: 'diagonale' }), /valore "diagonale" non ammesso \(ammessi: .*orizzontale/);
  });
});

describe('grafico-ciambella', () => {
  test('evidenzia ingrandisce l\'arco e sottolinea la voce di legenda', () => {
    const h = genera(ciambella({ evidenzia: 'Sud' }));
    assert.equal((h.match(/fetta fetta-\d evidenziata/g) ?? []).length, 1);
    assert.equal((h.match(/fetta fetta-\d attenuata/g) ?? []).length, 2);
    assert.match(h, /ciambella-voce fetta-3 evidenziata/);
    assert.match(h, /Evidenziato: Sud/);
    rifiutato(ciambella({ evidenzia: 'Est' }), /punto "Est" non presente/);
  });

  test('altezza aggiunge un attributo solo se non è la standard', () => {
    assert.match(genera(ciambella({ altezza: 'alta' })), /data-altezza="alta"/);
    assert.doesNotMatch(genera(ciambella()), /data-altezza/);
  });

  test('valori nascondi lascia in legenda le sole etichette; ordinamento riordina gli archi', () => {
    assert.doesNotMatch(genera(ciambella({ valori: 'nascondi' })), /class="ciambella-valore"/);
    const h = genera(ciambella({ ordinamento: 'crescente' }));
    assert.ok(prima(h, '>Sud<', '>Nord<'));
  });
});

describe('grafico-linee', () => {
  test('altezza cambia il viewBox', () => {
    assert.match(genera(linee({ altezza: 'alta' })), /viewBox="0 0 720 400"/);
    assert.match(genera(linee({ altezza: 'compatta' })), /viewBox="0 0 720 220"/);
  });

  test('valori nascondi toglie i valori dai punti', () => {
    assert.doesNotMatch(genera(linee({ valori: 'nascondi' })), /valore-linea/);
  });

  test('legenda nascondi vale con una sola linea; con più linee la legenda resta', () => {
    assert.doesNotMatch(genera(linee({ legenda: 'nascondi' })), /class="legenda"/);
    assert.match(genera(linee({ legenda: 'nascondi' }, 2)), /class="legenda"/);
  });
});

describe('kpi', () => {
  test('dimensione grande aggiunge l\'attributo solo se serve', () => {
    assert.match(genera(kpi({ dimensione: 'grande' })), /data-dimensione="grande"/);
    assert.doesNotMatch(genera(kpi()), /data-dimensione/);
  });

  test('un Componente senza Regolazioni rifiuta le Regolazioni', () => {
    rifiutato({ componente: 'tabella-serie', serie: 'ricavi_per_regione', regolazioni: { altezza: 'alta' } }, /regolazione "altezza": non prevista/);
  });
});

describe('Regolazione di tipo punto: manifest', () => {
  const errori = (regolazioni, props = { serie: { tipo: 'serie' } }, tipo = 'componenti') =>
    esegui([
      'valida',
      creaPresentazione(),
      '--catalogo',
      creaCatalogo(
        tipo === 'componenti'
          ? {
              'componenti/x/manifest.json': { nome: 'x', scopo: 'x', props, regolazioni },
              'componenti/x/render.mjs': 'export default () => "";',
            }
          : {
              'layouts/y/manifest.json': { nome: 'y', scopo: 'y', zone: [{ nome: 'titolo', tipo: 'testo', ruolo: 'titolo', obbligatoria: true }], regolazioni },
              'layouts/y/render.mjs': 'export default () => "";',
            },
      ),
    ]).err;

  test('deve citare una proprietà di tipo serie ed è previsto solo per i Componenti', () => {
    assert.match(errori({ e: { tipo: 'punto', serie: 'altro' } }), /"serie" deve citare una proprietà di tipo serie/);
    assert.match(errori({ e: { tipo: 'punto', serie: 'serie' } }, { serie: { tipo: 'testo' } }), /"serie" deve citare/);
    assert.match(errori({ e: { tipo: 'punto', serie: 'titolo' } }, undefined, 'layouts'), /solo per i Componenti/);
    assert.match(errori({ e: { tipo: 'altro' } }), /tipo "altro" sconosciuto/);
  });
});
