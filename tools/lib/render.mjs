import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RADICE_DS, LINGUA_PREDEFINITA, TEMA_PREDEFINITO } from './catalogo.mjs';
import { esc } from './html.mjs';
import { risolviOggetto } from './props.mjs';
import { risolviTesto } from './testo.mjs';

const cerca = (oggetto, chiave) => chiave.split('.').reduce((o, k) => o?.[k], oggetto);

/** Valori effettivi delle Regolazioni dichiarate dal manifest: quelli della Specifica, altrimenti i predefiniti (nessuno per un punto). */
function risolviRegolazioni(manifest, dati) {
  return Object.fromEntries(
    Object.entries(manifest.regolazioni ?? {}).map(([nome, def]) => [nome, dati?.[nome] ?? def.predefinito]),
  );
}

function renderComponente(dati, id, ctx) {
  const componente = ctx.risorse.componenti.get(dati.componente);
  const props = risolviOggetto(componente.manifest.props, dati, ctx);
  const regolazioni = risolviRegolazioni(componente.manifest, dati.regolazioni);
  return componente.render(props, { esc, t: ctx.t, id, regolazioni });
}

function renderZone(layout, slide, id, ctx) {
  const livello = layout.manifest.livelloTitolo ?? 2;
  const zone = {};
  for (const z of layout.manifest.zone) {
    const valore = slide.zone?.[z.nome];
    if (valore === undefined) {
      zone[z.nome] = '';
    } else if (z.tipo === 'testo') {
      const testo = risolviTesto(valore, ctx.analisi, ctx.lingua);
      zone[z.nome] = z.ruolo === 'titolo' ? `<h${livello} id="${id}-titolo">${testo}</h${livello}>` : testo;
    } else if (z.tipo === 'elenco') {
      zone[z.nome] = valore.map((v) => `<li>${risolviTesto(v, ctx.analisi, ctx.lingua)}</li>`).join('');
    } else if (z.tipo === 'componenti') {
      zone[z.nome] = valore.map((c, i) => renderComponente(c, `${id}-${z.nome}-${i + 1}`, ctx)).join('');
    }
  }
  return zone;
}

function renderSlide(slide, numero, ctx) {
  const layout = ctx.risorse.layout.get(slide.layout);
  const id = `slide-${numero}`;
  const regolazioni = risolviRegolazioni(layout.manifest, slide.regolazioni);
  const interno = layout.render({ zone: renderZone(layout, slide, id, ctx), regolazioni, t: ctx.t, id });
  // Solo i valori diversi dal predefinito diventano attributi: senza Regolazioni l'HTML non cambia.
  const attributi = Object.entries(layout.manifest.regolazioni ?? {})
    .filter(([nome, def]) => regolazioni[nome] !== def.predefinito)
    .map(([nome]) => ` data-reg-${nome}="${regolazioni[nome]}"`)
    .join('');
  return (
    `<section class="slide slide-${layout.manifest.nome}" id="${id}" aria-labelledby="${id}-titolo" data-indice="${numero}" data-titolo="${esc(ctx.titolo)}"${attributi}>` +
    `<div class="slide-contenuto">${interno}</div></section>`
  );
}

/** Genera i tre artefatti della Presentazione: HTML, CSS e JS. */
export function generaPresentazione({ specifica, analisi, risorse }) {
  const lingua = risorse.lingue.get(specifica.lingua ?? LINGUA_PREDEFINITA);
  const tema = risorse.temi.get(specifica.tema ?? TEMA_PREDEFINITO);
  const t = (chiave) => cerca(lingua, chiave) ?? chiave;
  const ctx = { risorse, analisi, lingua, t, titolo: specifica.titolo };

  const slide = specifica.slide.map((s, i) => renderSlide(s, i + 1, ctx)).join('\n');
  const variabili = Object.entries(tema.variabili)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join('\n');

  const html = `<!doctype html>
<html lang="${esc(lingua.codice)}" data-tema="${esc(tema.nome)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(specifica.titolo)}</title>
<link rel="stylesheet" href="assets/presentazione.css">
</head>
<body>
<a class="salta" href="#presentazione">${esc(t('ui.saltaAlContenuto'))}</a>
<main id="presentazione" class="presentazione">
${slide}
</main>
<nav class="avanzamento" aria-label="${esc(t('ui.avanzamento'))}">
<div class="barra" aria-hidden="true"><span></span></div>
<span class="contatore" aria-live="polite">1 / ${specifica.slide.length}</span>
<button type="button">${esc(t('ui.schermoIntero'))}</button>
</nav>
<script src="assets/presentazione.js" defer></script>
</body>
</html>
`;
  const base = readFileSync(join(RADICE_DS, 'assets', 'base.css'), 'utf8');
  const css = `:root {\n${variabili}\n}\n${base}\n${risorse.stili}\n`;
  const js = readFileSync(join(RADICE_DS, 'assets', 'presentazione.js'), 'utf8');
  return { html, css, js };
}
