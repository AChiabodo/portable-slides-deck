export default function render({ zone }) {
  const fonte = zone.fonte ? `<p class="messaggio-fonte">${zone.fonte}</p>` : '';
  return `<div class="messaggio-corpo">${zone.titolo}<p class="messaggio-testo">${zone.messaggio}</p>${fonte}</div>`;
}
