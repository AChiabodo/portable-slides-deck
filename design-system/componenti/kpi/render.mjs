export default function render({ voci }, { regolazioni }) {
  const elementi = voci
    .map(
      (v) =>
        `<li class="kpi"><span class="kpi-valore">${v.valore.testo}</span><span class="kpi-etichetta">${v.etichetta}</span></li>`,
    )
    .join('');
  const dimensione = regolazioni.dimensione === 'standard' ? '' : ` data-dimensione="${regolazioni.dimensione}"`;
  return `<ul class="kpi-riga" style="--colonne:${voci.length}"${dimensione}>${elementi}</ul>`;
}
