const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function render({ zone, t }) {
  const intestazione = (chiave) => `<h3 class="dec-intestazione">${esc(t(`layout.decisione.${chiave}`))}</h3>`;

  const testa = `<header class="dec-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const richiesta = `<p class="dec-richiesta">${zone.richiesta}</p>`;

  const contesto = zone.contesto ? `<section class="dec-contesto">${intestazione('contesto')}<p class="dec-testo">${zone.contesto}</p></section>` : '';
  const molte = (zone.evidenze.match(/scheda-dati-voce/g) ?? []).length > 4;
  const evidenze = zone.evidenze ? `<div class="dec-evidenze${molte ? ' dec-molte' : ''}">${zone.evidenze}</div>` : '';
  const quadro = contesto || evidenze ? `<div class="dec-quadro${contesto && evidenze ? '' : ' dec-solo'}">${contesto}${evidenze}</div>` : '';

  const opzioni = `<section class="dec-opzioni">${intestazione('opzioni')}${zone.opzioni}</section>`;
  const raccomandazione = zone.raccomandazione
    ? `<section class="dec-raccomandazione pannello">${intestazione('raccomandazione')}<p class="dec-testo">${zone.raccomandazione}</p></section>`
    : '';

  return `${testa}${richiesta}<div class="dec-corpo">${quadro}${opzioni}</div>${raccomandazione}`;
}
