const LARGHEZZA = 720;
const ALTEZZE = { compatta: 220, standard: 300, alta: 400 };
const MARGINE = { sinistra: 40, destra: 40, alto: 34, basso: 40 };
const GUIDE = 4;
const MARCATORI = ['cerchio', 'quadrato', 'rombo'];

function marcatore(tipo, x, y, classe) {
  if (tipo === 'quadrato') return `<rect class="${classe}" x="${(x - 6).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="12" height="12"/>`;
  if (tipo === 'rombo') {
    return `<polygon class="${classe}" points="${x.toFixed(1)},${(y - 8).toFixed(1)} ${(x + 8).toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${(y + 8).toFixed(1)} ${(x - 8).toFixed(1)},${y.toFixed(1)}"/>`;
  }
  return `<circle class="${classe}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5"/>`;
}

export default function render({ titolo, linee }, { esc, t, id, regolazioni }) {
  const ALTEZZA = ALTEZZE[regolazioni.altezza];
  const etichette = linee[0].serie.punti.map((p) => p.etichetta);
  const valori = linee.flatMap((l) => l.serie.punti.map((p) => p.valore));
  const minimo = Math.min(...valori);
  const massimo = Math.max(...valori);
  const margineValori = (massimo - minimo || 1) * 0.12;
  const basso = minimo - margineValori;
  const alto = massimo + margineValori;
  const larghezzaArea = LARGHEZZA - MARGINE.sinistra - MARGINE.destra;
  const altezzaArea = ALTEZZA - MARGINE.alto - MARGINE.basso;
  const passo = etichette.length > 1 ? larghezzaArea / (etichette.length - 1) : 0;
  const px = (i) => MARGINE.sinistra + (etichette.length > 1 ? i * passo : larghezzaArea / 2);
  const py = (v) => MARGINE.alto + (1 - (v - basso) / (alto - basso)) * altezzaArea;

  const guide = Array.from({ length: GUIDE + 1 }, (_, k) => {
    const y = MARGINE.alto + (k / GUIDE) * altezzaArea;
    return `<line class="guida" x1="${MARGINE.sinistra}" x2="${LARGHEZZA - MARGINE.destra}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  }).join('');

  const asseX = etichette
    .map((e, i) => `<text class="tacca" x="${px(i).toFixed(1)}" y="${ALTEZZA - 14}" text-anchor="middle">${esc(e)}</text>`)
    .join('');

  const disegno = linee
    .map((l, k) => {
      const punti = l.serie.punti.map((p, i) => ({ x: px(i), y: py(p.valore), testo: p.testo, valore: p.valore }));
      const percorso = punti.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      // Il valore più alto di ogni punto sta sopra il marcatore, gli altri sotto: così le etichette non si sovrappongono.
      const valoriTesto = regolazioni.valori === 'nascondi'
        ? ''
        : punti
            .map((p, i) => {
              const sopra = linee.every((altra, j) => j === k || (altra.serie.punti[i]?.valore ?? -Infinity) <= p.valore);
              return `<text class="valore-linea linea-${k + 1}" x="${p.x.toFixed(1)}" y="${(p.y + (sopra ? -13 : 24)).toFixed(1)}" text-anchor="middle">${esc(p.testo)}</text>`;
            })
            .join('');
      const marcatori = punti.map((p) => marcatore(MARCATORI[k], p.x, p.y, `punto linea-${k + 1}`)).join('');
      return `<g><polyline class="linea linea-${k + 1}" points="${percorso}"/>${marcatori}${valoriTesto}</g>`;
    })
    .join('');

  const legenda = linee
    .map((l, k) => `<li><span class="legenda-segno linea-${k + 1} ${MARCATORI[k]}" aria-hidden="true"></span>${l.nome}</li>`)
    .join('');

  const nome = titolo || '';
  const descrizione = `${t('grafici.linee')}: ${linee
    .map((l) => `${l.serie.etichetta}: ${l.serie.punti.map((p) => `${p.etichetta}: ${p.testo}`).join('; ')}`)
    .join(' | ')}`;

  return (
    `<figure class="grafico grafico-linee">` +
    (nome ? `<figcaption>${nome}</figcaption>` : '') +
    // Con più linee la legenda è l'unico modo per distinguerle: si nasconde solo con una linea.
    (regolazioni.legenda === 'nascondi' && linee.length === 1 ? '' : `<ul class="legenda">${legenda}</ul>`) +
    `<svg viewBox="0 0 ${LARGHEZZA} ${ALTEZZA}" role="img" aria-labelledby="${id}-d"><desc id="${id}-d">${esc(descrizione)}</desc>` +
    `${guide}${asseX}${disegno}</svg></figure>`
  );
}
