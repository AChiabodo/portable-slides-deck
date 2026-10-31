export default function render({ zone }) {
  const intestazione =
    `<header class="ta-testa">${zone.occhiello ? `<p class="occhiello">${zone.occhiello}</p>` : ''}${zone.titolo}</header>`;
  const righe = (zone.tabella.match(/<tr[\s>]/g) || []).length;
  const tabella = `<div class="ta-tabella pannello${righe <= 6 ? ' ta-ariosa' : ''}">${zone.tabella}</div>`;
  const nota = zone.nota ? `<div class="ta-nota">${zone.nota}</div>` : '';
  const fonte = zone.fonte ? `<p class="ta-fonte">${zone.fonte}</p>` : '';
  const piede = nota || fonte ? `<div class="ta-piede">${nota}${fonte}</div>` : '';
  return `${intestazione}${tabella}${piede}`;
}
