import { formattaValore } from './formato.mjs';
import { esc } from './html.mjs';
import { risolviTesto } from './testo.mjs';

/**
 * Trasforma il valore scritto nella Specifica nella forma consumata dal render del componente:
 * testo -> HTML già escapato, valore -> { etichetta, testo, numero, formato },
 * scelta -> { valore, testo }, lista -> array di oggetti risolti.
 */
export function risolviProp(def, dato, ctx) {
  switch (def.tipo) {
    case 'testo':
      return risolviTesto(dato, ctx.analisi, ctx.lingua);
    case 'valore': {
      const v = ctx.analisi.valori[dato];
      // `numero` (numero, o data AAAA-MM-GG) serve a disegnare, mai a stampare cifre nuove.
      return {
        etichetta: esc(v.etichetta),
        testo: esc(formattaValore(v, v.valore, ctx.lingua.formato)),
        numero: v.valore,
        formato: v.formato.tipo,
      };
    }
    case 'scelta':
      return { valore: dato, testo: esc(ctx.t(`scelte.${def.vocabolario}.${dato}`)) };
    case 'serie': {
      // Dati grezzi: i componenti che li disegnano (es. SVG) devono usare ctx.esc.
      const s = ctx.analisi.serie[dato];
      return {
        etichetta: s.etichetta,
        punti: s.punti.map((p) => ({
          etichetta: p.etichetta,
          valore: p.valore,
          testo: formattaValore(s, p.valore, ctx.lingua.formato),
        })),
      };
    }
    case 'lista':
      return dato.map((elemento) => risolviOggetto(def.elementi, elemento, ctx));
    default:
      throw new Error(`tipo di proprietà sconosciuto: ${def.tipo}`);
  }
}

export function risolviOggetto(defs, dato, ctx) {
  const risolto = {};
  for (const [nome, def] of Object.entries(defs)) {
    if (dato[nome] !== undefined) risolto[nome] = risolviProp(def, dato[nome], ctx);
  }
  return risolto;
}
