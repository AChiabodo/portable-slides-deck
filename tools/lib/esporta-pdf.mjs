import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { esportaSingolo } from './pipeline.mjs';

const PERCORSI_EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function trovaEdge() {
  return [process.env.EDGE_PATH, ...PERCORSI_EDGE].find((p) => p && existsSync(p));
}

/** Esporta dist/presentazione.pdf stampando il file singolo con Edge headless (il print CSS definisce 16:9). */
export async function esportaPdf(cartella, radiciCatalogo = []) {
  const edge = trovaEdge();
  if (!edge) return { errori: ['esporta-pdf: Edge non trovato, imposta la variabile EDGE_PATH con il percorso di msedge.exe'] };

  const singolo = await esportaSingolo(cartella, radiciCatalogo);
  if (singolo.errori.length) return singolo;

  const pdf = resolve(cartella, 'dist', 'presentazione.pdf');
  rmSync(pdf, { force: true });
  const profilo = join(resolve(cartella, 'dist'), '.profilo-edge');
  const r = spawnSync(
    edge,
    [
      '--headless',
      '--disable-gpu',
      `--user-data-dir=${profilo}`,
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdf}`,
      pathToFileURL(resolve(singolo.file[0])).href,
    ],
    { encoding: 'utf8', timeout: 60000 },
  );
  rmSync(profilo, { recursive: true, force: true });
  if (!existsSync(pdf)) return { errori: [`esporta-pdf: Edge non ha prodotto il PDF (${(r.stderr || r.error?.message || '').trim()})`] };
  return { errori: [], file: [pdf] };
}
