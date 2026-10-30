import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { caricaRisorse } from './catalogo.mjs';
import { generaPresentazione } from './render.mjs';
import { validaSpecifica } from './validatore.mjs';
import { validaAnalisi } from './analisi.mjs';

function leggiJson(cartella, nome) {
  let testo;
  try {
    testo = readFileSync(join(cartella, nome), 'utf8');
  } catch {
    return { errore: `${nome}: file non trovato in ${cartella}` };
  }
  try {
    return { dati: JSON.parse(testo) };
  } catch (e) {
    return { errore: `${nome}: JSON non valido (${e.message})` };
  }
}

async function carica(cartella, radiciCatalogo) {
  const risorse = await caricaRisorse(radiciCatalogo);
  const spec = leggiJson(cartella, 'specifica.json');
  const ana = leggiJson(cartella, 'analisi.json');
  const errori = [...risorse.errori, ...[spec, ana].filter((f) => f.errore).map((f) => f.errore)];
  if (!errori.length) errori.push(...validaAnalisi(ana.dati));
  if (!errori.length) errori.push(...validaSpecifica({ specifica: spec.dati, analisi: ana.dati, risorse }));
  return { risorse, specifica: spec.dati, analisi: ana.dati, errori };
}

export async function valida(cartella, radiciCatalogo = []) {
  const { specifica, errori } = await carica(cartella, radiciCatalogo);
  return { errori, file: errori.length ? [] : [`specifica valida (${specifica.slide.length} slide)`] };
}

export async function genera(cartella, radiciCatalogo = []) {
  const contesto = await carica(cartella, radiciCatalogo);
  if (contesto.errori.length) return { errori: contesto.errori };

  const { html, css, js } = generaPresentazione(contesto);
  const dist = join(cartella, 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  writeFileSync(join(dist, 'index.html'), html);
  writeFileSync(join(dist, 'assets', 'presentazione.css'), css);
  writeFileSync(join(dist, 'assets', 'presentazione.js'), js);
  return { errori: [], file: [join(dist, 'index.html')] };
}

const incorpora = (contenuto, tag) => contenuto.replace(new RegExp(`</(${tag})`, 'gi'), '<\\/$1');

/** Valida e produce dist/presentazione.html, un unico file con CSS e JS incorporati. */
export async function esportaSingolo(cartella, radiciCatalogo = []) {
  const contesto = await carica(cartella, radiciCatalogo);
  if (contesto.errori.length) return { errori: contesto.errori };

  const { html, css, js } = generaPresentazione(contesto);
  const unico = html
    .replace('<link rel="stylesheet" href="assets/presentazione.css">', () => `<style>\n${incorpora(css, 'style')}</style>`)
    .replace('<script src="assets/presentazione.js" defer></script>', () => `<script>\n${incorpora(js, 'script')}</script>`);
  const dist = join(cartella, 'dist');
  mkdirSync(dist, { recursive: true });
  const file = join(dist, 'presentazione.html');
  writeFileSync(file, unico);
  return { errori: [], file: [file] };
}
