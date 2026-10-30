export default function render({ zone }) {
  const kpi = zone.kpi ? `<div class="rgc-kpi">${zone.kpi}</div>` : '';
  const grafico = zone.grafico ? `<div class="rgc-grafico">${zone.grafico}</div>` : '';
  const commento = zone.commento ? `<p class="rgc-commento">${zone.commento}</p>` : '';
  return `${zone.titolo}${kpi}<div class="rgc-corpo">${grafico}${commento}</div>`;
}
