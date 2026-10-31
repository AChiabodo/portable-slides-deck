const ICONA_RACCOMANDATA =
  '<svg class="opzione-icona" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M8 1.2l1.9 4.2 4.6.5-3.4 3.1 1 4.5L8 11.2l-4.1 2.3 1-4.5L1.5 5.9l4.6-.5z" fill="currentColor"/></svg>';
const ICONA_PIU =
  '<svg class="opzione-segno" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M8 4.5v7M4.5 8h7" stroke="var(--colore-carta)" stroke-width="1.8" stroke-linecap="round"/></svg>';
const ICONA_MENO =
  '<svg class="opzione-segno" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M4.5 8h7" stroke="var(--colore-carta)" stroke-width="1.8" stroke-linecap="round"/></svg>';

export default function render({ opzioni }, { esc, t }) {
  const schede = opzioni
    .map((o) => {
      const ruolo = o.ruolo?.valore ?? 'alternativa';
      const etichettaRuolo = o.ruolo ? o.ruolo.testo : esc(t('scelte.ruolo-opzione.alternativa'));
      return (
        `<li class="opzione" data-ruolo="${ruolo}">` +
        `<header class="opzione-testa">` +
        `<h3 class="opzione-titolo">${o.titolo}</h3>` +
        `<span class="opzione-ruolo">${ruolo === 'raccomandata' ? ICONA_RACCOMANDATA : ''}<span>${etichettaRuolo}</span></span>` +
        `</header>` +
        `<section class="opzione-blocco opzione-vantaggi">` +
        `<h4 class="opzione-intestazione">${ICONA_PIU}<span>${esc(t('componenti.opzioni-decisione.vantaggi'))}</span></h4>` +
        `<p class="opzione-testo">${o.vantaggi}</p></section>` +
        `<section class="opzione-blocco opzione-svantaggi">` +
        `<h4 class="opzione-intestazione">${ICONA_MENO}<span>${esc(t('componenti.opzioni-decisione.svantaggi'))}</span></h4>` +
        `<p class="opzione-testo">${o.svantaggi}</p></section>` +
        `</li>`
      );
    })
    .join('');
  return `<ul class="opzioni" role="list" style="--colonne:${opzioni.length}">${schede}</ul>`;
}
