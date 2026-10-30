(() => {
  const slide = Array.from(document.querySelectorAll('.slide'));
  if (!slide.length) return;

  const radice = document.documentElement;
  const contatore = document.querySelector('.avanzamento .contatore');
  const barra = document.querySelector('.avanzamento .barra span');
  const pulsante = document.querySelector('.avanzamento button');
  const modoSlide = window.matchMedia('(min-width: 900px)');
  let corrente = 0;

  radice.classList.add('js');

  function mostra(indice) {
    corrente = Math.max(0, Math.min(slide.length - 1, indice));
    slide.forEach((s, i) => {
      if (i === corrente) s.setAttribute('data-attiva', '');
      else s.removeAttribute('data-attiva');
    });
    contatore.textContent = `${corrente + 1} / ${slide.length}`;
    barra.style.width = `${((corrente + 1) / slide.length) * 100}%`;
  }

  function daHash() {
    const trovata = slide.findIndex((s) => `#${s.id}` === location.hash);
    return trovata >= 0 ? trovata : 0;
  }

  function vai(indice) {
    mostra(indice);
    history.replaceState(null, '', `#${slide[corrente].id}`);
    if (!modoSlide.matches) slide[corrente].scrollIntoView();
  }

  // In lettura verticale (schermi piccoli) l'avanzamento segue lo scorrimento.
  function seguiScorrimento() {
    if (modoSlide.matches) return;
    const meta = window.innerHeight / 2;
    const indice = slide.findIndex((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= meta && r.bottom >= meta;
    });
    if (indice >= 0) mostra(indice);
  }

  function schermoIntero() {
    if (document.fullscreenElement) document.exitFullscreen();
    else radice.requestFullscreen?.();
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'f' || e.key === 'F') return schermoIntero();
    if (!modoSlide.matches) return;
    const suControllo = e.target instanceof Element && e.target.closest('button, a, input');
    const avanti = ['ArrowRight', 'ArrowDown', 'PageDown'];
    const indietro = ['ArrowLeft', 'ArrowUp', 'PageUp'];
    if (avanti.includes(e.key) || (e.key === ' ' && !suControllo)) vai(corrente + 1);
    else if (indietro.includes(e.key)) vai(corrente - 1);
    else if (e.key === 'Home') vai(0);
    else if (e.key === 'End') vai(slide.length - 1);
    else return;
    e.preventDefault();
  });

  pulsante?.addEventListener('click', schermoIntero);
  window.addEventListener('scroll', seguiScorrimento, { passive: true });
  window.addEventListener('hashchange', () => mostra(daHash()));
  modoSlide.addEventListener('change', () => mostra(corrente));

  mostra(daHash());
})();
