const pannello = (classe, intestazione, contenuto) =>
  `<section class="affiancato-pannello ${classe} pannello"><h3 class="affiancato-intestazione">${intestazione}</h3><div class="affiancato-contenuto">${contenuto}</div></section>`;

export default function render({ zone }) {
  const testa = `<header class="affiancato-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const conclusione = zone.conclusione ? `<div class="affiancato-conclusione">${zone.conclusione}</div>` : '';
  return (
    `${testa}<div class="affiancato-corpo">` +
    pannello('affiancato-sinistra', zone['intestazione-sinistra'], zone.sinistra) +
    pannello('affiancato-destra', zone['intestazione-destra'], zone.destra) +
    `</div>${conclusione}`
  );
}
