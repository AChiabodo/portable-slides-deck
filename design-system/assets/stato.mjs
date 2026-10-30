// Icone degli stati: ogni stato ha una forma propria, così non si distingue solo per colore.
const FORME = {
  completato: '<circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M4.6 8.2l2.4 2.4 4.4-4.9" fill="none" stroke="var(--stato-contrasto, #fff)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'in-linea': '<circle cx="8" cy="8" r="6" fill="currentColor"/>',
  'a-rischio': '<path d="M8 1.5l7 12.5H1z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/><path d="M8 6v4" stroke="var(--stato-contrasto, #fff)" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.9" r="1" fill="var(--stato-contrasto, #fff)"/>',
  'in-ritardo': '<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="currentColor"/><path d="M5.3 5.3l5.4 5.4M10.7 5.3l-5.4 5.4" stroke="var(--stato-contrasto, #fff)" stroke-width="1.8" stroke-linecap="round"/>',
  'non-avviato': '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  superato: '<circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M4.6 8.2l2.4 2.4 4.4-4.9" fill="none" stroke="var(--stato-contrasto, #fff)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  parziale: '<circle cx="8" cy="8" r="6.1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 1.9a6.1 6.1 0 0 1 0 12.2z" fill="currentColor"/>',
  'non-superato': '<circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" stroke="var(--stato-contrasto, #fff)" stroke-width="1.8" stroke-linecap="round"/>',
};

export const STATI = Object.keys(FORME);

/** SVG decorativo (`aria-hidden`) dello stato; il significato lo porta sempre anche l'etichetta testuale. */
export function iconaStato(stato, classe = 'stato-icona') {
  const forma = FORME[stato];
  if (!forma) throw new Error(`stato sconosciuto: ${stato}`);
  return `<svg class="${classe}" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">${forma}</svg>`;
}

/** Badge completo: icona e testo (già escapato, tradotto dalla `scelta`). Il colore arriva da `[data-stato]` in base.css. */
export function badgeStato(stato, testo) {
  return `<span class="stato" data-stato="${stato}">${iconaStato(stato)}<span class="stato-testo">${testo}</span></span>`;
}
