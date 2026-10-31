import { badgeStato } from '../../assets/stato.mjs';

export default function render({ voci }, { esc, t }) {
  const righe = voci
    .map(
      (v) =>
        `<li class="semaforo-riga" data-stato="${v.stato.valore}">` +
        `<span class="semaforo-stato">${badgeStato(v.stato.valore, v.stato.testo)}</span>` +
        `<span class="semaforo-etichetta">${v.etichetta}</span>` +
        (v.nota ? `<span class="semaforo-nota">${v.nota}</span>` : '') +
        `</li>`,
    )
    .join('');
  return `<ul class="semaforo" role="list" aria-label="${esc(t('componenti.semaforo.stato'))}">${righe}</ul>`;
}
