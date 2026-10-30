export default function render({ zone }) {
  const sottotitolo = zone.sottotitolo ? `<p class="copertina-sottotitolo">${zone.sottotitolo}</p>` : '';
  return `<div class="copertina-corpo">${zone.titolo}${sottotitolo}</div>`;
}
