const LARGHEZZA = 800;
const MARGINE_SINISTRO = 270;
const MARGINE_DESTRO = 110;
const ALTEZZA_RIGA_MIN = 48;
const MAX_CARATTERI_ETICHETTA = 26;

const accorcia = (testo) =>
  testo.length > MAX_CARATTERI_ETICHETTA ? `${testo.slice(0, MAX_CARATTERI_ETICHETTA - 1)}…` : testo;

export default function render({ serie, titolo }, { esc, t, id }) {
  const valori = serie.punti.map((p) => p.valore);
  const minimo = Math.min(0, ...valori);
  const massimo = Math.max(0, ...valori);
  const ampiezza = massimo - minimo || 1;
  const area = LARGHEZZA - MARGINE_SINISTRO - MARGINE_DESTRO;
  const zero = MARGINE_SINISTRO + (-minimo / ampiezza) * area;
  const n = serie.punti.length;
  const altezzaRiga = n <= 4 ? 84 : n <= 6 ? 62 : ALTEZZA_RIGA_MIN;
  const altezza = n * altezzaRiga + 8;

  const righe = serie.punti
    .map((p, i) => {
      const y = 4 + i * altezzaRiga;
      const lunghezza = (Math.abs(p.valore) / ampiezza) * area;
      const x = p.valore >= 0 ? zero : zero - lunghezza;
      const negativa = p.valore < 0;
      const xValore = negativa ? zero + 8 : zero + lunghezza + 8;
      const centro = y + altezzaRiga / 2;
      return (
        `<text class="etichetta" x="${MARGINE_SINISTRO - 12}" y="${centro}" text-anchor="end" dominant-baseline="middle">${esc(accorcia(p.etichetta))}</text>` +
        `<rect class="barra${negativa ? ' negativa' : ''}" x="${x.toFixed(1)}" y="${y + 6}" width="${lunghezza.toFixed(1)}" height="${altezzaRiga - 12}"/>` +
        `<text class="valore" x="${xValore.toFixed(1)}" y="${centro}" dominant-baseline="middle">${esc(p.testo)}</text>`
      );
    })
    .join('');

  const nome = titolo || esc(serie.etichetta);
  const descrizione = `${t('grafici.barre')}: ${serie.punti.map((p) => `${p.etichetta}: ${p.testo}`).join('; ')}`;

  return (
    `<figure class="grafico grafico-barre"><figcaption>${nome}</figcaption>` +
    `<svg viewBox="0 0 ${LARGHEZZA} ${altezza}" role="img" aria-labelledby="${id}-t ${id}-d">` +
    `<title id="${id}-t">${nome}</title><desc id="${id}-d">${esc(descrizione)}</desc>` +
    `<line class="asse" x1="${zero.toFixed(1)}" x2="${zero.toFixed(1)}" y1="0" y2="${altezza}"/>${righe}</svg></figure>`
  );
}
