export default function render({ zone }) {
  const testa =
    `<header class="percorso-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}` +
    `${zone.introduzione ? `<p class="introduzione">${zone.introduzione}</p>` : ''}</header>`;
  const dettaglio = zone.dettaglio ? `<div class="percorso-dettaglio">${zone.dettaglio}</div>` : '';
  return `${testa}<div class="percorso-fasi-corpo">${zone.fasi}</div>${dettaglio}`;
}
