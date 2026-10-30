export default function render({ zone }) {
  const intestazione =
    `<header class="dash-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const principale = `<div class="dash-principale pannello">${zone.principale}</div>`;
  const kpi = zone.kpi ? `<div class="dash-kpi">${zone.kpi}</div>` : '';
  const commento = zone.commento ? `<p class="dash-commento pannello">${zone.commento}</p>` : '';
  const lato = kpi || commento ? `<div class="dash-lato">${kpi}${commento}</div>` : '';
  const nota = zone.nota ? `<div class="dash-nota">${zone.nota}</div>` : '';
  return `${intestazione}<div class="dash-corpo${lato ? '' : ' dash-solo'}">${principale}${lato}</div>${nota}`;
}
