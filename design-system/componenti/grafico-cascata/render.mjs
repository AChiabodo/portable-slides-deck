const LARGHEZZA = 720;
const ALTEZZA = 360;
const MARGINE = { sinistra: 14, destra: 14, alto: 46, basso: 70 };
const ALTEZZA_MINIMA = 3;

// Va a capo sulle parole in al più due righe; l'eccedenza è abbreviata con i puntini.
function righeEtichetta(testo, massimo) {
  const righe = [];
  let riga = '';
  for (const parola of testo.split(/\s+/).filter(Boolean)) {
    if (!riga) riga = parola;
    else if (`${riga} ${parola}`.length <= massimo) riga += ` ${parola}`;
    else {
      righe.push(riga);
      riga = parola;
    }
  }
  righe.push(riga);
  const abbrevia = (r) => (r.length > massimo ? `${r.slice(0, massimo - 1)}…` : r);
  if (righe.length > 2) return [righe[0], `${righe[1].slice(0, massimo - 1)}…`];
  return righe.map(abbrevia);
}

export default function render({ serie }, { esc, t, id }) {
  const punti = serie.punti;
  const n = punti.length;
  const livelli = [];
  let corrente = 0;
  punti.forEach((p, i) => {
    const estremo = i === 0 || (n > 1 && i === n - 1);
    if (estremo) {
      livelli.push({ da: 0, a: p.valore, estremo: true });
      corrente = p.valore;
    } else {
      livelli.push({ da: corrente, a: corrente + p.valore, estremo: false });
      corrente += p.valore;
    }
  });

  const tutti = livelli.flatMap((l) => [l.da, l.a]);
  const minimo = Math.min(0, ...tutti);
  const massimo = Math.max(0, ...tutti);
  const ampiezza = massimo - minimo || 1;
  const areaX = LARGHEZZA - MARGINE.sinistra - MARGINE.destra;
  const areaY = ALTEZZA - MARGINE.alto - MARGINE.basso;
  const y = (v) => MARGINE.alto + (1 - (v - minimo) / ampiezza) * areaY;
  const passo = areaX / n;
  const larghezzaBarra = passo * 0.58;
  const cx = (i) => MARGINE.sinistra + passo * (i + 0.5);
  const caratteri = Math.max(8, Math.floor(passo / 9));

  const raccordi = livelli
    .slice(0, -1)
    .map((l, i) => {
      const x1 = cx(i) + larghezzaBarra / 2;
      const x2 = cx(i + 1) - larghezzaBarra / 2;
      const quota = y(l.a).toFixed(1);
      return `<line class="raccordo" x1="${x1.toFixed(1)}" x2="${x2.toFixed(1)}" y1="${quota}" y2="${quota}"/>`;
    })
    .join('');

  const barre = livelli
    .map((l, i) => {
      const alto = Math.min(y(l.da), y(l.a));
      const altezza = Math.max(Math.abs(y(l.da) - y(l.a)), ALTEZZA_MINIMA);
      const classe = l.estremo ? 'estremo' : l.a - l.da > 0 ? 'su' : l.a - l.da < 0 ? 'giu' : 'nulla';
      const x = cx(i);
      let segno = '';
      let etichettaY = alto - 8;
      if (classe === 'su') {
        segno = `<polygon class="segno su" points="${(x - 8).toFixed(1)},${(alto - 4).toFixed(1)} ${(x + 8).toFixed(1)},${(alto - 4).toFixed(1)} ${x.toFixed(1)},${(alto - 14).toFixed(1)}"/>`;
        etichettaY = alto - 20;
      } else if (classe === 'giu') {
        const fondo = alto + altezza;
        segno = `<polygon class="segno giu" points="${(x - 8).toFixed(1)},${(fondo + 4).toFixed(1)} ${(x + 8).toFixed(1)},${(fondo + 4).toFixed(1)} ${x.toFixed(1)},${(fondo + 14).toFixed(1)}"/>`;
      }
      const nome = righeEtichetta(punti[i].etichetta, caratteri)
        .map((riga, k) => `<tspan x="${x.toFixed(1)}" dy="${k === 0 ? 0 : 19}">${esc(riga)}</tspan>`)
        .join('');
      return (
        `<rect class="barra ${classe}" x="${(x - larghezzaBarra / 2).toFixed(1)}" y="${alto.toFixed(1)}" width="${larghezzaBarra.toFixed(1)}" height="${altezza.toFixed(1)}"/>` +
        segno +
        `<text class="valore ${classe}" x="${x.toFixed(1)}" y="${etichettaY.toFixed(1)}" text-anchor="middle">${esc(punti[i].testo)}</text>` +
        `<text class="nome" x="${x.toFixed(1)}" y="${ALTEZZA - MARGINE.basso + 28}" text-anchor="middle">${nome}</text>`
      );
    })
    .join('');

  const descrizione = `${t('grafici.cascata')}: ${punti.map((p) => `${p.etichetta}: ${p.testo}`).join('; ')}`;

  return (
    `<figure class="grafico grafico-cascata">` +
    `<svg viewBox="0 0 ${LARGHEZZA} ${ALTEZZA}" role="img" aria-labelledby="${id}-t ${id}-d">` +
    `<title id="${id}-t">${esc(serie.etichetta)}</title><desc id="${id}-d">${esc(descrizione)}</desc>` +
    `<line class="asse" x1="${MARGINE.sinistra}" x2="${LARGHEZZA - MARGINE.destra}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/>` +
    `${raccordi}${barre}</svg></figure>`
  );
}
