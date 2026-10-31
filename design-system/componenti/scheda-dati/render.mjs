export default function render({ voci }, { esc, t }) {
  const coppie = voci
    .map((v) => `<div class="scheda-dati-voce"><dt>${v.etichetta}</dt><dd>${v.valore}</dd></div>`)
    .join('');
  return `<div class="scheda-dati" role="group" aria-label="${esc(t('componenti.scheda-dati.etichetta'))}"><dl>${coppie}</dl></div>`;
}
