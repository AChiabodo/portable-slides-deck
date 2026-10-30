import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODELLI = join(RADICE, 'tools', 'modelli');
const NOME_VALIDO = /^[a-z0-9-]+$/;

/** Un nome semplice diventa `presentazioni/<nome>` nella radice del repo; un percorso è usato così com'è. */
function percorsoDi(argomento) {
  return /[\\/]/.test(argomento) || isAbsolute(argomento) ? argomento : join(RADICE, 'presentazioni', argomento);
}

/** Crea la cartella di una nuova Presentazione con dati/, analisi.py, analisi.json e specifica.json di partenza. */
export async function nuova(argomento) {
  const cartella = percorsoDi(argomento);
  const nome = basename(cartella);
  if (!NOME_VALIDO.test(nome)) return { errori: [`nuova: nome non valido "${nome}" (ammessi: a-z, 0-9, -)`] };
  if (existsSync(cartella)) return { errori: [`nuova: la cartella ${cartella} è già esistente`] };

  mkdirSync(join(cartella, 'dati'), { recursive: true });
  for (const file of ['analisi.py', 'analisi.json', 'specifica.json']) copyFileSync(join(MODELLI, file), join(cartella, file));
  return { errori: [], file: [cartella] };
}
