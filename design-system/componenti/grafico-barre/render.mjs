const LARGHEZZA = 800;
const MARGINE_SINISTRO = 270;
const MARGINE_DESTRO = 110;
const ALTEZZA_RIGA_MIN = 48;
const MAX_CARATTERI_ETICHETTA = 26;

const accorcia = (testo) =>
  testo.length > MAX_CARATTERI_ETICHETTA ? `${testo.slice(0, MAX_CARATTERI_ETICHETTA - 1)}…` : testo;

const FATTORE_ALTEZZA = { compatta: 0.75, standard: 1, alta: 1.3 };
const ALTEZZA_VERTICALE = { compatta: 240, standard: 320, alta: 420 };
const VERTICALE = { sinistra: 20, destra: 20, alto: 34, basso: 76, caratteriPerPixel: 1 / 10.5 };

function ordina(punti, ordinamento) {
  if (ordinamento === 'dato') return punti;
  return [...punti].sort((a, b) => (ordinamento === 'crescente' ? a.valore - b.valore : b.valore - a.valore));
}

/** Il punto evidenziato ha contorno e testo in grassetto (mai solo il colore); gli altri sono attenuati. */
function classiBarra(p, negativa, evidenzia) {
  const stato = evidenzia === undefined ? '' : p.etichetta === evidenzia ? ' evidenziata' : ' attenuata';
  return `barra${negativa ? ' negativa' : ''}${stato}`;
}
const classeTesto = (base, p, evidenzia) => (evidenzia !== undefined && p.etichetta === evidenzia ? `${base} evidenziata` : base);

function righeEtichetta(testo, massimo) {
  const righe = [];
  for (const parola of testo.split(' ')) {
    const ultima = righe.length - 1;
    if (ultima >= 0 && righe[ultima].length + 1 + parola.length <= massimo) righe[ultima] += ` ${parola}`;
    else righe.push(parola);
  }
  const due = righe.length > 2 ? [righe[0], righe.slice(1).join(' ')] : righe;
  return due.map((r) => (r.length > massimo ? `${r.slice(0, massimo - 1)}…` : r));
}

function disegnaOrizzontale(punti, { altezza: livello, valori, evidenzia }, esc) {
  const numeri = punti.map((p) => p.valore);
  const minimo = Math.min(0, ...numeri);
  const massimo = Math.max(0, ...numeri);
  const ampiezza = massimo - minimo || 1;
  const area = LARGHEZZA - MARGINE_SINISTRO - MARGINE_DESTRO;
  const zero = MARGINE_SINISTRO + (-minimo / ampiezza) * area;
  const n = punti.length;
  const altezzaRiga = Math.round((n <= 4 ? 84 : n <= 6 ? 62 : ALTEZZA_RIGA_MIN) * FATTORE_ALTEZZA[livello]);
  const altezza = n * altezzaRiga + 8;

  const righe = punti
    .map((p, i) => {
      const y = 4 + i * altezzaRiga;
      const lunghezza = (Math.abs(p.valore) / ampiezza) * area;
      const x = p.valore >= 0 ? zero : zero - lunghezza;
      const negativa = p.valore < 0;
      const xValore = negativa ? zero + 8 : zero + lunghezza + 8;
      const centro = y + altezzaRiga / 2;
      return (
        `<text class="${classeTesto('etichetta', p, evidenzia)}" x="${MARGINE_SINISTRO - 12}" y="${centro}" text-anchor="end" dominant-baseline="middle">${esc(accorcia(p.etichetta))}</text>` +
        `<rect class="${classiBarra(p, negativa, evidenzia)}" x="${x.toFixed(1)}" y="${y + 6}" width="${lunghezza.toFixed(1)}" height="${altezzaRiga - 12}"/>` +
        (valori === 'mostra'
          ? `<text class="${classeTesto('valore', p, evidenzia)}" x="${xValore.toFixed(1)}" y="${centro}" dominant-baseline="middle">${esc(p.testo)}</text>`
          : '')
      );
    })
    .join('');

  return { altezza, larghezza: LARGHEZZA, corpo: `<line class="asse" x1="${zero.toFixed(1)}" x2="${zero.toFixed(1)}" y1="0" y2="${altezza}"/>${righe}` };
}

function disegnaVerticale(punti, { altezza: livello, valori, evidenzia }, esc) {
  const numeri = punti.map((p) => p.valore);
  const minimo = Math.min(0, ...numeri);
  const massimo = Math.max(0, ...numeri);
  const ampiezza = massimo - minimo || 1;
  const altezza = ALTEZZA_VERTICALE[livello];
  const areaL = LARGHEZZA - VERTICALE.sinistra - VERTICALE.destra;
  const areaA = altezza - VERTICALE.alto - VERTICALE.basso;
  const zero = VERTICALE.alto + (massimo / ampiezza) * areaA;
  const passo = areaL / punti.length;
  const larghezzaBarra = Math.min(passo - 24, 120);
  const massimoCaratteri = Math.max(6, Math.floor(passo * VERTICALE.caratteriPerPixel));

  const colonne = punti
    .map((p, i) => {
      const centro = VERTICALE.sinistra + passo * (i + 0.5);
      const lunghezza = (Math.abs(p.valore) / ampiezza) * areaA;
      const negativa = p.valore < 0;
      const y = negativa ? zero : zero - lunghezza;
      const yValore = negativa ? zero + lunghezza + 22 : zero - lunghezza - 8;
      const righe = righeEtichetta(p.etichetta, massimoCaratteri)
        .map((r, k) => `<tspan x="${centro.toFixed(1)}" dy="${k === 0 ? 0 : 20}">${esc(r)}</tspan>`)
        .join('');
      return (
        `<rect class="${classiBarra(p, negativa, evidenzia)}" x="${(centro - larghezzaBarra / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${larghezzaBarra.toFixed(1)}" height="${lunghezza.toFixed(1)}"/>` +
        (valori === 'mostra'
          ? `<text class="${classeTesto('valore', p, evidenzia)}" x="${centro.toFixed(1)}" y="${yValore.toFixed(1)}" text-anchor="middle">${esc(p.testo)}</text>`
          : '') +
        `<text class="${classeTesto('etichetta', p, evidenzia)}" x="${centro.toFixed(1)}" y="${altezza - 34}" text-anchor="middle"><title>${esc(p.etichetta)}</title>${righe}</text>`
      );
    })
    .join('');

  return { altezza, larghezza: LARGHEZZA, corpo: `<line class="asse" x1="0" x2="${LARGHEZZA}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/>${colonne}` };
}

export default function render({ serie, titolo }, { esc, t, id, regolazioni }) {
  const { ordinamento, evidenzia, orientamento } = regolazioni;
  const punti = ordina(serie.punti, ordinamento);
  const disegno = (orientamento === 'verticale' ? disegnaVerticale : disegnaOrizzontale)(punti, regolazioni, esc);

  const nome = titolo || esc(serie.etichetta);
  const descrizione =
    `${t('grafici.barre')}: ${punti.map((p) => `${p.etichetta}: ${p.testo}`).join('; ')}` +
    (evidenzia === undefined ? '' : `. ${t('grafici.evidenziato')}: ${evidenzia}`);

  return (
    `<figure class="grafico grafico-barre"><figcaption>${nome}</figcaption>` +
    `<svg viewBox="0 0 ${disegno.larghezza} ${disegno.altezza}" role="img" aria-labelledby="${id}-t ${id}-d">` +
    `<title id="${id}-t">${nome}</title><desc id="${id}-d">${esc(descrizione)}</desc>` +
    `${disegno.corpo}</svg></figure>`
  );
}
