/* Skye Gestão e Inovação — demonstração autônoma de gestão de lojas.
   Derivada das áreas funcionais do modelo fornecido pelo usuário. Dados locais e fictícios.
   Não faz chamadas de rede, não recebe pagamentos e não persiste registros. */
'use strict';
const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const money = v => BRL.format(v / 100);
const toCents = v => Math.round(Number(v) * 100);
const unitQty = (p,n) => p.unit==='kg' ? `${Number(n).toFixed(2).replace('.',',')} kg` : `${Number(n).toLocaleString('pt-BR')} un.`;
const safe = s => String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const PRODUCT_SEEDS = {
 mercadinho: [
 ['Arroz branco 5 kg','Mercearia',2690,28,7], ['Feijão carioca 1 kg','Mercearia',899,9,7], ['Açúcar cristal 1 kg','Mercearia',479,21,6],
 ['Café torrado 500 g','Mercearia',2280,16,5],['Óleo de soja 900 ml','Mercearia',779,12,5],['Leite integral 1 L','Bebidas',549,30,10],
 ['Refrigerante 2 L','Bebidas',999,8,5],['Água mineral 500 ml','Bebidas',250,0,6], ['Pão francês','Padaria',1990,14,4,'kg'],
 ['Banana prata','Hortifruti',699,7.8,3,'kg'],['Detergente 500 ml','Limpeza',289,17,5], ['Sabonete 90 g','Higiene',319,22,6]
 ],
 tabacaria: [
 ['Isqueiro colorido','Acessórios',490,24,8], ['Cinzeiro de mesa','Acessórios',1890,12,4], ['Porta-isqueiro','Acessórios',1190,5,5],
 ['Aromatizador ambiente','Conveniência',1590,16,5], ['Copo térmico','Conveniência',4990,8,3], ['Chaveiro metálico','Presentes',890,15,5],
 ['Abridor de garrafa','Presentes',1490,10,4], ['Bala de menta','Conveniência',450,36,10], ['Água mineral 500 ml','Bebidas',250,22,8],
 ['Energético 269 ml','Bebidas',999,4,7], ['Embalagem para presente','Presentes',350,0,5], ['Organizador de balcão','Acessórios',3250,7,3]
 ],
 agropecuaria: [
 ['Ração para cães 15 kg','Pet',12990,9,4], ['Ração para aves 5 kg','Nutrição animal',3490,14,5], ['Ração para cães a granel','Nutrição animal',1350,19.2,6,'kg'],
 ['Petisco para cães','Pet',1190,16,6], ['Areia higiênica 4 kg','Pet',2590,4,5], ['Bebedouro para aves','Acessórios',1890,11,5],
 ['Luva de jardinagem','Jardinagem',1490,8,4], ['Terra vegetal 10 kg','Jardinagem',1990,13,4], ['Semente de hortaliças','Jardinagem',590,18,6],
 ['Pá de jardinagem','Jardinagem',2990,0,3], ['Mangueira 10 m','Acessórios',7990,6,3],['Corda 10 m','Acessórios',1890,15,5]
 ]
};
const SEGMENT_NAME = {mercadinho:'Mercadinho',tabacaria:'Tabacaria',agropecuaria:'Agropecuária'};
const DESCRIPTIONS = {
 dashboard:['Visão geral','Confira os dados de exemplo e os principais alertas da loja.'],
 pdv:['Frente de caixa','Inclua produtos e finalize uma venda fictícia, como no sistema original.'],
 estoque:['Produtos e estoque','Encontre produtos, consulte quantidades e identifique itens com estoque baixo.'],
 vendas:['Vendas','Acompanhe as vendas simuladas e abra o detalhe de cada registro.'],
 clientes:['Clientes e fidelização','Veja como organizar o cadastro e o relacionamento com clientes.'],
 contas:['Contas a pagar','Conheça o acompanhamento de despesas, sem pagar contas reais.'],
 relatorios:['Relatórios','Acompanhe o resumo comercial calculado sobre os dados fictícios.']
};
const root=document.querySelector('#app');
const activeSegmentLabel=document.querySelector('#activeSegmentLabel');
const dialog=document.querySelector('#detailsDialog');
let page='dashboard';
const requestedSegment=new URLSearchParams(location.search).get('tipo');
let segment=Object.prototype.hasOwnProperty.call(SEGMENT_NAME,requestedSegment)?requestedSegment:null;
let state;
let cart=[];
let filters={pdv:'',estoque:'',stockStatus:'todos',pdvCat:'Todos',customer:''};
let toastTimeout=0;
function seedData(which) {
 const products=PRODUCT_SEEDS[which].map((x,i)=>({id:i+1,name:x[0],category:x[1],price:x[2],stock:x[3],min:x[4],unit:x[5]||'un'}));
 const customers=[{id:1,name:'Cliente balcão',points:0},{id:2,name:'Cliente Exemplo A',points:130},{id:3,name:'Cliente Exemplo B',points:75},{id:4,name:'Cliente Exemplo C',points:210},{id:5,name:'Cliente Exemplo D',points:30}];
 const sales=[
  {id:101,time:'09:14',customer:'Cliente balcão',method:'Pix (simulado)',items:[{id:1,qty:1},{id:2,qty:1}]},
  {id:102,time:'10:37',customer:'Cliente Exemplo A',method:'Cartão (simulado)',items:[{id:3,qty:2},{id:4,qty:1}]},
  {id:103,time:'11:52',customer:'Cliente Exemplo B',method:'Dinheiro (simulado)',items:[{id:6,qty:2},{id:7,qty:1}]}
 ].map(s=>({...s,items:s.items.map(l=>({...l,name:products[l.id-1].name,price:products[l.id-1].price,unit:products[l.id-1].unit})),total:s.items.reduce((sum,l)=>sum+Math.round(products[l.id-1].price*l.qty),0)}));
 const payables=[{id:1,description:'Compra de mercadorias',supplier:'Fornecedor Exemplo A',due:'20/11/2026',value:128500,status:'Pendente'},
 {id:2,description:'Energia elétrica',supplier:'Prestador de Exemplo',due:'24/11/2026',value:38490,status:'Pendente'},
 {id:3,description:'Reposição de embalagens',supplier:'Fornecedor Exemplo B',due:'27/11/2026',value:22900,status:'Pendente'}];
 return {products,customers,sales,payables,createdSales:0,createdCustomers:0};
}
function resetDemo(){state=seedData(segment);cart=[];filters={pdv:'',estoque:'',stockStatus:'todos',pdvCat:'Todos',customer:''};render();}
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3300);}
function navTitle(){const [h,sub]=DESCRIPTIONS[page];document.querySelector('#pageTitle').textContent=h;document.querySelector('#pageSubtitle').textContent=sub;document.querySelectorAll('[data-page]').forEach(b=>{const selected=b.dataset.page===page;b.classList.toggle('active',selected);b.setAttribute('aria-current',selected?'page':'false');});}
function switchPage(p){if(!DESCRIPTIONS[p])return;page=p;render();window.scrollTo({top:0,behavior:'instant'});}
const stockStatus=p=>p.stock<=0?'out':p.stock<=p.min?'low':'ok';
const stockPill=p=>stockStatus(p)==='out'?'<span class="pill danger">Sem estoque</span>':stockStatus(p)==='low'?'<span class="pill warning">Estoque baixo</span>':'<span class="pill success">Normal</span>';
const salesTotal=()=>state.sales.reduce((s,x)=>s+x.total,0);
const qtyCartFor=id=>cart.find(x=>x.id===id)?.qty||0;
const cartTotal=()=>cart.reduce((s,c)=>s+Math.round(state.products.find(p=>p.id===c.id).price*c.qty),0);
const cartItemCount=()=>cart.reduce((s,x)=>s+x.qty,0);
function dailyChart(){const data=[28,55,39,64,45,78,59].map((v,i)=>i===6?Math.min(100,45+state.createdSales*8):v);return `<div class="chart-area">${data.map((v,i)=>`<div class="chart-bar" style="--bar-height:${v}%"><span>${['Seg','Ter','Qua','Qui','Sex','Sáb','Hoje'][i]}</span></div>`).join('')}</div><div class="chart-legend"><span>Visualização ilustrativa da semana</span><span>Os totais dos cartões refletem as vendas simuladas</span></div>`;}
function intro(){return `<section class="intro-panel"><div><span class="intro-eyebrow">${safe(SEGMENT_NAME[segment]).toUpperCase()} · DADOS DE EXEMPLO</span><h2>Experimente uma rotina de loja, sem cadastro.</h2><p>Explore uma versão limitada do modelo: teste o caixa, confira estoque, acompanhe vendas e veja como tudo se organiza num só lugar.</p></div><button class="btn btn-gold" type="button" data-page="pdv">Fazer uma venda de teste ↗</button></section>`;}
function dashboard(){const low=state.products.filter(p=>stockStatus(p)!=='ok');return `${intro()}<div class="stats-grid">
 <article class="stat"><div class="label">Vendas de exemplo</div><strong>${money(salesTotal())}</strong><small><span class="stat-tag">${state.sales.length} registros</span> nesta simulação</small></article>
 <article class="stat"><div class="label">Produtos cadastrados</div><strong>${state.products.length}</strong><small>Catálogo fictício do segmento</small></article>
 <article class="stat"><div class="label">Atenção ao estoque</div><strong>${low.length}</strong><small>Itens baixos ou zerados</small></article>
 <article class="stat"><div class="label">Clientes cadastrados</div><strong>${state.customers.length}</strong><small>Contatos fictícios, sem telefone</small></article>
 </div><div class="grid-two section-gap">
 <section class="panel"><div class="panel-head"><div><h2>Movimentação da loja</h2><small>Gráfico ilustrativo · teste as vendas para atualizar os totais</small></div><button data-page="relatorios" class="btn btn-light btn-small">Ver relatório ↗</button></div>${dailyChart()}</section>
 <section class="panel"><div class="panel-head"><div><h2>Itens que pedem atenção</h2><small>Estoque abaixo do mínimo ou zerado</small></div></div>${low.slice(0,5).map(p=>`<div class="list-row"><div><b>${safe(p.name)}</b><br><span>${p.stock} ${p.unit}</span></div>${stockPill(p)}</div>`).join('')}<div class="quick-links"><button data-page="estoque" class="btn btn-outline btn-small">Ver todo o estoque →</button></div></section>
 </div><div class="hint section-gap"><strong>Esta não é uma loja real.</strong> Os dados são fictícios, as vendas são simuladas e nenhuma informação é enviada a um servidor. Clique em <b>Reiniciar</b> quando quiser voltar ao início. A demonstração reinicia ao atualizar a página.</div>`;}
function catalogItems(){const query=filters.pdv.toLowerCase();return state.products.filter(p=>(filters.pdvCat==='Todos'||p.category===filters.pdvCat)&&(`${p.name} ${p.category}`).toLowerCase().includes(query));}
function pdv(){const categories=['Todos',...new Set(state.products.map(x=>x.category))];return `<div class="pdv-layout"><section class="panel"><div class="panel-head"><div><h2>Escolher produtos</h2><small>Valores e estoque simulados para ${safe(SEGMENT_NAME[segment].toLowerCase())}</small></div><span class="pill">PDV de teste</span></div><div class="toolbar"><input id="pdvSearch" type="search" placeholder="Buscar pelo nome do produto" value="${safe(filters.pdv)}" aria-label="Buscar produtos"></div><div class="category-tabs" id="pdvCategories">${categories.map(c=>`<button type="button" data-cat="${safe(c)}" class="${filters.pdvCat===c?'selected':''}">${safe(c)}</button>`).join('')}</div><div class="products-grid section-gap pdv-catalog">${catalogItems().map(p=>`<article class="product-tile"><h3>${safe(p.name)}</h3><span class="meta">${safe(p.category)} · ${p.unit==='kg'?'por kg':'por unidade'}</span><span class="price">${money(p.price)}</span><span class="stock-mini ${stockStatus(p)}">${p.stock.toLocaleString('pt-BR')} ${p.unit} disponíveis</span><div class="tile-bottom">${p.unit==='kg'?`<label><span class="sr-only">Peso para ${safe(p.name)}</span><input type="number" data-weight="${p.id}" min="0.1" max="${p.stock}" step="0.1" value="0.5" aria-label="Peso em kg para ${safe(p.name)}"></label>`:''}<button class="btn btn-primary btn-small" data-add="${p.id}" ${p.stock<=0?'disabled':''}>+ Adicionar</button></div></article>`).join('')||'<div class="empty">Nenhum produto encontrado.</div>'}</div></section>
 <section class="panel"><div class="panel-head"><div><h2>Venda simulada</h2><small>${cart.length} produtos diferentes no carrinho</small></div><button class="btn btn-light btn-small" data-clear-cart ${!cart.length?'disabled':''}>Limpar</button></div><div class="cart-list">${cart.length?cart.map(c=>{const p=state.products.find(x=>x.id===c.id);return `<div class="cart-line"><div><strong>${safe(p.name)}</strong><small>${unitQty(p,c.qty)} × ${money(p.price)} / ${p.unit}</small><div class="cart-actions"><button data-cart-change="${p.id}" data-step="-1" class="qty-btn" aria-label="Reduzir quantidade de ${safe(p.name)}">−</button><span>${unitQty(p,c.qty)}</span><button data-cart-change="${p.id}" data-step="1" class="qty-btn" aria-label="Aumentar quantidade de ${safe(p.name)}">+</button></div></div><div class="cart-subtotal">${money(Math.round(c.qty*p.price))}</div></div>`;}).join(''):'<div class="empty">Escolha produtos na lista para começar.</div>'}</div><div class="cart-total"><span>Valor total</span><strong>${money(cartTotal())}</strong></div><div class="stack section-gap">
 <label class="field">Cliente (opcional)<select id="saleCustomer">${state.customers.map(c=>`<option value="${safe(c.name)}">${safe(c.name)}</option>`).join('')}</select></label>
 <label class="field">Forma de pagamento para a simulação<select id="salePayment"><option>Dinheiro (simulado)</option><option>Cartão (simulado)</option><option>Pix (simulado)</option></select></label>
 <p class="payment-note">Nenhuma cobrança será feita. A opção Pix não gera chave, QR Code ou transação bancária.</p><button class="btn btn-primary" data-checkout ${cart.length?'':'disabled'}>Finalizar venda fictícia · ${money(cartTotal())} →</button><p class="helper">Limite da demonstração: até 6 novas vendas por visita.</p>
 </div></section></div>`;}
function estoque(){const q=filters.estoque.toLowerCase();const prods=state.products.filter(p=>(`${p.name} ${p.category}`).toLowerCase().includes(q)&&(filters.stockStatus==='todos'||stockStatus(p)===filters.stockStatus));return `<section class="panel"><div class="panel-head"><div><h2>Estoque por produto</h2><small>Produtos do ${safe(SEGMENT_NAME[segment].toLowerCase())} · dados fictícios</small></div><span class="pill">Somente consulta</span></div><div class="toolbar"><input type="search" id="stockSearch" placeholder="Buscar produto ou categoria" value="${safe(filters.estoque)}"><select id="stockFilter" aria-label="Filtrar situação do estoque"><option value="todos" ${filters.stockStatus==='todos'?'selected':''}>Todos os itens</option><option value="ok" ${filters.stockStatus==='ok'?'selected':''}>Normal</option><option value="low" ${filters.stockStatus==='low'?'selected':''}>Estoque baixo</option><option value="out" ${filters.stockStatus==='out'?'selected':''}>Sem estoque</option></select></div><div class="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Quantidade</th><th>Estoque mínimo</th><th>Situação</th></tr></thead><tbody>${prods.map(p=>`<tr><td><strong>${safe(p.name)}</strong><small>${p.unit==='kg'?'Venda por peso':'Venda por unidade'}</small></td><td>${safe(p.category)}</td><td>${money(p.price)}</td><td>${p.stock.toLocaleString('pt-BR')} ${p.unit}</td><td>${p.min} ${p.unit}</td><td>${stockPill(p)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhum produto corresponde ao filtro.</td></tr>'}</tbody></table></div><p class="hint section-gap">Na demonstração, o estoque só muda quando você finaliza uma venda fictícia. Cadastros, ajustes administrativos, importação de notas e lançamentos reais estão desativados.</p></section>`;}
function vendas(){return `<section class="panel"><div class="panel-head"><div><h2>Histórico de vendas</h2><small>Registros de exemplo e vendas que você simulou nesta visita</small></div><span class="pill">${state.sales.length} vendas</span></div><div class="table-wrap"><table><thead><tr><th>Venda</th><th>Horário</th><th>Cliente</th><th>Pagamento</th><th>Valor</th><th>Ação</th></tr></thead><tbody>${[...state.sales].reverse().map(x=>`<tr><td><strong>#${x.id}</strong></td><td>${safe(x.time)}</td><td>${safe(x.customer)}</td><td>${safe(x.method)}</td><td><strong>${money(x.total)}</strong></td><td><button type="button" data-sale-detail="${x.id}" class="btn btn-light btn-small">Ver itens</button></td></tr>`).join('')}</tbody></table></div><p class="hint section-gap">As vendas desta tela não são comprovantes fiscais e não geram operações financeiras reais. Recarregar a página restaura os exemplos.</p></section>`;}
function clientes(){return `<div class="grid-two"><section class="panel"><div class="panel-head"><div><h2>Clientes de exemplo</h2><small>Cadastro e pontos para mostrar possibilidades de fidelização</small></div><span class="pill">Sem dados pessoais reais</span></div><div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Saldo ilustrativo</th><th>Situação</th></tr></thead><tbody>${state.customers.map(c=>`<tr><td><strong>${safe(c.name)}</strong></td><td>${c.points} pontos</td><td><span class="pill success">Cadastrado</span></td></tr>`).join('')}</tbody></table></div></section><section class="panel"><h2>Simule um cadastro</h2><p class="lead">Para testar o fluxo, use apenas um nome fictício, como “Cliente Teste”. Não informe dados reais.</p><label class="field" for="newCustomer">Nome fictício<input maxlength="32" minlength="3" id="newCustomer" placeholder="Ex.: Cliente Teste 01"></label><div class="quick-links"><button class="btn btn-primary" data-add-customer>Adicionar cliente fictício</button></div><p class="helper section-gap">Nesta versão, você pode adicionar até 2 clientes de teste; nada é armazenado em servidor.</p><div class="hint section-gap"><strong>Fidelização:</strong> o modelo contempla histórico e acompanhamento de clientes. Aqui mostramos pontos exemplificativos, sem comunicação comercial nem envio de mensagens.</div></section></div>`;}
function contas(){const total=state.payables.filter(p=>p.status!=='Pago').reduce((s,x)=>s+x.value,0);return `<section class="panel"><div class="panel-head"><div><h2>Contas a pagar</h2><small>Exemplos de despesas da operação</small></div><span class="pill warning">Pendente: ${money(total)}</span></div><div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Fornecedor</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody>${state.payables.map(p=>`<tr><td><strong>${safe(p.description)}</strong></td><td>${safe(p.supplier)}</td><td>${p.due}</td><td>${money(p.value)}</td><td>${p.status==='Pago'?'<span class="pill success">Pago (simulado)</span>':'<span class="pill warning">Pendente</span>'}</td><td><button class="btn btn-light btn-small" data-pay="${p.id}" ${p.status==='Pago'?'disabled':''}>Simular baixa</button></td></tr>`).join('')}</tbody></table></div><div class="hint section-gap"><strong>Não realiza pagamentos.</strong> Aqui você pode marcar uma conta como paga apenas para conhecer o acompanhamento visual. Não há vínculo com banco, fornecedor nem sistema financeiro.</div></section>`;}
function relatorios(){const categoryTotals={};for(const s of state.sales)for(const l of s.items){const cat=state.products.find(p=>p.id===l.id)?.category||'Outros';categoryTotals[cat]=(categoryTotals[cat]||0)+Math.round(l.qty*l.price);}const cats=Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1]);const maximum=Math.max(...cats.map(x=>x[1]),1);const byMethod={};for(const s of state.sales)byMethod[s.method]=(byMethod[s.method]||0)+s.total;return `<div class="stats-grid"><article class="stat"><span class="label">Total de vendas simuladas</span><strong>${money(salesTotal())}</strong><small>Inclui registros de exemplo</small></article><article class="stat"><span class="label">Quantidade de vendas</span><strong>${state.sales.length}</strong><small>Nesta visita ao site</small></article><article class="stat"><span class="label">Ticket médio</span><strong>${money(Math.round(salesTotal()/Math.max(state.sales.length,1)))}</strong><small>Calculado sobre a simulação</small></article><article class="stat"><span class="label">Produtos com alerta</span><strong>${state.products.filter(p=>stockStatus(p)!=='ok').length}</strong><small>Estoque baixo ou zerado</small></article></div><div class="report-grid section-gap"><section class="panel"><h2>Vendas por categoria</h2><p class="lead">Distribuição dos itens vendidos na simulação</p>${cats.map(([cat,total])=>`<div class="report-mini"><span>${safe(cat)}</span><div class="bar"><i style="--pct:${Math.max(2,Math.round(total/maximum*100))}%"></i></div><b>${money(total)}</b></div>`).join('')}</section><section class="panel"><h2>Formas de pagamento</h2><p class="lead">Apenas métodos fictícios</p>${Object.entries(byMethod).map(([method,total])=>`<div class="list-row"><b>${safe(method)}</b><span>${money(total)}</span></div>`).join('')}<div class="hint section-gap">A demonstração não registra recebimentos reais nem gera documentos fiscais.</div></section></div>`;}
function render(focusId){navTitle();root.innerHTML=({dashboard,pdv,estoque,vendas,clientes,contas,relatorios}[page])();if(focusId){const e=document.getElementById(focusId);if(e){e.focus();try{e.setSelectionRange(e.value.length,e.value.length);}catch{}}}}
function addToCart(id,qty){const p=state.products.find(x=>x.id===id);if(!p)return;if(!Number.isFinite(qty)||qty<=0||(p.unit!=='kg'&&!Number.isInteger(qty))){toast('Informe uma quantidade válida.');return;}qty=p.unit==='kg'?Math.round(qty*10)/10:qty;const existing=qtyCartFor(id);if(existing+qty>p.stock+1e-8){toast('Quantidade maior que o estoque de exemplo disponível.');return;}const found=cart.find(x=>x.id===id);if(found)found.qty=Math.round((found.qty+qty)*10)/10;else cart.push({id,qty});render();toast(`${p.name} adicionado à venda.`);}
function updateCart(id,direction){const p=state.products.find(x=>x.id===id);const pos=cart.findIndex(x=>x.id===id);if(pos<0||!p)return;const step=p.unit==='kg'?.1:1;const next=Math.round((cart[pos].qty+step*direction)*10)/10;if(next<=0)cart.splice(pos,1);else if(next>p.stock+1e-8){toast('Estoque insuficiente para aumentar a quantidade.');return;}else cart[pos].qty=next;render();}
function checkout(){if(!cart.length){toast('Adicione um produto antes de finalizar.');return;}if(state.createdSales>=6){toast('Você chegou ao limite de 6 vendas. Use Reiniciar para testar novamente.');return;}for(const c of cart){const p=state.products.find(x=>x.id===c.id);if(c.qty>p.stock+1e-8){toast(`Estoque insuficiente: ${p.name}.`);return;}}
 const customer=document.getElementById('saleCustomer')?.value||'Cliente balcão';const method=document.getElementById('salePayment')?.value||'Dinheiro (simulado)';const items=cart.map(c=>{const p=state.products.find(x=>x.id===c.id);return{id:p.id,name:p.name,price:p.price,unit:p.unit,qty:c.qty};});
 const total=cartTotal();for(const c of cart){const p=state.products.find(x=>x.id===c.id);p.stock=Math.round((p.stock-c.qty)*10)/10;}
 const now=new Date();const time=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(now);const id=104+state.createdSales;
 state.sales.push({id,time,customer,method,items,total});state.createdSales++;if(customer!=='Cliente balcão'){const c=state.customers.find(x=>x.name===customer);if(c)c.points+=Math.floor(total/1000);}
 cart=[];switchPage('vendas');toast('Venda fictícia registrada! Nenhuma cobrança foi realizada.');showSale(id);
}
function showSale(id){const sale=state.sales.find(x=>x.id===id);if(!sale)return;document.querySelector('#dialogHeading').textContent=`Venda fictícia #${sale.id}`;document.querySelector('#dialogBody').innerHTML=`<div class="dialog-content"><span class="pill">Somente demonstração</span><p>Cliente: ${safe(sale.customer)} · Horário: ${safe(sale.time)}</p><p>Pagamento: ${safe(sale.method)}</p><div class="table-wrap"><table><thead><tr><th>Item</th><th>Quantidade</th><th>Total</th></tr></thead><tbody>${sale.items.map(i=>`<tr><td>${safe(i.name)}</td><td>${unitQty(i,i.qty)}</td><td>${money(Math.round(i.price*i.qty))}</td></tr>`).join('')}</tbody></table></div><div class="dialog-total"><span>Total fictício</span><strong>${money(sale.total)}</strong></div><p>Este recibo ilustrativo não possui valor fiscal ou comercial.</p></div>`;dialog.showModal();}
function addCustomer(){const input=document.querySelector('#newCustomer');const name=(input?.value||'').trim().replace(/\s+/g,' ');if(!name||name.length<3){toast('Digite um nome fictício de pelo menos 3 caracteres.');return;}if(state.createdCustomers>=2){toast('Limite de 2 clientes de teste atingido.');return;}if(state.customers.some(x=>x.name.toLowerCase()===name.toLowerCase())){toast('Esse nome já está na lista.');return;}state.customers.push({id:state.customers.length+1,name,points:0});state.createdCustomers++;render();toast('Cliente de teste incluído somente nesta simulação.');}
const segmentGate=document.getElementById('segmentGate');
const appLayout=document.querySelector('.app-layout');
function showSegmentGate(){
 appLayout.hidden=true;segmentGate.hidden=false;
 history.replaceState({},'',location.pathname);
 window.scrollTo({top:0,behavior:'instant'});
}
function enterSegment(which){
 if(!Object.prototype.hasOwnProperty.call(SEGMENT_NAME,which))return;
 segment=which;page='dashboard';
 segmentGate.hidden=true;appLayout.hidden=false;
 activeSegmentLabel.textContent=SEGMENT_NAME[which];
 history.replaceState({},'',location.pathname+'?tipo='+encodeURIComponent(which));
 resetDemo();
 try{if(window.parent!==window)window.parent.postMessage({type:'skye-shop-segment',segment:which},location.origin);}catch{}
 window.scrollTo({top:0,behavior:'instant'});
}
if(segment)enterSegment(segment);else showSegmentGate();
document.querySelectorAll('[data-enter-segment]').forEach(btn=>btn.addEventListener('click',()=>enterSegment(btn.dataset.enterSegment)));
document.getElementById('changeSegment').addEventListener('click',showSegmentGate);
document.addEventListener('click',ev=>{
 const btn=ev.target.closest('button');if(!btn)return;
 if(btn.dataset.page){switchPage(btn.dataset.page);return;}
 if(btn.dataset.add){const id=Number(btn.dataset.add);const p=state.products.find(x=>x.id===id);const w=document.querySelector(`[data-weight="${id}"]`);addToCart(id,p.unit==='kg'?Number(w?.value):1);return;}
 if(btn.dataset.cartChange){updateCart(Number(btn.dataset.cartChange),Number(btn.dataset.step));return;}
 if(btn.hasAttribute('data-clear-cart')){cart=[];render();return;}
 if(btn.hasAttribute('data-checkout')){checkout();return;}
 if(btn.dataset.saleDetail){showSale(Number(btn.dataset.saleDetail));return;}
 if(btn.dataset.cat){filters.pdvCat=btn.dataset.cat;render();return;}
 if(btn.hasAttribute('data-add-customer')){addCustomer();return;}
 if(btn.dataset.pay){const x=state.payables.find(x=>x.id===Number(btn.dataset.pay));if(x&&x.status!=='Pago'){x.status='Pago';render();toast('Baixa ilustrativa registrada. Nenhum dinheiro foi transferido.');}return;}
});
document.querySelector('#nav').addEventListener('click',ev=>{const b=ev.target.closest('button[data-page]');if(b){switchPage(b.dataset.page);}});
root.addEventListener('input',ev=>{if(ev.target.id==='pdvSearch'){filters.pdv=ev.target.value;render('pdvSearch');}if(ev.target.id==='stockSearch'){filters.estoque=ev.target.value;render('stockSearch');}});
root.addEventListener('change',ev=>{if(ev.target.id==='stockFilter'){filters.stockStatus=ev.target.value;render();}});

document.querySelector('#resetDemoTop').addEventListener('click',()=>{if(confirm('Reiniciar vendas, estoque e clientes fictícios desta visita?')){page='dashboard';resetDemo();toast('Simulação reiniciada.');}});
document.querySelector('#dialogClose').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
