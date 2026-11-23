/* Vídeo de demonstração da Skye — inicia sem som, com controles acessíveis. */
(() => {
  'use strict';
  const video=document.getElementById('skye-hero-video');
  const playButton=document.getElementById('skye-video-play');
  const audioButton=document.getElementById('skye-video-audio');
  const fullscreenButton=document.getElementById('skye-video-fullscreen');
  const frame=document.querySelector('.hero-video-window');
  const ambient=document.getElementById('skye-ambient-audio');
  if(!video)return;

  // O vídeo nunca começa reproduzindo áudio.
  video.muted=true;
  video.defaultMuted=true;
  video.volume=.65;

  function updatePlay(){
    if(!playButton)return;
    const paused=video.paused;
    playButton.setAttribute('aria-label',paused?'Reproduzir vídeo':'Pausar vídeo');
    playButton.title=paused?'Reproduzir vídeo':'Pausar vídeo';
    const icon=playButton.querySelector('span:first-child');
    if(icon)icon.textContent=paused?'▶':'Ⅱ';
    const label=playButton.querySelector('.hero-video-control-label');
    if(label)label.textContent=paused?'Reproduzir':'Pausar';
  }
  function updateAudio(){
    if(!audioButton)return;
    const active=!video.muted;
    audioButton.setAttribute('aria-pressed',String(active));
    audioButton.setAttribute('aria-label',active?'Desativar narração':'Ativar narração');
    audioButton.title=active?'Desativar narração':'Ativar narração';
    const label=audioButton.querySelector('.hero-video-control-label');
    if(label)label.textContent=active?'Silenciar':'Ouvir narração';
    const icon=audioButton.querySelector('span:first-child');
    if(icon)icon.textContent=active?'♫':'♪';
  }
  function tryPlay(){
    const p=video.play();
    if(p && typeof p.catch==='function')p.catch(()=>{updatePlay();});
  }

  playButton?.addEventListener('click',()=>{
    if(video.paused)tryPlay();else video.pause();
  });
  audioButton?.addEventListener('click',()=>{
    video.muted=!video.muted;
    if(!video.muted && ambient && !ambient.paused)ambient.pause();
    updateAudio();
  });
  ambient?.addEventListener('play',()=>{
    if(!video.muted){video.muted=true;updateAudio();}
  });
  fullscreenButton?.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement){await document.exitFullscreen();return;}
      if(frame?.requestFullscreen){await frame.requestFullscreen();return;}
      // iOS Safari pode exigir tela cheia no próprio elemento video.
      if(typeof video.webkitEnterFullscreen==='function')video.webkitEnterFullscreen();
    }catch(_){}
  });
  video.addEventListener('play',updatePlay);
  video.addEventListener('pause',updatePlay);
  video.addEventListener('volumechange',updateAudio);
  video.addEventListener('error',()=>{
    video.pause();updatePlay();
    if(playButton)playButton.title='Não foi possível carregar o vídeo. Recarregue a página.';
  });

  // Pausa o vídeo fora da área visível, poupando dados e processamento.
  let shouldResume=true;
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries[0]?.isIntersecting;
      if(!visible){shouldResume=!video.paused;video.pause();}
      else if(shouldResume && !document.hidden)tryPlay();
    },{threshold:.08});
    observer.observe(video);
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){shouldResume=!video.paused;video.pause();}
    else if(shouldResume && video.getBoundingClientRect().bottom>0 && video.getBoundingClientRect().top<innerHeight)tryPlay();
  });
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData){
    video.autoplay=false;shouldResume=false;video.pause();
  }else tryPlay();
  updatePlay();updateAudio();
})();
