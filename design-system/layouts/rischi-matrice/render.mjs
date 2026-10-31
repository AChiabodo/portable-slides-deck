export default function render({ zone, t }) {
  const intestazione =
    `<header class="rm-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const matrice = `<div class="rm-matrice pannello">${zone.matrice}</div>`;
  const mitigazioni =
    `<section class="rm-mitigazioni pannello"><h3 class="rm-intestazione">${t('layout.rischi-matrice.mitigazioni')}</h3>` +
    `<ul class="rm-elenco">${zone.mitigazioni}</ul></section>`;
  return `${intestazione}<div class="rm-corpo">${matrice}${mitigazioni}</div>`;
}
