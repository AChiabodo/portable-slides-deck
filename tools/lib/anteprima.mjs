import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { genera } from './pipeline.mjs';
import { trovaEdge } from './esporta-pdf.mjs';

const LARGHEZZA = 1280;
const ALTEZZA = 760;

/** Una slide è un `<section class="slide …" id="…">`: se ne legge l'id per puntarla con l'ancora. */
function idSlide(html) {
  return [...html.matchAll(/<section class="slide [^"]*" id="([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Salva in dist/anteprime/slide-NN.png l'immagine di ogni slide (o della sola slide `opzioni.slide`, da 1)
 * così com'è in presentazione, con Edge headless.
 */
export async function anteprima(cartella, radiciCatalogo = [], opzioni = {}) {
  const richiesta = opzioni.slide === undefined ? undefined : Number(opzioni.slide);
  if (richiesta !== undefined && (!Number.isInteger(richiesta) || richiesta < 1)) {
    return { errori: [`anteprima: --slide vuole un numero intero da 1 (ricevuto "${opzioni.slide}")`] };
  }

  const edge = trovaEdge();
  if (!edge) return { errori: ['anteprima: Edge non trovato, imposta la variabile EDGE_PATH con il percorso di msedge.exe'] };

  const esito = await genera(cartella, radiciCatalogo);
  if (esito.errori.length) return esito;

  const ids = idSlide(readFileSync(esito.file[0], 'utf8'));
  if (richiesta !== undefined && richiesta > ids.length) {
    return { errori: [`anteprima: la slide ${richiesta} non esiste (la Presentazione ne ha ${ids.length})`] };
  }
  const numeri = richiesta === undefined ? ids.map((_, i) => i + 1) : [richiesta];

  const dist = resolve(cartella, 'dist');
  const uscita = join(dist, 'anteprime');
  if (richiesta === undefined) rmSync(uscita, { recursive: true, force: true });
  mkdirSync(uscita, { recursive: true });
  const profilo = join(dist, '.profilo-edge');
  const base = pathToFileURL(resolve(esito.file[0])).href;

  const file = [];
  const errori = [];
  for (const n of numeri) {
    const png = join(uscita, `slide-${String(n).padStart(2, '0')}.png`);
    rmSync(png, { force: true });
    const r = spawnSync(
      edge,
      [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        `--user-data-dir=${profilo}`,
        `--window-size=${LARGHEZZA},${ALTEZZA}`,
        `--screenshot=${png}`,
        `${base}#${ids[n - 1]}`,
      ],
      { encoding: 'utf8', timeout: 60000 },
    );
    if (existsSync(png)) file.push(png);
    else errori.push(`anteprima: Edge non ha prodotto l'immagine della slide ${n} (${(r.stderr || r.error?.message || '').trim()})`);
  }
  rmSync(profilo, { recursive: true, force: true });
  return { errori, file };
}
