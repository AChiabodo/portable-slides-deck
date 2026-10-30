const colonna = (intestazione, voci) =>
  `<div class="confronto-colonna"><h3 class="confronto-intestazione">${intestazione}</h3><ul class="confronto-elenco">${voci}</ul></div>`;

export default function render({ zone }) {
  return (
    `${zone.titolo}<div class="confronto-corpo">` +
    colonna(zone['intestazione-sinistra'], zone.sinistra) +
    colonna(zone['intestazione-destra'], zone.destra) +
    '</div>'
  );
}
