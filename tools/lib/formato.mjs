/** Formattazione dei valori dell'Analisi secondo le convenzioni della lingua. */

export function formattaNumero(numero, decimali, f) {
  const fisso = Math.abs(numero).toFixed(decimali);
  const [intero, decimale] = fisso.split('.');
  const raggruppato = intero.replace(/\B(?=(\d{3})+(?!\d))/g, f.separatoreMigliaia);
  const testo = decimale ? raggruppato + f.separatoreDecimale + decimale : raggruppato;
  return numero < 0 && Number(fisso) !== 0 ? `-${testo}` : testo;
}

export function formattaData(iso, f) {
  const [anno, mese, giorno] = iso.split('-');
  return f.data.replace('yyyy', anno).replace('MM', mese).replace('dd', giorno);
}

/** `valore` è un elemento di `valori` o `serie` dell'Analisi; `numero` è il numero da formattare. */
export function formattaValore(valore, numero, f) {
  const { tipo, decimali = 0, unita } = valore.formato;
  if (tipo === 'data') return formattaData(numero, f);
  const testo = formattaNumero(numero, decimali, f);
  if (tipo === 'percentuale') return testo + f.suffissoPercentuale;
  return unita ? testo + f.separatoreUnita + unita : testo;
}
