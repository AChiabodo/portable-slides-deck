const LIVELLI = ['basso', 'medio', 'alto'];

const gravita = (probabilita, impatto) => {
  const somma = probabilita + impatto;
  return somma <= 1 ? 'bassa' : somma === 2 ? 'media' : 'alta';
};

export default function render({ rischi }, { t }) {
  const indice = (scelta) => LIVELLI.indexOf(scelta.valore);

  const riga = (p) =>
    `<span class="mr-livello mr-livello-y">${t(`scelte.livello.${LIVELLI[p]}`)}</span>` +
    LIVELLI.map((_, i) => {
      const marcatori = rischi
        .map((r, k) => (indice(r.probabilita) === p && indice(r.impatto) === i ? `<span class="mr-segno" style="--n:${k + 1}"></span>` : ''))
        .join('');
      return `<div class="mr-cella gravita-${gravita(p, i)}">${marcatori}</div>`;
    }).join('');

  const griglia =
    `<div class="mr-griglia" aria-hidden="true">` +
    `<span class="mr-asse mr-asse-y">${t('componenti.matrice-rischi.probabilita')}</span>` +
    [2, 1, 0].map(riga).join('') +
    `<span class="mr-vuoto"></span><span class="mr-vuoto"></span>` +
    LIVELLI.map((l) => `<span class="mr-livello mr-livello-x">${t(`scelte.livello.${l}`)}</span>`).join('') +
    `<span class="mr-asse mr-asse-x">${t('componenti.matrice-rischi.impatto')}</span></div>`;

  const legenda = rischi
    .map(
      (r, k) =>
        `<li class="mr-voce"><span class="mr-segno" style="--n:${k + 1}" aria-hidden="true"></span>` +
        `<span class="mr-titolo">${r.titolo}</span>` +
        `<span class="mr-dettaglio">${t('componenti.matrice-rischi.probabilita')}: ${r.probabilita.testo} · ${t('componenti.matrice-rischi.impatto')}: ${r.impatto.testo}</span></li>`,
    )
    .join('');

  return (
    `<figure class="matrice-rischi" role="group" aria-label="${t('componenti.matrice-rischi.etichetta')}">${griglia}` +
    `<ol class="mr-legenda" role="list">${legenda}</ol></figure>`
  );
}
