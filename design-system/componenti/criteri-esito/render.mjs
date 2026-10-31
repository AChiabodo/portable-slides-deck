import { badgeStato } from '../../assets/stato.mjs';

export default function render({ criteri }, { esc, t }) {
  const nomi = ['criterio', 'soglia', 'risultato', 'esito'];
  const etichetta = Object.fromEntries(nomi.map((n) => [n, esc(t(`componenti.criteri-esito.${n}`))]));
  const testa = nomi.map((n) => `<th scope="col" class="criteri-${n}">${etichetta[n]}</th>`).join('');
  const corpo = criteri
    .map(
      (c) =>
        `<tr>` +
        `<th scope="row" class="criteri-criterio" data-etichetta="${etichetta.criterio}">${c.criterio}</th>` +
        `<td class="criteri-soglia" data-etichetta="${etichetta.soglia}">${c.soglia}</td>` +
        `<td class="criteri-risultato" data-etichetta="${etichetta.risultato}">${c.risultato.testo}</td>` +
        `<td class="criteri-esito" data-etichetta="${etichetta.esito}">${badgeStato(c.esito.valore, c.esito.testo)}</td>` +
        `</tr>`,
    )
    .join('');
  return `<table class="criteri"><thead><tr>${testa}</tr></thead><tbody>${corpo}</tbody></table>`;
}
