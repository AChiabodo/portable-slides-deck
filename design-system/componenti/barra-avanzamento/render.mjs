import { badgeStato } from '../../assets/stato.mjs';

const limita = (numero) => Math.min(100, Math.max(0, Number(numero) || 0));

export default function render({ voci }, { t }) {
  const righe = voci
    .map((v) => {
      const conBarra = v.valore.formato === 'percentuale';
      const barra = conBarra
        ? `<span class="ba-pista" aria-hidden="true"><span class="ba-riempimento" style="width:${limita(v.valore.numero).toFixed(2)}%"></span></span>`
        : '';
      const stato = v.stato ? `<span class="ba-stato">${badgeStato(v.stato.valore, v.stato.testo)}</span>` : '';
      const attributo = v.stato ? ` data-stato="${v.stato.valore}"` : '';
      return (
        `<li class="ba-voce${conBarra ? '' : ' senza-barra'}"${attributo}>` +
        `<span class="ba-etichetta">${v.etichetta}</span>${stato}` +
        `<span class="ba-valore">${v.valore.testo}</span>${barra}</li>`
      );
    })
    .join('');

  return `<ul class="barra-avanzamento" role="list" aria-label="${t('componenti.barra-avanzamento.etichetta')}">${righe}</ul>`;
}
