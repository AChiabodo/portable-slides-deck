export default function render({ passi }) {
  const elementi = passi
    .map(
      (p) =>
        `<li class="passo">` +
        (p.etichetta ? `<span class="passo-etichetta">${p.etichetta}</span>` : '') +
        `<span class="passo-titolo">${p.titolo}</span>` +
        (p.testo ? `<span class="passo-testo">${p.testo}</span>` : '') +
        `</li>`,
    )
    .join('');
  return `<ol class="flusso">${elementi}</ol>`;
}
