/** Adega SKYE: unidades-base inteiras, estoque por lote e caução fora da receita. */
export class WineDomainError extends Error {
  constructor(message, code='INVALID_OPERATION') { super(message); this.name='WineDomainError'; this.code=code; }
}
const fail=(message,code)=>{throw new WineDomainError(message,code);};
const now=()=>new Date().toISOString();
const methods=['pix','dinheiro','debito','credito'];
const roles=['gestao','caixa','entrega'];
const integer=(value,label,min=0,max=1e9)=>{if(!Number.isSafeInteger(value)||value<min||value>max)fail(`${label}: informe um número inteiro entre ${min} e ${max}.`);return value;};
const text=(value,max=240)=>String(value??'').trim().slice(0,max);
const required=(value,label)=>{const result=text(value);if(!result)fail(`Informe ${label}.`);return result;};
const manager=c=>{if(c.actor!=='gestao')fail('Esta ação exige o perfil de gestão.','FORBIDDEN');};
const sales=c=>{if(!['gestao','caixa'].includes(c.actor))fail('Esta ação exige caixa ou gestão.','FORBIDDEN');};
const open=s=>{if(s.shift.status!=='open')fail('Abra um novo turno antes desta operação.');};
const sig=value=>Array.isArray(value)?`[${value.map(sig).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${sig(value[k])}`).join(',')}}`:JSON.stringify(value);
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const datePlus=(date,days)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function validDate(value,label='a data') {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail(`Informe ${label} no formato ano-mês-dia.`);
  const d=new Date(value+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)fail(`Informe ${label} válida.`);return value;
}
const orderFor=(s,id)=>{const o=s.orders.find(o=>o.id===id);if(!o)fail('Pedido não encontrado.');return o;};
const productFor=(s,id)=>{const p=s.products.find(p=>p.id===id);if(!p)fail('Produto não encontrado.');return p;};
const isExpired=(s,b)=>Boolean(productFor(s,b.productId).expiryEnabled&&b.expiryDate&&b.expiryDate<s.businessDate);
const exact=(value,label)=>{if(!Number.isSafeInteger(value))fail(`${label} fora do limite de precisão. Reduza a quantidade ou divida a operação.`,'PRECISION_LIMIT');return value;};
function validateComputedPrecision(s) {
  for(const p of s.products)for(const [label,value] of Object.entries(wineStock(s,p.id)))exact(value,`Estoque ${label}`);
  for(const o of s.orders) {
    for(const i of o.items){exact(i.baseQuantity,'Unidades-base');exact(i.totalCents,'Total do item');exact(i.costCents,'Custo do item');}
    for(const [label,value] of Object.entries(wineOrderTotals(s,o)))exact(value,`Total ${label}`);
  }
  for(const r of wineReturnables(s))for(const [label,value] of Object.entries(r))if(typeof value==='number')exact(value,`Retornáveis ${label}`);
  const report=wineReport(s);for(const [label,value] of Object.entries(report)){if(typeof value==='number')exact(value,`Relatório ${label}`);else if(label==='byMethod')for(const cents of Object.values(value))exact(cents,'Total por forma de pagamento');}
}
function audit(s,c,details={}) {s.history.push({id:`history-${c.id}`,commandId:c.id,type:c.type,actor:c.actor,orderId:c.orderId||null,at:now(),...structuredClone(details)});}
function movement(s,c,b,kind,quantity,extra={}) {s.movements.push({id:`move-${c.id}-${s.movements.length+1}`,commandId:c.id,batchId:b.id,productId:b.productId,orderId:c.orderId||null,kind,quantity,at:now(),actor:c.actor,...extra});}

export function createWineDemoState() {
  const businessDate=localDate();
  return {
    schemaVersion:1,revision:0,businessDate,
    products:[
      {id:'cerveja',name:'Cerveja Jardim 600 ml',category:'Cervejas',min:12,expiryEnabled:true,presentations:[{id:'unidade',name:'Unidade',units:1,priceCents:1000,barcode:'DEMO1001'},{id:'fardo',name:'Fardo',units:12,priceCents:10800,barcode:'DEMO1012'},{id:'caixa',name:'Caixa',units:24,priceCents:21000,barcode:'DEMO1024'}]},
      {id:'agua',name:'Água da Serra 500 ml',category:'Águas',min:12,expiryEnabled:true,presentations:[{id:'unidade',name:'Unidade',units:1,priceCents:300,barcode:'DEMO2001'},{id:'fardo',name:'Fardo',units:6,priceCents:1600,barcode:'DEMO2006'}]},
      {id:'vinho',name:'Vinho Brisa Tinto 750 ml',category:'Vinhos',min:4,expiryEnabled:false,presentations:[{id:'unidade',name:'Unidade',units:1,priceCents:4500,barcode:'DEMO3001'},{id:'caixa',name:'Caixa',units:4,priceCents:16800,barcode:'DEMO3004'}]}
    ],
    batches:[
      {id:'lote-cerveja',productId:'cerveja',quantity:24,reserved:0,expiryDate:datePlus(businessDate,90),costCents:600,code:'CJ-DEMO-01'},
      {id:'lote-agua',productId:'agua',quantity:36,reserved:0,expiryDate:datePlus(businessDate,180),costCents:150,code:'AG-DEMO-01'},
      {id:'lote-vinho',productId:'vinho',quantity:8,reserved:0,expiryDate:null,costCents:2500,code:'VI-DEMO-01'}
    ],
    returnableTypes:[{id:'casco',name:'Casco de garrafa',depositCents:500},{id:'engradado',name:'Engradado',depositCents:2500}],
    orders:[],receipts:[],movements:[],history:[],processedCommands:{},
    shift:{id:'turno-1',status:'open',openedAt:now(),closedAt:null},shifts:[]
  };
}
export function wineStock(s,productId) {
  const p=productFor(s,productId),batches=s.batches.filter(b=>b.productId===p.id);
  const physical=batches.reduce((n,b)=>n+b.quantity,0),reserved=batches.reduce((n,b)=>n+b.reserved,0);
  const expired=batches.filter(b=>isExpired(s,b)).reduce((n,b)=>n+b.quantity,0);
  const available=batches.filter(b=>!isExpired(s,b)).reduce((n,b)=>n+b.quantity-b.reserved,0);
  return {physical,reserved,available,expired,min:p.min};
}
const depositNet=(s,o,typeId)=>s.receipts.filter(r=>r.orderId===o.id).reduce((n,r)=>n+(r.depositAllocations||[]).filter(a=>a.typeId===typeId).reduce((sum,a)=>sum+a.amountCents,0),0);
const depositRequired=(o,r)=>r.chargeDeposit&&!(o.stage==='cancelled'&&!r.delivered)?Math.max(0,r.quantity-r.returned)*r.depositPerUnitCents:0;
export function wineReturnables(s,orderId) {
  return s.orders.filter(o=>!orderId||o.id===orderId).flatMap(o=>o.returnables.map(r=>{
    const depositReceivedCents=depositNet(s,o,r.typeId),depositRequiredCents=depositRequired(o,r);
    return {orderId:o.id,orderNumber:o.number,customer:o.customer,typeId:r.typeId,name:r.name,planned:r.quantity,delivered:r.delivered,returned:r.returned,pending:r.delivered-r.returned,chargeDeposit:r.chargeDeposit,depositPerUnitCents:r.depositPerUnitCents,depositChargedCents:r.chargeDeposit?r.quantity*r.depositPerUnitCents:0,depositRequiredCents,depositReceivedCents,depositRefundableCents:Math.max(0,depositReceivedCents-depositRequiredCents)};
  }));
}
export function wineOrderTotals(s,order) {
  const o=typeof order==='string'?orderFor(s,order):order;if(!o)fail('Pedido não encontrado.');
  const subtotalCents=o.items.reduce((n,i)=>n+i.unitPriceCents*i.quantity,0),deliveryFeeCents=o.deliveryFeeCents||0,discountCents=o.discountCents||0;
  const contractedSaleCents=subtotalCents+deliveryFeeCents-discountCents;
  const saleCents=o.stage==='cancelled'?0:contractedSaleCents;
  const returnables=wineReturnables(s,o.id);
  const depositChargedCents=returnables.reduce((n,r)=>n+r.depositChargedCents,0);
  const depositCents=returnables.reduce((n,r)=>n+r.depositRequiredCents,0);
  const receipts=s.receipts.filter(r=>r.orderId===o.id);
  const saleReceivedCents=receipts.reduce((n,r)=>n+r.saleCents,0),depositReceivedCents=receipts.reduce((n,r)=>n+r.depositCents,0);
  const depositBalanceCents=returnables.reduce((n,r)=>n+Math.max(0,r.depositRequiredCents-r.depositReceivedCents),0);
  const saleBalanceCents=Math.max(0,saleCents-saleReceivedCents);
  const depositRefundDueCents=returnables.reduce((n,r)=>n+r.depositRefundableCents,0),saleRefundDueCents=Math.max(0,saleReceivedCents-saleCents);
  return {subtotalCents,deliveryFeeCents,discountCents,contractedSaleCents,saleCents,depositCents,depositChargedCents,totalCents:saleCents+depositCents,receivedCents:saleReceivedCents+depositReceivedCents,saleReceivedCents,depositReceivedCents,balanceCents:saleBalanceCents+depositBalanceCents,saleBalanceCents,depositBalanceCents,refundDueCents:saleRefundDueCents+depositRefundDueCents,saleRefundDueCents,depositRefundDueCents,costCents:o.items.reduce((n,i)=>n+(i.costCents||0),0)};
}
export function wineReport(s) {
  if(s.shift.status==='closed'&&s.shift.totals)return structuredClone(s.shift.totals);
  const orders=s.orders.filter(o=>o.shiftId===s.shift.id);
  const receipts=s.receipts.filter(r=>r.shiftId===s.shift.id);
  const eligible=s.orders.filter(o=>o.stage!=='draft');
  const salesAdjustmentCents=s.orders.filter(o=>o.shiftId!==s.shift.id&&o.cancelledShiftId===s.shift.id).reduce((n,o)=>n-(o.cancelledSaleCents||0),0);
  const soldCents=orders.filter(o=>!['draft','cancelled'].includes(o.stage)).reduce((n,o)=>n+wineOrderTotals(s,o).saleCents,0)+salesAdjustmentCents;
  const deposited=s.receipts.reduce((n,r)=>n+r.depositCents,0);
  const active=o=>o.stage!=='cancelled'&&!(o.mode==='balcao'&&o.stage==='completed')&&!(o.mode==='entrega'&&o.stage==='delivered');
  return {orderCount:orders.length,openCount:s.orders.filter(o=>active(o)||wineOrderTotals(s,o).balanceCents>0).length,soldCents,salesAdjustmentCents,
    receivedCents:receipts.reduce((n,r)=>n+r.amountCents,0),saleReceivedCents:receipts.reduce((n,r)=>n+r.saleCents,0),depositReceivedCents:receipts.filter(r=>r.depositCents>0).reduce((n,r)=>n+r.depositCents,0),depositRefundedCents:-receipts.filter(r=>r.depositCents<0).reduce((n,r)=>n+r.depositCents,0),depositHeldCents:deposited,
    pendingCents:eligible.reduce((n,o)=>n+wineOrderTotals(s,o).balanceCents,0),refundDueCents:eligible.reduce((n,o)=>n+wineOrderTotals(s,o).refundDueCents,0),pendingReturnables:wineReturnables(s).reduce((n,r)=>n+r.pending,0),
    byMethod:Object.fromEntries(methods.map(method=>[method,receipts.filter(r=>r.method===method).reduce((n,r)=>n+r.amountCents,0)])),
    grossReceivedCents:receipts.filter(r=>r.amountCents>0).reduce((n,r)=>n+r.amountCents,0),refundedCents:-receipts.filter(r=>r.amountCents<0).reduce((n,r)=>n+r.amountCents,0)
  };
}
function reserveOrder(s,c,o) {
  o.stockAllocations=[];
  for(const item of o.items) {
    let remaining=item.baseQuantity;item.costCents=0;
    const batches=s.batches.filter(b=>b.productId===item.productId&&!isExpired(s,b)).sort((a,b)=>(a.expiryDate||'9999-12-31').localeCompare(b.expiryDate||'9999-12-31')||a.id.localeCompare(b.id));
    for(const b of batches) {
      const quantity=Math.min(remaining,b.quantity-b.reserved);if(!quantity)continue;
      b.reserved+=quantity;remaining-=quantity;item.costCents=exact(item.costCents+exact(quantity*b.costCents,'Custo do lote'),'Custo do item');
      o.stockAllocations.push({batchId:b.id,productId:b.productId,itemId:item.id,quantity,costCents:b.costCents});
      movement(s,c,b,'reserve',quantity);
      if(!remaining)break;
    }
    if(remaining)fail(`Estoque disponível insuficiente: ${item.name}.`,'INSUFFICIENT_STOCK');
  }
  o.stockReserved=true;
}
function releaseOrder(s,c,o) {
  for(const a of o.stockAllocations||[]) {const b=s.batches.find(b=>b.id===a.batchId);if(!b||b.reserved<a.quantity)fail('Reserva de estoque inconsistente.');b.reserved-=a.quantity;movement(s,c,b,'release',a.quantity);}
  o.stockReserved=false;
}
function remainingReceipt(s,receipt) {
  const reversals=s.receipts.flatMap(r=>r.reversals||[]).filter(r=>r.receiptId===receipt.id);
  return {saleCents:receipt.saleCents-reversals.reduce((n,r)=>n+r.saleCents,0),depositAllocations:(receipt.depositAllocations||[]).map(a=>({typeId:a.typeId,amountCents:a.amountCents-reversals.reduce((n,r)=>n+(r.depositAllocations||[]).filter(x=>x.typeId===a.typeId).reduce((sum,x)=>sum+x.amountCents,0),0)}))};
}
function appendRefund(s,c,o,type,reversals,method) {
  const sale=reversals.reduce((n,r)=>n+r.saleCents,0);
  const depositMap=new Map();for(const r of reversals)for(const a of r.depositAllocations)depositMap.set(a.typeId,(depositMap.get(a.typeId)||0)+a.amountCents);
  const depositAllocations=[...depositMap].map(([typeId,amountCents])=>({typeId,amountCents:-amountCents}));
  const deposit=depositAllocations.reduce((n,a)=>n-a.amountCents,0);
  s.receipts.push({id:`${type}-${c.id}-${s.receipts.length+1}`,commandId:c.id,orderId:o.id,shiftId:s.shift.id,type,amountCents:-sale-deposit,saleCents:-sale,depositCents:-deposit,depositAllocations,reversals,originalReceiptId:reversals.length===1?reversals[0].receiptId:null,method,reason:text(c.reason),actor:c.actor,at:now(),simulated:true});
}
function receive(s,c,o) {
  sales(c);open(s);if(o.stage==='draft')fail('Confirme o pedido antes de receber.');
  if(o.stage==='cancelled'&&!o.stockConsumed)fail('Pedido cancelado antes da saída não pode receber.');
  if(!methods.includes(c.method))fail('Escolha explicitamente a forma de pagamento.');integer(c.amountCents,'Valor',1);
  const t=wineOrderTotals(s,o);if(c.amountCents>t.balanceCents)fail('O valor excede o saldo restante.');
  const saleCents=Math.min(c.amountCents,t.saleBalanceCents);let rest=c.amountCents-saleCents;const depositAllocations=[];
  for(const r of wineReturnables(s,o.id)) {const amountCents=Math.min(rest,Math.max(0,r.depositRequiredCents-r.depositReceivedCents));if(amountCents)depositAllocations.push({typeId:r.typeId,amountCents});rest-=amountCents;if(!rest)break;}
  if(rest)fail('Não foi possível alocar o recebimento.');
  s.receipts.push({id:`receipt-${c.id}`,commandId:c.id,orderId:o.id,shiftId:s.shift.id,type:'receipt',amountCents:c.amountCents,saleCents,depositCents:c.amountCents-saleCents,depositAllocations,reversals:[],method:c.method,actor:c.actor,at:now(),simulated:true});
  audit(s,c,{amountCents:c.amountCents,saleCents,depositCents:c.amountCents-saleCents,method:c.method});
}

export function dispatchWine(state,c) {
  if(!c||typeof c!=='object'||typeof c.id!=='string'||!c.id.trim()||c.id.length>150)fail('Comando exige uma chave de idempotência válida.');
  if(!roles.includes(c.actor))fail('Perfil inválido.','FORBIDDEN');
  const signature=sig(c);
  if(Object.hasOwn(state.processedCommands,c.id)) {if(state.processedCommands[c.id]!==signature)fail('Chave de idempotência já utilizada por outra operação.','IDEMPOTENCY_CONFLICT');return state;}
  const s=structuredClone(state);
  switch(c.type) {
    case 'SAVE_CLIENT': {
      const name=String(c.name||'').trim(), recordId=String(c.clientId||'').trim();
      if(!["gestao","caixa"].includes(c.actor)||!name||!recordId||name.length>100)throw new Error('Informe o nome do cliente com um perfil autorizado.');
      const previous=(s.clients||[]).find(x=>x.id===recordId);
      const record={...previous,id:recordId,name,contact:String(c.contact||'').trim().slice(0,120)};
      s.clients=(s.clients||[]).filter(x=>x.id!==record.id).concat(record);
      break;
    }
    case 'DELETE_CLIENT':
    case 'SET_CLIENT_OFFER': {
      manager(c);const client=(s.clients||[]).find(x=>x.id===c.clientId);if(!client)fail('Cliente não encontrado.');
      if(c.type==='DELETE_CLIENT')s.clients=s.clients.filter(x=>x.id!==c.clientId);
      else {integer(c.percent,'Desconto percentual',0,50);client.offerPercent=c.percent;}
      audit(s,c,{clientId:c.clientId});break;
    }
    case 'REDEEM_CLIENT_OFFER': {
      sales(c);open(s);const order=orderFor(s,c.orderId);
      const client=(s.clients||[]).find(x=>x.id===order.clientId);
      if(!client?.offerPercent||!['confirmed','completed'].includes(order.stage)||order.discountCents||s.receipts.some(r=>r.orderId===order.id))fail('Oferta indisponível para esta venda.');
      const amount=Math.round(order.items.reduce((sum,i)=>sum+i.totalCents,0)*client.offerPercent/100);
      if(!amount)fail('A venda precisa ter produtos para resgatar a oferta.');
      order.discountCents=amount;client.offerPercent=0;audit(s,c,{amountCents:amount,reason:'Oferta de fidelidade'});break;
    }
    case 'CREATE_ORDER': {
      const client=(s.clients||[]).find(x=>x.id===c.clientId);
      if(c.clientId&&!client)throw new Error('Cliente não encontrado.');

      sales(c);open(s);if(!['balcao','entrega'].includes(c.mode))fail('Modo de atendimento inválido.');const id=required(c.orderId,'o identificador do pedido');if(s.orders.some(o=>o.id===id))fail('Pedido já existente.');
      if(c.mode==='entrega'){required(client?.name||c.customer,'o cliente fictício');required(c.address,'o endereço de entrega');}integer(c.deliveryFeeCents||0,'Taxa de entrega');
      s.orders.push({id,number:s.orders.length+1,mode:c.mode,clientId:client?.id||null,customer:text(client?.name||c.customer,100),address:c.mode==='entrega'?text(c.address,240):'',deliveryFeeCents:c.mode==='entrega'?c.deliveryFeeCents||0:0,stage:'draft',items:[],returnables:[],discountCents:0,stockReserved:false,stockConsumed:false,createdAt:now(),shiftId:s.shift.id});audit(s,c,{mode:c.mode});break;
    }
    case 'ADD_ITEM': {
      sales(c);open(s);const o=orderFor(s,c.orderId);if(o.stage!=='draft')fail('Somente rascunhos podem receber itens.');
      const p=productFor(s,c.productId),presentation=p.presentations.find(x=>x.id===c.presentationId);if(!presentation)fail('Apresentação não encontrada.');integer(c.quantity,'Quantidade',1,10000);
      const id=c.itemId||`item-${c.id}`;if(o.items.some(i=>i.id===id))fail('Identificador de item repetido.');
      const baseQuantity=integer(presentation.units*c.quantity,'Unidades-base',1);const totalCents=integer(presentation.priceCents*c.quantity,'Total do item',0,Number.MAX_SAFE_INTEGER);
      o.items.push({id,productId:p.id,name:p.name,presentationId:presentation.id,presentationName:presentation.name,unitsPerPresentation:presentation.units,units:presentation.units,quantity:c.quantity,baseQuantity,unitPriceCents:presentation.priceCents,totalCents,costCents:0,barcode:presentation.barcode});audit(s,c,{productId:p.id,quantity:c.quantity,baseQuantity});break;
    }
    case 'REMOVE_ITEM': {
      sales(c);open(s);const o=orderFor(s,c.orderId);if(o.stage!=='draft')fail('Somente rascunhos permitem remoção.');const at=o.items.findIndex(i=>i.id===c.itemId);if(at<0)fail('Item não encontrado.');o.items.splice(at,1);o.discountCents=0;audit(s,c,{itemId:c.itemId});break;
    }
    case 'ADD_RETURNABLE': {
      sales(c);open(s);const o=orderFor(s,c.orderId);if(o.stage!=='draft')fail('Defina retornáveis antes de confirmar o pedido.');const t=s.returnableTypes.find(t=>t.id===c.typeId);if(!t)fail('Tipo de retornável não encontrado.');integer(c.quantity,'Quantidade de retornáveis',1,100000);
      if(typeof c.chargeDeposit!=='boolean')fail('Escolha se haverá caução reembolsável.');const r=o.returnables.find(r=>r.typeId===t.id);if(r){if(r.chargeDeposit!==c.chargeDeposit)fail('Mantenha uma única política de caução para o mesmo tipo neste pedido.');integer(r.quantity+c.quantity,'Quantidade de retornáveis',1,100000);r.quantity+=c.quantity;}
      else o.returnables.push({typeId:t.id,name:t.name,quantity:c.quantity,chargeDeposit:c.chargeDeposit,depositPerUnitCents:t.depositCents,delivered:0,returned:0});audit(s,c,{typeId:t.id,quantity:c.quantity,chargeDeposit:c.chargeDeposit});break;
    }
    case 'REMOVE_RETURNABLE': {
      sales(c);open(s);const o=orderFor(s,c.orderId);if(o.stage!=='draft')fail('Somente rascunhos permitem remover retornáveis.');const at=o.returnables.findIndex(r=>r.typeId===c.typeId);if(at<0)fail('Retornável não encontrado.');o.returnables.splice(at,1);audit(s,c,{typeId:c.typeId});break;
    }
    case 'CONFIRM_ORDER': {
      sales(c);open(s);const o=orderFor(s,c.orderId);if(o.stage!=='draft')fail('Pedido já confirmado.');if(!o.items.length)fail('Adicione ao menos um item.');reserveOrder(s,c,o);o.stage='confirmed';o.confirmedAt=now();audit(s,c);break;
    }
    case 'COMPLETE_ORDER': {
      sales(c);open(s);const o=orderFor(s,c.orderId);if(o.stage!=='confirmed'||!o.stockReserved||o.stockConsumed)fail('Confirme o pedido antes de concluir; a baixa já concluída não se repete.');
      for(const a of o.stockAllocations){const b=s.batches.find(b=>b.id===a.batchId);if(!b||b.quantity<a.quantity||b.reserved<a.quantity)fail('Reserva de estoque inconsistente.');if(isExpired(s,b))fail('Um lote reservado está vencido. Cancele e refaça o pedido com estoque válido.');b.quantity-=a.quantity;b.reserved-=a.quantity;movement(s,c,b,'consume',a.quantity,{physicalDelta:-a.quantity});}
      o.stockConsumed=true;o.stockReserved=false;o.stage='completed';o.completedAt=now();for(const r of o.returnables)r.delivered=r.quantity;audit(s,c);break;
    }
    case 'SET_DELIVERY_STAGE': {
      open(s);const o=orderFor(s,c.orderId);if(o.mode!=='entrega')fail('Este pedido não é de entrega.');const next={completed:'out_for_delivery',out_for_delivery:'delivered'}[o.stage];if(!next||next!==c.stage)fail('Avance uma etapa por vez: separado, saiu para entrega e entregue.');o.stage=c.stage;o.updatedAt=now();audit(s,c,{stage:c.stage});break;
    }
    case 'CANCEL_ORDER': {
      open(s);const o=orderFor(s,c.orderId);const reason=required(c.reason,'o motivo do cancelamento');if(o.stage==='cancelled')fail('Pedido já cancelado.');if(o.stockConsumed)manager(c);else sales(c);
      const previous=wineOrderTotals(s,o);if(o.stockReserved)releaseOrder(s,c,o);o.previousStage=o.stage;o.stage='cancelled';o.cancelledAt=now();o.cancelledShiftId=s.shift.id;o.cancelledSaleCents=previous.saleCents;o.cancelReason=reason;
      audit(s,c,{reason,stockConsumed:o.stockConsumed,financialHistoryPreserved:true,saleAdjustmentCents:-previous.saleCents});break;
    }
    case 'DISCOUNT': {
      manager(c);open(s);const o=orderFor(s,c.orderId);const reason=required(c.reason,'o motivo do desconto');if(o.stage==='cancelled')fail('Pedido cancelado.');if(s.receipts.some(r=>r.orderId===o.id))fail('Aplique o desconto antes dos recebimentos.');integer(c.amountCents,'Desconto');if(c.amountCents>o.items.reduce((n,i)=>n+i.totalCents,0)+o.deliveryFeeCents)fail('Desconto maior que a venda.');o.discountCents=c.amountCents;audit(s,c,{reason,amountCents:c.amountCents});break;
    }
    case 'RECEIVE': receive(s,c,orderFor(s,c.orderId));break;
    case 'REFUND_RECEIPT': {
      manager(c);open(s);const reason=required(c.reason,'o motivo do estorno');integer(c.amountCents,'Valor do estorno',1);
      const original=s.receipts.find(r=>r.id===c.receiptId&&r.type==='receipt');if(!original)fail('Recebimento não encontrado.');const o=orderFor(s,original.orderId),remaining=remainingReceipt(s,original);
      if(c.amountCents>remaining.saleCents+remaining.depositAllocations.reduce((n,a)=>n+a.amountCents,0))fail('Estorno maior que o recebimento ainda disponível.');
      let rest=c.amountCents;const depositAllocations=[];for(const a of [...remaining.depositAllocations].reverse()){const amountCents=Math.min(rest,a.amountCents);if(amountCents)depositAllocations.push({typeId:a.typeId,amountCents});rest-=amountCents;if(!rest)break;}
      const saleCents=Math.min(rest,remaining.saleCents);rest-=saleCents;if(rest)fail('Alocação do estorno inconsistente.');
      appendRefund(s,{...c,reason},o,'refund',[{receiptId:original.id,saleCents,depositAllocations}],original.method);audit(s,{...c,orderId:o.id},{reason,amountCents:-c.amountCents});break;
    }
    case 'RETURN_RETURNABLE': {
      open(s);const o=orderFor(s,c.orderId);const r=o.returnables.find(r=>r.typeId===c.typeId);if(!r)fail('Retornável não encontrado neste pedido.');integer(c.quantity,'Quantidade devolvida',1);if(c.quantity>r.delivered-r.returned)fail('A devolução excede os retornáveis pendentes.');r.returned+=c.quantity;audit(s,c,{typeId:r.typeId,quantity:c.quantity,reason:text(c.reason)||'Devolução física de retornáveis'});break;
    }
    case 'REFUND_DEPOSIT': {
      manager(c);open(s);const reason=required(c.reason,'o motivo da devolução de caução');integer(c.amountCents,'Valor da caução a devolver',1);if(c.method&&!methods.includes(c.method))fail('Forma de devolução inválida.');
      const o=orderFor(s,c.orderId),r=wineReturnables(s,o.id).find(r=>r.typeId===c.typeId);if(!r)fail('Retornável não encontrado.');if(c.amountCents>r.depositRefundableCents)fail('O valor supera a caução efetivamente recebida e liberada para devolução.');
      let rest=c.amountCents;for(const original of s.receipts.filter(x=>x.orderId===o.id&&x.type==='receipt')){const a=remainingReceipt(s,original).depositAllocations.find(a=>a.typeId===c.typeId),amountCents=Math.min(rest,a?.amountCents||0);if(!amountCents)continue;appendRefund(s,{...c,reason},o,'deposit_refund',[{receiptId:original.id,saleCents:0,depositAllocations:[{typeId:c.typeId,amountCents}]}],c.method||original.method);rest-=amountCents;if(!rest)break;}
      if(rest)fail('Recebimentos de caução inconsistentes.');audit(s,c,{reason,typeId:c.typeId,amountCents:-c.amountCents});break;
    }
    case 'RECEIVE_STOCK': {
      manager(c);const p=productFor(s,c.productId);integer(c.quantity,'Quantidade recebida',1);integer(c.costCents,'Custo por unidade');const expiryDate=c.expiryDate?validDate(c.expiryDate,'a validade'):null;if(p.expiryEnabled&&!expiryDate)fail('Informe a validade para este produto.');
      const id=c.batchId||`batch-${c.id}`;if(s.batches.some(b=>b.id===id))fail('Identificador de lote já utilizado.');const reason=required(c.reason,'o motivo da entrada');
      const b={id,productId:p.id,quantity:c.quantity,reserved:0,expiryDate,costCents:c.costCents,code:required(c.code,'o código do lote')};s.batches.push(b);movement(s,c,b,'entry',c.quantity,{physicalDelta:c.quantity,reason});audit(s,c,{productId:p.id,batchId:id,quantity:c.quantity,reason});break;
    }
    case 'COUNT_STOCK': case 'ADJUST_STOCK': case 'LOSS_STOCK': {
      manager(c);const b=s.batches.find(b=>b.id===c.batchId);if(!b)fail('Lote não encontrado.');const reason=required(c.reason,'o motivo do movimento');let delta;
      if(c.type==='COUNT_STOCK'){integer(c.quantity,'Quantidade contada');delta=c.quantity-b.quantity;}
      else if(c.type==='LOSS_STOCK'){integer(c.quantity,'Quantidade perdida',1);delta=-c.quantity;}
      else {integer(Math.abs(c.quantity),'Quantidade do ajuste',1);delta=c.quantity;}
      const quantity=b.quantity+delta;if(!Number.isSafeInteger(quantity)||quantity<b.reserved||quantity<0)fail('O movimento não pode comprometer o estoque reservado ou gerar saldo negativo.');const previous=b.quantity;b.quantity=quantity;movement(s,c,b,c.type==='COUNT_STOCK'?'count':c.type==='LOSS_STOCK'?'loss':'adjust',delta,{physicalDelta:delta,reason,previous,physical:quantity});audit(s,c,{batchId:b.id,productId:b.productId,quantity:delta,reason});break;
    }
    case 'UPSERT_PRODUCT': {
      manager(c);const p=c.product;if(!p||typeof p!=='object')fail('Informe o produto.');const id=required(p.id,'o código do produto');if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))fail('Código de produto inválido.');const existing=s.products.find(x=>x.id===id);
      const name=required(p.name,'o nome do produto'),category=required(p.category,'a categoria');integer(p.min,'Estoque mínimo');if(typeof p.expiryEnabled!=='boolean')fail('Defina o controle de validade.');
      if(existing&&existing.expiryEnabled!==p.expiryEnabled&&s.batches.some(b=>b.productId===id&&b.reserved))fail('Não altere o controle de validade enquanto houver reservas.');
      if(p.expiryEnabled&&s.batches.some(b=>b.productId===id&&b.quantity>0&&!b.expiryDate))fail('Há lote sem validade. Regularize o lote antes de habilitar o controle.');
      if(!Array.isArray(p.presentations)||!p.presentations.length||p.presentations.length>30)fail('Cadastre ao menos uma apresentação.');const ids=new Set(),barcodes=new Set(s.products.filter(x=>x.id!==id).flatMap(x=>x.presentations.map(y=>y.barcode).filter(Boolean)));
      const presentations=p.presentations.map(x=>{const presentationId=required(x.id,'o código da apresentação');if(!/^[a-zA-Z0-9_-]{1,80}$/.test(presentationId)||ids.has(presentationId))fail('Código de apresentação inválido ou repetido.');ids.add(presentationId);integer(x.units,'Unidades por apresentação',1,100000);integer(x.priceCents,'Preço da apresentação',1);const barcode=text(x.barcode,31);if(barcode.length>30||barcode&&!/^[a-zA-Z0-9._-]+$/.test(barcode))fail('Código de barras inválido.');if(barcode&&barcodes.has(barcode))fail('Código de barras já cadastrado.');if(barcode)barcodes.add(barcode);return {id:presentationId,name:required(x.name,'o nome da apresentação'),units:x.units,priceCents:x.priceCents,barcode};});
      const record={id,name,category,min:p.min,expiryEnabled:p.expiryEnabled,presentations};if(existing)Object.assign(existing,record);else s.products.push(record);audit(s,c,{productId:id,previous:existing?state.products.find(x=>x.id===id):null,current:record});break;
    }
    case 'UPSERT_RETURNABLE_TYPE': {
      manager(c);const r=c.returnableType;if(!r||typeof r!=='object')fail('Informe o tipo de retornável.');const id=required(r.id,'o código do retornável');if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))fail('Código de retornável inválido.');integer(r.depositCents,'Caução por unidade');const record={id,name:required(r.name,'o nome do retornável'),depositCents:r.depositCents};const existing=s.returnableTypes.find(x=>x.id===id);if(existing)Object.assign(existing,record);else s.returnableTypes.push(record);audit(s,c,{typeId:id,current:record});break;
    }
    case 'SET_BUSINESS_DATE': {
      manager(c);const businessDate=validDate(c.businessDate,'a data de referência');if(s.batches.some(b=>b.reserved&&productFor(s,b.productId).expiryEnabled&&b.expiryDate&&b.expiryDate<businessDate))fail('Existem reservas que ficariam vencidas. Conclua ou cancele esses pedidos antes de avançar a data.');s.businessDate=businessDate;audit(s,c,{businessDate});break;
    }
    case 'CLOSE_SHIFT': {
      manager(c);open(s);if(s.orders.some(o=>!(o.stage==='cancelled'||o.mode==='balcao'&&o.stage==='completed'||o.mode==='entrega'&&o.stage==='delivered')||wineOrderTotals(s,o).balanceCents>0))fail('Existem pedidos, entregas ou saldos em aberto.');if(s.orders.some(o=>wineOrderTotals(s,o).refundDueCents>0))fail('Existem devoluções financeiras pendentes.');const totals=wineReport(s);s.shift.status='closed';s.shift.closedAt=now();s.shift.totals=totals;audit(s,c);break;
    }
    case 'OPEN_SHIFT': {
      manager(c);if(s.shift.status!=='closed')fail('O turno atual já está aberto.');s.shifts.push(structuredClone(s.shift));s.shift={id:`turno-${s.shifts.length+1}`,status:'open',openedAt:now(),closedAt:null};audit(s,c);break;
    }
    default: fail('Operação não reconhecida.');
  }
  validateComputedPrecision(s);
  Object.defineProperty(s.processedCommands,c.id,{value:signature,enumerable:true,writable:true,configurable:true});s.revision=exact((s.revision||0)+1,'Versão do estado');return s;
}
