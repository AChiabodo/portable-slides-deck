import { badgeStato } from '../../assets/stato.mjs';

export default function render({ azioni }, { esc, t }) {
  const conStato = azioni.some((a) => a.stato);
  const colonne = [
    ['azione', esc(t('componenti.elenco-azioni.azione'))],
    ['responsabile', esc(t('componenti.elenco-azioni.responsabile'))],
    ['scadenza', esc(t('componenti.elenco-azioni.scadenza'))],
  ];
  // Le chiavi di lingua non hanno un'intestazione propria per lo stato: si riusa quella del semaforo.
  if (conStato) colonne.push(['stato', esc(t('componenti.semaforo.stato'))]);
  const etichetta = Object.fromEntries(colonne);

  const testa = colonne.map(([classe, testo]) => `<th scope="col" class="azioni-${classe}">${testo}</th>`).join('');
  const corpo = azioni
    .map(
      (a) =>
        `<tr>` +
        `<th scope="row" class="azioni-azione" data-etichetta="${etichetta.azione}">${a.azione}</th>` +
        `<td class="azioni-responsabile" data-etichetta="${etichetta.responsabile}">${a.responsabile}</td>` +
        `<td class="azioni-scadenza" data-etichetta="${etichetta.scadenza}">${a.scadenza.testo}</td>` +
        (conStato
          ? `<td class="azioni-stato" data-etichetta="${etichetta.stato}">${a.stato ? badgeStato(a.stato.valore, a.stato.testo) : ''}</td>`
          : '') +
        `</tr>`,
    )
    .join('');
  return `<table class="azioni"><thead><tr>${testa}</tr></thead><tbody>${corpo}</tbody></table>`;
}
