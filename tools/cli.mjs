#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { genera, valida, esportaSingolo } from './lib/pipeline.mjs';
import { esportaPdf } from './lib/esporta-pdf.mjs';
import { nuova } from './lib/nuova.mjs';

const USO = `Uso: node tools/cli.mjs <comando> <cartella-presentazione> [--catalogo <cartella>]...

Comandi:
  nuova            crea la struttura di una Presentazione (un nome semplice diventa presentazioni/<nome>)
  valida           controlla Specifica e Analisi contro il Catalogo
  genera           valida e genera dist/index.html con gli asset
  esporta-singolo  valida e produce dist/presentazione.html, un unico file autonomo
  esporta-pdf      genera dist/presentazione.pdf con Edge headless (EDGE_PATH opzionale)`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { catalogo: { type: 'string', multiple: true, default: [] } },
});
const [comando, cartella] = positionals;
const comandi = { nuova, valida, genera, 'esporta-singolo': esportaSingolo, 'esporta-pdf': esportaPdf };

if (!comandi[comando] || !cartella) {
  console.error(USO);
  process.exit(2);
}

try {
  const esito = await comandi[comando](cartella, values.catalogo);
  if (esito.errori.length) {
    for (const e of esito.errori) console.error(`ERRORE ${e}`);
    process.exit(1);
  }
  for (const f of esito.file ?? []) console.log(`OK ${f}`);
} catch (e) {
  console.error(`ERRORE ${e.message}`);
  process.exit(1);
}
