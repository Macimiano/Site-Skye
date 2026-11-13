/* Trilha instrumental original da Skye. Nunca inicia sem interação do visitante. */
(() => {
  'use strict';
  const control = document.getElementById('ambient-toggle');
  const audio = document.getElementById('skye-ambient-audio');
  if (!control || !audio) return;
  const text = control.querySelector('.ambient-caption');
  const icon = control.querySelector('.ambient-note');
  audio.volume = 0.46;
  function render(isPlaying) {
    control.setAttribute('aria-pressed', String(isPlaying));
    control.setAttribute('aria-label', isPlaying ? 'Pausar música ambiente' : 'Ativar música ambiente');
    control.title = isPlaying ? 'Pausar música ambiente' : 'Ativar música ambiente suave';
    if (text) text.textContent = isPlaying ? 'Pausar música' : 'Música ambiente';
    if (icon) icon.textContent = isPlaying ? 'Ⅱ' : '♫';
  }
  render(false);
  control.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    try { await audio.play(); }
    catch (error) {
      render(false);
      if (text) text.textContent = 'Áudio indisponível';
      control.title = 'Não foi possível reproduzir este áudio no navegador';
    }
  });
  audio.addEventListener('play', () => render(true));
  audio.addEventListener('pause', () => render(false));
  audio.addEventListener('ended', () => render(false));
  // Respeita o visitante quando ele sai da aba; não reinicia sozinho.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) audio.pause();
  });
})();
