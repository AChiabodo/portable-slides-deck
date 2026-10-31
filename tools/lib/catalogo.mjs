import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RADICE_DS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'design-system');
export const LINGUA_PREDEFINITA = 'it';
export const TEMA_PREDEFINITO = 'quiet-editorial';

const NOME_VALIDO = /^[a-z0-9-]+$/;

const cartelle = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

const leggiJson = (percorso) => JSON.parse(readFileSync(percorso, 'utf8'));

function erroreIdentita(valore, esistenti, campo, participio) {
  if (typeof valore !== 'string' || !NOME_VALIDO.test(valore)) return `${campo} mancante o non valido (a-z, 0-9, -)`;
  if (esistenti.has(valore)) return `${campo} "${valore}" già ${participio}`;
  return null;
}

function erroriManifestLayout(m) {
  const errori = [];
  if (!Array.isArray(m.zone) || m.zone.length === 0) return ['zone mancanti'];
  const titoli = m.zone.filter((z) => z.ruolo === 'titolo');
  if (titoli.length !== 1 || titoli[0].tipo !== 'testo' || !titoli[0].obbligatoria) {
    errori.push('serve esattamente una zona con ruolo "titolo", di tipo testo e obbligatoria');
  }
  for (const z of m.zone) {
    if (typeof z.nome !== 'string' || !['testo', 'elenco', 'componenti'].includes(z.tipo)) {
      errori.push(`zona non valida: ${JSON.stringify(z)}`);
    } else if (z.tipo === 'componenti' && !Array.isArray(z.ammessi)) {
      errori.push(`la zona "${z.nome}" deve dichiarare i componenti ammessi`);
    }
  }
  return errori;
}

const TIPI_PROP = ['testo', 'valore', 'serie', 'lista', 'scelta'];

function erroriDefinizioniProp(defs, percorso = 'props') {
  const errori = [];
  for (const [nome, def] of Object.entries(defs)) {
    const dove = `${percorso} › "${nome}"`;
    if (typeof def !== 'object' || def === null || !TIPI_PROP.includes(def.tipo)) {
      errori.push(`${dove}: tipo di proprietà non valido (ammessi: ${TIPI_PROP.join(', ')})`);
    } else if (def.tipo === 'scelta') {
      if (!Array.isArray(def.opzioni) || def.opzioni.length < 2 || !def.opzioni.every((o) => typeof o === 'string' && NOME_VALIDO.test(o))) {
        errori.push(`${dove}: "opzioni" deve elencare almeno 2 valori (a-z, 0-9, -)`);
      }
      if (typeof def.vocabolario !== 'string' || !NOME_VALIDO.test(def.vocabolario)) {
        errori.push(`${dove}: "vocabolario" mancante o non valido (a-z, 0-9, -)`);
      }
    } else if (def.tipo === 'lista') {
      if (typeof def.elementi !== 'object' || def.elementi === null) errori.push(`${dove}: "elementi" mancante`);
      else errori.push(...erroriDefinizioniProp(def.elementi, dove));
    }
  }
  return errori;
}

/** Le Regolazioni sono elenchi chiusi con un predefinito; `richiede` (solo Layout) lega una Regolazione al contenuto di una zona. */
function erroriRegolazioni(m, tipo) {
  if (m.regolazioni === undefined) return [];
  if (typeof m.regolazioni !== 'object' || m.regolazioni === null || Array.isArray(m.regolazioni)) {
    return ['"regolazioni" deve essere un oggetto'];
  }
  const errori = [];
  for (const [nome, def] of Object.entries(m.regolazioni)) {
    const dove = `regolazione "${nome}"`;
    if (!NOME_VALIDO.test(nome)) errori.push(`${dove}: nome non valido (a-z, 0-9, -)`);
    if (typeof def !== 'object' || def === null) {
      errori.push(`${dove}: definizione non valida`);
      continue;
    }
    if (def.tipo !== undefined) {
      // Unica eccezione alle liste chiuse: un punto di una serie, verificato contro l'Analisi.
      if (def.tipo !== 'punto') errori.push(`${dove}: tipo "${def.tipo}" sconosciuto (previsto solo "punto")`);
      else if (tipo !== 'componente') errori.push(`${dove}: il tipo "punto" è previsto solo per i Componenti`);
      else if (m.props?.[def.serie]?.tipo !== 'serie') errori.push(`${dove}: "serie" deve citare una proprietà di tipo serie`);
      continue;
    }
    const valori = def.valori;
    if (!Array.isArray(valori) || valori.length < 2 || !valori.every((v) => typeof v === 'string' && NOME_VALIDO.test(v))) {
      errori.push(`${dove}: "valori" deve elencare almeno 2 valori (a-z, 0-9, -)`);
    } else if (new Set(valori).size !== valori.length) {
      errori.push(`${dove}: "valori" contiene duplicati`);
    } else if (!valori.includes(def.predefinito)) {
      errori.push(`${dove}: "predefinito" deve essere uno dei valori`);
    }
    if (def.richiede !== undefined) {
      const zona = m.zone?.find((z) => z.nome === def.richiede?.zona);
      if (tipo !== 'layout') errori.push(`${dove}: "richiede" è previsto solo per i Layout`);
      else if (!zona || zona.tipo !== 'componenti') errori.push(`${dove}: "richiede" deve citare una zona di tipo componenti del Layout`);
      else if (!Number.isInteger(def.richiede.min) || def.richiede.min < 1) errori.push(`${dove}: "richiede.min" deve essere un intero ≥ 1`);
    }
  }
  return errori;
}

function erroriManifest(m, tipo) {
  if (typeof m.nome !== 'string' || !NOME_VALIDO.test(m.nome)) return ['nome mancante o non valido (a-z, 0-9, -)'];
  if (typeof m.scopo !== 'string' || !m.scopo) return ['scopo mancante'];
  if (tipo === 'layout') return [...erroriManifestLayout(m), ...erroriRegolazioni(m, tipo)];
  if (typeof m.props !== 'object' || m.props === null) return ['props mancanti'];
  const errori = erroriDefinizioniProp(m.props);
  if (Object.hasOwn(m.props, 'regolazioni')) errori.push('"regolazioni" è un nome riservato: non può essere una proprietà');
  return [...errori, ...erroriRegolazioni(m, tipo), ...erroriIncompatibilita(m)];
}

/** `incompatibileCon` elenca, per nome di Regolazione di slide, i valori con cui il Componente non è leggibile. */
function erroriIncompatibilita(m) {
  if (m.incompatibileCon === undefined) return [];
  const c = m.incompatibileCon;
  if (typeof c !== 'object' || c === null || Array.isArray(c)) return ['"incompatibileCon" deve essere un oggetto'];
  return Object.entries(c)
    .filter(([, valori]) => !Array.isArray(valori) || !valori.length || !valori.every((v) => typeof v === 'string'))
    .map(([nome]) => `incompatibileCon "${nome}": deve elencare uno o più valori (testo)`);
}

/**
 * Carica sistema di design e cartelle di catalogo aggiuntive.
 * Ogni radice può contenere layouts/, componenti/, temi/ e lingue/.
 */
export async function caricaRisorse(radiciExtra = []) {
  const risorse = { layout: new Map(), componenti: new Map(), temi: new Map(), lingue: new Map(), errori: [] };
  const stili = { layout: [], componenti: [] };

  for (const radice of [RADICE_DS, ...radiciExtra.map((r) => resolve(r))]) {
    for (const [sotto, tipo, mappa] of [
      ['layouts', 'layout', risorse.layout],
      ['componenti', 'componente', risorse.componenti],
    ]) {
      for (const nome of cartelle(join(radice, sotto))) {
        const dir = join(radice, sotto, nome);
        const etichetta = `catalogo ${tipo} "${nome}"`;
        try {
          const manifest = leggiJson(join(dir, 'manifest.json'));
          const errori = erroriManifest(manifest, tipo);
          if (errori.length) {
            risorse.errori.push(...errori.map((e) => `${etichetta}: manifest non valido: ${e}`));
            continue;
          }
          if (mappa.has(manifest.nome)) {
            risorse.errori.push(`${etichetta}: nome "${manifest.nome}" già definito`);
            continue;
          }
          const modulo = await import(pathToFileURL(join(dir, 'render.mjs')).href);
          mappa.set(manifest.nome, { manifest, render: modulo.default });
          const stile = join(dir, 'stile.css');
          if (existsSync(stile)) stili[tipo === 'layout' ? 'layout' : 'componenti'].push(readFileSync(stile, 'utf8'));
        } catch (e) {
          risorse.errori.push(`${etichetta}: ${e.message}`);
        }
      }
    }
    for (const nome of cartelle(join(radice, 'temi'))) {
      try {
        const tema = leggiJson(join(radice, 'temi', nome, 'tema.json'));
        const errore = erroreIdentita(tema.nome, risorse.temi, 'nome', 'definito');
        if (errore) risorse.errori.push(`tema "${nome}": ${errore}`);
        else risorse.temi.set(tema.nome, tema);
      } catch (e) {
        risorse.errori.push(`tema "${nome}": ${e.message}`);
      }
    }
    const dirLingue = join(radice, 'lingue');
    if (existsSync(dirLingue)) {
      for (const f of readdirSync(dirLingue).filter((f) => f.endsWith('.json')).sort()) {
        try {
          const lingua = leggiJson(join(dirLingue, f));
          const errore = erroreIdentita(lingua.codice, risorse.lingue, 'codice', 'definita');
          if (errore) risorse.errori.push(`lingua "${lingua.codice ?? f}": ${errore}`);
          else risorse.lingue.set(lingua.codice, lingua);
        } catch (e) {
          risorse.errori.push(`lingua "${f}": ${e.message}`);
        }
      }
    }
  }
  risorse.stili = [...stili.layout, ...stili.componenti].join('\n');
  return risorse;
}
