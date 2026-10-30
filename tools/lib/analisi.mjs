const ID_VALIDO = /^[A-Za-z0-9_]+$/;
const TIPI_FORMATO = ['numero', 'percentuale', 'data'];
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const isOggetto = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const nonVuoto = (v) => typeof v === 'string' && v.trim() !== '';

function valoreValido(tipo, v) {
  return tipo === 'data' ? typeof v === 'string' && DATA_ISO.test(v) : typeof v === 'number' && Number.isFinite(v);
}

function validaElemento(voce, percorso, errore, { serie }) {
  if (!isOggetto(voce)) return errore(percorso, 'deve essere un oggetto');
  if (!nonVuoto(voce.etichetta)) errore(percorso, 'manca l\'etichetta');
  const tipo = voce.formato?.tipo;
  if (!TIPI_FORMATO.includes(tipo)) {
    errore(percorso, `formato.tipo non valido (ammessi: ${TIPI_FORMATO.join(', ')})`);
  }
  const p = voce.provenienza;
  if (!isOggetto(p)) {
    errore(percorso, 'manca la provenienza (file, colonna, operazione)');
  } else {
    for (const campo of ['file', 'colonna', 'operazione']) {
      if (!nonVuoto(p[campo])) errore(percorso, `provenienza incompleta: manca "${campo}"`);
    }
  }
  if (serie) {
    if (!Array.isArray(voce.punti) || voce.punti.length === 0) {
      errore(percorso, 'serve almeno un punto in "punti"');
      return;
    }
    voce.punti.forEach((punto, i) => {
      if (!nonVuoto(punto?.etichetta)) errore(percorso, `punto ${i + 1}: manca l'etichetta`);
      if (TIPI_FORMATO.includes(tipo) && !valoreValido(tipo, punto?.valore)) {
        errore(percorso, `punto ${i + 1}: il valore deve essere ${tipo === 'data' ? 'una data AAAA-MM-GG' : 'un numero finito'}`);
      }
    });
  } else if (TIPI_FORMATO.includes(tipo) && !valoreValido(tipo, voce.valore)) {
    errore(percorso, `il valore deve essere ${tipo === 'data' ? 'una data AAAA-MM-GG' : 'un numero finito'}`);
  }
}

/** Controlla lo schema fisso di analisi.json. Restituisce la lista degli errori. */
export function validaAnalisi(analisi) {
  const errori = [];
  const errore = (percorso, messaggio) => errori.push(`analisi.json › ${percorso}: ${messaggio}`);
  if (!isOggetto(analisi)) return ['analisi.json: deve essere un oggetto JSON'];
  for (const chiave of Object.keys(analisi)) {
    if (!['valori', 'serie'].includes(chiave)) errori.push(`analisi.json: campo "${chiave}" non previsto`);
  }
  for (const [sezione, serie, nome] of [['valori', false, 'valore'], ['serie', true, 'serie']]) {
    if (!isOggetto(analisi[sezione])) {
      errori.push(`analisi.json: "${sezione}" deve essere un oggetto`);
      continue;
    }
    for (const [id, voce] of Object.entries(analisi[sezione])) {
      if (!ID_VALIDO.test(id)) {
        errore(`${nome} "${id}"`, `identificatore "${id}" non valido (ammessi: lettere, cifre, _)`);
        continue;
      }
      validaElemento(voce, `${nome} "${id}"`, errore, { serie });
    }
  }
  return errori;
}
