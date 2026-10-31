const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function render({ zone, t }) {
  const testa = `<header class="somm-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const messaggi = `<ol class="somm-messaggi">${zone.messaggi}</ol>`;
  const raccomandazione = zone.raccomandazione
    ? `<section class="somm-raccomandazione"><h3 class="somm-intestazione">${esc(t('layout.sommario-esecutivo.raccomandazione'))}</h3>` +
      `<p class="somm-testo">${zone.raccomandazione}</p></section>`
    : '';
  const molte = (zone.identita.match(/scheda-dati-voce/g) ?? []).length > 4;
  const identita = zone.identita ? `<div class="somm-identita${molte ? ' somm-molte' : ''}">${zone.identita}</div>` : '';
  return (
    `${testa}<div class="somm-corpo">` +
    `<div class="somm-principale">${messaggi}${raccomandazione}</div>` +
    `<div class="somm-lato"><div class="somm-kpi">${zone.kpi}</div>${identita}</div></div>`
  );
}
