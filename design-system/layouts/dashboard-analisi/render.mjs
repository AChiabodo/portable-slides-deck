export default function render({ zone, regolazioni }) {
  const intestazione =
    `<header class="dash-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const principale = `<div class="dash-principale pannello">${zone.principale}</div>`;
  const kpi = zone.kpi ? `<div class="dash-kpi">${zone.kpi}</div>` : '';
  const commento = zone.commento ? `<p class="dash-commento pannello">${zone.commento}</p>` : '';
  const lato = kpi || commento ? `<div class="dash-lato">${kpi}${commento}</div>` : '';
  const nota = zone.nota ? `<div class="dash-nota">${zone.nota}</div>` : '';
  const corpo = regolazioni.ordine === 'invertito' ? `${lato}${principale}` : `${principale}${lato}`;
  return `${intestazione}<div class="dash-corpo${lato ? '' : ' dash-solo'}">${corpo}</div>${nota}`;
}
