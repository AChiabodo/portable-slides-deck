import { formattaValore } from './formato.mjs';
import { esc } from './html.mjs';

/** Segnaposto che rimanda a un valore dell'Analisi: {{id}}. */
export const RIFERIMENTO = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
const NUMERO = /\d+(?:[.,]\d+)*/g;

/** Esamina un testo della Specifica senza risolverlo: riferimenti, cifre scritte a mano, parole. */
export function analizzaTesto(testo) {
  const riferimenti = [...testo.matchAll(RIFERIMENTO)].map((m) => m[1]);
  const senzaRiferimenti = testo.replace(RIFERIMENTO, ' ');
  return {
    riferimenti,
    segnapostoNonChiuso: /\{\{|\}\}/.test(senzaRiferimenti),
    numeri: senzaRiferimenti.match(NUMERO) ?? [],
    // Ogni riferimento conta come una parola.
    parole: testo.replace(RIFERIMENTO, 'x').split(/\s+/).filter(Boolean).length,
  };
}

/** Sostituisce i riferimenti con i valori formattati ed escapa il resto: restituisce HTML sicuro. */
export function risolviTesto(testo, analisi, lingua) {
  let html = '';
  let ultimo = 0;
  for (const m of testo.matchAll(RIFERIMENTO)) {
    html += esc(testo.slice(ultimo, m.index));
    const valore = analisi.valori[m[1]];
    html += esc(formattaValore(valore, valore.valore, lingua.formato));
    ultimo = m.index + m[0].length;
  }
  return html + esc(testo.slice(ultimo));
}
