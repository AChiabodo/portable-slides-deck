export default function render({ zone, regolazioni }) {
  const kpi = zone.kpi ? `<div class="rgc-kpi">${zone.kpi}</div>` : '';
  const grafico = zone.grafico ? `<div class="rgc-grafico">${zone.grafico}</div>` : '';
  const commento = zone.commento ? `<p class="rgc-commento">${zone.commento}</p>` : '';
  const corpo = regolazioni.ordine === 'invertito' ? `${commento}${grafico}` : `${grafico}${commento}`;
  return `${zone.titolo}${kpi}<div class="rgc-corpo">${corpo}</div>`;
}
