import { LINGUA_PREDEFINITA, TEMA_PREDEFINITO } from './catalogo.mjs';
import { analizzaTesto } from './testo.mjs';
import { erroriContrastoTema } from './contrasto.mjs';

const CAMPI_SPECIFICA = ['titolo', 'lingua', 'tema', 'numeriAmmessi', 'slide'];
const isOggetto = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const nonVuoto = (v) => typeof v === 'string' && v.trim() !== '';
const elenca = (nomi) => nomi.map((n) => `"${n}"`).join(', ');

/** Valida una Specifica contro Catalogo e Analisi. Restituisce la lista (vuota se valida) degli errori. */
export function validaSpecifica({ specifica, analisi, risorse }) {
  const errori = [];
  const errore = (percorso, messaggio) => errori.push(`${percorso}: ${messaggio}`);

  if (!isOggetto(specifica)) return ['specifica.json: deve essere un oggetto JSON'];
  for (const chiave of Object.keys(specifica)) {
    if (!CAMPI_SPECIFICA.includes(chiave)) errore('specifica.json', `campo "${chiave}" non previsto`);
  }
  if (!nonVuoto(specifica.titolo)) errore('specifica.json', 'il campo "titolo" è obbligatorio');
  if (!risorse.lingue.has(specifica.lingua ?? LINGUA_PREDEFINITA)) {
    errore('specifica.json', `lingua "${specifica.lingua}" non disponibile (disponibili: ${elenca([...risorse.lingue.keys()])})`);
  }
  const tema = risorse.temi.get(specifica.tema ?? TEMA_PREDEFINITO);
  if (tema) {
    errori.push(...erroriContrastoTema(tema));
  } else {
    errore('specifica.json', `tema "${specifica.tema}" non disponibile (disponibili: ${elenca([...risorse.temi.keys()])})`);
  }

  const ammessi = new Set();
  if (specifica.numeriAmmessi !== undefined) {
    if (!Array.isArray(specifica.numeriAmmessi) || !specifica.numeriAmmessi.every((n) => typeof n === 'string')) {
      errore('specifica.json', '"numeriAmmessi" deve essere un elenco di testi (es. ["2024", "3"])');
    } else {
      specifica.numeriAmmessi.forEach((n) => ammessi.add(n));
    }
  }

  if (!Array.isArray(specifica.slide) || specifica.slide.length === 0) {
    errore('specifica.json', 'serve almeno una slide in "slide"');
    return errori;
  }

  // Il titolo finisce in <title>, dove i segnaposto non vengono risolti: ogni cifra è scritta a mano.
  if (nonVuoto(specifica.titolo)) {
    for (const numero of analizzaTesto(specifica.titolo).numeri) {
      if (!ammessi.has(numero)) errore('specifica.json › titolo', `numero scritto a mano "${numero}": aggiungerlo a "numeriAmmessi" o toglierlo`);
    }
  }

  const ctx = { analisi, risorse, ammessi, errore, parole: 0 };
  specifica.slide.forEach((slide, i) => validaSlide(slide, `slide ${i + 1}`, ctx));
  return errori;
}

function validaSlide(slide, percorso, ctx) {
  if (!isOggetto(slide)) return ctx.errore(percorso, 'deve essere un oggetto');
  const layout = ctx.risorse.layout.get(slide.layout);
  if (!layout) {
    return ctx.errore(
      percorso,
      `layout "${slide.layout}" non presente nel Catalogo (disponibili: ${elenca([...ctx.risorse.layout.keys()])})`,
    );
  }
  for (const chiave of Object.keys(slide)) {
    if (!['layout', 'zone'].includes(chiave)) ctx.errore(percorso, `campo "${chiave}" non previsto`);
  }
  const zone = isOggetto(slide.zone) ? slide.zone : {};
  const definite = layout.manifest.zone;

  for (const nome of Object.keys(zone)) {
    if (!definite.some((z) => z.nome === nome)) {
      ctx.errore(
        percorso,
        `zona "${nome}" non prevista dal layout "${layout.manifest.nome}" (zone: ${elenca(definite.map((z) => z.nome))})`,
      );
    }
  }

  ctx.parole = 0;
  for (const z of definite) {
    const posizione = `${percorso} › zona "${z.nome}"`;
    const valore = zone[z.nome];
    if (valore === undefined) {
      if (z.obbligatoria || (z.min ?? 0) > 0) ctx.errore(percorso, `zona "${z.nome}" obbligatoria e mancante`);
      continue;
    }
    if (z.tipo === 'testo') validaTesto(valore, posizione, z.maxParole, ctx);
    else if (z.tipo === 'elenco') validaElenco(valore, posizione, z, ctx);
    else validaComponenti(valore, posizione, z, ctx);
  }

  const massimo = layout.manifest.maxParoleSlide;
  if (massimo && ctx.parole > massimo) {
    ctx.errore(percorso, `${ctx.parole} parole in totale, massimo ${massimo} per il layout "${layout.manifest.nome}"`);
  }
}

function validaTesto(testo, percorso, maxParole, ctx) {
  if (typeof testo !== 'string') return ctx.errore(percorso, 'deve essere un testo');
  const analisi = analizzaTesto(testo);
  for (const id of analisi.riferimenti) {
    if (!Object.hasOwn(ctx.analisi.valori, id)) ctx.errore(percorso, `riferimento "{{${id}}}" non presente nell'Analisi`);
  }
  if (analisi.segnapostoNonChiuso) ctx.errore(percorso, 'segnaposto non chiuso o non valido (usare {{id}})');
  for (const numero of analisi.numeri) {
    if (!ctx.ammessi.has(numero)) {
      ctx.errore(
        percorso,
        `numero scritto a mano "${numero}": usare un riferimento {{id}} all'Analisi oppure aggiungerlo a "numeriAmmessi"`,
      );
    }
  }
  ctx.parole += analisi.parole;
  if (maxParole !== undefined && analisi.parole > maxParole) ctx.errore(percorso, `${analisi.parole} parole, massimo ${maxParole}`);
}

function validaElenco(valore, percorso, zona, ctx) {
  if (!Array.isArray(valore)) return ctx.errore(percorso, 'deve essere un elenco di testi');
  if (zona.minVoci !== undefined && valore.length < zona.minVoci) ctx.errore(percorso, `almeno ${zona.minVoci} voci`);
  if (zona.maxVoci !== undefined && valore.length > zona.maxVoci) ctx.errore(percorso, `${valore.length} voci, massimo ${zona.maxVoci}`);
  valore.forEach((voce, i) => validaTesto(voce, `${percorso} › voce ${i + 1}`, zona.maxParoleVoce, ctx));
}

function validaComponenti(valore, percorso, zona, ctx) {
  if (!Array.isArray(valore)) return ctx.errore(percorso, 'deve essere un elenco di componenti');
  if (zona.min !== undefined && valore.length < zona.min) ctx.errore(percorso, `almeno ${zona.min} componenti`);
  if (zona.max !== undefined && valore.length > zona.max) ctx.errore(percorso, `${valore.length} componenti, massimo ${zona.max}`);
  valore.forEach((dati, i) => {
    const posizione = `${percorso} › componente ${i + 1}`;
    if (!isOggetto(dati)) return ctx.errore(posizione, 'deve essere un oggetto con il campo "componente"');
    const componente = ctx.risorse.componenti.get(dati.componente);
    if (!componente) {
      return ctx.errore(
        posizione,
        `componente "${dati.componente}" non presente nel Catalogo (disponibili: ${elenca([...ctx.risorse.componenti.keys()])})`,
      );
    }
    if (!zona.ammessi.includes(dati.componente)) {
      return ctx.errore(posizione, `componente "${dati.componente}" non ammesso nella zona (ammessi: ${elenca(zona.ammessi)})`);
    }
    const { componente: _nome, ...props } = dati;
    validaOggetto(componente.manifest.props, props, `${posizione} (${dati.componente})`, ctx);
  });
}

function validaOggetto(definizioni, dati, percorso, ctx) {
  for (const chiave of Object.keys(dati)) {
    if (!Object.hasOwn(definizioni, chiave)) ctx.errore(percorso, `proprietà "${chiave}" non prevista`);
  }
  for (const [nome, def] of Object.entries(definizioni)) {
    if (dati[nome] === undefined) {
      if (def.obbligatoria) ctx.errore(percorso, `proprietà "${nome}" obbligatoria e mancante`);
      continue;
    }
    validaProp(def, dati[nome], `${percorso} › "${nome}"`, ctx);
  }
}

function validaProp(def, dato, percorso, ctx) {
  switch (def.tipo) {
    case 'testo':
      return validaTesto(dato, percorso, def.maxParole, ctx);
    case 'valore':
      if (typeof dato !== 'string' || !Object.hasOwn(ctx.analisi.valori, dato)) {
        ctx.errore(percorso, `valore "${dato}" non presente nell'Analisi`);
      }
      return;
    case 'serie': {
      if (typeof dato !== 'string' || !Object.hasOwn(ctx.analisi.serie, dato)) {
        return ctx.errore(percorso, `serie "${dato}" non presente nell'Analisi`);
      }
      const punti = ctx.analisi.serie[dato].punti.length;
      if (def.maxPunti !== undefined && punti > def.maxPunti) ctx.errore(percorso, `la serie "${dato}" ha ${punti} punti, massimo ${def.maxPunti}`);
      return;
    }
    case 'lista':
      if (!Array.isArray(dato)) return ctx.errore(percorso, 'deve essere un elenco');
      if (def.min !== undefined && dato.length < def.min) ctx.errore(percorso, `almeno ${def.min} voci`);
      if (def.max !== undefined && dato.length > def.max) ctx.errore(percorso, `${dato.length} voci, massimo ${def.max}`);
      dato.forEach((el, i) => {
        if (isOggetto(el)) validaOggetto(def.elementi, el, `${percorso} › voce ${i + 1}`, ctx);
        else ctx.errore(`${percorso} › voce ${i + 1}`, 'deve essere un oggetto');
      });
      return;
    default:
      return ctx.errore(percorso, `tipo di proprietà "${def.tipo}" sconosciuto nel manifest`);
  }
}
