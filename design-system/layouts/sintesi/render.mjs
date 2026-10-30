export default function render({ zone }) {
  const occhiello = zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : '';
  const messaggio = zone.messaggio ? `<p class="sintesi-messaggio">${zone.messaggio}</p>` : '';
  const kpi = zone.kpi ? `<div class="sintesi-kpi">${zone.kpi}</div>` : '';
  return (
    `<div class="sintesi-corpo"><div class="sintesi-principale">${occhiello}${zone.titolo}${messaggio}${kpi}</div>` +
    `<ol class="sintesi-punti">${zone.punti}</ol></div>`
  );
}
