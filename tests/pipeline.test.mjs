import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, conSlide, slideKpi, esegui, leggi } from './helpers.mjs';


describe('genera: Specifica valida', () => {
  test('una copertina produce una Presentazione HTML in italiano', () => {
    const dir = creaPresentazione();
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.match(html, /<html lang="it"/);
    assert.match(html, /<h1[^>]*>Vendite del periodo<\/h1>/);
  });

  test('i KPI mostrano i valori dell\'Analisi formattati in italiano', () => {
    const specifica = conSlide(
      slideKpi([
        { etichetta: 'Ricavi', valore: 'ricavi_totale' },
        { etichetta: 'Crescita', valore: 'crescita' },
        { etichetta: 'Chiusura', valore: 'data_chiusura' },
      ]),
    );
    const dir = creaPresentazione({ specifica });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.ok(html.includes('1.234,5\u00a0€'), 'numero con unità');
    assert.ok(html.includes('12,3%'), 'percentuale');
    assert.ok(html.includes('07/03/2024'), 'data');
    assert.match(html, /Ricavi/);
  });

  test('il grafico a barre è un SVG accessibile generato dalla serie dell\'Analisi', () => {
    const specifica = conSlide({
      layout: 'risultato-grafico-commento',
      zone: {
        titolo: 'Il Nord pesa più degli altri',
        grafico: [{ componente: 'grafico-barre', serie: 'ricavi_per_regione' }],
      },
    });
    const dir = creaPresentazione({ specifica });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.match(html, /<svg[^>]*role="img"/);
    assert.equal((html.match(/<rect class="barra"/g) ?? []).length, 3);
    const descrizione = html.match(/<desc[^>]*>([^<]*)<\/desc>/)?.[1] ?? '';
    assert.match(descrizione, /Grafico a barre/);
    assert.ok(descrizione.includes('Nord: 5.200\u00a0€'), descrizione);
    assert.ok(descrizione.includes('Sud: 1.800\u00a0€'), descrizione);
  });

  test('i riferimenti {{id}} nel Commento diventano valori formattati dell\'Analisi', () => {
    const specifica = conSlide({
      layout: 'risultato-grafico-commento',
      zone: {
        titolo: 'Ricavi in crescita',
        commento: 'I ricavi arrivano a {{ricavi_totale}}, con una crescita del {{ crescita }}.',
      },
    });
    const dir = creaPresentazione({ specifica });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.ok(html.includes('I ricavi arrivano a 1.234,5\u00a0€, con una crescita del 12,3%.'));
    assert.ok(!html.includes('{{'));
  });

  test('il testo della Specifica viene sempre escapato', () => {
    const specifica = conSlide({
      layout: 'risultato-grafico-commento',
      zone: { titolo: "Utili <script>alert('x')</script> & perdite" },
    });
    const dir = creaPresentazione({ specifica });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.ok(!html.includes('<script>alert'));
    assert.ok(html.includes("Utili &lt;script&gt;alert('x')&lt;/script&gt; &amp; perdite"));
  });

  test('la chiusura elenca i prossimi passi in una lista ordinata', () => {
    const specifica = conSlide({
      layout: 'chiusura',
      zone: {
        titolo: 'Prossimi passi',
        passi: ['Approfondire il Sud', 'Rivedere il budget di {{ricavi_totale}}'],
      },
    });
    const dir = creaPresentazione({ specifica });
    const r = esegui(['genera', dir]);
    assert.equal(r.codice, 0, r.err);
    const html = leggi(dir, 'dist/index.html');
    assert.match(html, /<ol[^>]*>\s*<li>Approfondire il Sud<\/li><li>Rivedere il budget di 1\.234,5\u00a0€<\/li>\s*<\/ol>/);
  });

  test('la Presentazione è composta da sezioni con titolo semantico e non usa risorse esterne', () => {
    const specifica = conSlide(slideKpi([{ etichetta: 'Ricavi', valore: 'ricavi_totale' }]));
    const dir = creaPresentazione({ specifica });
    assert.equal(esegui(['genera', dir]).codice, 0);
    const html = leggi(dir, 'dist/index.html');
    const css = leggi(dir, 'dist/assets/presentazione.css');
    assert.equal((html.match(/<section class="slide /g) ?? []).length, 2);
    assert.match(html, /<section[^>]*id="slide-2"[^>]*aria-labelledby="slide-2-titolo"/);
    assert.match(html, /<h2 id="slide-2-titolo">/);
    assert.doesNotMatch(html + css, /https?:\/\//);
    assert.doesNotMatch(css, /@import|url\(/);
    assert.match(css, /--colore-carta:/);
  });
});
