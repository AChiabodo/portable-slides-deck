const CENTRO = 100;
const RAGGIO = 74;
const SPAZIO = 0.7;

export default function render({ serie, totale }, { esc, t, id }) {
  const positivi = serie.punti.reduce((somma, p) => (p.valore > 0 ? somma + p.valore : somma), 0);
  const conArco = serie.punti.filter((p) => p.valore > 0).length;
  const spazio = conArco > 1 ? SPAZIO : 0;

  let inizio = 0;
  const archi = serie.punti
    .map((p, i) => {
      if (!(p.valore > 0)) return '';
      const quota = (p.valore / positivi) * 100;
      const lunghezza = Math.max(quota - spazio, 0.01);
      const arco =
        `<circle class="fetta fetta-${i + 1}" cx="${CENTRO}" cy="${CENTRO}" r="${RAGGIO}" pathLength="100" ` +
        `stroke-dasharray="${lunghezza.toFixed(3)} ${(100 - lunghezza).toFixed(3)}" stroke-dashoffset="${(-inizio).toFixed(3)}"/>`;
      inizio += quota;
      return arco;
    })
    .join('');

  const righeEtichetta = totale ? totale.etichetta.split(' ') : [];
  const meta = Math.ceil(righeEtichetta.length / 2);
  const doppia = totale && totale.etichetta.length > 12 && righeEtichetta.length > 1;
  const linee = doppia ? [righeEtichetta.slice(0, meta).join(' '), righeEtichetta.slice(meta).join(' ')] : totale ? [totale.etichetta] : [];
  const centro = totale
    ? `<text class="totale-valore${totale.testo.length > 9 ? ' lungo' : ''}" x="${CENTRO}" y="${CENTRO - (doppia ? 4 : 0) + 4}" text-anchor="middle">${totale.testo}</text>` +
      `<text class="totale-etichetta" x="${CENTRO}" y="${CENTRO + (doppia ? 14 : 24)}" text-anchor="middle">` +
      linee.map((l, i) => `<tspan x="${CENTRO}" dy="${i === 0 ? 0 : 12}">${l}</tspan>`).join('') +
      `</text>`
    : '';

  const legenda = serie.punti
    .map(
      (p, i) =>
        `<li class="ciambella-voce fetta-${i + 1}${p.valore > 0 ? '' : ' senza-arco'}">` +
        `<span class="ciambella-segno" aria-hidden="true"></span>` +
        `<span class="ciambella-nome">${esc(p.etichetta)}</span>` +
        `<span class="ciambella-valore">${esc(p.testo)}</span></li>`,
    )
    .join('');

  const parti = serie.punti.map((p) => `${p.etichetta}: ${p.testo}`).join('; ');
  const descrizione = `${t('grafici.ciambella')}: ${esc(serie.etichetta)}${totale ? ` (${totale.etichetta}: ${totale.testo})` : ''}. ${esc(parti)}`;

  return (
    `<figure class="grafico grafico-ciambella">` +
    `<svg viewBox="0 0 200 200" role="img" aria-labelledby="${id}-t ${id}-d">` +
    `<title id="${id}-t">${t('grafici.ciambella')}</title><desc id="${id}-d">${descrizione}</desc>` +
    `<circle class="pista" cx="${CENTRO}" cy="${CENTRO}" r="${RAGGIO}"/>` +
    `<g transform="rotate(-90 ${CENTRO} ${CENTRO})">${archi}</g>${centro}</svg>` +
    `<ul class="ciambella-legenda">${legenda}</ul></figure>`
  );
}
