(() => {
  'use strict';
  const workspace = document.getElementById('workspace');
  const menu = document.getElementById('side-links');
  const appName = document.getElementById('app-name');
  const heading = document.getElementById('project-heading');
  const buttons = [...document.querySelectorAll('[data-project]')];
  if (!workspace || !menu || !buttons.length) return;
  const fmt = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
  const products = [
    {id:1,name:'Café torrado 500 g',category:'Mercearia',price:18.9,stock:25,min:8},
    {id:2,name:'Arroz branco 5 kg',category:'Mercearia',price:24.9,stock:16,min:5},
    {id:3,name:'Detergente neutro 500 ml',category:'Limpeza',price:3.9,stock:12,min:6},
    {id:4,name:'Biscoito integral 200 g',category:'Mercearia',price:6.5,stock:7,min:8},
    {id:5,name:'Sabonete 90 g',category:'Higiene',price:3.5,stock:22,min:10},
    {id:6,name:'Água mineral 1,5 L',category:'Bebidas',price:4.9,stock:32,min:10}
  ];
  let nextOrder=104;
  const orders = [
    {id:101,customer:'Mercado da Praça',items:4,total:138.4,day:'05/11/2026'},
    {id:102,customer:'Empório Aurora',items:3,total:92.3,day:'06/11/2026'},
    {id:103,customer:'Casa do Campo',items:2,total:51.7,day:'07/11/2026'}
  ];
  const clients = [
    {id:1,name:'Mercado Horizonte',city:'Socorro',days:32,owner:'Marina',status:'Recontatar'},
    {id:2,name:'Armazém Primavera',city:'Lindóia',days:18,owner:'Rafael',status:'Acompanhar'},
    {id:3,name:'Comercial Vale',city:'Serra Negra',days:46,owner:'Marina',status:'Recontatar'},
    {id:4,name:'Empório Estação',city:'Socorro',days:9,owner:'Rafael',status:'Em dia'}
  ];
  const templates = [
    {title:'Apresentação',body:'Olá, {cliente}! Aqui é {vendedor}, da equipe comercial. Podemos conversar sobre sua próxima compra?'},
    {title:'Retorno agendado',body:'Olá, {cliente}! Tudo bem? Estou retornando nosso contato. Qual seria um bom horário para conversarmos?'},
    {title:'Recuperação',body:'Olá, {cliente}! Sentimos sua falta por aqui. Posso ajudar com alguma dúvida ou preparar uma nova proposta?'}
  ];
  const sections={
    gestao:[['painel','Visão geral','▦'],['pedidos','Novo pedido','＋'],['estoque','Estoque','▣'],['historico','Pedidos registrados','≡']],
    equipe:[['carteira','Carteira de clientes','▦'],['retornos','Retornos','◷'],['mensagens','Mensagens prontas','✉']]
  };
  let project = new URLSearchParams(location.search).get('modulo') === 'equipe' ? 'equipe' : 'gestao';
  let current = project === 'gestao' ? 'painel' : 'carteira';
  let cart = {};
  let selectedClient=1;
  let selectedTemplate=0;
  let currentMessage='';
  let alert='';
  const title = (t,sub,action='')=> `<div class="section-head"><div><h3>${t}</h3><p>${sub}</p></div>${action||'<span class="pill">AMBIENTE FICTÍCIO</span>'}</div>`;
  const metrics=(items)=>`<div class="metric-grid">${items.map(([name,value,sub])=>`<div class="metric"><small>${name}</small><b>${value}</b><span>${sub}</span></div>`).join('')}</div>`;
  const compact = (items) => `<div class="compact-list">${items.map(i=>`<div class="compact-item"><div><strong>${i[0]}</strong><small>${i[1]}</small></div><span class="num">${i[2]}</span></div>`).join('')}</div>`;
  const table=(headers, rows)=> `<div class="table"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  const note=()=>`<div class="notice">Este é um exemplo interativo com dados fictícios. As alterações feitas aqui só existem durante esta visita.</div>`;
  function panel(){
    const total=orders.reduce((s,o)=>s+o.total,0);
    const low=products.filter(p=>p.stock<=p.min);
    workspace.innerHTML= title('Sua operação em um só lugar','Uma visão rápida do que merece atenção.') + note() +
      metrics([['Vendas simuladas',fmt(total),'Valores demonstrativos'],['Pedidos registrados',String(orders.length),'Inclui testes desta sessão'],['Produtos com estoque baixo',String(low.length),'Conforme limites simulados']]) +
      `<div class="columns"><div class="panel"><h4>Movimentação da semana</h4><div class="bars" aria-label="Gráfico ilustrativo de vendas durante a semana"><span class="bar" style="--h:23%"></span><span class="bar" style="--h:54%"></span><span class="bar" style="--h:38%"></span><span class="bar" style="--h:76%"></span><span class="bar" style="--h:49%"></span><span class="bar" style="--h:90%"></span><span class="bar" style="--h:63%"></span></div><div class="bar-caption"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div><p style="margin-top:12px">Gráfico ilustrativo; não representa dados reais.</p></div><div class="panel"><h4>Itens para acompanhar</h4>${compact(low.length?low.map(p=>[p.name,'Estoque mínimo: '+p.min,p.stock+' un.']):[['Tudo em dia','Nenhum item abaixo do mínimo','OK']])}</div></div>`;
  }
  function ordersView(){
    const cartEntries=Object.entries(cart).filter(([,qty])=>qty>0).map(([id,qty])=>({...products.find(p=>p.id===Number(id)),qty}));
    const total=cartEntries.reduce((s,p)=>s+p.price*p.qty,0);
    workspace.innerHTML=title('Monte um pedido de teste','Clique nos produtos para adicionar itens ao pedido.')+note()+`<div class="order-grid"><div><h4 style="margin:0 0 14px">Produtos disponíveis</h4><div class="product-grid">${products.map(p=>`<button class="product" data-add="${p.id}" ${p.stock<=0?'disabled':''}><strong>${p.name}</strong><small>${p.category} · ${p.stock} em estoque</small><span>${fmt(p.price)} / un. &nbsp; +</span></button>`).join('')}</div></div><div class="panel mini-cart"><h4>Seu pedido</h4>${cartEntries.length?compact(cartEntries.map(p=>[p.name,p.qty+' × '+fmt(p.price),fmt(p.price*p.qty)])):'<p>Escolha um produto para começar.</p>'}<div class="total"><span>Total fictício</span><span>${fmt(total)}</span></div><div class="cart-actions"><button class="btn gold" id="confirm-order" ${cartEntries.length?'':'disabled'}>Registrar pedido de teste</button><button class="btn ghost" id="clear-order">Limpar</button></div></div></div>${alert?`<div class="inline-status" role="status">${alert}</div>`:''}`;
    workspace.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{
      const p=products.find(i=>i.id===Number(b.dataset.add));
      if((cart[p.id]||0)>=p.stock) { alert='Quantidade máxima disponível para teste.';ordersView();return;}
      cart[p.id]=(cart[p.id]||0)+1;alert='';ordersView();
    });
    document.getElementById('clear-order').onclick=()=>{cart={};alert='';ordersView();};
    document.getElementById('confirm-order').onclick=()=>{
      if(!cartEntries.length)return;
      cartEntries.forEach(p=>{products.find(x=>x.id===p.id).stock-=p.qty;});
      orders.unshift({id:nextOrder++,customer:'Cliente de demonstração',items:cartEntries.reduce((s,p)=>s+p.qty,0),total,day:'Simulação'});
      cart={};alert='Pedido de teste registrado! Confira em "Pedidos registrados" ou na visão geral.';ordersView();
    };
  }
  function inventory(){
    workspace.innerHTML=title('Produtos e estoque','Acompanhe quantidades e pontos de atenção.')+note()+`<div class="toolbar"><div class="field search"><label for="stock-search">Pesquisar produto</label><input id="stock-search" placeholder="Digite um nome ou categoria"></div><span class="pill">${products.length} PRODUTOS FICTÍCIOS</span></div><div id="stock-results"></div>`;
    const field=document.getElementById('stock-search'), results=document.getElementById('stock-results');
    function redraw(){
      const q=field.value.toLocaleLowerCase('pt-BR');
      const rows=products.filter(p=>(p.name+' '+p.category).toLocaleLowerCase('pt-BR').includes(q)).map(p=>`<tr><td><strong>${p.name}</strong></td><td>${p.category}</td><td>${p.stock}</td><td>${p.min}</td><td><span class="status ${p.stock<=p.min?'warn':''}">${p.stock<=p.min?'Atenção':'Em dia'}</span></td></tr>`);
      results.innerHTML=rows.length?table(['Produto','Categoria','Disponível','Mínimo','Situação'],rows):'<div class="empty">Nenhum produto corresponde à busca.</div>';
    }
    field.addEventListener('input',redraw);redraw();
  }
  function history(){
    workspace.innerHTML=title('Pedidos registrados','A lista se atualiza quando você registra um pedido de teste.')+note()+table(['Pedido','Cliente','Itens','Total','Data'],orders.map(o=>`<tr><td><b>#${o.id}</b></td><td>${o.customer}</td><td>${o.items}</td><td><strong>${fmt(o.total)}</strong></td><td>${o.day}</td></tr>`));
  }
  function clientsView(){
    workspace.innerHTML=title('Carteira de clientes','Exemplo de organização de uma equipe de vendas.')+note()+metrics([['Clientes na carteira',String(clients.length),'Dados fictícios'],['Precisam de retorno',String(clients.filter(c=>c.status==='Recontatar').length),'Prioridade de contato'],['Contatos atualizados',String(clients.filter(c=>c.status==='Em dia').length),'Durante a simulação']])+
    `<div style="margin-top:18px">${table(['Cliente','Cidade','Responsável','Dias sem contato','Status'],clients.map(c=>`<tr><td><strong>${c.name}</strong></td><td>${c.city}</td><td>${c.owner}</td><td>${c.days}</td><td><span class="status ${c.status==='Recontatar'?'warn':''}">${c.status}</span></td></tr>`))}</div>`;
  }
  function returnsView(){
    const pending=clients.filter(c=>c.status!=='Em dia');
    workspace.innerHTML=title('Retornos para organizar','Uma lista de exemplo para a equipe não perder oportunidades.')+note()+`<div class="panel"><h4>Próximos contatos</h4>${pending.length?compact(pending.map(c=>[c.name,c.city+' · '+c.owner+' · '+c.days+' dias sem contato',c.status])):'<p>Todos os contatos foram simulados.</p>'}<p style="margin-top:15px">Abra <strong>Mensagens prontas</strong> para montar um retorno fictício.</p><button class="btn" id="go-messages" style="margin-top:13px">Preparar uma mensagem →</button></div>`;
    document.getElementById('go-messages').onclick=()=>{current='mensagens';render();};
  }
  function populate(body,client){return body.replaceAll('{cliente}',client.name).replaceAll('{vendedor}',client.owner);}
  function messagesView(){
    const client=clients.find(c=>c.id===selectedClient) || clients[0];
    const tpl=templates[selectedTemplate];
    currentMessage=currentMessage || populate(tpl.body,client);
    workspace.innerHTML=title('Mensagens prontas','Escolha um contato, personalize o texto e simule o acompanhamento.')+note()+`<div class="message-grid"><div class="panel"><h4>Quem você quer contatar?</h4><div class="client-picker">${clients.map(c=>`<button type="button" data-client="${c.id}" class="${c.id===selectedClient?'selected':''}"><strong>${c.name}</strong><small>${c.city} · ${c.status}</small></button>`).join('')}</div></div><div class="panel"><h4>Prepare sua mensagem</h4><div class="field"><label for="template-select">Modelo</label><select id="template-select">${templates.map((t,i)=>`<option value="${i}" ${i===selectedTemplate?'selected':''}>${t.title}</option>`).join('')}</select></div><div class="field" style="margin-top:14px"><label for="message-draft">Edite como quiser</label><textarea id="message-draft"></textarea></div><div class="message-actions"><button type="button" class="btn" id="render-preview">Atualizar prévia</button><button type="button" class="btn ghost" id="reset-message">Voltar ao modelo</button><button type="button" class="btn gold" id="mark-contact">Simular contato realizado</button></div><div class="message-preview" id="message-preview" aria-label="Prévia do contato"></div><p style="font-size:11px;color:#667993;margin-top:11px">Nenhuma mensagem é enviada ao WhatsApp nesta demonstração.</p><div id="message-feedback" aria-live="polite"></div></div></div>`;
    const draft=document.getElementById('message-draft'), preview=document.getElementById('message-preview');
    draft.value=currentMessage;preview.textContent=currentMessage;
    workspace.querySelectorAll('[data-client]').forEach(b=>b.onclick=()=>{selectedClient=Number(b.dataset.client);currentMessage='';messagesView();});
    document.getElementById('template-select').onchange=e=>{selectedTemplate=Number(e.target.value);currentMessage='';messagesView();};
    document.getElementById('render-preview').onclick=()=>{currentMessage=draft.value;preview.textContent=currentMessage;};
    document.getElementById('reset-message').onclick=()=>{currentMessage=populate(templates[selectedTemplate].body,client);draft.value=currentMessage;preview.textContent=currentMessage;};
    document.getElementById('mark-contact').onclick=()=>{
      client.status='Em dia';client.days=0;
      document.getElementById('message-feedback').innerHTML='<div class="inline-status">Contato marcado como realizado na simulação. Nada foi enviado ao cliente.</div>';
    };
  }
  function render(){
    buttons.forEach(b=>{const active=b.dataset.project===project;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));});
    heading.textContent=project==='gestao'?'Gestão e pedidos':'Equipe de vendas';
    appName.textContent=project==='gestao'?'Corte Certo':'Equipe comercial';
    menu.innerHTML=sections[project].map(([id,label,symbol])=>`<button data-view="${id}" type="button" class="${current===id?'selected':''}" aria-current="${current===id?'page':'false'}"><span class="nav-symbol" aria-hidden="true">${symbol}</span>${label}</button>`).join('');
    menu.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{current=b.dataset.view;alert='';render();});
    if(current==='painel')panel();
    else if(current==='pedidos')ordersView();
    else if(current==='estoque')inventory();
    else if(current==='historico')history();
    else if(current==='carteira')clientsView();
    else if(current==='retornos')returnsView();
    else if(current==='mensagens')messagesView();
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{
    project=b.dataset.project;
    current=project==='gestao'?'painel':'carteira';
    currentMessage='';
    const url=new URL(location.href);
    if(project==='equipe')url.searchParams.set('modulo','equipe');else url.searchParams.delete('modulo');
    window.history.replaceState(null,'',url.pathname+url.search);
    render();
  }));
  render();
})();
