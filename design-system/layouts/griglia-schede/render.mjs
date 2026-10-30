export default function render({ zone }) {
  const testa =
    `<header class="griglia-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}` +
    `${zone.introduzione ? `<p class="introduzione">${zone.introduzione}</p>` : ''}</header>`;
  const nota = zone.nota ? `<div class="griglia-nota">${zone.nota}</div>` : '';
  return `${testa}<div class="griglia-corpo">${zone.schede}</div>${nota}`;
}
