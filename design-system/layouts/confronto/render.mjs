const colonna = (intestazione, voci) =>
  `<div class="confronto-colonna"><h3 class="confronto-intestazione">${intestazione}</h3><ul class="confronto-elenco">${voci}</ul></div>`;

export default function render({ zone, regolazioni }) {
  const sinistra = colonna(zone['intestazione-sinistra'], zone.sinistra);
  const destra = colonna(zone['intestazione-destra'], zone.destra);
  return `${zone.titolo}<div class="confronto-corpo">${regolazioni.ordine === 'invertito' ? destra + sinistra : sinistra + destra}</div>`;
}
