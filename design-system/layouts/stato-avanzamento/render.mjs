const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const conta = (html, schema) => (html.match(schema) ?? []).length;

// Più righe da mostrare, più si stringe il testo della colonna: la slide non scorre e non taglia.
const scala = (righe, [densa, fitta]) => (righe > fitta ? ' sta-fitta' : righe > densa ? ' sta-densa' : '');

export default function render({ zone, t }) {
  const testa = `<header class="sta-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;

  const righe = conta(zone.workstream, /<li class="(?:semaforo-riga|ba-voce)[ "]/g);
  const componenti = conta(zone.workstream, /<ul class="(?:semaforo|barra-avanzamento)"/g);
  const doppio = componenti > 1;
  const workstream = `<div class="sta-workstream${doppio ? ' sta-doppio' : ''}${scala(doppio ? righe / componenti : righe, [4, 6])}">${zone.workstream}</div>`;
  const nota = zone.nota ? `<div class="sta-nota">${zone.nota}</div>` : '';

  const complessivo = zone.complessivo
    ? `<section class="sta-complessivo"><h3 class="sta-intestazione">${esc(t('layout.stato-avanzamento.complessivo'))}</h3>${zone.complessivo}</section>`
    : '';
  const kpi = zone.kpi ? `<div class="sta-kpi">${zone.kpi}</div>` : '';
  const commento = zone.commento ? `<p class="sta-commento pannello">${zone.commento}</p>` : '';
  const righeLato = conta(zone.complessivo, /<li class="semaforo-riga[ "]/g);
  const lato = complessivo || kpi || commento ? `<div class="sta-lato${scala(righeLato, [3, 5])}">${complessivo}${kpi}${commento}</div>` : '';

  return `${testa}<div class="sta-corpo${lato ? '' : ' sta-solo'}"><div class="sta-principale">${workstream}${nota}</div>${lato}</div>`;
}
