const pannello = (classe, intestazione, contenuto) =>
  `<section class="affiancato-pannello ${classe} pannello"><h3 class="affiancato-intestazione">${intestazione}</h3><div class="affiancato-contenuto">${contenuto}</div></section>`;

export default function render({ zone, regolazioni }) {
  const testa = `<header class="affiancato-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const conclusione = zone.conclusione ? `<div class="affiancato-conclusione">${zone.conclusione}</div>` : '';
  const sinistra = pannello('affiancato-sinistra', zone['intestazione-sinistra'], zone.sinistra);
  const destra = pannello('affiancato-destra', zone['intestazione-destra'], zone.destra);
  return `${testa}<div class="affiancato-corpo">${regolazioni.ordine === 'invertito' ? destra + sinistra : sinistra + destra}</div>${conclusione}`;
}
