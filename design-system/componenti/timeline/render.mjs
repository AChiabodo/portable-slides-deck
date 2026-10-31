import { badgeStato, iconaStato } from '../../assets/stato.mjs';

const DISTANZA_MARCATORI = 4;

const larghezzaEtichetta = (n) => (n <= 4 ? 24 : n <= 5 ? 20 : 17);

// Posizioni in % della larghezza: proporzionali alle date, poi distanziate perché le etichette alternate non si sovrappongano.
function posizioni(voci, ordinabile) {
  const n = voci.length;
  const larghezza = larghezzaEtichetta(n);
  const istanti = ordinabile ? voci.map((v) => Date.parse(`${v.data.numero}T00:00:00Z`)) : [];
  const primo = Math.min(...istanti);
  const ultimo = Math.max(...istanti);
  const proporzionale = ordinabile && ultimo > primo;
  const pos = voci.map((_, i) => {
    const quota = proporzionale ? (istanti[i] - primo) / (ultimo - primo) : i / (n - 1);
    return larghezza / 2 + quota * (100 - larghezza);
  });
  for (let i = 1; i < n; i++) {
    pos[i] = Math.max(pos[i], pos[i - 1] + DISTANZA_MARCATORI, i >= 2 ? pos[i - 2] + larghezza : 0);
  }
  pos[n - 1] = Math.min(pos[n - 1], 100 - larghezza / 2);
  for (let i = n - 2; i >= 0; i--) {
    pos[i] = Math.min(pos[i], pos[i + 1] - DISTANZA_MARCATORI, i + 2 < n ? pos[i + 2] - larghezza : Infinity);
  }
  return { pos, larghezza };
}

export default function render({ voci }, { t }) {
  const ordinabile = voci.every((v) => v.data.formato === 'data' && !Number.isNaN(Date.parse(`${v.data.numero}T00:00:00Z`)));
  const ordinate = ordinabile
    ? voci
        .map((v, i) => ({ v, i }))
        .sort((a, b) => Date.parse(`${a.v.data.numero}T00:00:00Z`) - Date.parse(`${b.v.data.numero}T00:00:00Z`) || a.i - b.i)
        .map(({ v }) => v)
    : voci;
  const { pos, larghezza } = posizioni(ordinate, ordinabile);

  const elementi = ordinate
    .map(
      (v, i) =>
        `<li class="tl-voce ${i % 2 === 0 ? 'sopra' : 'sotto'}" data-stato="${v.stato.valore}" style="--pos:${pos[i].toFixed(2)}%">` +
        `<span class="tl-marcatore">${iconaStato(v.stato.valore)}</span>` +
        `<div class="tl-testo"><span class="tl-data">${v.data.testo}</span><strong class="tl-titolo">${v.titolo}</strong>` +
        (v.nota ? `<span class="tl-nota">${v.nota}</span>` : '') +
        `${badgeStato(v.stato.valore, v.stato.testo)}</div></li>`,
    )
    .join('');

  return `<ol class="timeline" aria-label="${t('componenti.timeline.etichetta')}" style="--larghezza:${larghezza}%">${elementi}</ol>`;
}
