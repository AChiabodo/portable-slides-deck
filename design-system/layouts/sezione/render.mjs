export default function render({ zone }) {
  const sottotitolo = zone.sottotitolo ? `<p class="sezione-sottotitolo">${zone.sottotitolo}</p>` : '';
  return `<div class="sezione-corpo">${zone.titolo}${sottotitolo}</div>`;
}
