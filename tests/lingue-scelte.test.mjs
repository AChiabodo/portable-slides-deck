import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { RADICE } from './helpers.mjs';

const DS = join(RADICE, 'design-system');
const leggi = (percorso) => JSON.parse(readFileSync(percorso, 'utf8'));

function* scelte(defs, dove) {
  for (const [nome, def] of Object.entries(defs)) {
    if (def.tipo === 'scelta') yield { dove: `${dove} › ${nome}`, def };
    if (def.tipo === 'lista') yield* scelte(def.elementi, `${dove} › ${nome}`);
  }
}

test('ogni opzione di ogni prop scelta del Catalogo ha l\'etichetta in ogni lingua', () => {
  const lingue = readdirSync(join(DS, 'lingue')).map((f) => leggi(join(DS, 'lingue', f)));
  const trovate = [];
  for (const sotto of ['componenti', 'layouts']) {
    for (const nome of readdirSync(join(DS, sotto))) {
      const manifest = join(DS, sotto, nome, 'manifest.json');
      if (!existsSync(manifest)) continue;
      trovate.push(...scelte(leggi(manifest).props ?? {}, `${sotto}/${nome}`));
    }
  }
  assert.ok(trovate.length > 0, 'nessuna prop scelta nel Catalogo di partenza');
  for (const lingua of lingue) {
    for (const { dove, def } of trovate) {
      for (const opzione of def.opzioni) {
        const etichetta = lingua.scelte?.[def.vocabolario]?.[opzione];
        assert.ok(etichetta, `lingua "${lingua.codice}": manca scelte.${def.vocabolario}.${opzione} (${dove})`);
      }
    }
  }
});
