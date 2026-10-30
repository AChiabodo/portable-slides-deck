import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(RADICE, 'tools', 'cli.mjs');

const provenienza = () => ({ file: 'dati/vendite.csv', colonna: 'ricavi', operazione: 'somma' });

export const analisiBase = () => ({
  valori: {
    ricavi_totale: {
      etichetta: 'Ricavi totali',
      formato: { tipo: 'numero', decimali: 1, unita: '€' },
      valore: 1234.5,
      provenienza: provenienza(),
    },
    crescita: {
      etichetta: 'Crescita annua',
      formato: { tipo: 'percentuale', decimali: 1 },
      valore: 12.34,
      provenienza: provenienza(),
    },
    data_chiusura: {
      etichetta: 'Data di chiusura',
      formato: { tipo: 'data' },
      valore: '2024-03-07',
      provenienza: provenienza(),
    },
  },
  serie: {
    ricavi_per_regione: {
      etichetta: 'Ricavi per regione',
      formato: { tipo: 'numero', decimali: 0, unita: '€' },
      punti: [
        { etichetta: 'Nord', valore: 5200 },
        { etichetta: 'Centro', valore: 3100 },
        { etichetta: 'Sud', valore: 1800 },
      ],
      provenienza: provenienza(),
    },
  },
});

export const specificaBase = () => ({
  titolo: 'Vendite del periodo',
  lingua: 'it',
  tema: 'quiet-editorial',
  slide: [{ layout: 'copertina', zone: { titolo: 'Vendite del periodo' } }],
});

/** Crea una cartella di presentazione temporanea e ne restituisce il percorso. */
export function creaPresentazione({ analisi = analisiBase(), specifica = specificaBase(), grezzi = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'presentazione-'));
  if (analisi !== null) writeFileSync(join(dir, 'analisi.json'), JSON.stringify(analisi, null, 2));
  if (specifica !== null) writeFileSync(join(dir, 'specifica.json'), JSON.stringify(specifica, null, 2));
  for (const [nome, contenuto] of Object.entries(grezzi)) writeFileSync(join(dir, nome), contenuto);
  return dir;
}

/** Crea una cartella di catalogo aggiuntivo con i file indicati (percorso relativo -> contenuto). */
export function creaCatalogo(file) {
  const dir = mkdtempSync(join(tmpdir(), 'catalogo-'));
  for (const [rel, contenuto] of Object.entries(file)) {
    const percorso = join(dir, rel);
    mkdirSync(dirname(percorso), { recursive: true });
    writeFileSync(percorso, typeof contenuto === 'string' ? contenuto : JSON.stringify(contenuto, null, 2));
  }
  return dir;
}

/** Esegue la CLI e restituisce codice di uscita, stdout e stderr. */
export function esegui(argomenti) {
  const r = spawnSync(process.execPath, [CLI, ...argomenti], { encoding: 'utf8' });
  return { codice: r.status, out: r.stdout, err: r.stderr };
}

export const leggi = (dir, rel) => readFileSync(join(dir, rel), 'utf8');
export const esiste = (dir, rel) => existsSync(join(dir, rel));

/** Specifica con la copertina di base seguita dalle slide indicate. */
export const conSlide = (...slide) => ({ ...specificaBase(), slide: [specificaBase().slide[0], ...slide] });

export const slideKpi = (voci, extra = {}) => ({
  layout: 'risultato-grafico-commento',
  zone: { titolo: 'Ricavi in crescita', kpi: [{ componente: 'kpi', voci }], ...extra },
});
