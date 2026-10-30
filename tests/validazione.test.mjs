import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, creaCatalogo, specificaBase, analisiBase, conSlide, slideKpi, esegui, esiste, leggi } from './helpers.mjs';

/** Esegue `valida` e verifica codice di uscita non nullo e messaggio d'errore leggibile. */
function rifiutata(opzioni, atteso) {
  const dir = creaPresentazione(opzioni);
  const r = esegui(['valida', dir]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}${r.err}`);
  assert.match(r.err, atteso);
  return dir;
}

const rgc = (zone) => ({ layout: 'risultato-grafico-commento', zone: { titolo: 'Un risultato', ...zone } });

describe('valida: Specifica accettata', () => {
  test('una Specifica conforme al Catalogo esce con codice 0', () => {
    const dir = creaPresentazione({
      specifica: conSlide(
        slideKpi([{ etichetta: 'Ricavi', valore: 'ricavi_totale' }], {
          grafico: [{ componente: 'grafico-barre', serie: 'ricavi_per_regione' }],
          commento: 'Ricavi a {{ricavi_totale}}.',
        }),
      ),
    });
    const r = esegui(['valida', dir]);
    assert.equal(r.codice, 0, r.err);
    assert.match(r.out, /OK/);
  });
});

describe('valida: numeri scritti a mano', () => {
  test('una cifra nel Commento è rifiutata e il messaggio indica come correggere', () => {
    rifiutata({ specifica: conSlide(rgc({ commento: 'Ricavi cresciuti del 12% sul periodo.' })) }, /numero scritto a mano "12".*\{\{id\}\}.*numeriAmmessi/);
  });

  test('vale per ogni testo: titolo, etichette dei KPI, elenchi, anche con formati decimali', () => {
    rifiutata({ specifica: conSlide(rgc({ titolo: 'Ricavi a 1.234,5 euro' })) }, /numero scritto a mano "1\.234,5"/);
    rifiutata({ specifica: conSlide(slideKpi([{ etichetta: 'Top 3', valore: 'crescita' }])) }, /numero scritto a mano "3"/);
    rifiutata({ specifica: conSlide({ layout: 'chiusura', zone: { titolo: 'Fine', passi: ['Entro 30 giorni'] } }) }, /numero scritto a mano "30"/);
  });

  test('i numeri in "numeriAmmessi" sono accettati, gli altri restano rifiutati', () => {
    const specifica = { ...conSlide(rgc({ commento: 'Nel 2024 abbiamo 3 priorità, non 4.' })), numeriAmmessi: ['2024', '3'] };
    rifiutata({ specifica }, /numero scritto a mano "4"/);
    const dir = creaPresentazione({ specifica: { ...specifica, numeriAmmessi: ['2024', '3', '4'] } });
    assert.equal(esegui(['valida', dir]).codice, 0);
  });

  test('i riferimenti {{id}} non sono considerati numeri scritti a mano', () => {
    const dir = creaPresentazione({ specifica: conSlide(rgc({ commento: 'Ricavi a {{ricavi_totale}} (+{{crescita}}).' })) });
    assert.equal(esegui(['valida', dir]).codice, 0);
  });
});

describe('valida: limiti di contenuto del Catalogo', () => {
  const parole = (n) => Array.from({ length: n }, () => 'parola').join(' ');
  const voce = (i) => ({ etichetta: `Voce ${'abcde'[i]}`, valore: 'crescita' });

  test('numero massimo di voci KPI', () => {
    rifiutata({ specifica: conSlide(slideKpi([0, 1, 2, 3, 4].map(voce))) }, /5 voci, massimo 4/);
  });

  test('parole massime per zona di testo e per voce', () => {
    rifiutata({ specifica: conSlide(rgc({ commento: parole(46) })) }, /zona "commento".*46 parole, massimo 45/);
    rifiutata({ specifica: conSlide({ layout: 'chiusura', zone: { titolo: 'Fine', passi: [parole(15)] } }) }, /15 parole, massimo 14/);
  });

  test('parole massime per slide, sommando tutte le zone', () => {
    const specifica = conSlide(
      rgc({
        titolo: parole(20),
        commento: parole(45),
        kpi: [{ componente: 'kpi', voci: [0, 1, 2, 3].map((i) => ({ etichetta: parole(4), valore: 'crescita' })) }],
      }),
    );
    rifiutata({ specifica }, /slide 2: \d+ parole in totale, massimo 70/);
  });

  test('numero massimo di punti della serie e di voci dell\'elenco', () => {
    const analisi = analisiBase();
    analisi.serie.troppe = {
      ...analisi.serie.ricavi_per_regione,
      punti: Array.from({ length: 9 }, (_, i) => ({ etichetta: `R${'abcdefghi'[i]}`, valore: i })),
    };
    rifiutata(
      { analisi, specifica: conSlide(rgc({ grafico: [{ componente: 'grafico-barre', serie: 'troppe' }] })) },
      /la serie "troppe" ha 9 punti, massimo 8/,
    );
    rifiutata({ specifica: conSlide({ layout: 'chiusura', zone: { titolo: 'Fine', passi: ['a', 'b', 'c', 'd', 'e', 'f'] } }) }, /6 voci, massimo 5/);
  });

  test('numero di componenti per zona', () => {
    const grafico = { componente: 'grafico-barre', serie: 'ricavi_per_regione' };
    rifiutata({ specifica: conSlide(rgc({ grafico: [grafico, grafico] })) }, /2 componenti, massimo 1/);
  });
});

describe('valida: numeri nel titolo della Presentazione', () => {
  test('una cifra scritta a mano nel titolo è rifiutata, salvo allow-list', () => {
    const specifica = { ...conSlide(), titolo: 'Vendite 2024' };
    const dir = creaPresentazione({ specifica });
    const r = esegui(['valida', dir]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /specifica\.json › titolo.*numero scritto a mano "2024"/);

    const ammessa = creaPresentazione({ specifica: { ...specifica, numeriAmmessi: ['2024'] } });
    assert.equal(esegui(['valida', ammessa]).codice, 0);
  });
});

describe('valida: struttura della Specifica', () => {
  test('file della presentazione mancante', () => {
    rifiutata({ specifica: null }, /specifica\.json/);
    rifiutata({ analisi: null }, /analisi\.json/);
  });

  test('JSON non valido', () => {
    const dir = creaPresentazione({ specifica: null, grezzi: { 'specifica.json': '{ "titolo": ' } });
    const r = esegui(['valida', dir]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /specifica\.json.*JSON non valido/);
  });

  test('campi di primo livello mancanti o sconosciuti', () => {
    rifiutata({ specifica: { ...specificaBase(), titolo: '' } }, /titolo/);
    rifiutata({ specifica: { ...specificaBase(), slide: [] } }, /almeno una slide/);
    rifiutata({ specifica: { ...specificaBase(), lingua: 'xx' } }, /lingua "xx"/);
    rifiutata({ specifica: { ...specificaBase(), tema: 'inesistente' } }, /tema "inesistente"/);
    rifiutata({ specifica: { ...specificaBase(), colore: 'rosso' } }, /campo "colore" non previsto/);
  });

  test('layout fuori dal Catalogo', () => {
    rifiutata({ specifica: conSlide({ layout: 'inesistente', zone: {} }) }, /slide 2.*layout "inesistente".*Catalogo/);
  });

  test('zona obbligatoria mancante e zona non prevista', () => {
    rifiutata({ specifica: conSlide({ layout: 'risultato-grafico-commento', zone: {} }) }, /slide 2.*zona "titolo".*obbligatoria/);
    rifiutata({ specifica: conSlide(rgc({ foto: 'x' })) }, /slide 2.*zona "foto".*non prevista.*risultato-grafico-commento/);
  });

  test('tipo di contenuto sbagliato in una zona', () => {
    rifiutata({ specifica: conSlide(rgc({ commento: ['a', 'b'] })) }, /slide 2.*zona "commento".*testo/);
    rifiutata({ specifica: conSlide({ layout: 'chiusura', zone: { titolo: 'Fine', passi: 'uno' } }) }, /zona "passi".*elenco/);
  });

  test('componente fuori dal Catalogo o non ammesso nella zona', () => {
    rifiutata(
      { specifica: conSlide(rgc({ grafico: [{ componente: 'torta-3d' }] })) },
      /slide 2.*zona "grafico".*componente "torta-3d".*Catalogo/,
    );
    rifiutata(
      { specifica: conSlide(rgc({ grafico: [{ componente: 'kpi', voci: [] }] })) },
      /slide 2.*zona "grafico".*componente "kpi".*non ammesso/,
    );
  });

  test('proprietà dei componenti: mancanti, sconosciute, con riferimenti inesistenti', () => {
    rifiutata({ specifica: conSlide(rgc({ kpi: [{ componente: 'kpi' }] })) }, /componente 1 \(kpi\).*proprietà "voci" obbligatoria/);
    rifiutata(
      { specifica: conSlide(rgc({ grafico: [{ componente: 'grafico-barre', serie: 'ricavi_per_regione', colore: 'rosso' }] })) },
      /proprietà "colore" non prevista/,
    );
    rifiutata(
      { specifica: conSlide(slideKpi([{ etichetta: 'Ricavi', valore: 'ricavi_2030' }])) },
      /valore "ricavi_2030" non presente nell'Analisi/,
    );
    rifiutata(
      { specifica: conSlide(rgc({ grafico: [{ componente: 'grafico-barre', serie: 'serie_fantasma' }] })) },
      /serie "serie_fantasma" non presente nell'Analisi/,
    );
  });

  test('riferimento {{id}} inesistente o segnaposto non chiuso nel testo', () => {
    rifiutata({ specifica: conSlide(rgc({ commento: 'Ricavi {{ricavi_2030}}.' })) }, /riferimento "\{\{ricavi_2030\}\}" non presente nell'Analisi/);
    rifiutata({ specifica: conSlide(rgc({ commento: 'Ricavi {{ricavi_totale.' })) }, /segnaposto non chiuso/);
  });

  test('tutti gli errori sono riportati insieme, ciascuno con la sua posizione', () => {
    const dir = creaPresentazione({
      specifica: conSlide({ layout: 'inesistente', zone: {} }, rgc({ foto: 'x' })),
    });
    const r = esegui(['valida', dir]);
    assert.equal(r.codice, 1);
    assert.match(r.err, /slide 2/);
    assert.match(r.err, /slide 3/);
  });

  test('una Specifica non valida non produce nessuna Presentazione', () => {
    const dir = creaPresentazione({ specifica: conSlide({ layout: 'inesistente', zone: {} }) });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 1);
    assert.equal(esiste(dir, 'dist'), false);
  });
});
