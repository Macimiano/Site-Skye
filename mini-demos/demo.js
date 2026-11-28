(() => {
'use strict';
const defs = {
 restaurante: {
   brand:'Mesa & Sabor',name:'Restaurante e lanchonete',icon:'▦',title:'A operação do salão em um só lugar',lead:'Comandas, pedidos da cozinha, caixa e movimentações.',
   nav:['Visão geral','Comandas','Cozinha','Cardápio','Relatórios'],navIcons:['▦','▤','♨','☰','▥'],action:'Nova comanda de teste',
   kpis:[['Comandas abertas','12','4 aguardando preparo'],['Vendas simuladas','R$ 1.846','No movimento de hoje'],['Em preparo','05','Pedidos na cozinha'],['Ticket médio','R$ 46,15','Valor estimado']],
   graphTitle:'Movimento da semana',graphSub:'Vendas fictícias registradas por dia',graph:[40,61,53,74,65,90,76],
   tableTitle:'Comandas em andamento',tableSub:'Atendimento e status da cozinha',columns:['Comanda','Mesa','Situação'],rows:[['Comanda #028','Mesa 04','Em preparo'],['Comanda #029','Mesa 12','Pronta'],['Comanda #030','Balcão','Aberta']],
   activityTitle:'Pedidos recentes',activity:[['Combo hambúrguer + batata','2 unidades · Mesa 04','Em preparo'],['Porção de salgados','1 unidade · Mesa 12','Pronto para servir'],['Suco natural','2 unidades · Balcão','Entregue']],
   extras:['Comandas abertas e fechadas','Pedidos encaminhados à cozinha','Fechamento do caixa'],newLabel:'Comanda de teste criada'
 },
 adega: {
   brand:'Adega Modelo',name:'Adega e loja de bebidas',icon:'◈',title:'Vendas e estoque sem perder o ritmo',lead:'Bebidas, embalagens, combos, produtos gelados e retornáveis.',
   nav:['Visão geral','Vendas','Estoque','Retornáveis','Relatórios'],navIcons:['▦','▤','▧','◈','▥'],action:'Simular venda',
   kpis:[['Vendas fictícias','R$ 2.387','Movimento de exemplo'],['Pedidos hoje','32','Balcão e retirada'],['Itens em estoque','268','Unidades cadastradas'],['Reposição','04','Itens em atenção']],
   graphTitle:'Vendas por dia',graphSub:'Receita fictícia da semana',graph:[45,55,69,63,85,100,81],
   tableTitle:'Estoque e reposição',tableSub:'Produtos que merecem atenção',columns:['Produto','Saldo','Situação'],rows:[['Refrigerante 2 L','8 un.','Repor'],['Cerveja lata 350 ml','92 un.','Disponível'],['Gelo 5 kg','3 sacos','Repor']],
   activityTitle:'Últimas movimentações',activity:[['Pedido #221','Cerveja + gelo · retirada','Concluído'],['Pedido #222','Refrigerantes · balcão','Concluído'],['Pedido #223','Água e energético','Separando']],
   extras:['Estoque por embalagem','Combos e promoções','Controle de retornáveis'],newLabel:'Venda fictícia registrada'
 },
 petshop: {
   brand:'Patinhas & Cia',name:'Pet shop',icon:'✦',title:'Agenda e loja trabalhando juntas',lead:'Banho e tosa, pets, tutores e vendas de produtos.',
   nav:['Visão geral','Agenda','Serviços','Produtos','Clientes'],navIcons:['▦','◷','✄','▧','♙'],action:'Agendar banho de teste',
   kpis:[['Serviços do dia','14','Banho e tosa agendados'],['Em atendimento','03','Pets na unidade'],['Vendas de exemplo','R$ 842','Loja e serviços'],['Próximos horários','06','Vagas no dia seguinte']],
   graphTitle:'Atendimentos da semana',graphSub:'Quantidade fictícia de serviços',graph:[44,58,77,56,87,98,69],
   tableTitle:'Agenda de atendimentos',tableSub:'Tutores, pets e horários de exemplo',columns:['Pet / tutor','Horário','Serviço'],rows:[['Luna · Camila','09h30','Banho'],['Thor · Bruno','11h00','Tosa'],['Mel · Juliana','14h30','Banho']],
   activityTitle:'Rotina da loja',activity:[['Banho e escovação','Luna · 9h30','Confirmado'],['Ração premium','Venda simulada · 1 un.','Concluída'],['Tosa higiênica','Thor · 11h00','Em andamento']],
   extras:['Agenda de banho e tosa','Cadastro de pets e tutores','Produtos e serviços'],newLabel:'Agendamento fictício criado'
 },
 hotel: {
   brand:'Pousada Horizonte',name:'Hotel e pousada',icon:'◇',title:'Reservas e hospedagens mais organizadas',lead:'Quartos, check-in, check-out e controle da estadia.',
   nav:['Visão geral','Reservas','Quartos','Hospedagens','Relatórios'],navIcons:['▦','▤','▣','◇','▥'],action:'Simular reserva',
   kpis:[['Ocupação','78%','Quartos ocupados'],['Check-ins hoje','06','Entradas previstas'],['Check-outs hoje','04','Saídas previstas'],['Reservas abertas','18','No período de exemplo']],
   graphTitle:'Taxa de ocupação',graphSub:'Estimativa ilustrativa dos últimos dias',graph:[60,75,70,88,95,98,78],
   tableTitle:'Chegadas previstas',tableSub:'Reservas de hóspedes fictícios',columns:['Reserva','Quarto','Situação'],rows:[['Reserva #380','Suíte 05','Confirmada'],['Reserva #381','Quarto 12','Check-in'],['Reserva #382','Suíte 02','Confirmada']],
   activityTitle:'Rotina da hospedagem',activity:[['Quarto 05','Check-in previsto · 14h','Confirmado'],['Quarto 08','Limpeza programada','Pendente'],['Quarto 12','Hóspede em estadia','Ocupado']],
   extras:['Mapa de quartos','Gestão de reservas','Organização das limpezas'],newLabel:'Reserva fictícia registrada'
 }
};
const key=document.body.dataset.segment;
const d=defs[key]||defs.restaurante;
let page='Visão geral',used=0;
const escapeHTML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=sel=>document.querySelector(sel);
const label=()=>page==='Visão geral'?d.title:page+' — demonstração';
const makeHeader=()=> `<div class="demo-top"><div><strong>Skye · Demonstração de ${escapeHTML(d.name)}</strong> <span>· Dados de exemplo, sem operação real</span></div><a href="../#demonstracoes">← Voltar ao site</a></div>`;
function render(){
const sections=d.nav.map((n,i)=>`<button type="button" data-page="${escapeHTML(n)}" class="${page===n?'active':''}"><span class="nicon">${d.navIcons[i]}</span>${escapeHTML(n)}</button>`).join('');
const kpis=d.kpis.map(([t,v,sub])=>`<article class="kpi"><small>${escapeHTML(t)}</small><strong>${escapeHTML(v)}</strong><span>${escapeHTML(sub)}</span></article>`).join('');
const rows=d.rows.map((r,i)=>`<div class="table-row"><b>${escapeHTML(r[0])}</b><span>${escapeHTML(r[1])}</span><span class="chip ${i===1?'green':i===0?'warn':''}">${escapeHTML(r[2])}</span></div>`).join('');
const activities=d.activity.map(([t,sub,st],i)=>`<div class="activity-card"><div><strong>${escapeHTML(t)}</strong><br/><small>${escapeHTML(sub)}</small></div><span class="chip ${i===1?'green':''}">${escapeHTML(st)}</span></div>`).join('');
$('#app').innerHTML=`${makeHeader()}<div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-logo">${d.icon}</span><div><strong>${escapeHTML(d.brand)}</strong><small>Simulação Skye</small></div></div><div><div class="nav-label">Seu espaço de trabalho</div><nav class="side-nav" aria-label="Módulos da demonstração">${sections}</nav></div><div class="sidebar-foot"><strong>Ambiente demonstrativo</strong>Sem cadastro, cobranças ou dados reais. Até três registros fictícios nesta visita.</div></aside><main class="content"><header class="headline"><div><div class="eyebrow">${escapeHTML(d.name)} · Dados fictícios</div><h1>${escapeHTML(label())}</h1><p>${escapeHTML(d.lead)}</p></div><div class="head-actions"><button type="button" class="button" id="reset">Reiniciar</button><button type="button" class="button primary" id="action" ${used>=3?'disabled':''}>＋ ${escapeHTML(d.action)}</button></div></header><div class="demo-hint"><b>●</b><div>Esta é uma <b>prévia interativa e limitada</b>, criada para apresentar possibilidades. Todos os valores, nomes e operações são fictícios. Alterações são descartadas ao atualizar.</div></div>${page==='Visão geral'?`<div class="kpi-grid">${kpis}</div><div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>${escapeHTML(d.graphTitle)}</h2><p>${escapeHTML(d.graphSub)}</p></div><a href="#" data-page="Relatórios">Ver detalhes ›</a></div><div class="graph">${d.graph.map((v,i)=>`<div class="bar-col"><div class="bar" style="height:${v}%"></div><small>${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][i]}</small></div>`).join('')}</div><div class="graph-footer"><span>Últimos 7 dias · exemplo</span><span>Valores ilustrativos</span></div></section><section class="panel"><div class="panel-head"><div><h2>${escapeHTML(d.tableTitle)}</h2><p>${escapeHTML(d.tableSub)}</p></div><a href="#" data-page="${escapeHTML(d.nav[1])}">Ver todos ›</a></div><div class="table-lite"><div class="table-head">${d.columns.map(x=>`<span>${escapeHTML(x)}</span>`).join('')}</div>${rows}</div></section></div>`:`<section class="panel"><div class="panel-head"><div><h2>${escapeHTML(page)}</h2><p>Conteúdo de demonstração com informações ilustrativas</p></div></div><div class="table-lite"><div class="table-head">${d.columns.map(x=>`<span>${escapeHTML(x)}</span>`).join('')}</div>${rows}</div><p class="footer-note">${d.extras.map(x=>escapeHTML(x)).join(' · ')}</p></section>`}<section class="section-block"><div class="panel-head"><div><h2>Movimentações recentes</h2><p>Exemplos para conhecer o fluxo de trabalho</p></div></div>${activities}<div id="more-rows"></div></section><p class="footer-note">Simulação independente, sem acesso ao sistema de produção. <a class="back-link" href="../#contato">Converse com a Skye sobre seu negócio ›</a></p></main></div>`;
const el=$('#action');el.addEventListener('click',()=>{if(used>=3)return;used++;const p=$('#more-rows');const card=document.createElement('div');card.className='activity-card';card.innerHTML=`<div><strong>${escapeHTML(d.newLabel)} #${used}</strong><br/><small>Simulado agora · Sem dados reais</small></div><span class="chip green">Simulado</span>`;p.prepend(card);if(used>=3){el.disabled=true;el.textContent='Limite de demonstração atingido';el.style.opacity='.6'};});
$('#reset').addEventListener('click',()=>{used=0;page='Visão geral';render()});
document.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();page=btn.dataset.page;render()}));
}
render();
})();
