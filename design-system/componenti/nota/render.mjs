export default function render({ etichetta, testo }) {
  return `<aside class="nota"><span class="nota-etichetta">${etichetta}</span><p class="nota-testo">${testo}</p></aside>`;
}
