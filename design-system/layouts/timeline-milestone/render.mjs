export default function render({ zone }) {
  const testa =
    `<header class="tlm-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}` +
    `${zone.introduzione ? `<p class="introduzione">${zone.introduzione}</p>` : ''}</header>`;
  const dettaglio = zone.dettaglio ? `<div class="tlm-dettaglio">${zone.dettaglio}</div>` : '';
  return `${testa}<div class="tlm-corpo">${zone.timeline}</div>${dettaglio}`;
}
