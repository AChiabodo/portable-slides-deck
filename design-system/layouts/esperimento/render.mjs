export default function render({ zone, t }) {
  const intestazione =
    `<header class="es-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const blocco = (nome, classe) =>
    zone[nome]
      ? `<section class="es-blocco ${classe} pannello"><h3 class="es-intestazione">${t(`layout.esperimento.${nome}`)}</h3><p class="es-testo">${zone[nome]}</p></section>`
      : '';
  const dati = zone.dati ? `<div class="es-dati">${zone.dati}</div>` : '';
  const base = blocco('ipotesi', 'es-ipotesi') + blocco('metodo', 'es-metodo') + dati;
  const risultato =
    `<section class="es-risultato pannello"><h3 class="es-intestazione">${t('layout.esperimento.risultato')}</h3>` +
    `<div class="es-componenti">${zone.risultato}</div></section>`;
  const conclusione = blocco('conclusione', 'es-conclusione');
  return (
    `${intestazione}<div class="es-corpo${base ? '' : ' es-solo'}">` +
    `${base ? `<div class="es-base">${base}</div>` : ''}<div class="es-esito">${risultato}</div>${conclusione}</div>`
  );
}
