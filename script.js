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


// Skye v2: projeto real, galeria acessível e tema automático.
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const themeLabel = toggle && toggle.querySelector('.theme-label');
  let theme = 'auto';
  try {const saved = localStorage.getItem('skye-theme');if (['auto','light','dark'].includes(saved)) theme=saved;} catch(_){ /* Navegador pode bloquear armazenamento. */ }
  const themeNames = {auto:'Automático',light:'Claro',dark:'Escuro'};
  function updateTheme(){
    root.setAttribute('data-theme',theme);
    if (toggle) {toggle.setAttribute('aria-label','Tema: '+themeNames[theme]+'. Clique para alternar.');toggle.title='Tema: '+themeNames[theme];}
    if (themeLabel) themeLabel.textContent=themeNames[theme];
  }
  updateTheme();
  if (toggle) toggle.addEventListener('click',()=>{theme=({auto:'light',light:'dark',dark:'auto'})[theme];try{localStorage.setItem('skye-theme',theme);}catch(_){}updateTheme();});

  const cards = [...document.querySelectorAll('.showcase-card')];
  const filters = [...document.querySelectorAll('.gallery-filter')];
  const dialog = document.getElementById('gallery-dialog');
  const enlarged = document.getElementById('gallery-dialog-image');
  const title = document.getElementById('gallery-dialog-label');
  const caption = document.getElementById('gallery-dialog-caption');
  const counter = document.getElementById('gallery-count');
  const closeButton = document.getElementById('gallery-close');
  let visibleCards=cards;
  let selected=0;
  let previousFocus=null;
  function filterBy(category){
    filters.forEach(b=>{const yes=b.dataset.filter===category;b.classList.toggle('is-selected',yes);b.setAttribute('aria-pressed',String(yes));});
    cards.forEach(card=>{card.hidden=category!=='todos'&&card.dataset.category!==category;});
    visibleCards=cards.filter(c=>!c.hidden);
  }
  filters.forEach(b=>b.addEventListener('click',()=>filterBy(b.dataset.filter)));
  function show(index){
    if (!visibleCards.length) return;
    selected=(index+visibleCards.length)%visibleCards.length;
    const card=visibleCards[selected], img=card.querySelector('.showcase-image img');
    enlarged.src=img.getAttribute('src');
    enlarged.alt=img.alt;
    const heading=card.querySelector('.showcase-caption strong');
    title.textContent=(card.querySelector('.showcase-kicker')?.textContent||'Projeto Skye')+' · '+(heading?.textContent||'');
    caption.textContent=card.querySelector('.showcase-description')?.textContent||'';
    counter.textContent=`${selected+1} de ${visibleCards.length}`;
  }
  cards.forEach(card=>card.addEventListener('click',()=>{
    if (!dialog || !dialog.showModal) return;
    previousFocus=document.activeElement;
    show(visibleCards.indexOf(card));
    dialog.showModal();
    closeButton?.focus();
  }));
  document.getElementById('gallery-prev')?.addEventListener('click',()=>show(selected-1));
  document.getElementById('gallery-next')?.addEventListener('click',()=>show(selected+1));
  closeButton?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog?.addEventListener('close',()=>previousFocus?.focus());
  document.addEventListener('keydown',e=>{if (!dialog?.open)return;if(e.key==='ArrowRight')show(selected+1);if(e.key==='ArrowLeft')show(selected-1);});
})();
