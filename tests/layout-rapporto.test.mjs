import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaPresentazione, analisiBase, conSlide, esegui, leggi } from './helpers.mjs';

const prov = { file: 'dati/poc.csv', colonna: 'misura', operazione: 'media' };

function analisiRapporto() {
  const a = analisiBase();
  a.valori.precisione = { etichetta: 'Precisione', formato: { tipo: 'percentuale', decimali: 1 }, valore: 87.4, provenienza: prov };
  a.valori.scadenza = { etichetta: 'Scadenza', formato: { tipo: 'data' }, valore: '2026-05-12', provenienza: prov };
  return a;
}

function genera(...slide) {
  const dir = creaPresentazione({ analisi: analisiRapporto(), specifica: conSlide(...slide) });
  const r = esegui(['genera', dir]);
  return { r, dir, html: r.codice === 0 ? leggi(dir, 'dist/index.html') : '' };
}

function rifiutata(slide, atteso) {
  const dir = creaPresentazione({ analisi: analisiRapporto(), specifica: conSlide(slide) });
  const r = esegui(['valida', dir]);
  assert.equal(r.codice, 1, `atteso errore, ottenuto: ${r.out}`);
  assert.match(r.err, atteso);
}

const parole = (n) => Array.from({ length: n }, () => 'parola').join(' ');
const rischi = (n) =>
  Array.from({ length: n }, (_, i) => ({
    titolo: `Rischio ${['uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto'][i]}`,
    probabilita: ['medio', 'basso', 'alto', 'medio', 'alto', 'basso', 'medio', 'alto'][i],
    impatto: ['alto', 'alto', 'medio', 'medio', 'basso', 'alto', 'basso', 'alto'][i],
  }));
const matrice = (n = 3) => [{ componente: 'matrice-rischi', rischi: rischi(n) }];
const criteri = [
  {
    componente: 'criteri-esito',
    criteri: [{ criterio: 'Precisione', soglia: 'Oltre soglia', risultato: 'precisione', esito: 'superato' }],
  },
];
const azioni = [
  {
    componente: 'elenco-azioni',
    azioni: [{ azione: 'Estendere il pilota', responsabile: 'Maria Rossi', scadenza: 'scadenza', stato: 'in-linea' }],
  },
];
const tabellaSerie = [
  { componente: 'tabella-serie', intestazione: 'Regione', colonne: [{ titolo: 'Ricavi', serie: 'ricavi_per_regione' }] },
];
const kpi = { componente: 'kpi', voci: [{ etichetta: 'Precisione', valore: 'precisione' }] };
const barre = { componente: 'grafico-barre', serie: 'ricavi_per_regione', titolo: 'Ricavi per regione' };
const nota = [{ componente: 'nota', etichetta: 'Attenzione', testo: 'Il campione è limitato.' }];
const dati = [{ componente: 'scheda-dati', voci: [{ etichetta: 'Responsabile', valore: 'Maria Rossi' }, { etichetta: 'Ambiente', valore: 'Cloud privato' }] }];

const rischiMatrice = (zone = {}) => ({
  layout: 'rischi-matrice',
  zone: { titolo: 'Tre rischi da governare', matrice: matrice(), mitigazioni: ['Mostrare la fonte di ogni risposta', 'Separare i documenti riservati'], ...zone },
});
const tabellaAmpia = (zone = {}) => ({ layout: 'tabella-ampia', zone: { titolo: 'Una tabella ampia', tabella: criteri, ...zone } });
const appendice = (zone = {}) => ({ layout: 'cartella-appendice', zone: { titolo: 'Dettagli tecnici', contenuti: ['Architettura', 'Metodo di valutazione'], ...zone } });
const esperimento = (zone = {}) => ({
  layout: 'esperimento',
  zone: {
    titolo: 'La ricerca supera la soglia',
    ipotesi: 'Una ricerca semantica risponde con precisione adeguata.',
    metodo: 'Interrogazioni reali valutate da revisori indipendenti.',
    risultato: [barre],
    conclusione: 'La soglia è superata nei reparti del pilota.',
    ...zone,
  },
});

describe('layout rischi-matrice', () => {
  test('rende matrice e mitigazioni nella slide', () => {
    const { r, html } = genera(rischiMatrice({ occhiello: 'Rischi' }));
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="slide slide-rischi-matrice"/);
    assert.match(html, /<h2 id="slide-2-titolo">Tre rischi da governare<\/h2>/);
    assert.match(html, /class="occhiello">Rischi</);
    assert.match(html, /Mitigazioni/);
    assert.match(html, /<li>Mostrare la fonte di ogni risposta<\/li>/);
    assert.match(html, /Rischio uno/);
  });

  test('l\'occhiello è facoltativo', () => {
    const { r, html } = genera(rischiMatrice());
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /class="occhiello"/);
  });

  test('accetta il numero massimo di rischi e di mitigazioni', () => {
    const { r } = genera(rischiMatrice({ matrice: matrice(8), mitigazioni: ['Una', 'Due', 'Tre', 'Quattro', 'Cinque'] }));
    assert.equal(r.codice, 0, r.err);
  });

  test('oltre 5 mitigazioni è rifiutato', () => {
    rifiutata(rischiMatrice({ mitigazioni: ['Una', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei'] }), /6 voci, massimo 5/);
  });

  test('un titolo troppo lungo è rifiutato', () => {
    rifiutata(rischiMatrice({ titolo: parole(15) }), /15 parole, massimo 14/);
  });

  test('una mitigazione troppo lunga è rifiutata', () => {
    rifiutata(rischiMatrice({ mitigazioni: [parole(19)] }), /19 parole, massimo 18/);
  });

  test('un componente diverso dalla matrice dei rischi è rifiutato', () => {
    rifiutata(rischiMatrice({ matrice: [kpi] }), /componente "kpi" non ammesso nella zona/);
  });

  test('il testo delle mitigazioni e dei rischi è escapato', () => {
    const rs = rischi(2);
    rs[0].titolo = '<script>alert</script>';
    const { r, html } = genera(
      rischiMatrice({ matrice: [{ componente: 'matrice-rischi', rischi: rs }], mitigazioni: ['<img src=x> prova', 'Altra mitigazione'] }),
    );
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<img src=x>/);
    assert.match(html, /&lt;img src=x&gt; prova/);
  });
});

describe('layout tabella-ampia', () => {
  test('rende la tabella con nota e fonte', () => {
    const { r, html } = genera(tabellaAmpia({ occhiello: 'Verifica', nota, fonte: 'Fonte: verifica del pilota' }));
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="slide slide-tabella-ampia"/);
    assert.match(html, /<h2 id="slide-2-titolo">Una tabella ampia<\/h2>/);
    assert.match(html, /Fonte: verifica del pilota/);
    assert.match(html, /Il campione è limitato\./);
    assert.match(html, /87,4%/);
  });

  test('accetta criteri, azioni e tabella di serie', () => {
    for (const tabella of [criteri, azioni, tabellaSerie]) {
      const { r } = genera(tabellaAmpia({ tabella }));
      assert.equal(r.codice, 0, r.err);
    }
  });

  test('occhiello, nota e fonte sono facoltativi', () => {
    const { r, html } = genera(tabellaAmpia());
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /class="occhiello"/);
    assert.doesNotMatch(html, /class="ta-nota"|class="ta-fonte"/);
  });

  test('un componente non ammesso nella tabella è rifiutato', () => {
    rifiutata(tabellaAmpia({ tabella: [kpi] }), /componente "kpi" non ammesso nella zona/);
  });

  test('un componente non ammesso nella nota è rifiutato', () => {
    rifiutata(tabellaAmpia({ nota: [kpi] }), /componente "kpi" non ammesso nella zona/);
  });

  test('due componenti nella tabella sono rifiutati', () => {
    rifiutata(tabellaAmpia({ tabella: [...criteri, ...azioni] }), /2 componenti|massimo 1/);
  });

  test('una fonte troppo lunga è rifiutata', () => {
    rifiutata(tabellaAmpia({ fonte: parole(13) }), /13 parole, massimo 12/);
  });

  test('un numero scritto a mano nella fonte è rifiutato', () => {
    rifiutata(tabellaAmpia({ fonte: 'Fonte: 35 interviste' }), /35/);
  });

  test('la fonte è escapata', () => {
    const { r, html } = genera(tabellaAmpia({ fonte: '<b>fonte</b> & co' }));
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<b>fonte<\/b>/);
    assert.match(html, /&lt;b&gt;fonte&lt;\/b&gt; &amp; co/);
  });
});

describe('layout cartella-appendice', () => {
  test('rende titolo, sottotitolo e contenuti con l\'occhiello fisso', () => {
    const { r, html } = genera(appendice({ sottotitolo: 'Materiali di supporto' }));
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="slide slide-cartella-appendice"/);
    assert.match(html, /<h2 id="slide-2-titolo">Dettagli tecnici<\/h2>/);
    assert.match(html, /class="occhiello">Appendice</);
    assert.match(html, /Materiali di supporto/);
    assert.match(html, /<li>Architettura<\/li>/);
  });

  test('il sottotitolo è facoltativo', () => {
    const { r, html } = genera(appendice());
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /slide-cartella-appendice/);
  });

  test('il foglio di stile nasconde la cornice e usa i colori della copertina', () => {
    const { dir } = genera(appendice());
    const css = leggi(dir, 'dist/assets/presentazione.css');
    assert.match(css, /\.slide-cartella-appendice[^{]*\{[^}]*--colore-copertina-sfondo/);
  });

  test('oltre 6 contenuti è rifiutato', () => {
    rifiutata(appendice({ contenuti: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => `Voce ${x}`) }), /7 voci, massimo 6/);
  });

  test('un titolo troppo lungo è rifiutato', () => {
    rifiutata(appendice({ titolo: parole(11) }), /11 parole, massimo 10/);
  });

  test('un contenuto troppo lungo è rifiutato', () => {
    rifiutata(appendice({ contenuti: [parole(9)] }), /9 parole, massimo 8/);
  });

  test('i contenuti sono escapati', () => {
    const { r, html } = genera(appendice({ contenuti: ['<script>x</script>'] }));
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<script>x/);
    assert.match(html, /&lt;script&gt;x&lt;\/script&gt;/);
  });

  test('la zona occhiello non è prevista', () => {
    rifiutata(appendice({ occhiello: 'Altro' }), /zona "occhiello" non prevista/);
  });
});

describe('layout esperimento', () => {
  test('rende ipotesi, metodo, risultato, conclusione e dati', () => {
    const { r, html } = genera(esperimento({ occhiello: 'Esperimento', dati }));
    assert.equal(r.codice, 0, r.err);
    assert.match(html, /class="slide slide-esperimento"/);
    assert.match(html, /<h2 id="slide-2-titolo">La ricerca supera la soglia<\/h2>/);
    for (const intestazione of ['Ipotesi', 'Metodo', 'Risultato', 'Conclusione']) {
      assert.match(html, new RegExp(`class="es-intestazione">${intestazione}<`));
    }
    assert.match(html, /Una ricerca semantica risponde con precisione adeguata\./);
    assert.match(html, /Cloud privato/);
  });

  test('ammette due componenti nel risultato', () => {
    const { r } = genera(esperimento({ risultato: [barre, kpi] }));
    assert.equal(r.codice, 0, r.err);
  });

  test('le zone facoltative possono mancare', () => {
    const { r, html } = genera({ layout: 'esperimento', zone: { titolo: 'Solo il risultato', risultato: [kpi] } });
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /es-ipotesi|es-metodo|es-conclusione|es-dati|class="occhiello"/);
    assert.match(html, /es-solo/);
  });

  test('il risultato è obbligatorio', () => {
    const dir = creaPresentazione({ analisi: analisiRapporto(), specifica: conSlide({ layout: 'esperimento', zone: { titolo: 'Senza risultato' } }) });
    const r = esegui(['valida', dir]);
    assert.equal(r.codice, 1);
  });

  test('oltre due componenti nel risultato sono rifiutati', () => {
    rifiutata(esperimento({ risultato: [barre, kpi, barre] }), /3 componenti|massimo 2/);
  });

  test('un componente non ammesso nel risultato è rifiutato', () => {
    rifiutata(esperimento({ risultato: [nota[0]] }), /componente "nota" non ammesso nella zona/);
  });

  test('un componente non ammesso nei dati è rifiutato', () => {
    rifiutata(esperimento({ dati: [kpi] }), /componente "kpi" non ammesso nella zona/);
  });

  test('ipotesi, metodo e conclusione oltre il limite sono rifiutati', () => {
    rifiutata(esperimento({ ipotesi: parole(23) }), /23 parole, massimo 22/);
    rifiutata(esperimento({ metodo: parole(23) }), /23 parole, massimo 22/);
    rifiutata(esperimento({ conclusione: parole(31) }), /31 parole, massimo 30/);
  });

  test('una slide troppo piena è rifiutata', () => {
    const datiLunghi = [
      {
        componente: 'scheda-dati',
        voci: Array.from({ length: 8 }, () => ({ etichetta: 'Responsabile del pilota', valore: 'Maria Rossi del reparto' })),
      },
    ];
    rifiutata(
      esperimento({ ipotesi: parole(22), metodo: parole(22), conclusione: parole(30), occhiello: parole(4), titolo: parole(16), dati: datiLunghi }),
      /massimo 120/,
    );
  });

  test('un numero scritto a mano nella conclusione è rifiutato', () => {
    rifiutata(esperimento({ conclusione: 'La precisione sale al 91 per cento' }), /91/);
  });

  test('i testi sono escapati', () => {
    const { r, html } = genera(esperimento({ ipotesi: '<script>x</script> & prova', conclusione: 'Esito "ok" <b>' }));
    assert.equal(r.codice, 0, r.err);
    assert.doesNotMatch(html, /<script>x/);
    assert.match(html, /&lt;script&gt;x&lt;\/script&gt; &amp; prova/);
    assert.match(html, /&lt;b&gt;/);
  });
});
