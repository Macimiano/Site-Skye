import {openRequestedGuide} from './src/shared.mjs';
import {
  wineStock, wineOrderTotals, wineReport, wineReturnables,
} from './src/wine-domain.mjs';
import { createWineStore, WINE_STORAGE_KEY } from './src/wine-storage.mjs';
import {
  escapeHtml as esc, formatMoney as money, parseMoney as cents,
} from './src/shared.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const uid = () => crypto.randomUUID();
const qty = value => new Intl.NumberFormat('pt-BR', {maximumFractionDigits:0}).format(value || 0);
const date = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem validade';
const dateTime = value => value ? new Date(value).toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'}) : 'Agora';
const methods = {pix:'Pix simulado',dinheiro:'Dinheiro simulado',debito:'Débito simulado',credito:'Crédito simulado'};
const stageLabels = {draft:'Rascunho',confirmed:'Separando',completed:'Concluído',out_for_delivery:'Saiu para entrega',delivered:'Entregue',cancelled:'Cancelado'};
const roleLabels = {gestao:'Gestão',caixa:'Caixa',entrega:'Entregas'};
const historyLabels = {
  CREATE_ORDER:'Pedido aberto',ADD_ITEM:'Item adicionado',REMOVE_ITEM:'Item removido',
  CONFIRM_ORDER:'Pedido confirmado e estoque reservado',COMPLETE_ORDER:'Venda concluída e estoque baixado',
  SET_DELIVERY_STAGE:'Entrega atualizada',CANCEL_ORDER:'Pedido cancelado',RECEIVE:'Recebimento registrado',
  DISCOUNT:'Desconto autorizado',REFUND_RECEIPT:'Recebimento estornado',RETURN_RETURNABLE:'Retornáveis devolvidos',
  ADD_RETURNABLE:'Retornáveis incluídos',REFUND_DEPOSIT:'Caução devolvida',REMOVE_RETURNABLE:'Retornável removido do rascunho',SET_BUSINESS_DATE:'Data de referência alterada',RECEIVE_STOCK:'Entrada de estoque',
  COUNT_STOCK:'Contagem de estoque',ADJUST_STOCK:'Ajuste de estoque',LOSS_STOCK:'Perda de estoque',
  UPSERT_PRODUCT:'Cadastro de produto atualizado',UPSERT_RETURNABLE_TYPE:'Cadastro de retornável atualizado',
  OPEN_SHIFT:'Turno aberto',CLOSE_SHIFT:'Turno fechado',
};
const paths = {
  home:'m3 11 9-8 9 8 M6 9v12h12V9',pos:'M3 7h18v14H3z M7 7V5a5 5 0 0 1 10 0v2 M8 12h8',
  delivery:'M3 6h12v12H3z M15 10h4l3 4v4h-7 M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  stock:'m3 7 9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',wine:'M7 3h10l1 6a6 6 0 0 1-12 0z M12 15v6 M8 21h8',
  returnables:'M3 11a9 9 0 1 1 2 7 M3 4v7h7',cash:'M3 5h18v14H3z M7 9h1 M16 15h1 M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  history:'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',plus:'M12 5v14 M5 12h14',
  search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',close:'M6 6l12 12 M18 6 6 18',
  check:'m5 12 4 4L19 6',help:'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.wine}"/></svg>`;
const nav = [
  ['home','Visão do dia','Hoje'],['pos','Vendas e pedidos','Vendas'],['delivery','Entregas','Entregas'],
  ['stock','Estoque e reposição','Estoque'],['catalog','Produtos e apresentações','Produtos'],
  ['returnables','Retornáveis e cauções','Cascos'],['cash','Caixa e turno','Caixa'],['history','Histórico','Histórico'],
];

let store, state, loadError, busy = false;
let view = 'home', selectedOrder = null, search = '', filter = 'all', role = 'gestao';
try {store=createWineStore();state=store.read();} catch(error) {loadError=error.message;}
const orderById = id => state.orders.find(order => order.id === id);
const current = () => orderById(selectedOrder);
const total = order => wineOrderTotals(state, order);
const isActive = order => (order.stage !== 'cancelled' && (order.stage === 'draft' || order.stage === 'confirmed' || (order.mode === 'entrega' && order.stage !== 'delivered'))) || (order.stage !== 'draft' && (total(order).balanceCents > 0 || total(order).refundDueCents > 0));
const badge = order => `<span class="badge ${esc(order.stage)}">${stageLabels[order.stage] || esc(order.stage)}</span>`;
const orderName = order => order.customer || (order.mode === 'entrega' ? 'Entrega' : 'Venda de balcão');
const methodOptions = () => `<option value="">Escolha uma forma de pagamento</option>${Object.entries(methods).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}`;

function toast(message, error=false) {
  const box=$('#toast');box.textContent=message;box.className=`visible ${error?'error':''}`;
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.className='',5000);
}
function closeModal() {$('#dialog').close();$('#dialog').innerHTML='';}
function modal(title, content, wide=false) {
  const dialog=$('#dialog');dialog.className=wide?'wide':'';
  dialog.innerHTML=`<div class="dialog-heading"><h2>${esc(title)}</h2><button class="icon-btn" data-action="close" aria-label="Fechar">${icon('close')}</button></div>${content}`;
  if(!dialog.open)dialog.showModal();
}
async function send(type, data={}, commandId=uid()) {
  if(busy)return false;
  busy=true;
  try {state=await store.transact({id:commandId,type,actor:role,...data});render();return true;}
  catch(error){toast(error.message,true);return false;}
  finally{busy=false;}
}
function navigate(next, orderId=null) {
  view=next;if(orderId)selectedOrder=orderId;search='';filter='all';render();window.scrollTo(0,0);
}
function empty(title, text, action='') {
  return `<div class="empty">${icon('wine')}<h3>${title}</h3><p>${text}</p>${action}</div>`;
}
function searchBox(placeholder, label) {
  return `<label class="search">${icon('search')}<input id="search" value="${esc(search)}" placeholder="${placeholder}" aria-label="${label}"></label>`;
}
function render() {
  if(loadError){
    $('#app').innerHTML=`<main id="main" class="recovery"><h1>Vamos recuperar a demonstração da adega</h1><p>${esc(loadError)}</p><button class="primary" data-action="reset">Reiniciar somente a adega</button><p><a href="/#demonstracoes" target="_top">Central de demonstrações</a></p></main>`;
    return;
  }
  const allowed = role==='entrega' ? nav.filter(([key])=>['delivery','returnables'].includes(key)) : nav;
  if(!allowed.some(([key])=>key===view)&&view!=='order')view=allowed[0][0];
  if(role==='entrega'&&view==='order')view='delivery';
  const title=view==='order'&&current()?`Pedido #${current().number}`:(nav.find(([key])=>key===view)?.[1]||'Adega SKYE');
  const pages={home:homePage,pos:ordersPage,delivery:deliveryPage,stock:stockPage,catalog:catalogPage,returnables:returnablesPage,cash:cashPage,history:historyPage,order:orderPage};
  $('#app').innerHTML=`<div class="shell">
    <aside class="sidebar">
      <a class="brand" href="/#demonstracoes" target="_top"><img src="./assets/logo-skye.png" alt="SKYE Gestão e Inovação"></a>
      <div class="workspace-label">ADEGA & LOJA DE BEBIDAS<span>Brisa • estabelecimento fictício</span></div>
      <nav aria-label="Principal">${allowed.map(([key,label,mobile])=>`<button class="nav-item ${view===key?'selected':''}" data-action="navigate" data-view="${key}" aria-label="${label}" title="${label}">${icon(key==='catalog'?'wine':key)}<span class="nav-label-desktop">${label}</span><span class="nav-label-mobile">${mobile}</span></button>`).join('')}</nav>
      <div class="sidebar-bottom"><button data-action="guide">${icon('help')} Roteiro da demonstração</button><a href="/#demonstracoes" target="_top">${icon('home')} Central de demonstrações</a><div class="local-state"><span></span> Adega salva neste navegador</div></div>
    </aside>
    <div class="workspace">
      <div class="demo-bar"><span><strong>Demonstração SKYE</strong> • Pagamentos simulados</span><div class="wine-notice-actions"><a href="/#demonstracoes" target="_top">Central</a><button data-action="guide">Roteiro</button><button data-action="reset">Reiniciar adega</button></div></div>
      <header class="app-header"><div><p class="eyebrow">BRISA • ADEGA DEMONSTRATIVA</p><h1>${title}</h1><p class="wine-date">Data de referência: ${date(state.businessDate)}</p></div><div class="header-controls"><label class="role-select"><span>Explorar como</span><select id="role" aria-label="Perfil demonstrativo">${Object.entries(roleLabels).map(([value,label])=>`<option value="${value}" ${role===value?'selected':''}>${label}</option>`).join('')}</select></label>${role!=='entrega'&&view!=='order'?`<button class="primary" data-action="new">${icon('plus')} Nova venda <kbd>F2</kbd></button>`:''}</div></header>
      <main id="main" class="content">${(pages[view]||homePage)()}</main>
      <footer class="app-footer">${icon('check')} Dados fictícios • Isolado do restaurante <span>Perfil simulado · Sem autenticação nesta versão</span></footer>
    </div>
  </div>`;
}

function kpis() {
  const report=wineReport(state);
  const deliveries=state.orders.filter(order=>order.mode==='entrega'&&!['draft','cancelled','delivered'].includes(order.stage));
  const low=state.products.filter(product=>wineStock(state,product.id).available<=product.min);
  const pending=wineReturnables(state).reduce((sum,row)=>sum+row.pending,0);
  return `<div class="stats">
    <article><span>A receber</span><strong>${money(report.pendingCents)}<small>Saldos das contas abertas</small></strong>${icon('cash')}</article>
    <article><span>Entregas em andamento</span><strong>${deliveries.length}<small>Separando, prontas ou em rota</small></strong>${icon('delivery')}</article>
    <article><span>Retornáveis pendentes</span><strong>${qty(pending)}<small>Cascos e engradados a receber</small></strong>${icon('returnables')}</article>
    <article><span>Produtos para repor</span><strong>${low.length}<small>Disponível no mínimo ou abaixo</small></strong>${icon('stock')}</article>
  </div>`;
}
function homePage() {
  const active=state.orders.filter(isActive).slice().reverse();
  const low=state.products.filter(product=>wineStock(state,product.id).available<=product.min);
  return `<div class="wine-home-heading vitrine-intro"><span class="vitrine-art garrafas" aria-hidden="true"><i></i></span><div><h2>A rotina da sua adega, organizada.</h2><p>Vendas, entregas e retornáveis com o estoque sempre à vista.</p></div><button class="secondary" data-action="guide">${icon('help')} Testar o fluxo completo</button></div>
    ${kpis()}<div class="wine-quick-actions"><button class="primary" data-action="new">${icon('pos')} Venda rápida</button><button class="secondary" data-action="new-delivery">${icon('delivery')} Pedido de entrega</button><button class="secondary" data-action="navigate" data-view="returnables">${icon('returnables')} Receber retornáveis</button>${role==='gestao'?'<button class="secondary" data-action="stock-entry">Entrada de mercadorias</button>':''}</div>
    <div class="wine-summary-grid"><section class="panel"><div class="section-heading"><div><h2>Pedidos para acompanhar</h2><p>Atendimento e pagamento têm situações independentes.</p></div></div><div class="orders-grid">${active.slice(0,4).map(orderCard).join('')}</div>${!active.length?empty('Tudo pronto para vender','Abra uma venda de balcão ou um pedido de entrega para experimentar o piloto.'):''}</section>
    <section class="panel"><h2>Lista de reposição</h2><ul class="wine-low-list">${low.map(product=>{const stock=wineStock(state,product.id);return `<li><span>${esc(product.name)}<small>Mínimo ${qty(product.min)} un.</small></span><strong>${qty(stock.available)} disponíveis</strong></li>`;}).join('')||'<li>Estoque disponível acima do mínimo em todos os produtos.</li>'}</ul><div class="wine-metric-note">Confirmar o pedido reserva unidades. Concluir a venda faz a baixa. Entregar e receber não repetem o consumo.</div><button class="text-link" data-action="navigate" data-view="stock">Conferir estoque e validade</button></section></div>`;
}
function orderCard(order) {
  const t=total(order);
  return `<button class="order-card" data-action="open" data-id="${esc(order.id)}"><div><strong>#${order.number} · ${esc(orderName(order))}</strong>${badge(order)}</div><p>${esc(order.items.map(item=>`${item.quantity}× ${item.name} (${item.presentationName})`).join(', ')||'Rascunho sem produtos')}</p><div class="order-card-footer"><span>${order.mode==='entrega'?'Entrega':'Balcão'} · ${dateTime(order.createdAt||order.at)}</span><strong>${money(t.balanceCents)}<small>${t.refundDueCents>0?'A devolver '+money(t.refundDueCents):'em aberto'}</small></strong></div></button>`;
}
function ordersPage() {
  const orders=state.orders.filter(order=>`${order.number} ${order.customer||''} ${stageLabels[order.stage]}`.toLowerCase().includes(search.toLowerCase())&&(filter==='all'||(filter==='open'?isActive(order):order.stage===filter))).slice().reverse();
  return `${kpis()}<div class="toolbar wine-toolbar-wrap">${searchBox('Pedido ou cliente fictício','Buscar pedidos')}<div class="wine-filters">${[['all','Todos'],['open','Em aberto'],['completed','Concluídos'],['cancelled','Cancelados']].map(([value,label])=>`<button class="chip ${filter===value?'active':''}" data-action="filter" data-id="${value}">${label}</button>`).join('')}</div></div><div class="orders-grid">${orders.map(orderCard).join('')}</div>${!orders.length?empty('Nenhum pedido encontrado','Experimente outro filtro ou abra a primeira venda.','<button class="primary" data-action="new">Nova venda</button>'):''}`;
}
function deliveryPage() {
  const orders=state.orders.filter(order=>order.mode==='entrega'&&!['draft','cancelled','delivered'].includes(order.stage));
  return `<div class="tip compact"><p>O acompanhamento é manual. A baixa acontece ao concluir a separação; registrar saída e entrega não altera o estoque nem confirma pagamento.</p></div><div class="wine-delivery-grid">${orders.map(order=>`<article class="wine-delivery-card"><div class="row"><strong>Pedido #${order.number}</strong>${badge(order)}</div><h3>${esc(orderName(order))}</h3><p>${esc(order.address)}</p><p>${esc(order.items.map(item=>`${item.quantity}× ${item.name} • ${item.presentationName}`).join(', '))}</p>${role!=='entrega'?`<p><strong>Saldo ${money(total(order).balanceCents)}</strong> · Taxa ${money(order.deliveryFeeCents)}</p>`:''}${order.stage==='confirmed'&&role!=='entrega'?`<button class="primary full" data-action="complete" data-id="${esc(order.id)}">Concluir separação e baixar estoque</button>`:''}${['completed','out_for_delivery'].includes(order.stage)?`<button class="primary full" data-action="delivery-stage" data-id="${esc(order.id)}" data-stage="${order.stage==='completed'?'out_for_delivery':'delivered'}">${order.stage==='completed'?'Registrar saída para entrega':'Registrar entrega realizada'}</button>`:''}${role!=='entrega'?`<button class="secondary full" data-action="open" data-id="${esc(order.id)}">Abrir pedido</button>`:''}</article>`).join('')}</div>${!orders.length?empty('Nenhuma entrega em andamento','Pedidos confirmados de entrega aparecerão aqui.'):''}`;
}
function orderPage() {
  const order=current();if(!order)return empty('Selecione um pedido','Abra uma venda na lista de pedidos.');
  const t=total(order);
  const products=state.products.filter(product=>`${product.name} ${product.category} ${product.presentations.map(p=>p.barcode).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return `<div class="order-topline"><button class="text-link" data-action="navigate" data-view="pos">Todos os pedidos</button><span>${badge(order)}<span class="subtle">${esc(orderName(order))} · ${order.mode==='entrega'?'Entrega':'Balcão'}</span></span></div>
    ${order.mode==='entrega'?`<div class="tip compact"><p><strong>Entrega manual:</strong> ${esc(order.address)} · Taxa ${money(order.deliveryFeeCents)}</p></div>`:''}
    <div class="wine-sale"><section>
      ${order.stage==='draft'?`<div class="toolbar wine-toolbar-wrap"><h2>Escolha os produtos</h2>${searchBox('Produto ou código de barras','Buscar produtos no pedido')}</div><div class="wine-products">${products.map(product=>{const stock=wineStock(state,product.id),price=product.presentations[0]?.priceCents||0;return `<button class="wine-product" data-action="product" data-id="${esc(product.id)}"><div class="wine-product-top"><span class="wine-product-symbol">${icon('wine')}</span><span class="badge ${stock.available<=product.min?'received':'ready'}">${qty(stock.available)} un. disponíveis</span></div><h3>${esc(product.name)}</h3><p>${esc(product.category)} · ${product.presentations.length} apresentações</p><div class="wine-product-price"><strong>${money(price)}</strong><span>${esc(product.presentations[0]?.name||'Unidade')}</span></div></button>`;}).join('')}</div>${!products.length?empty('Produto não encontrado','Tente outro nome ou código de barras.'):''}`:
        `<section class="panel"><h2>Produtos da venda</h2>${order.items.map(item=>orderLine(item,false)).join('')}<div class="wine-step-list">${['confirmed','completed',...(order.mode==='entrega'?['out_for_delivery','delivered']:[])].map(stage=>`<span class="${stage===order.stage?'active':''}">${stageLabels[stage]}</span>`).join('')}</div><p class="small-note">Preços, conversões e custos são preservados nesta operação. Cadastro posterior não altera o que foi combinado.</p></section>`}
      ${returnablesForOrder(order)}
      ${order.stage!=='draft'?receiptsForOrder(order):''}
    </section><aside class="order-summary panel"><div class="section-heading"><h2>Venda #${order.number}</h2>${icon('pos')}</div>
      ${order.stage==='draft'?`<div>${order.items.map(item=>orderLine(item,true)).join('')||'<p class="wine-order-empty">Adicione produtos ao lado.</p>'}</div>`:''}
      <dl class="totals"><div><dt>Bebidas e mercadorias</dt><dd>${money(t.subtotalCents)}</dd></div>${order.deliveryFeeCents?`<div><dt>Taxa de entrega</dt><dd>${money(t.deliveryFeeCents)}</dd></div>`:''}<div><dt>Desconto autorizado</dt><dd>− ${money(t.discountCents)}</dd></div><div class="total"><dt>Venda</dt><dd>${money(t.saleCents)}</dd></div><div class="wine-deposit-total"><dt>Caução exigível<small>Original ${money(t.depositChargedCents)} · Liberada ${money(t.depositChargedCents-t.depositCents)}<br>Separada da receita de bebidas</small></dt><dd>${money(t.depositCents)}</dd></div><div><dt>Total da conta</dt><dd>${money(t.totalCents)}</dd></div><div><dt>Recebido líquido para a venda</dt><dd>${money(t.saleReceivedCents)}</dd></div><div><dt>Caução recebida líquida</dt><dd>${money(t.depositReceivedCents)}</dd></div><div class="balance"><dt>Saldo restante</dt><dd>${money(t.balanceCents)}</dd></div>${t.refundDueCents?`<div class="refund"><dt>A devolver</dt><dd>${money(t.refundDueCents)}</dd></div>`:''}</dl>
      <div class="wine-order-actions">${order.stage==='draft'?`<button class="primary full" data-action="confirm" data-id="${esc(order.id)}" ${!order.items.length?'disabled':''}>Confirmar e reservar estoque</button><button class="secondary full" data-action="add-returnable" data-id="${esc(order.id)}">Incluir cascos / engradados</button>`:''}${order.stage==='confirmed'?`<button class="primary full" data-action="complete" data-id="${esc(order.id)}">${order.mode==='entrega'?'Concluir separação':'Concluir venda'} e baixar estoque</button>`:''}${order.mode==='entrega'&&['completed','out_for_delivery'].includes(order.stage)?`<button class="secondary full" data-action="delivery-stage" data-id="${esc(order.id)}" data-stage="${order.stage==='completed'?'out_for_delivery':'delivered'}">${order.stage==='completed'?'Registrar saída para entrega':'Registrar entrega realizada'}</button>`:''}${t.balanceCents>0&&order.stage!=='draft'&&(order.stage!=='cancelled'||order.stockConsumed)?`<button class="primary full" data-action="receive" data-id="${esc(order.id)}">${icon('cash')} ${order.stage==='cancelled'?'Receber caução pendente':'Receber pagamento'}</button>`:''}${t.refundDueCents>0?'<div class="wine-liability-note">Devolução financeira pendente</div>':t.balanceCents===0&&!['draft','cancelled'].includes(order.stage)?'<div class="wine-paid">Conta quitada</div>':''}${role==='gestao'&&!['cancelled'].includes(order.stage)&&!state.receipts.some(receipt=>receipt.orderId===order.id)?`<button class="text-link" data-action="discount" data-id="${esc(order.id)}">Aplicar desconto</button>`:''}${order.stage!=='cancelled'?`<button class="danger-text" data-action="cancel" data-id="${esc(order.id)}">Cancelar pedido</button>`:''}</div><p class="small-note">Confirmar reserva; concluir baixa. Receber e entregar não repetem a baixa. Nenhuma cobrança externa é realizada.</p>
    </aside></div>`;
}
function orderLine(item, editable) {
  return `<article class="wine-order-line"><div><h3>${item.quantity}× ${esc(item.name)}</h3><small>${esc(item.presentationName)} · ${money(item.unitPriceCents)} cada</small><p class="unit-conversion">${item.quantity} × ${qty(item.unitsPerPresentation)} = ${qty(item.baseQuantity)} unidades</p></div><div><strong>${money(item.totalCents??item.quantity*item.unitPriceCents)}</strong>${editable?`<button class="danger-text" data-action="remove-item" data-id="${esc(item.id)}">Remover</button>`:''}</div></article>`;
}
function returnablesForOrder(order) {
  const planned=order.returnables||[];
  if(!planned.length)return '';
  const rows=wineReturnables(state,order.id);
  return `<section class="panel"><h2>Cascos e engradados desta operação</h2>${order.stage==='draft'?planned.map(row=>`<div class="wine-order-line"><span>${qty(row.quantity)}× ${esc(row.name)}<small>${row.chargeDeposit?'Caução de '+money(row.depositPerUnitCents)+' por unidade':'Sem cobrança de caução'}</small></span><button class="danger-text" data-action="remove-returnable" data-id="${esc(row.typeId)}">Remover</button></div>`).join(''):rows.map(returnableCard).join('')}<p class="small-note">A devolução física e a devolução da caução são registradas separadamente.</p></section>`;
}
function receiptsForOrder(order) {
  const receipts=state.receipts.filter(receipt=>receipt.orderId===order.id);
  if(!receipts.length)return '';
  return `<section class="panel wine-receipts"><h2>Recebimentos e devoluções</h2>${receipts.map(receipt=>`<div><div class="row"><span><strong>${receipt.type==='deposit_refund'?'Devolução de caução':receipt.amountCents<0?'Estorno':esc(methods[receipt.method]||receipt.method)}</strong><small>${dateTime(receipt.at)}</small></span><strong>${money(receipt.amountCents)}</strong></div><small>Venda ${money(receipt.saleCents)} · Caução ${money(receipt.depositCents)}</small>${role==='gestao'&&receipt.type==='receipt'?`<button class="text-link" data-action="refund" data-id="${esc(receipt.id)}">Estornar recebimento</button>`:''}</div>`).join('')}</section>`;
}

function stockPage() {
  const products=state.products.filter(product=>product.name.toLowerCase().includes(search.toLowerCase())&&(filter!=='low'||wineStock(state,product.id).available<=product.min));
  const movements=state.movements.slice(-30).reverse();
  const movementLabels={reserve:'Reserva',consume:'Baixa da venda',release:'Liberação de reserva',entry:'Entrada',receive:'Entrada',count:'Contagem',adjust:'Ajuste',loss:'Perda',initial:'Estoque inicial'};
  return `<div class="toolbar wine-toolbar-wrap">${searchBox('Buscar produto','Buscar estoque')}<div class="wine-filters"><button class="chip ${filter==='all'?'active':''}" data-action="filter" data-id="all">Todos</button><button class="chip ${filter==='low'?'active':''}" data-action="filter" data-id="low">Reposição</button>${role==='gestao'?'<button class="primary" data-action="stock-entry">Entrada de estoque</button>':''}</div></div>
    <section class="panel"><div class="section-heading"><div><h2>Estoque por unidade base</h2><p>Disponível = físico − reservado − vencido bloqueado. Embalagens usam a conversão do cadastro.</p></div></div><div class="table-scroll"><table><thead><tr><th>Produto</th><th>Físico</th><th>Reservado</th><th>Vencido bloqueado</th><th>Disponível</th><th>Mínimo</th><th>Situação</th></tr></thead><tbody>${products.map(product=>{const stock=wineStock(state,product.id);return `<tr><td><strong>${esc(product.name)}</strong><small>${product.expiryEnabled?'Validade controlada':'Validade desabilitada'}</small></td><td>${qty(stock.physical)}</td><td>${qty(stock.reserved)}</td><td>${qty(stock.expired)}</td><td><strong>${qty(stock.available)}</strong></td><td>${qty(product.min)}</td><td><span class="badge wine-stock-badge ${stock.available<=product.min?'received':'ready'}">${stock.available<=product.min?'Repor estoque':'Regular'}</span></td></tr>`;}).join('')||'<tr><td colspan="7">Nenhum produto encontrado.</td></tr>'}</tbody></table></div></section>
    <section class="panel"><h2>Lotes, contagem e perdas</h2><div class="table-scroll"><table><thead><tr><th>Produto / lote</th><th>Validade</th><th>Físico</th><th>Reservado</th><th>Custo / un.</th>${role==='gestao'?'<th>Ações</th>':''}</tr></thead><tbody>${state.batches.filter(batch=>products.some(product=>product.id===batch.productId)).map(batch=>{const product=state.products.find(product=>product.id===batch.productId);return `<tr><td><strong>${esc(product?.name)}</strong><small>${esc(batch.code||batch.id)}</small></td><td>${date(batch.expiryDate)}${product?.expiryEnabled&&batch.expiryDate&&batch.expiryDate<state.businessDate?'<small>Bloqueado para novas vendas</small>':''}</td><td>${qty(batch.quantity)}</td><td>${qty(batch.reserved)}</td><td>${money(batch.costCents)}</td>${role==='gestao'?`<td><button class="text-link" data-action="batch-count" data-id="${esc(batch.id)}">Contar</button> · <button class="text-link" data-action="batch-adjust" data-id="${esc(batch.id)}">Ajustar</button> · <button class="text-link" data-action="batch-loss" data-id="${esc(batch.id)}">Perda</button></td>`:''}</tr>`;}).join('')}</tbody></table></div></section>
    <section class="panel"><h2>Movimentações recentes</h2><div class="table-scroll"><table><thead><tr><th>Registro</th><th>Movimento</th><th>Produto</th><th>Quantidade</th><th>Motivo / pedido</th></tr></thead><tbody>${movements.map(movement=>`<tr><td>${dateTime(movement.at)}</td><td>${esc(movementLabels[movement.kind||movement.type]||historyLabels[movement.type]||movement.kind||movement.type)}</td><td>${esc(state.products.find(product=>product.id===movement.productId)?.name||state.products.find(product=>product.id===state.batches.find(batch=>batch.id===movement.batchId)?.productId)?.name||'Produto')}</td><td>${qty(movement.quantity??movement.qty)}</td><td>${esc(movement.reason||(movement.orderId?'Pedido #'+orderById(movement.orderId)?.number:'—'))}</td></tr>`).join('')||'<tr><td colspan="5">Entradas, reservas e baixas aparecerão aqui.</td></tr>'}</tbody></table></div></section>`;
}
function catalogPage() {
  const products=state.products.filter(product=>`${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()));
  return `<div class="toolbar wine-toolbar-wrap">${searchBox('Nome ou categoria','Buscar produtos')}${role==='gestao'?'<button class="primary" data-action="product-new">Novo produto</button>':''}</div><div class="catalog-grid">${products.map(product=>`<article class="panel"><div class="row"><span class="badge planned">${esc(product.category)}</span><span class="subtle">Mín. ${qty(product.min)} un.</span></div><h2>${esc(product.name)}</h2><p class="subtle">${product.expiryEnabled?'Validade controlada por lote':'Validade desabilitada'}</p><h3>Apresentações e preços</h3><ul class="recipe">${product.presentations.map(presentation=>`<li><span><strong>${esc(presentation.name)}</strong><small class="block">${qty(presentation.units)} unidades · ${esc(presentation.barcode||'Sem código')}</small></span><strong>${money(presentation.priceCents)}</strong></li>`).join('')}</ul>${role==='gestao'?`<button class="secondary full" data-action="product-edit" data-id="${esc(product.id)}">Editar cadastro e apresentações</button>`:''}</article>`).join('')}</div><div class="wine-metric-note">Cada embalagem tem quantidade e preço próprios. Alterar o cadastro não muda a conversão nem o preço dos pedidos já registrados.</div>`;
}
function returnableCard(row) {
  const order=orderById(row.orderId);
  return `<article class="wine-returnable-card"><div class="row"><div><h3>${esc(row.name)}</h3><p class="subtle">Pedido #${order?.number||'—'} · ${esc(order?orderName(order):'Operação')}</p></div>${row.delivered===0?'<span class="badge planned">Previsto · aguardando saída</span>':row.pending>0?'<span class="badge received">A devolver</span>':'<span class="badge ready">Devolvido</span>'}</div><div class="wine-returnable-numbers"><div><span>Entregues / saída</span><strong>${qty(row.delivered)}</strong></div><div><span>Devolvidos</span><strong>${qty(row.returned)}</strong></div><div><span>Pendentes</span><strong>${qty(row.pending)}</strong></div></div>${role!=='entrega'?`<p class="subtle">Caução por unidade ${money(row.depositPerUnitCents)} · Mantida nesta operação ${money(row.depositReceivedCents)}</p>${row.depositRefundableCents>0?`<div class="wine-liability-note">${money(row.depositRefundableCents)} de caução disponível para devolução financeira.</div>`:''}`:''}<div class="wine-returnable-actions">${row.pending>0?`<button class="secondary" data-action="return-returnable" data-id="${esc(row.orderId)}" data-type="${esc(row.typeId)}">Registrar devolução física</button>`:''}${role==='gestao'&&row.depositRefundableCents>0?`<button class="primary" data-action="deposit-refund" data-id="${esc(row.orderId)}" data-type="${esc(row.typeId)}">Devolver caução</button>`:''}${role!=='entrega'?`<button class="text-link" data-action="open" data-id="${esc(row.orderId)}">Abrir pedido</button>`:''}</div></article>`;
}
function returnablesPage() {
  const rows=wineReturnables(state).filter(row=>row.delivered>0||row.depositReceivedCents>0).filter(row=>filter!=='pending'||row.pending>0||row.depositRefundableCents>0);
  return `<div class="section-heading"><div><p>Entregues corresponde à saída registrada da loja. A logística segue em Entregas. Devolver um casco não devolve dinheiro automaticamente.</p></div>${role==='gestao'?'<button class="secondary" data-action="returnable-type">Cadastrar retornável</button>':''}</div>${role!=='entrega'?'<div class="wine-liability-note">Cauções reembolsáveis são valores sob responsabilidade da loja, separados da receita de bebidas. A devolução financeira exige retorno elegível e caução efetivamente recebida.</div>':''}<div class="wine-filters" style="margin-bottom:22px">${[['all','Todas as operações'],['pending','Com pendências']].map(([value,label])=>`<button class="chip ${filter===value?'active':''}" data-action="filter" data-id="${value}">${label}</button>`).join('')}</div>${rows.map(returnableCard).join('')||empty('Nenhum retornável nesta visão','Inclua cascos ou engradados ao montar uma venda. Após concluir, acompanhe aqui as devoluções parciais.')}<section class="panel"><h2>Tipos de retornáveis</h2><div class="table-scroll"><table><thead><tr><th>Retornável</th>${role!=='entrega'?'<th>Caução por unidade</th>':''}</tr></thead><tbody>${state.returnableTypes.map(type=>`<tr><td>${esc(type.name)}</td>${role!=='entrega'?`<td>${money(type.depositCents)}</td>`:''}</tr>`).join('')}</tbody></table></div></section>`;
}
function cashPage() {
  const report=wineReport(state);
  const receipts=state.receipts.filter(receipt=>receipt.shiftId===state.shift.id).slice().reverse();
  const orders=state.orders.filter(order=>order.shiftId===state.shift.id&&order.stage!=='draft');
  return `<div class="section-heading"><div><h2>${esc(state.shift.id)} <span class="badge ${state.shift.status==='open'?'ready':'planned'}">${state.shift.status==='open'?'Aberto':'Fechado'}</span></h2><p>Vendas, cauções e recebimentos têm registros próprios.</p></div>${role==='gestao'?`<button class="secondary" data-action="shift">${state.shift.status==='open'?'Fechar turno':'Abrir novo turno'}</button>`:''}</div>
    <div class="wine-cash-grid"><article><span>Vendido no turno</span><strong>${money(report.soldCents)}</strong><small>Mercadorias, taxa e descontos</small></article><article><span>Recebido líquido no turno</span><strong>${money(report.receivedCents)}</strong><small>Recebimentos menos devoluções</small></article><article><span>A receber em todas as contas</span><strong>${money(report.pendingCents)}</strong><small>Posição atual, incluindo outros turnos</small></article><article><span>Recebido para vendas no turno</span><strong>${money(report.saleReceivedCents)}</strong><small>Receita separada de caução</small></article><article><span>Recebido em cauções no turno</span><strong>${money(report.depositReceivedCents)}</strong><small>Valores reembolsáveis recebidos</small></article><article><span>Cauções devolvidas no turno</span><strong>${money(report.depositRefundedCents)}</strong><small>Sem nova movimentação de produtos</small></article></div>
    <div class="wine-liability-note">Posição global de cauções mantidas pela loja: <strong>${money(report.depositHeldCents)}</strong>. Esse valor não compõe a receita de venda das bebidas. Devoluções financeiras pendentes em todas as contas: <strong>${money(report.refundDueCents)}</strong>. O saldo físico de retornáveis pode continuar pendente após fechar um turno.</div>
    <div class="split"><section class="panel"><h2>Recebido no turno por forma de pagamento</h2><div class="payment-methods">${Object.entries(methods).map(([method,label])=>`<div><span>${label}</span><strong>${money(report.byMethod?.[method])}</strong></div>`).join('')}</div><p class="small-note">Meios, estornos e liquidação bancária são simulados. Nenhuma cobrança ou transferência é realizada.</p></section><section class="panel"><h2>Contas e atendimentos em aberto</h2>${state.orders.filter(isActive).map(order=>`<button class="list-link" data-action="open" data-id="${esc(order.id)}"><span>#${order.number} · ${esc(orderName(order))}<small class="block">${stageLabels[order.stage]}${total(order).refundDueCents>0?' · A devolver '+money(total(order).refundDueCents):''}</small></span><strong>${money(order.stage==='draft'?0:total(order).balanceCents)}</strong></button>`).join('')||'<p class="subtle">Nenhuma conta ou atendimento em aberto.</p>'}</section></div>
    <section class="panel"><h2>Registros que compõem o recebido</h2><div class="table-scroll"><table><thead><tr><th>Horário</th><th>Pedido</th><th>Registro</th><th>Forma</th><th>Venda</th><th>Caução</th><th>Total</th></tr></thead><tbody>${receipts.map(receipt=>`<tr><td>${dateTime(receipt.at)}</td><td><button class="text-link" data-action="open" data-id="${esc(receipt.orderId)}">#${orderById(receipt.orderId)?.number}</button></td><td>${receipt.type==='deposit_refund'?'Devolução de caução':receipt.amountCents<0?'Estorno':'Recebimento'}</td><td>${esc(methods[receipt.method]||receipt.method)}</td><td>${money(receipt.saleCents)}</td><td>${money(receipt.depositCents)}</td><td><strong>${money(receipt.amountCents)}</strong></td></tr>`).join('')||'<tr><td colspan="7">Os registros de pagamento aparecerão aqui.</td></tr>'}</tbody></table></div></section>
    <section class="panel"><h2>Pedidos que compõem o vendido no turno</h2>${report.salesAdjustmentCents?`<p class="wine-metric-note">Ajustes de vendas de turnos anteriores: ${money(report.salesAdjustmentCents)}. Os cancelamentos correspondentes estão no histórico.</p>`:''}${orders.map(order=>`<button class="list-link" data-action="open" data-id="${esc(order.id)}"><span>#${order.number} · ${esc(orderName(order))} · ${stageLabels[order.stage]}</span><strong>${money(total(order).saleCents)}</strong></button>`).join('')||'<p class="subtle">Nenhuma venda neste turno.</p>'}</section>
    ${state.shifts.length?`<section class="panel"><h2>Fechamentos anteriores</h2><div class="table-scroll"><table><thead><tr><th>Turno</th><th>Fechamento</th><th>Vendido</th><th>Recebido líquido</th><th>Caução mantida</th></tr></thead><tbody>${state.shifts.slice().reverse().map(shift=>{const summary=shift.report||shift.totals||{};return `<tr><td>${esc(shift.id)}</td><td>${dateTime(shift.closedAt)}</td><td>${money(summary.soldCents)}</td><td>${money(summary.receivedCents)}</td><td>${money(summary.depositHeldCents)}</td></tr>`;}).join('')}</tbody></table></div></section>`:''}`;
}
function historyPage() {
  return `<section class="panel"><h2>Histórico da demonstração</h2>${state.history.slice().reverse().map(event=>{const order=orderById(event.orderId);const details=[order?`Pedido #${order.number} · ${orderName(order)}`:'',event.reason||'',event.quantity!==undefined?`Quantidade: ${qty(event.quantity)}`:'',event.amountCents!==undefined?`Valor: ${money(event.amountCents)}`:'',event.stage?`Situação: ${stageLabels[event.stage]}`:'',event.saleAdjustmentCents!==undefined?`Ajuste de venda: ${money(event.saleAdjustmentCents)}`:''].filter(Boolean);return `<article class="wine-history-event"><div><strong>${esc(historyLabels[event.type]||'Alteração registrada')}</strong><small>${dateTime(event.at)} · ${esc(roleLabels[event.actor]||event.actor)}</small></div><p>${esc(details.join('\n')||'Registro preservado na demonstração.')}</p></article>`;}).join('')||'<p class="subtle">Os registros aparecerão conforme você explora a adega.</p>'}</section>`;
}

function newOrder(mode='balcao') {
  modal(mode==='entrega'?'Novo pedido de entrega':'Nova venda',`<form data-form="new" data-command="${uid()}"><label>Atendimento<select name="mode" id="new-mode"><option value="balcao" ${mode==='balcao'?'selected':''}>Balcão</option><option value="entrega" ${mode==='entrega'?'selected':''}>Entrega</option></select></label><label>Cliente fictício <span class="subtle">(opcional no balcão)</span><input name="customer" maxlength="100" placeholder="Ex.: Cliente de demonstração"></label><label data-delivery>Endereço fictício de entrega<input name="address" maxlength="180" placeholder="Rua Fictícia, 100"></label><label data-delivery>Taxa de entrega (R$)<input name="fee" inputmode="decimal" value="0,00"></label><p class="small-note">Use somente dados fictícios. A entrega é acompanhada manualmente.</p><button class="primary full" type="submit">Abrir pedido</button></form>`);
  syncNewMode();
}
function syncNewMode(){const delivery=$('#new-mode')?.value==='entrega';$('#dialog').querySelectorAll('[data-delivery]').forEach(label=>label.hidden=!delivery);}
function productModal(productId, presentationId=null) {
  const product=state.products.find(product=>product.id===productId);if(!product)return;
  modal(product.name,`<form data-form="item" data-product="${esc(productId)}" data-command="${uid()}"><div class="wine-presentations">${product.presentations.map((presentation,index)=>`<label class="wine-presentation-option"><input type="radio" name="presentation" value="${esc(presentation.id)}" ${(presentationId?presentationId===presentation.id:index===0)?'checked':''}><span>${esc(presentation.name)}<small>${qty(presentation.units)} unidades por apresentação</small></span><strong>${money(presentation.priceCents)}</strong></label>`).join('')}</div><label>Quantidade de apresentações<input name="quantity" id="item-quantity" type="number" min="1" max="100" step="1" value="1" required></label><p class="wine-presentation-note" id="presentation-note"></p><p class="small-note">Disponível: ${qty(wineStock(state,product.id).available)} unidades. A reserva será validada ao confirmar o pedido.</p><button class="primary full" type="submit">Adicionar ao pedido</button></form>`);
  updatePresentationNote();
}
function updatePresentationNote() {
  const form=$('[data-form="item"]');if(!form)return;
  const product=state.products.find(product=>product.id===form.dataset.product);
  const presentation=product.presentations.find(presentation=>presentation.id===new FormData(form).get('presentation'));
  const quantity=Number(form.querySelector('[name="quantity"]').value||0);
  $('#presentation-note').textContent=`${quantity} × ${presentation.units} = ${qty(quantity*presentation.units)} unidades • ${money(quantity*presentation.priceCents)}`;
}
function receiveModal(orderId) {
  const t=total(orderId);
  const cancelled=orderById(orderId).stage==='cancelled';
  modal(cancelled?'Receber caução pendente':'Receber pagamento',`<form data-form="receive" data-id="${esc(orderId)}" data-command="${uid()}"><div class="modal-balance"><span>Saldo da conta</span><strong>${money(t.balanceCents)}</strong></div><label>Valor a receber (R$)<input name="amount" value="${(t.balanceCents/100).toFixed(2).replace('.',',')}" inputmode="decimal" required></label><label>Forma de pagamento<select name="method" required>${methodOptions()}</select></label><p class="wine-metric-note">${cancelled?'A venda cancelada não receberá nova receita. Este registro cobre somente a caução exigível dos retornáveis que saíram da loja.':'O recebimento cobre primeiro a venda e depois a caução. Os valores ficam separados nos registros e no caixa.'}</p><p class="small-note">Recebimento simulado. Não há cobrança externa.</p><button class="primary full" type="submit">Registrar recebimento</button></form>`);
}
function reasonModal(title,type,payload,amountLabel=null) {
  modal(title,`<form data-form="reason" data-type="${type}" data-payload="${esc(JSON.stringify(payload))}" data-command="${uid()}">${type==='CANCEL_ORDER'?'<p>Antes de concluir, a reserva será liberada. Após a conclusão, cancelar não repõe produtos automaticamente. Os recebimentos permanecem no histórico.</p>':''}${amountLabel?`<label>${amountLabel}<input name="amount" inputmode="decimal" required></label>`:''}<label>Motivo obrigatório<textarea name="reason" rows="3" required minlength="3" maxlength="240"></textarea></label><button class="${type==='CANCEL_ORDER'?'danger':'primary'} full" type="submit">Confirmar registro</button></form>`);
}
function addReturnableModal(orderId) {
  modal('Incluir retornáveis na venda',`<form data-form="add-returnable" data-id="${esc(orderId)}" data-command="${uid()}"><label>Retornável<select name="typeId">${state.returnableTypes.map(type=>`<option value="${esc(type.id)}">${esc(type.name)} · Caução ${money(type.depositCents)}</option>`).join('')}</select></label><label>Quantidade<input name="quantity" type="number" min="1" max="1000" step="1" value="1" required></label><label class="check-row"><input name="chargeDeposit" type="checkbox" checked>Cobrar caução reembolsável</label><p class="small-note">A entrega física será registrada ao concluir a venda. Você poderá registrar devolução parcial e devolver a caução separadamente.</p><button class="primary full" type="submit">Incluir retornáveis</button></form>`);
}
function returnPhysicalModal(orderId,typeId) {
  const row=wineReturnables(state,orderId).find(row=>row.typeId===typeId);
  modal('Registrar devolução física',`<form data-form="physical-return" data-id="${esc(orderId)}" data-type="${esc(typeId)}" data-command="${uid()}"><p>${esc(row.name)} · ${qty(row.pending)} pendente(s)</p><label>Quantidade devolvida<input name="quantity" type="number" min="1" max="${row.pending}" value="1" step="1" required></label><p class="small-note">Este registro não devolve dinheiro automaticamente e não altera o estoque de bebidas.</p><button class="primary full" type="submit">Confirmar devolução física</button></form>`);
}
function depositRefundModal(orderId,typeId) {
  const row=wineReturnables(state,orderId).find(row=>row.typeId===typeId);
  modal('Devolver caução recebida',`<form data-form="deposit-refund" data-id="${esc(orderId)}" data-type="${esc(typeId)}" data-command="${uid()}"><div class="modal-balance"><span>Disponível para devolver</span><strong>${money(row.depositRefundableCents)}</strong></div><label>Valor da devolução (R$)<input name="amount" value="${(row.depositRefundableCents/100).toFixed(2).replace('.',',')}" inputmode="decimal" required></label><label>Motivo<textarea name="reason" rows="2" required minlength="3" maxlength="240">Devolução de caução liberada</textarea></label><p class="small-note">A devolução segue as formas dos recebimentos de origem e fica separada da receita de venda. Operação simulada.</p><button class="primary full" type="submit">Registrar devolução da caução</button></form>`);
}
function stockEntryModal(productId=null) {
  modal('Entrada de mercadorias',`<form data-form="stock-entry" data-command="${uid()}"><label>Produto<select name="productId">${state.products.map(product=>`<option value="${esc(product.id)}" ${product.id===productId?'selected':''}>${esc(product.name)}${product.expiryEnabled?' • validade obrigatória':''}</option>`).join('')}</select></label><div class="form-grid"><label>Quantidade em unidades<input name="quantity" type="number" min="1" max="100000" step="1" required></label><label>Custo por unidade (R$)<input name="cost" inputmode="decimal" required placeholder="Ex.: 6,00"></label><label>Código do lote<input name="code" maxlength="60" placeholder="Ex.: LOTE-DEMO-02" required></label><label>Validade do lote<input name="expiryDate" type="date"></label></div><label>Motivo / origem<textarea name="reason" rows="2" required minlength="3" maxlength="240">Entrada de mercadoria demonstrativa</textarea></label><p class="small-note">Informe unidades base. Para um fardo de 12 com quantidade 2, a entrada é de 24 unidades.</p><button class="primary full" type="submit">Registrar entrada</button></form>`);
}
function batchModal(id,kind) {
  const batch=state.batches.find(batch=>batch.id===id),product=state.products.find(product=>product.id===batch.productId);
  const titles={count:'Contagem de estoque',adjust:'Ajustar estoque',loss:'Registrar perda'};
  const labels={count:'Quantidade física contada (substitui o saldo)',adjust:'Quantidade a somar ou subtrair',loss:'Quantidade perdida (positiva)'};
  modal(titles[kind],`<form data-form="batch" data-id="${esc(id)}" data-kind="${kind}" data-command="${uid()}"><p>${esc(product.name)} · Lote ${esc(batch.code||id)}</p><div class="wine-count-note">Físico ${qty(batch.quantity)} un. · Reservado ${qty(batch.reserved)} un.</div><label>${labels[kind]}<input name="quantity" type="number" ${kind==='count'?'min="0"':kind==='loss'?'min="1"':''} step="1" ${kind==='count'?`value="${batch.quantity}"`:''} required></label><label>Motivo obrigatório<textarea name="reason" rows="2" required minlength="3" maxlength="240"></textarea></label><p class="small-note">Uma contagem ou saída não pode comprometer unidades reservadas.</p><button class="primary full" type="submit">Registrar ${kind==='count'?'contagem':kind==='loss'?'perda':'ajuste'}</button></form>`);
}
function productEditor(id=null) {
  const product=state.products.find(product=>product.id===id);
  const rows=[...(product?.presentations||[{id:uid(),name:'Unidade',units:1,priceCents:0,barcode:''}]),{id:uid(),name:'',units:'',priceCents:null,barcode:''}];
  modal(product?'Editar produto e apresentações':'Novo produto',`<form data-form="product" data-id="${esc(id||uid())}" data-command="${uid()}"><div class="form-grid"><label>Nome do produto<input name="name" value="${esc(product?.name)}" required maxlength="100"></label><label>Categoria<input name="category" value="${esc(product?.category||'Bebidas')}" required maxlength="50"></label><label>Estoque mínimo em unidades<input name="min" type="number" min="0" max="100000" step="1" value="${product?.min||0}" required></label></div><label class="check-row"><input type="checkbox" name="expiryEnabled" ${product?.expiryEnabled?'checked':''}>Controlar validade por lote</label><div class="wine-form-section"><h3>Apresentações configuráveis</h3><p class="small-note" style="margin-bottom:18px">Cada apresentação possui quantidade, preço e código próprios. A última linha vazia permite acrescentar uma apresentação; salve e edite novamente para acrescentar outras.</p>${rows.map((presentation,index)=>`<section class="presentation-editor" data-presentation="${esc(presentation.id)}"><h3>${presentation.name?'Apresentação '+(index+1):'Nova apresentação (opcional)'}</h3><div class="form-grid"><label>Nome da apresentação<input name="presentation-name-${index}" value="${esc(presentation.name)}" maxlength="50" placeholder="Unidade, fardo, caixa…"></label><label>Unidades nesta apresentação<input name="presentation-units-${index}" value="${presentation.units}" type="number" min="1" max="100000" step="1"></label><label>Preço da apresentação (R$)<input name="presentation-price-${index}" value="${presentation.priceCents===null?'':(presentation.priceCents/100).toFixed(2)}" inputmode="decimal"></label><label>Código de barras<input name="presentation-barcode-${index}" value="${esc(presentation.barcode)}" maxlength="30"></label></div></section>`).join('')}</div><p class="small-note" style="margin-bottom:20px">Para remover uma apresentação do cadastro, apague seu nome. Os pedidos antigos preservam o histórico.</p><button class="primary full" type="submit">Salvar produto e apresentações</button></form>`,true);
}
function returnableTypeModal() {
  modal('Cadastrar tipo de retornável',`<form data-form="returnable-type" data-command="${uid()}"><label>Nome<input name="name" required maxlength="80" placeholder="Ex.: Casco 600 ml"></label><label>Caução por unidade (R$)<input name="deposit" value="0,00" inputmode="decimal" required></label><button class="primary full" type="submit">Salvar retornável</button></form>`);
}
function guide() {
  modal('Teste uma rotina completa de adega',`<ol class="guide"><li><strong>Comece com 24 unidades.</strong> O produto Cerveja da demonstração tem fardo configurado com 12.</li><li><strong>Monte a venda de um fardo e duas avulsas.</strong> Incluímos também dois cascos com caução separada.</li><li><strong>Confirme e conclua.</strong> A reserva vira baixa única: 24 − 12 − 2 = 10 unidades.</li><li><strong>Registre pagamento.</strong> Escolha explicitamente o meio. A caução fica separada da receita.</li><li><strong>Devolva um dos dois cascos.</strong> O saldo permanece em um casco. Devolver a caução é uma ação financeira própria.</li></ol><button class="primary full" data-action="guide-create">Criar venda do roteiro</button><p class="small-note">O roteiro exige o estoque inicial de 24 unidades. Se você já alterou esse produto, reinicie somente a adega para repetir o cenário. Nenhum pedido anterior será alterado automaticamente.</p>`);
}

document.addEventListener('click',async event=>{
  if(event.target.closest('.skip')){event.preventDefault();const main=$('#main');main.tabIndex=-1;main.focus();return;}
  const button=event.target.closest('[data-action]');if(!button||button.disabled||busy)return;
  const {action,id}=button.dataset;
  if(action==='close'){closeModal();return;}
  if(action==='navigate'){navigate(button.dataset.view);return;}
  if(action==='filter'){filter=id;render();return;}
  if(action==='open'){navigate('order',id);return;}
  if(action==='new'||action==='new-delivery'){newOrder(action==='new-delivery'?'entrega':'balcao');return;}
  if(action==='product'){productModal(id);return;}
  if(action==='remove-returnable'){if(await send('REMOVE_RETURNABLE',{orderId:selectedOrder,typeId:id}))toast('Retornável removido do rascunho.');return;}
  if(action==='remove-item'){if(await send('REMOVE_ITEM',{orderId:selectedOrder,itemId:id}))toast('Item removido do rascunho.');return;}
  if(action==='confirm'){if(await send('CONFIRM_ORDER',{orderId:id}))toast('Pedido confirmado. Unidades reservadas.');return;}
  if(action==='complete'){if(await send('COMPLETE_ORDER',{orderId:id}))toast('Venda concluída. Estoque baixado uma única vez.');return;}
  if(action==='delivery-stage'){if(await send('SET_DELIVERY_STAGE',{orderId:id,stage:button.dataset.stage}))toast('Acompanhamento da entrega atualizado.');return;}
  if(action==='receive'){receiveModal(id);return;}
  if(action==='cancel'){reasonModal('Cancelar pedido','CANCEL_ORDER',{orderId:id});return;}
  if(action==='discount'){reasonModal('Desconto autorizado','DISCOUNT',{orderId:id},'Desconto sobre a venda (R$)');return;}
  if(action==='refund'){reasonModal('Estornar recebimento','REFUND_RECEIPT',{receiptId:id},'Valor a estornar (R$)');return;}
  if(action==='add-returnable'){addReturnableModal(id);return;}
  if(action==='return-returnable'){returnPhysicalModal(id,button.dataset.type);return;}
  if(action==='deposit-refund'){depositRefundModal(id,button.dataset.type);return;}
  if(action==='stock-entry'){stockEntryModal(id);return;}
  if(action.startsWith('batch-')){batchModal(id,action.slice(6));return;}
  if(action==='product-edit'||action==='product-new'){productEditor(id);return;}
  if(action==='returnable-type'){returnableTypeModal();return;}
  if(action==='shift'){if(await send(state.shift.status==='open'?'CLOSE_SHIFT':'OPEN_SHIFT'))toast('Turno atualizado.');return;}
  if(action==='guide'){guide();return;}
  if(action==='guide-create'){
    const product=state.products.find(product=>product.id==='cerveja');
    const pack=product?.presentations.find(presentation=>presentation.units===12),unit=product?.presentations.find(presentation=>presentation.units===1);
    const stock=product?wineStock(state,product.id):null;
    if(!pack||!unit||stock.physical!==24||stock.available!==24){toast('O roteiro exige 24 unidades disponíveis e apresentações de 12 e 1. Reinicie a adega para repetir.',true);return;}
    closeModal();const orderId=uid();
    let ok=await send('CREATE_ORDER',{orderId,mode:'balcao',customer:'Cliente fictício do roteiro',deliveryFeeCents:0});
    if(!ok)return;selectedOrder=orderId;view='order';search='';
    ok=await send('ADD_ITEM',{orderId,productId:product.id,presentationId:pack.id,quantity:1});
    if(ok)ok=await send('ADD_ITEM',{orderId,productId:product.id,presentationId:unit.id,quantity:2});
    if(ok)ok=await send('ADD_RETURNABLE',{orderId,typeId:state.returnableTypes[0].id,quantity:2,chargeDeposit:true});
    render();window.scrollTo(0,0);if(ok)toast('Roteiro montado. Confirme o pedido e conclua para ver o saldo de 10 unidades.');return;
  }
  if(action==='reset'){
    modal('Reiniciar somente a adega?',`<p>Vendas, estoque, recebimentos, retornáveis e histórico fictícios desta adega voltarão ao início. O restaurante e seus dados não serão alterados.</p><div class="dialog-actions"><button class="secondary" data-action="close">Continuar explorando</button><button class="danger" data-action="reset-confirm">Reiniciar adega</button></div>`);return;
  }
  if(action==='reset-confirm'){
    try{store||=createWineStore();state=await store.reset();loadError=null;selectedOrder=null;view='home';search='';filter='all';role='gestao';closeModal();render();window.scrollTo(0,0);toast('Adega reiniciada. O restaurante foi preservado.');}
    catch(error){toast('Não foi possível salvar o reinício. Verifique o armazenamento do navegador.',true);}return;
  }
});
document.addEventListener('submit',async event=>{
  const form=event.target.closest('[data-form]');if(!form)return;event.preventDefault();if(busy)return;
  const data=new FormData(form),get=name=>data.get(name),commandId=form.dataset.command;
  let ok=false;
  try{
    if(form.dataset.form==='new'){
      const orderId=uid();ok=await send('CREATE_ORDER',{orderId,mode:get('mode'),customer:get('customer'),address:get('mode')==='entrega'?get('address'):'',deliveryFeeCents:get('mode')==='entrega'?cents(get('fee')):0},commandId);
      if(ok){selectedOrder=orderId;view='order';search='';}
    }
    if(form.dataset.form==='item')ok=await send('ADD_ITEM',{orderId:selectedOrder,productId:form.dataset.product,presentationId:get('presentation'),quantity:Number(get('quantity'))},commandId);
    if(form.dataset.form==='receive')ok=await send('RECEIVE',{orderId:form.dataset.id,amountCents:cents(get('amount')),method:get('method')},commandId);
    if(form.dataset.form==='reason'){
      const payload={...JSON.parse(form.dataset.payload),reason:get('reason')};if(get('amount')!==null)payload.amountCents=cents(get('amount'));
      ok=await send(form.dataset.type,payload,commandId);
    }
    if(form.dataset.form==='add-returnable')ok=await send('ADD_RETURNABLE',{orderId:form.dataset.id,typeId:get('typeId'),quantity:Number(get('quantity')),chargeDeposit:get('chargeDeposit')==='on'},commandId);
    if(form.dataset.form==='physical-return')ok=await send('RETURN_RETURNABLE',{orderId:form.dataset.id,typeId:form.dataset.type,quantity:Number(get('quantity'))},commandId);
    if(form.dataset.form==='deposit-refund')ok=await send('REFUND_DEPOSIT',{orderId:form.dataset.id,typeId:form.dataset.type,amountCents:cents(get('amount')),reason:get('reason')},commandId);
    if(form.dataset.form==='stock-entry')ok=await send('RECEIVE_STOCK',{productId:get('productId'),quantity:Number(get('quantity')),costCents:cents(get('cost')),expiryDate:get('expiryDate')||null,code:get('code'),reason:get('reason')},commandId);
    if(form.dataset.form==='batch')ok=await send(({count:'COUNT_STOCK',adjust:'ADJUST_STOCK',loss:'LOSS_STOCK'})[form.dataset.kind],{batchId:form.dataset.id,quantity:Number(get('quantity')),reason:get('reason')},commandId);
    if(form.dataset.form==='product'){
      const presentations=[...form.querySelectorAll('[data-presentation]')].map((row,index)=>({id:row.dataset.presentation,name:get(`presentation-name-${index}`)?.trim(),units:Number(get(`presentation-units-${index}`)),priceValue:get(`presentation-price-${index}`),barcode:get(`presentation-barcode-${index}`)?.trim()||''})).filter(presentation=>presentation.name).map(({priceValue,...presentation})=>({...presentation,priceCents:cents(priceValue)}));
      ok=await send('UPSERT_PRODUCT',{product:{id:form.dataset.id,name:get('name'),category:get('category'),min:Number(get('min')),expiryEnabled:get('expiryEnabled')==='on',presentations}},commandId);
    }
    if(form.dataset.form==='returnable-type')ok=await send('UPSERT_RETURNABLE_TYPE',{returnableType:{id:uid(),name:get('name'),depositCents:cents(get('deposit'))}},commandId);
    if(ok){closeModal();render();if(form.dataset.form==='new')window.scrollTo(0,0);toast('Registro salvo na demonstração da adega.');}
  }catch(error){toast(error.message,true);}
});
document.addEventListener('change',event=>{
  if(event.target.id==='role'){role=event.target.value;view=role==='entrega'?'delivery':view;render();}
  if(event.target.id==='new-mode')syncNewMode();
  if(event.target.name==='presentation'||event.target.id==='item-quantity')updatePresentationNote();
});
document.addEventListener('input',event=>{
  if(event.target.id==='search'){
    const cursor=event.target.selectionStart;search=event.target.value;render();const input=$('#search');input?.focus();input?.setSelectionRange(cursor,cursor);
  }
  if(event.target.id==='item-quantity')updatePresentationNote();
});
document.addEventListener('keydown',event=>{
  if(event.key==='F2'&&role!=='entrega'&&!$('#dialog').open){event.preventDefault();newOrder();}
  if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#dialog').open){const input=$('#search');if(input){event.preventDefault();input.focus();}}
  if(event.key==='Enter'&&event.target.id==='search'&&view==='order'&&current()?.stage==='draft'){
    const barcode=event.target.value.trim();
    for(const product of state.products){const presentation=product.presentations.find(presentation=>presentation.barcode&&presentation.barcode===barcode);if(presentation){event.preventDefault();productModal(product.id,presentation.id);return;}}
  }
});
window.addEventListener('storage',event=>{
  if(event.key===WINE_STORAGE_KEY){try{state=store.read();render();toast('Adega atualizada por outra aba.');}catch(error){loadError=error.message;render();}}
});
$('#dialog').addEventListener('click',event=>{
  if(event.target!==$('#dialog'))return;const bounds=event.target.getBoundingClientRect();
  if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)closeModal();
});
render();
if(state)openRequestedGuide(guide);
