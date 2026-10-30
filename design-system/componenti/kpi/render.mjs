export default function render({ voci }) {
  const elementi = voci
    .map(
      (v) =>
        `<li class="kpi"><span class="kpi-valore">${v.valore.testo}</span><span class="kpi-etichetta">${v.etichetta}</span></li>`,
    )
    .join('');
  return `<ul class="kpi-riga" style="--colonne:${voci.length}">${elementi}</ul>`;
}
