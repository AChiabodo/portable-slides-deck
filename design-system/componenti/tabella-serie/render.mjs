export default function render({ titolo, intestazione, colonne }, { esc, t, id }) {
  const righe = colonne[0].serie.punti.map((p) => p.etichetta);
  const massimi = colonne.map((c) => Math.max(...c.serie.punti.map((p) => Math.abs(p.valore)), 0) || 1);

  const testa = colonne.map((c) => `<th scope="col">${c.titolo}</th>`).join('');
  const corpo = righe
    .map((etichetta, i) => {
      const celle = colonne
        .map((c, k) => {
          const p = c.serie.punti[i];
          if (!p) return '<td></td>';
          const quota = Math.max(0, Math.min(100, (Math.abs(p.valore) / massimi[k]) * 100));
          return (
            `<td><span class="cella-valore">${esc(p.testo)}</span>` +
            `<span class="cella-barra${p.valore < 0 ? ' negativa' : ''}" aria-hidden="true"><i style="width:${quota.toFixed(1)}%"></i></span></td>`
          );
        })
        .join('');
      return `<tr><th scope="row">${esc(etichetta)}</th>${celle}</tr>`;
    })
    .join('');

  return (
    `<figure class="tabella-serie">` +
    (titolo ? `<figcaption>${titolo}</figcaption>` : '') +
    `<table><thead><tr><th scope="col">${intestazione}</th>${testa}</tr></thead><tbody>${corpo}</tbody></table></figure>`
  );
}
