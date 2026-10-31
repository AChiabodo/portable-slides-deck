const colonna = (intestazione, contenuto) =>
  `<section class="col-colonna pannello">${intestazione ? `<h3 class="col-intestazione">${intestazione}</h3>` : ''}<div class="col-contenuto">${contenuto}</div></section>`;

export default function render({ zone, regolazioni }) {
  const testa = `<header class="col-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const colonne = [1, 2, 3].map((n) => colonna(zone[`intestazione-${n}`], zone[`colonna-${n}`]));
  // `ordine` elenca quale colonna sta in ogni posizione, da sinistra a destra.
  const ordinate = regolazioni.ordine.split('-').map((n) => colonne[Number(n) - 1]);
  const commento = zone.commento ? `<p class="col-commento">${zone.commento}</p>` : '';
  return `${testa}<div class="col-corpo" style="--colonne:3">${ordinate.join('')}</div>${commento}`;
}
