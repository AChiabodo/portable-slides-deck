const COLONNE = { 2: 2, 3: 3, 4: 2, 5: 3, 6: 3 };

export default function render({ voci }) {
  const elementi = voci
    .map(
      (v, i) =>
        `<li class="scheda"><span class="scheda-numero">${String(i + 1).padStart(2, '0')}</span>` +
        `<h3 class="scheda-titolo">${v.titolo}</h3>` +
        (v.evidenza ? `<p class="scheda-evidenza">${v.evidenza}</p>` : '') +
        `<p class="scheda-testo">${v.testo}</p></li>`,
    )
    .join('');
  return `<ul class="schede" style="--colonne:${COLONNE[voci.length]}">${elementi}</ul>`;
}
