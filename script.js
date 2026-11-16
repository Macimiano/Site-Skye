(() => {
  'use strict';
  const cfg = window.SKYE_CONFIG || {};
  const whatsapp = /^\d{12,13}$/.test(String(cfg.whatsapp || '')) ? String(cfg.whatsapp) : '';
  const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(cfg.email || '')) ? String(cfg.email) : '';
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const menuButton = document.getElementById('menu-toggle');
  const menu = document.getElementById('main-nav');
  if (menuButton && menu) {
    const close = () => {
      menu.classList.remove('show');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menu');
      document.body.classList.remove('nav-open');
    };
    menuButton.addEventListener('click', () => {
      const open = !menu.classList.contains('show');
      menu.classList.toggle('show', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('nav-open', open);
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (innerWidth > 760) close(); });
  }

  const floating = document.getElementById('floating-contact');
  if (floating && whatsapp) {
    const message = encodeURIComponent('Olá! Conheci a Skye pelo site e gostaria de conversar sobre um sistema de gestão personalizado para minha empresa.');
    floating.href = `https://wa.me/${whatsapp}?text=${message}`;
    floating.target = '_blank';
    floating.rel = 'noopener noreferrer';
  }

  const form = document.getElementById('proposal-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const prepared = document.getElementById('prepared-contact');
  const copyButton = document.getElementById('copy-contact');
  let message = '';
  function announce(text, kind = 'error') {
    if (!status) return;
    status.hidden = false;
    status.className = `form-status ${kind}`;
    status.textContent = text;
  }
  function validate(el) {
    let value = el.value.trim();
    if (el.required && !value) return false;
    if (el.minLength > 0 && value.length < el.minLength) return false;
    if (el.id === 'whatsapp') return value.replace(/\D/g, '').length >= 10;
    return true;
  }
  const inputs = [...form.querySelectorAll('input, textarea')];
  inputs.forEach(el => el.addEventListener('input', () => el.classList.remove('invalid')));
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    if (prepared) prepared.hidden = true;
    if (status) status.hidden = true;
    const bad = inputs.filter(el => !validate(el));
    inputs.forEach(el => el.classList.toggle('invalid', bad.includes(el)));
    if (bad.length) {
      announce('Confira os campos obrigatórios. O WhatsApp deve ter DDD e a descrição precisa ter pelo menos 10 caracteres.');
      bad[0].focus();
      return;
    }
    const nome = form.elements.nome.value.trim();
    const empresa = form.elements.empresa.value.trim();
    const telefone = form.elements.whatsapp.value.trim();
    const segmento = form.elements.segmento.value.trim();
    const necessidade = form.elements.necessidade.value.trim();
    const cidade = form.elements.cidade.value.trim();
    const atendimento = form.elements.atendimento.value;
    message = [
      'Olá, Skye! Gostaria de conversar sobre um sistema personalizado.',
      '',
      `Nome: ${nome}`,
      `Empresa: ${empresa}`,
      `WhatsApp: ${telefone}`,
      ...(segmento ? [`Segmento: ${segmento}`] : []),
      ...(cidade ? [`Cidade / região: ${cidade}`] : []),
      `Atendimento desejado: ${atendimento}`,
      `Necessidade: ${necessidade}`,
      '',
      'Mensagem preparada pelo site da Skye.'
    ].join('\n');
    if (whatsapp) {
      announce('Abrindo seu aplicativo de mensagens com os dados preenchidos. Confira e envie a mensagem para concluir o contato.', 'success');
      const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (mail) {
      announce('Abrindo seu aplicativo de e-mail. Confira e envie a mensagem para concluir o contato.', 'success');
      location.href = `mailto:${mail}?subject=${encodeURIComponent('Proposta de sistema personalizado — ' + empresa)}&body=${encodeURIComponent(message)}`;
    } else {
      announce('O canal comercial direto ainda não foi configurado. A mensagem abaixo está pronta para ser copiada.', 'success');
      if (prepared) prepared.hidden = false;
    }
  });
  if (copyButton) copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message);
      announce('Mensagem copiada. Envie-a pelo canal de contato que preferir.', 'success');
    } catch (_) {
      // Navegadores sem clipboard seguro podem oferecer seleção manual.
      const field = document.createElement('textarea');
      field.value = message;
      field.style.width = '100%';
      field.rows = 8;
      field.setAttribute('readonly', '');
      copyButton.replaceWith(field);
      field.focus();
      field.select();
      announce('Selecione e copie o texto exibido para compartilhar.', 'success');
    }
  });
})();


// Skye 5.2: tema automático e ampliação dos dois prints que permanecem na apresentação.
(() => {
  'use strict';
  const root=document.documentElement;
  const toggle=document.getElementById('theme-toggle');
  const label=toggle?.querySelector('.theme-label');
  let theme='auto';
  try {const v=localStorage.getItem('skye-theme');if(['auto','light','dark'].includes(v))theme=v;}catch(_){}
  const names={auto:'Automático',light:'Claro',dark:'Escuro'};
  function apply(){root.dataset.theme=theme;if(label)label.textContent=names[theme];if(toggle)toggle.setAttribute('aria-label','Tema: '+names[theme]+'. Clique para alternar.');}
  apply();
  toggle?.addEventListener('click',()=>{theme={auto:'light',light:'dark',dark:'auto'}[theme];try{localStorage.setItem('skye-theme',theme)}catch(_){}apply()});

  const previews={
    '0':{url:'assets/galeria/corte-certo-visao.webp',title:'Corte Certo · Visão geral',caption:'Tela real do sistema. Clique no zoom para observar detalhes.'},
    '4':{url:'assets/galeria/equipe-comercial.webp',title:'Equipe comercial · Mensagens prontas',caption:'Exemplo real de ferramenta comercial, com identificação da empresa ocultada.'}
  };
  const modal=document.getElementById('gallery-dialog'),image=document.getElementById('gallery-dialog-image');
  const stage=document.getElementById('gallery-zoom-stage'),level=document.getElementById('gallery-zoom-level');
  const decrease=document.getElementById('gallery-zoom-out'),increase=document.getElementById('gallery-zoom-in');
  let zoom=1,focusOrigin=null;
  function setZoom(value){
    if(!image||!stage)return;
    zoom=Math.max(1,Math.min(3,Math.round(value*100)/100));
    const active=zoom>1;
    stage.dataset.zoomed=String(active);
    image.style.width=active?`${Math.round(Math.min(image.naturalWidth||stage.clientWidth,stage.clientWidth-20)*zoom)}px`:'';
    image.style.maxHeight=active?'none':'';
    if(level)level.textContent=`${Math.round(zoom*100)}%`;
    if(decrease)decrease.disabled=zoom<=1;
    if(increase)increase.disabled=zoom>=3;
  }
  function reset(){if(stage)stage.scrollTo({top:0,left:0});setZoom(1)}
  document.querySelectorAll('[data-open-gallery]').forEach(btn=>btn.addEventListener('click',()=>{
    const p=previews[btn.dataset.openGallery];if(!p||!modal?.showModal)return;
    focusOrigin=btn;image.src=p.url;image.alt=p.title;
    document.getElementById('gallery-dialog-label').textContent=p.title;
    document.getElementById('gallery-dialog-caption').textContent=p.caption;
    reset();modal.showModal();document.getElementById('gallery-close')?.focus();
  }));
  increase?.addEventListener('click',()=>setZoom(zoom+.5));
  decrease?.addEventListener('click',()=>setZoom(zoom-.5));
  document.getElementById('gallery-zoom-reset')?.addEventListener('click',reset);
  document.getElementById('gallery-close')?.addEventListener('click',()=>modal?.close());
  modal?.addEventListener('click',e=>{if(e.target===modal)modal.close()});
  modal?.addEventListener('close',()=>{reset();focusOrigin?.focus()});
  modal?.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')setZoom(zoom+.5);if(e.key==='-')setZoom(zoom-.5);if(e.key==='0')reset()});
})();
