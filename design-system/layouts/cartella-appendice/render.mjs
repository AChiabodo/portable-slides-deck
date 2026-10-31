export default function render({ zone, t }) {
  const sottotitolo = zone.sottotitolo ? `<p class="ca-sottotitolo">${zone.sottotitolo}</p>` : '';
  return (
    `<div class="ca-corpo"><div class="ca-intestazione"><p class="occhiello">${t('layout.cartella-appendice.appendice')}</p>` +
    `${zone.titolo}${sottotitolo}</div><ol class="ca-contenuti">${zone.contenuti}</ol></div>`
  );
}
