export const SOGLIA_AA = 4.5;

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function luminanza(hex) {
  const pieno = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join('') : hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(pieno.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function rapportoContrasto(a, b) {
  const [chiaro, scuro] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
  return (chiaro + 0.05) / (scuro + 0.05);
}

/** Controlla le coppie dichiarate in `contrasti` del Tema contro la soglia WCAG AA. */
export function erroriContrastoTema(tema) {
  const errori = [];
  const etichetta = `tema "${tema.nome}"`;
  for (const coppia of tema.contrasti ?? []) {
    const [primo, secondo] = Array.isArray(coppia) ? coppia : [];
    const colori = [primo, secondo].map((nome) => tema.variabili?.[nome]);
    const mancante = [primo, secondo].find((nome, i) => typeof colori[i] !== 'string');
    if (mancante !== undefined || !primo || !secondo) {
      errori.push(`${etichetta}: variabile "${mancante ?? coppia}" non definita nelle variabili del tema`);
    } else if (!colori.every((c) => HEX.test(c))) {
      errori.push(`${etichetta}: le variabili "${primo}" e "${secondo}" devono essere colori esadecimali`);
    } else {
      const rapporto = rapportoContrasto(colori[0], colori[1]);
      if (rapporto < SOGLIA_AA) {
        const testo = rapporto.toFixed(1).replace('.', ',');
        errori.push(
          `${etichetta}: contrasto ${testo}:1 tra "${primo}" e "${secondo}", sotto la soglia WCAG AA di ${String(SOGLIA_AA).replace('.', ',')}:1`,
        );
      }
    }
  }
  return errori;
}
