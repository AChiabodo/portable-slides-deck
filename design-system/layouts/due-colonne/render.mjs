const colonna = (intestazione, contenuto) =>
  `<section class="col-colonna pannello">${intestazione ? `<h3 class="col-intestazione">${intestazione}</h3>` : ''}<div class="col-contenuto">${contenuto}</div></section>`;

export default function render({ zone, regolazioni }) {
  const testa = `<header class="col-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const colonne = [colonna(zone['intestazione-1'], zone['colonna-1']), colonna(zone['intestazione-2'], zone['colonna-2'])];
  if (regolazioni.ordine === 'invertito') colonne.reverse();
  const commento = zone.commento ? `<p class="col-commento">${zone.commento}</p>` : '';
  return `${testa}<div class="col-corpo" style="--colonne:2">${colonne.join('')}</div>${commento}`;
}
