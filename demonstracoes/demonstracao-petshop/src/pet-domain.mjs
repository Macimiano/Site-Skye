/** Pet shop SKYE: agenda por capacidade, contas separadas da operação e consumo único. */
export class PetDomainError extends Error {
  constructor(message,code='INVALID_OPERATION'){super(message);this.name='PetDomainError';this.code=code;}
}
const fail=(message,code)=>{throw new PetDomainError(message,code);};
const now=()=>new Date().toISOString();
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const roles=['gestao','recepcao','banho_tosa'];
const methods=['pix','dinheiro','debito','credito'];
const terminal=['cancelled','no_show'];
const exact=(n,label)=>{if(!Number.isSafeInteger(n))fail(`${label} fora do limite de precisão.`,'PRECISION_LIMIT');return n;};
const integer=(n,label,min=0,max=1e8)=>{if(!Number.isSafeInteger(n)||n<min||n>max)fail(`${label}: use inteiro entre ${min} e ${max}.`);return n;};
const text=(value,max=500)=>String(value??'').trim().slice(0,max);
const required=(value,label)=>{const v=text(value);if(!v)fail(`Informe ${label}.`);return v;};
const identifier=(value,label)=>{const v=required(value,label);if(!/^[a-zA-Z0-9_-]{1,100}$/.test(v))fail(`${label}: código inválido.`);return v;};
const manager=c=>{if(c.actor!=='gestao')fail('Esta ação exige gestão.','FORBIDDEN');};
const reception=c=>{if(!['gestao','recepcao'].includes(c.actor))fail('Esta ação exige recepção ou gestão.','FORBIDDEN');};
const grooming=c=>{if(!['gestao','banho_tosa'].includes(c.actor))fail('Esta ação exige banho e tosa ou gestão.','FORBIDDEN');};
const open=s=>{if(s.shift.status!=='open')fail('Abra um novo turno antes desta operação.');};
const signature=value=>Array.isArray(value)?`[${value.map(signature).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${signature(value[k])}`).join(',')}}`:JSON.stringify(value);
const sum=values=>values.reduce((a,b)=>exact(a+b,'Total acumulado'),0);
const quantity=(n,label,unit)=>{if(!Number.isFinite(n)||n<0||n>1e8||Math.abs(n*1000-Math.round(n*1000))>1e-7||(unit==='un'&&!Number.isSafeInteger(n)))fail(`${label}: use quantidade não negativa com até três casas; unidades devem ser inteiras.`);return Math.round(n*1000)/1000;};
const roundQty=n=>Math.round(n*1000)/1000;
function costForQuantity(q,cost){const scaled=BigInt(Math.round(q*1000))*BigInt(Math.round(cost*1000));return exact(Number((scaled+500000n)/1000000n),'Custo calculado');}
function validDate(value,label='a data'){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail(`Informe ${label} no formato ano-mês-dia.`);
  const d=new Date(value+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)fail(`Informe ${label} válida.`);return value;
}
function minutes(value,label='o horário'){
  if(typeof value!=='string'||!/^\d{2}:\d{2}$/.test(value))fail(`Informe ${label} no formato hora:minuto.`);
  const [h,m]=value.split(':').map(Number);if(h>23||m>59)fail(`Informe ${label} válido.`);return h*60+m;
}
const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const overlap=(a,b,c,d)=>a<d&&c<b;
const orderFor=(s,id)=>{const o=s.orders.find(o=>o.id===id);if(!o)fail('Conta não encontrada.');return o;};
const stockFor=(s,id)=>{const i=s.inventory.find(i=>i.id===id);if(!i)fail('Item de estoque não encontrado.');return i;};
const petFor=(s,id)=>{const p=s.pets.find(p=>p.id===id);if(!p)fail('Pet não encontrado.');return p;};
const expired=(s,i,date=s.businessDate)=>Boolean(i.expiryEnabled&&i.expiryDate&&i.expiryDate<date);
const serviceDate=(s,o)=>o.type==='appointment'&&o.date>s.businessDate?o.date:s.businessDate;
function audit(s,c,details={}){
  const o=c.orderId?s.orders.find(o=>o.id===c.orderId):null;
  s.history.push({id:`history-${c.id}`,commandId:c.id,type:c.type,actor:c.actor,orderId:o?.id||null,petId:o?.petId||null,at:now(),...structuredClone(details)});
}
function move(s,c,item,kind,q,extra={}){s.movements.push({id:`move-${c.id}-${s.movements.length+1}`,inventoryId:item.id,orderId:c.orderId||null,kind,quantity:q,actor:c.actor,at:now(),...extra});}

export function createPetDemoState(){
  return {schemaVersion:1,revision:0,businessDate:localDate(),
    tutors:[{id:'tutora-1',name:'Marina Exemplo',phone:'',notes:'Tutora fictícia dos pets Luna e Nino.'},{id:'tutor-2',name:'Rafael Exemplo',phone:'',notes:'Cadastro demonstrativo.'}],
    pets:[{id:'luna',tutorId:'tutora-1',name:'Luna',species:'Cão',size:'Médio',characteristics:'Pelagem longa',preferences:'Secagem em temperatura suave',notes:'Preferências fictícias informadas pela tutora.'},{id:'nino',tutorId:'tutora-1',name:'Nino',species:'Cão',size:'Pequeno',characteristics:'Pelagem curta',preferences:'Pausa durante a secagem',notes:'Animal distinto da mesma tutora.'},{id:'amora',tutorId:'tutor-2',name:'Amora',species:'Cão',size:'Médio',characteristics:'Pelagem média',preferences:'',notes:''}],
    professionals:[{id:'ana',name:'Ana • profissional fictícia',workStart:'09:00',workEnd:'18:00',breaks:[{start:'13:00',end:'14:00'}],weekdays:[0,1,2,3,4,5,6]},{id:'bruno',name:'Bruno • profissional fictício',workStart:'09:00',workEnd:'18:00',breaks:[{start:'13:00',end:'14:00'}],weekdays:[0,1,2,3,4,5,6]}],
    resources:[{id:'banheira',name:'Área de banho',capacity:2},{id:'mesa',name:'Mesa de tosa',capacity:2}],unavailable:[],
    services:[{id:'banho',name:'Banho',kind:'service',priceCents:6000,durationMinutes:30,bufferMinutes:15,requiredResourceIds:['banheira'],recipe:[{inventoryId:'shampoo',quantity:20}]},{id:'tosa',name:'Tosa',kind:'service',priceCents:9000,durationMinutes:30,bufferMinutes:15,requiredResourceIds:['mesa'],recipe:[]},{id:'hidratacao',name:'Hidratação adicional',kind:'addon',priceCents:2500,durationMinutes:15,bufferMinutes:15,requiredResourceIds:['banheira'],recipe:[{inventoryId:'hidratante',quantity:10}]}],
    inventory:[{id:'shampoo',name:'Shampoo de uso no serviço',kind:'supply',unit:'ml',physical:1000,reserved:0,min:100,costCents:2,priceCents:0,barcode:'',expiryEnabled:false,expiryDate:null},{id:'hidratante',name:'Hidratante de uso no serviço',kind:'supply',unit:'ml',physical:500,reserved:0,min:100,costCents:3,priceCents:0,barcode:'',expiryEnabled:false,expiryDate:null},{id:'racao',name:'Ração de demonstração • 3 kg',kind:'product',unit:'un',physical:12,reserved:0,min:3,costCents:4500,priceCents:8000,barcode:'PET8001',expiryEnabled:false,expiryDate:null},{id:'brinquedo',name:'Brinquedo de demonstração',kind:'product',unit:'un',physical:15,reserved:0,min:3,costCents:1200,priceCents:2500,barcode:'PET2501',expiryEnabled:false,expiryDate:null}],
    orders:[],receipts:[],movements:[],occurrences:[],history:[],processedCommands:{},shift:{id:'turno-1',status:'open',openedAt:now(),closedAt:null},shifts:[]};
}
export function petStock(s,id){const i=stockFor(s,id);const blocked=expired(s,i)?i.physical:0;return {physical:i.physical,reserved:i.reserved,available:expired(s,i)?0:roundQty(i.physical-i.reserved),expired:blocked,min:i.min};}
export function petOrderTotals(s,order){
  const o=typeof order==='string'?orderFor(s,order):order;if(!o)fail('Conta não encontrada.');
  const servicesCents=sum(o.services.map(x=>x.priceCents)),productsCents=sum(o.products.map(x=>exact(x.quantity*x.unitPriceCents,'Preço de produtos')));
  const subtotalCents=exact(servicesCents+productsCents,'Subtotal'),discountCents=o.discountCents||0,contractedCents=subtotalCents-discountCents;
  const totalCents=terminal.includes(o.stage)?0:contractedCents;
  const receipts=s.receipts.filter(r=>r.orderId===o.id),receivedCents=sum(receipts.map(r=>r.amountCents));
  const depositIds=new Set(receipts.filter(r=>r.kind==='deposit').map(r=>r.id));
  const depositReceivedCents=sum(receipts.filter(r=>r.kind==='deposit'||depositIds.has(r.originalReceiptId)).map(r=>r.amountCents));
  return {servicesCents,productsCents,subtotalCents,discountCents,contractedCents,totalCents,receivedCents,depositReceivedCents,balanceCents:Math.max(0,totalCents-receivedCents),refundDueCents:Math.max(0,receivedCents-totalCents),costCents:sum([o.supplyCostCents||0,...o.products.map(p=>costForQuantity(p.quantity,p.unitCostCents))])};
}
const calendarActive=o=>o.type==='appointment'&&!terminal.includes(o.stage);
const isOperationalOpen=o=>!terminal.includes(o.stage)&&!(o.type==='appointment'?o.stage==='delivered':o.stage==='completed');
const isDue=(s,o)=>o.type==='retail'||['received','in_service','ready','delivered'].includes(o.stage)||(o.type==='appointment'&&o.date<=s.businessDate)||terminal.includes(o.stage);
export function petReport(s){
  if(s.shift.status==='closed'&&s.shift.totals)return structuredClone(s.shift.totals);
  const orders=s.orders.filter(o=>o.shiftId===s.shift.id),receipts=s.receipts.filter(r=>r.shiftId===s.shift.id);
  const adjustment=s.orders.filter(o=>o.shiftId!==s.shift.id&&o.cancelledShiftId===s.shift.id).reduce((n,o)=>exact(n-(o.cancelledContractedCents||0),'Ajustes'),0);
  const soldCents=sum(orders.filter(o=>!terminal.includes(o.stage)&&(o.type==='appointment'||o.stage==='completed')).map(o=>petOrderTotals(s,o).totalCents))+adjustment;
  const deposits=new Set(s.receipts.filter(r=>r.kind==='deposit').map(r=>r.id));
  return {orderCount:orders.length,appointmentCount:orders.filter(o=>o.type==='appointment').length,retailCount:orders.filter(o=>o.type==='retail').length,soldCents,salesAdjustmentCents:adjustment,
    receivedCents:sum(receipts.map(r=>r.amountCents)),grossReceivedCents:sum(receipts.filter(r=>r.amountCents>0).map(r=>r.amountCents)),refundedCents:-sum(receipts.filter(r=>r.amountCents<0).map(r=>r.amountCents)),depositReceivedCents:sum(receipts.filter(r=>r.kind==='deposit'||deposits.has(r.originalReceiptId)).map(r=>r.amountCents)),
    pendingCents:sum(s.orders.filter(o=>o.type==='appointment'||o.stage!=='draft').map(o=>petOrderTotals(s,o).balanceCents)),duePendingCents:sum(s.orders.filter(o=>isDue(s,o)&&(o.type==='appointment'||o.stage!=='draft')).map(o=>petOrderTotals(s,o).balanceCents)),refundDueCents:sum(s.orders.map(o=>petOrderTotals(s,o).refundDueCents)),openCount:s.orders.filter(o=>isOperationalOpen(o)||petOrderTotals(s,o).balanceCents>0||petOrderTotals(s,o).refundDueCents>0).length,
    byMethod:Object.fromEntries(methods.map(method=>[method,sum(receipts.filter(r=>r.method===method).map(r=>r.amountCents))]))};
}
export function petHistory(s,petId){
  const pet=petFor(s,petId);return structuredClone({pet,tutor:s.tutors.find(t=>t.id===pet.tutorId),orders:s.orders.filter(o=>o.petId===petId),occurrences:s.occurrences.filter(o=>o.petId===petId),events:s.history.filter(h=>h.petId===petId)});
}
function bookingWindow(o){const begin=minutes(o.start),end=begin+o.durationMinutes;return {begin,end,until:end+o.bufferMinutes};}
function validateAppointment(s,o,excludeOrderId){
  if(o.petId)petFor(s,o.petId);validDate(o.date);const p=s.professionals.find(p=>p.id===o.professionalId);if(!p)fail('Profissional não encontrado.');
  integer(o.durationMinutes,'Duração',1,720);integer(o.bufferMinutes,'Preparação',0,240);const w=bookingWindow(o);if(w.until>1440)fail('O atendimento e a preparação devem terminar no mesmo dia.');
  if(!p.weekdays.includes(new Date(o.date+'T12:00:00Z').getUTCDay()))fail('O profissional não trabalha neste dia.','UNAVAILABLE');
  if(w.begin<minutes(p.workStart)||w.until>minutes(p.workEnd))fail('Horário fora da jornada, incluindo preparação.','UNAVAILABLE');
  if(p.breaks.some(b=>overlap(w.begin,w.until,minutes(b.start),minutes(b.end))))fail('Atendimento ou preparação conflita com intervalo do profissional.','UNAVAILABLE');
  if(!Array.isArray(o.resourceIds)||new Set(o.resourceIds).size!==o.resourceIds.length||o.resourceIds.some(id=>!s.resources.some(r=>r.id===id)))fail('Recursos inválidos.');
  const requiredResources=[...new Set(o.services.flatMap(x=>x.requiredResourceIds))];
  if(requiredResources.some(id=>!o.resourceIds.includes(id)))fail('Todos os recursos exigidos pelos serviços devem ser reservados.');
  const booked=s.orders.filter(other=>other.id!==excludeOrderId&&calendarActive(other)&&other.date===o.date);
  for(const other of booked){const v=bookingWindow(other);if(!overlap(w.begin,w.until,v.begin,v.until))continue;if(other.professionalId===o.professionalId)fail('Conflito de horário do profissional, incluindo preparação.','CONFLICT');if(o.petId&&other.petId===o.petId)fail('Este pet já tem atendimento neste período.','CONFLICT');}
  for(const u of s.unavailable.filter(u=>u.date===o.date))if(overlap(w.begin,w.until,minutes(u.start),minutes(u.end))&&(u.professionalId===o.professionalId||o.resourceIds.includes(u.resourceId)))fail('O período possui indisponibilidade de profissional ou recurso.','UNAVAILABLE');
  for(const resourceId of o.resourceIds){
    const resource=s.resources.find(r=>r.id===resourceId),events=[[w.begin,1],[w.until,-1]];
    for(const other of booked.filter(x=>x.resourceIds.includes(resourceId))){const v=bookingWindow(other);if(overlap(w.begin,w.until,v.begin,v.until)){events.push([Math.max(w.begin,v.begin),1],[Math.min(w.until,v.until),-1]);}}
    events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let count=0;for(const [,delta] of events){count+=delta;if(count>resource.capacity)fail(`Capacidade indisponível: ${resource.name}.`,'RESOURCE_CONFLICT');}
  }
  return {end:clock(w.end),blockedUntil:clock(w.until)};
}
function servicesFor(s,ids){
  if(!Array.isArray(ids)||!ids.length||ids.length>30||new Set(ids).size!==ids.length)fail('Selecione serviços distintos para o atendimento.');
  return ids.map(id=>{const v=s.services.find(x=>x.id===id);if(!v)fail('Serviço não encontrado.');return structuredClone(v);});
}
function candidate(s,query,existing=null){
  const services=existing?structuredClone(existing.services):servicesFor(s,query.serviceIds);
  return {...(existing||{}),petId:query.petId??existing?.petId,professionalId:query.professionalId??existing?.professionalId,date:query.date??existing?.date,start:query.start??existing?.start,services,
    durationMinutes:query.durationMinutes??existing?.durationMinutes??sum(services.map(v=>v.durationMinutes)),bufferMinutes:query.bufferMinutes??existing?.bufferMinutes??Math.max(...services.map(v=>v.bufferMinutes)),resourceIds:query.resourceIds??existing?.resourceIds??[...new Set(services.flatMap(v=>v.requiredResourceIds))]};
}
export function petAvailability(s,query){
  try{const existing=query.excludeOrderId?orderFor(s,query.excludeOrderId):null;const o=candidate(s,query,existing);return {available:true,...validateAppointment(s,o,query.excludeOrderId)};}
  catch(error){if(error instanceof PetDomainError)return {available:false,reason:error.message,code:error.code};throw error;}
}
export function availablePetSlots(s,query){
  const from=minutes(query.from||'09:00'),step=integer(query.stepMinutes??15,'Intervalo da busca',1,120),limit=integer(query.limit??12,'Limite de horários',1,100),slots=[];
  for(let t=from;t<1440&&slots.length<limit;t+=step){const start=clock(t);if(petAvailability(s,{...query,start}).available)slots.push(start);}return slots;
}
function requirements(services){const map=new Map();for(const service of services)for(const r of service.recipe)map.set(r.inventoryId,roundQty((map.get(r.inventoryId)||0)+r.quantity));return [...map].map(([inventoryId,quantity])=>({inventoryId,quantity}));}
function validateStockForDate(s,i,q,date){if(expired(s,i,date))fail(`Item vencido para a data do atendimento/venda: ${i.name}.`,'EXPIRED');if(roundQty(i.physical-i.reserved)<q)fail(`Estoque disponível insuficiente: ${i.name}.`,'INSUFFICIENT_STOCK');}
function reserveSupplies(s,c,o){
  o.stockRequirements=requirements(o.services).map(r=>{const i=stockFor(s,r.inventoryId);if(i.kind!=='supply')fail('A ficha técnica deve usar insumos de serviço.');validateStockForDate(s,i,r.quantity,o.date);return {...r,unitCostCents:i.costCents};});
  const scaledCost=o.stockRequirements.reduce((n,r)=>n+BigInt(Math.round(r.quantity*1000))*BigInt(Math.round(r.unitCostCents*1000)),0n);o.supplyCostCents=exact(Number((scaledCost+500000n)/1000000n),'Custo dos insumos');
  for(const r of o.stockRequirements){const i=stockFor(s,r.inventoryId);i.reserved=roundQty(i.reserved+r.quantity);move(s,c,i,'reserve_supply',r.quantity);}
  o.suppliesReserved=o.stockRequirements.length>0;
}
function releaseReservations(s,c,o){
  if(o.suppliesReserved){for(const r of o.stockRequirements){const i=stockFor(s,r.inventoryId);i.reserved=roundQty(i.reserved-r.quantity);move(s,c,i,'release_supply',r.quantity);}o.suppliesReserved=false;}
  for(const p of o.products.filter(p=>!p.consumed)){const i=stockFor(s,p.inventoryId);i.reserved=roundQty(i.reserved-p.quantity);p.reserved=false;move(s,c,i,'release_product',p.quantity);}
}
function consumeSupplies(s,c,o){
  if(o.suppliesConsumed)fail('Os insumos deste atendimento já foram consumidos.');
  for(const r of o.stockRequirements){const i=stockFor(s,r.inventoryId);if(expired(s,i,serviceDate(s,o)))fail(`Insumo vencido: ${i.name}.`);if(i.reserved<r.quantity||i.physical<r.quantity)fail('Reserva de insumo inconsistente.');i.reserved=roundQty(i.reserved-r.quantity);i.physical=roundQty(i.physical-r.quantity);move(s,c,i,'consume_supply',r.quantity,{physicalDelta:-r.quantity});}
  o.suppliesReserved=false;o.suppliesConsumed=true;
}
function consumeProducts(s,c,o){
  for(const p of o.products.filter(p=>!p.consumed)){const i=stockFor(s,p.inventoryId);if(expired(s,i,serviceDate(s,o)))fail(`Produto vencido: ${i.name}.`);if(!p.reserved||i.reserved<p.quantity||i.physical<p.quantity)fail('Reserva de produto inconsistente.');i.reserved=roundQty(i.reserved-p.quantity);i.physical=roundQty(i.physical-p.quantity);p.reserved=false;p.consumed=true;move(s,c,i,'consume_product',p.quantity,{physicalDelta:-p.quantity});}
  o.productsConsumed=true;
}
function validateTotals(s){
  for(const o of s.orders)for(const [label,value] of Object.entries(petOrderTotals(s,o)))exact(value,label);
  for(const i of s.inventory){quantity(i.physical,'Estoque',i.unit);quantity(i.reserved,'Reserva',i.unit);if(i.reserved>i.physical)fail('Reserva excede o estoque físico.');}
  const report=petReport(s);for(const [key,value] of Object.entries(report)){if(typeof value==='number')exact(value,key);else if(key==='byMethod')for(const n of Object.values(value))exact(n,key);}
}
function validateAllBookings(s){for(const o of s.orders.filter(o=>calendarActive(o)&&o.stage!=='delivered'))validateAppointment(s,o,o.id);}
function validateRecipe(s,value){
  if(!Array.isArray(value)||value.length>100)fail('Ficha técnica inválida.');const map=new Map();
  for(const r of value){const i=stockFor(s,r.inventoryId);if(i.kind!=='supply')fail('A ficha técnica aceita somente insumos de serviço.');const q=quantity(r.quantity??r.qty,'Quantidade da ficha',i.unit);if(q<=0)fail('Use consumo positivo na ficha técnica.');map.set(i.id,roundQty((map.get(i.id)||0)+q));}
  return [...map].map(([inventoryId,quantity])=>({inventoryId,quantity}));
}

export function dispatchPet(state,c){
  if(!c||typeof c!=='object'||typeof c.id!=='string'||!c.id.trim()||c.id.length>150)fail('O comando exige uma chave de idempotência válida.');if(!roles.includes(c.actor))fail('Perfil inválido.','FORBIDDEN');
  const sig=signature(c);if(Object.hasOwn(state.processedCommands,c.id)){if(state.processedCommands[c.id]!==sig)fail('Chave de idempotência já usada por outra operação.','IDEMPOTENCY_CONFLICT');return state;}
  const s=structuredClone(state);
  switch(c.type){
    case 'UPSERT_TUTOR':{
      reception(c);const v=c.tutor;if(!v||typeof v!=='object')fail('Informe o tutor.');const record={id:identifier(v.id,'Tutor'),name:required(v.name,'o nome do tutor'),phone:text(v.phone,40),notes:text(v.notes)};const old=s.tutors.find(x=>x.id===record.id);if(old)Object.assign(old,record);else s.tutors.push(record);audit(s,c,{tutorId:record.id,current:record});break;
    }
    case 'UPSERT_PET':{
      reception(c);const v=c.pet;if(!v||typeof v!=='object')fail('Informe o pet.');if(!s.tutors.some(t=>t.id===v.tutorId))fail('Tutor não encontrado.');const id=identifier(v.id,'Pet');const old=s.pets.find(p=>p.id===id);if(old&&old.tutorId!==v.tutorId&&s.orders.some(o=>o.petId===id))fail('Pet com histórico não pode trocar de tutor nesta demonstração.');
      const record={id,tutorId:v.tutorId,name:required(v.name,'o nome do pet'),species:required(v.species,'a espécie'),size:required(v.size,'o porte'),characteristics:text(v.characteristics),preferences:text(v.preferences),notes:text(v.notes)};if(old)Object.assign(old,record);else s.pets.push(record);audit(s,c,{petId:id,tutorId:v.tutorId,current:record});break;
    }
    case 'CREATE_APPOINTMENT':{
      reception(c);open(s);const id=identifier(c.orderId,'Atendimento');if(s.orders.some(o=>o.id===id))fail('Atendimento já existente.');const p=petFor(s,c.petId),o=candidate(s,c);const times=validateAppointment(s,o);
      if(c.servicePrices!==undefined){manager(c);if(!Array.isArray(c.servicePrices)||new Set(c.servicePrices.map(x=>x.serviceId)).size!==c.servicePrices.length)fail('Valores combinados inválidos.');const reason=required(c.priceReason,'o motivo do valor combinado');for(const row of c.servicePrices){const service=o.services.find(x=>x.id===row.serviceId);if(!service)fail('Serviço do valor combinado não encontrado.');integer(row.priceCents,'Valor combinado');service.priceCents=row.priceCents;}o.priceReason=reason;}
      Object.assign(o,{id,number:s.orders.length+1,type:'appointment',tutorId:p.tutorId,petId:p.id,petName:p.name,tutorName:s.tutors.find(t=>t.id===p.tutorId).name,professionalName:s.professionals.find(p=>p.id===o.professionalId).name,stage:'scheduled',products:[],discountCents:0,notes:text(c.notes),createdAt:now(),shiftId:s.shift.id,suppliesConsumed:false,productsConsumed:false,...times});
      reserveSupplies(s,c,o);s.orders.push(o);audit(s,c,{date:o.date,start:o.start,professionalId:o.professionalId,petId:o.petId});break;
    }
    case 'RESCHEDULE':{
      reception(c);open(s);const o=orderFor(s,c.orderId);if(o.type!=='appointment'||!['scheduled','confirmed'].includes(o.stage))fail('Remarque somente antes da chegada do pet.');if(c.petId&&c.petId!==o.petId)fail('Remarcação não pode trocar o pet do atendimento.');const proposed=candidate(s,c,o);const times=validateAppointment(s,proposed,o.id);
      for(const r of o.stockRequirements)if(expired(s,stockFor(s,r.inventoryId),proposed.date))fail('A nova data ultrapassa a validade de insumo reservado.');for(const p of o.products)if(expired(s,stockFor(s,p.inventoryId),proposed.date))fail('A nova data ultrapassa a validade de produto reservado.');
      const previous={date:o.date,start:o.start,professionalId:o.professionalId,durationMinutes:o.durationMinutes,bufferMinutes:o.bufferMinutes,resourceIds:o.resourceIds};Object.assign(o,{date:proposed.date,start:proposed.start,professionalId:proposed.professionalId,professionalName:s.professionals.find(p=>p.id===proposed.professionalId).name,durationMinutes:proposed.durationMinutes,bufferMinutes:proposed.bufferMinutes,resourceIds:proposed.resourceIds,...times});audit(s,c,{previous,date:o.date,start:o.start,professionalId:o.professionalId});break;
    }
    case 'SET_STAGE':{
      open(s);const o=orderFor(s,c.orderId);if(o.type!=='appointment')fail('Esta conta é uma venda de loja.');const next={scheduled:'confirmed',confirmed:'received',received:'in_service',in_service:'ready',ready:'delivered'}[o.stage];if(!next||next!==c.stage)fail('Avance uma etapa por vez no atendimento.');if(['in_service','ready'].includes(c.stage))grooming(c);else reception(c);
      if(c.stage==='in_service')consumeSupplies(s,c,o);if(c.stage==='delivered')consumeProducts(s,c,o);o.stage=c.stage;o.updatedAt=now();audit(s,c,{stage:o.stage});break;
    }
    case 'CREATE_RETAIL':{
      reception(c);open(s);const id=identifier(c.orderId,'Venda');if(s.orders.some(o=>o.id===id))fail('Conta já existente.');const tutor=s.tutors.find(t=>t.id===c.tutorId);if(c.tutorId&&!tutor)fail('Tutor não encontrado.');s.orders.push({id,number:s.orders.length+1,type:'retail',stage:'draft',customer:text(tutor?.name||c.customer),petId:null,tutorId:tutor?.id||null,services:[],products:[],discountCents:0,supplyCostCents:0,stockRequirements:[],suppliesReserved:false,suppliesConsumed:false,productsConsumed:false,createdAt:now(),shiftId:s.shift.id});audit(s,c);break;
    }
    case 'ADD_PRODUCT':{
      reception(c);open(s);const o=orderFor(s,c.orderId);if(terminal.includes(o.stage)||['delivered','completed'].includes(o.stage))fail('Esta conta não pode receber novos produtos.');const i=stockFor(s,c.inventoryId);if(i.kind!=='product'||i.unit!=='un')fail('A loja vende mercadorias em unidades; insumos de serviço não são vendidos.');integer(c.quantity,'Quantidade',1,10000);validateStockForDate(s,i,c.quantity,o.type==='appointment'?o.date:s.businessDate);const id=c.itemId||`item-${c.id}`;if(o.products.some(p=>p.id===id))fail('Item já cadastrado na conta.');
      const p={id,inventoryId:i.id,name:i.name,quantity:c.quantity,unitPriceCents:i.priceCents,unitCostCents:i.costCents,barcode:i.barcode,reserved:true,consumed:false};exact(p.unitPriceCents*p.quantity,'Total de produtos');i.reserved=roundQty(i.reserved+p.quantity);o.products.push(p);move(s,c,i,'reserve_product',p.quantity);audit(s,c,{inventoryId:i.id,quantity:p.quantity});break;
    }
    case 'REMOVE_PRODUCT':{
      reception(c);open(s);const o=orderFor(s,c.orderId);if(s.receipts.some(r=>r.orderId===o.id))fail('Não remova produtos de conta com recebimento; registre correção autorizada.');if(terminal.includes(o.stage))fail('Conta cancelada.');const at=o.products.findIndex(p=>p.id===c.itemId);if(at<0)fail('Item não encontrado.');const p=o.products[at];if(p.consumed||!p.reserved)fail('Produto já consumido ou sem reserva.');const i=stockFor(s,p.inventoryId);i.reserved=roundQty(i.reserved-p.quantity);o.products.splice(at,1);o.discountCents=0;move(s,c,i,'release_product',p.quantity);audit(s,c,{inventoryId:i.id,quantity:p.quantity});break;
    }
    case 'COMPLETE_RETAIL':{
      reception(c);open(s);const o=orderFor(s,c.orderId);if(o.type!=='retail'||o.stage!=='draft')fail('A venda já foi concluída ou não é de loja.');if(!o.products.length)fail('Adicione um produto antes de concluir.');consumeProducts(s,c,o);o.stage='completed';o.completedAt=now();audit(s,c);break;
    }
    case 'CANCEL_ORDER':case 'NO_SHOW':{
      open(s);const o=orderFor(s,c.orderId),reason=required(c.reason,'o motivo');if(terminal.includes(o.stage))fail('Esta conta já está cancelada ou marcada como não comparecimento.');if(c.type==='NO_SHOW'&&(o.type!=='appointment'||!['scheduled','confirmed'].includes(o.stage)))fail('Registre não comparecimento antes da chegada.');if(o.suppliesConsumed||o.productsConsumed)manager(c);else reception(c);const t=petOrderTotals(s,o);releaseReservations(s,c,o);o.previousStage=o.stage;o.stage=c.type==='NO_SHOW'?'no_show':'cancelled';o.cancelReason=reason;o.cancelledAt=now();o.cancelledShiftId=s.shift.id;o.cancelledContractedCents=(o.type==='appointment'||o.previousStage==='completed')?t.contractedCents:0;audit(s,c,{reason,financialHistoryPreserved:true,suppliesConsumed:o.suppliesConsumed,productsConsumed:o.productsConsumed});break;
    }
    case 'RECEIVE':{
      reception(c);open(s);const o=orderFor(s,c.orderId);if(terminal.includes(o.stage))fail('Contas canceladas não recebem pagamentos.');if(o.type==='retail'&&!o.products.length)fail('Adicione produtos antes de receber.');if(!methods.includes(c.method))fail('Escolha explicitamente a forma de pagamento.');if(!['deposit','payment'].includes(c.kind))fail('Escolha sinal ou pagamento.');integer(c.amountCents,'Valor do recebimento',1);if(c.amountCents>petOrderTotals(s,o).balanceCents)fail('O valor excede o saldo restante.');s.receipts.push({id:`receipt-${c.id}`,commandId:c.id,orderId:o.id,petId:o.petId||null,shiftId:s.shift.id,kind:c.kind,type:'receipt',amountCents:c.amountCents,method:c.method,actor:c.actor,at:now(),simulated:true});audit(s,c,{amountCents:c.amountCents,kind:c.kind,method:c.method});break;
    }
    case 'REFUND':{
      manager(c);open(s);required(c.reason,'o motivo do estorno');integer(c.amountCents,'Valor do estorno',1);const original=s.receipts.find(r=>r.id===c.receiptId&&r.type==='receipt');if(!original)fail('Recebimento não encontrado.');const previous=sum(s.receipts.filter(r=>r.originalReceiptId===original.id).map(r=>r.amountCents));if(c.amountCents>original.amountCents+previous)fail('Estorno maior que o recebimento ainda disponível.');s.receipts.push({id:`refund-${c.id}`,commandId:c.id,orderId:original.orderId,petId:original.petId,shiftId:s.shift.id,originalReceiptId:original.id,kind:'refund',type:'refund',amountCents:-c.amountCents,method:original.method,reason:text(c.reason),actor:c.actor,at:now(),simulated:true});audit(s,{...c,orderId:original.orderId},{amountCents:-c.amountCents,reason:text(c.reason)});break;
    }
    case 'DISCOUNT':case 'SET_SERVICE_PRICE':{
      manager(c);open(s);const o=orderFor(s,c.orderId),reason=required(c.reason,'o motivo');if(terminal.includes(o.stage)||o.suppliesConsumed||o.productsConsumed)fail('Defina valores antes de executar o serviço ou concluir a venda.');if(s.receipts.some(r=>r.orderId===o.id))fail('Defina valores antes dos recebimentos.');if(c.type==='DISCOUNT'){integer(c.amountCents,'Desconto');if(c.amountCents>petOrderTotals(s,o).subtotalCents)fail('Desconto maior que a conta.');o.discountCents=c.amountCents;audit(s,c,{reason,amountCents:c.amountCents});}else{const service=o.services.find(x=>x.id===c.serviceId);if(!service)fail('Serviço não encontrado nesta conta.');integer(c.priceCents,'Valor combinado');const previous=service.priceCents;service.priceCents=c.priceCents;if(o.discountCents>petOrderTotals(s,o).subtotalCents)fail('O novo valor ficaria abaixo do desconto aplicado.');audit(s,c,{reason,serviceId:service.id,previousPriceCents:previous,priceCents:c.priceCents});}break;
    }
    case 'ADD_OCCURRENCE':{
      open(s);const o=orderFor(s,c.orderId);if(o.type!=='appointment'||!o.petId)fail('Ocorrências são vinculadas a atendimento de um pet.');if(c.petId&&c.petId!==o.petId)fail('O pet informado não pertence a este atendimento.');const note=required(c.note,'a ocorrência operacional');s.occurrences.push({id:`occurrence-${c.id}`,orderId:o.id,petId:o.petId,note,actor:c.actor,at:now()});audit(s,c,{note});break;
    }
    case 'UPSERT_PROFESSIONAL':{
      manager(c);const v=c.professional;if(!v||typeof v!=='object')fail('Informe o profissional.');const id=identifier(v.id,'Profissional');if(minutes(v.workStart)>=minutes(v.workEnd))fail('Jornada inválida.');if(!Array.isArray(v.weekdays)||!v.weekdays.length||v.weekdays.some(n=>!Number.isInteger(n)||n<0||n>6))fail('Dias de trabalho inválidos.');if(!Array.isArray(v.breaks))fail('Intervalos inválidos.');const breaks=v.breaks.map(b=>{if(minutes(b.start)>=minutes(b.end)||minutes(b.start)<minutes(v.workStart)||minutes(b.end)>minutes(v.workEnd))fail('Intervalo fora da jornada.');return {start:b.start,end:b.end};});const record={id,name:required(v.name,'o nome do profissional'),workStart:v.workStart,workEnd:v.workEnd,breaks,weekdays:[...new Set(v.weekdays)]};const old=s.professionals.find(p=>p.id===id);if(old)Object.assign(old,record);else s.professionals.push(record);validateAllBookings(s);audit(s,c,{professionalId:id,current:record});break;
    }
    case 'UPSERT_RESOURCE':{
      manager(c);const v=c.resource;if(!v||typeof v!=='object')fail('Informe o recurso.');const record={id:identifier(v.id,'Recurso'),name:required(v.name,'o nome do recurso'),capacity:integer(v.capacity,'Capacidade',1,100)};const old=s.resources.find(r=>r.id===record.id);if(old)Object.assign(old,record);else s.resources.push(record);validateAllBookings(s);audit(s,c,{resourceId:record.id,current:record});break;
    }
    case 'ADD_UNAVAILABLE':{
      manager(c);const v=c.unavailable;if(!v||typeof v!=='object')fail('Informe a indisponibilidade.');const id=identifier(v.id,'Indisponibilidade');if(s.unavailable.some(u=>u.id===id))fail('Indisponibilidade já cadastrada.');if(Boolean(v.professionalId)===Boolean(v.resourceId))fail('Escolha um profissional ou um recurso.');if(v.professionalId&&!s.professionals.some(p=>p.id===v.professionalId)||v.resourceId&&!s.resources.some(r=>r.id===v.resourceId))fail('Profissional ou recurso não encontrado.');validDate(v.date);if(minutes(v.start)>=minutes(v.end))fail('Período de indisponibilidade inválido.');const record={id,professionalId:v.professionalId||null,resourceId:v.resourceId||null,date:v.date,start:v.start,end:v.end,reason:required(v.reason,'o motivo da indisponibilidade')};s.unavailable.push(record);validateAllBookings(s);audit(s,c,{current:record});break;
    }
    case 'REMOVE_UNAVAILABLE':{
      manager(c);const at=s.unavailable.findIndex(u=>u.id===c.unavailableId);if(at<0)fail('Indisponibilidade não encontrada.');const previous=s.unavailable[at];s.unavailable.splice(at,1);audit(s,c,{previous});break;
    }
    case 'UPSERT_SERVICE':case 'UPDATE_SERVICE':{
      manager(c);const v=c.service;if(!v||typeof v!=='object')fail('Informe o serviço.');const id=identifier(v.id,'Serviço');integer(v.priceCents,'Preço');integer(v.durationMinutes,'Duração',1,720);integer(v.bufferMinutes,'Preparação',0,240);if(!Array.isArray(v.requiredResourceIds)||new Set(v.requiredResourceIds).size!==v.requiredResourceIds.length||v.requiredResourceIds.some(id=>!s.resources.some(r=>r.id===id)))fail('Recursos do serviço inválidos.');const record={id,name:required(v.name,'o nome do serviço'),kind:v.kind==='addon'?'addon':'service',priceCents:v.priceCents,durationMinutes:v.durationMinutes,bufferMinutes:v.bufferMinutes,requiredResourceIds:[...v.requiredResourceIds],recipe:validateRecipe(s,v.recipe||[])};const old=s.services.find(x=>x.id===id);if(old)Object.assign(old,record);else s.services.push(record);audit(s,c,{serviceId:id,previous:state.services.find(x=>x.id===id)||null,current:record});break;
    }
    case 'UPSERT_INVENTORY':{
      manager(c);const v=c.inventory;if(!v||typeof v!=='object')fail('Informe o item de estoque.');const id=identifier(v.id,'Item');const old=s.inventory.find(i=>i.id===id);if(!['product','supply'].includes(v.kind)||!['un','ml','g'].includes(v.unit)||v.kind==='product'&&v.unit!=='un')fail('Mercadorias usam unidades; insumos podem usar un, ml ou g.');if(old&&(old.unit!==v.unit||old.kind!==v.kind))fail('Não altere unidade ou finalidade de item existente.');const physical=quantity(v.physical??old?.physical??0,'Estoque físico',v.unit),min=quantity(v.min??old?.min??0,'Estoque mínimo',v.unit);if(old&&physical!==old.physical)fail('Use ajuste ou contagem com motivo para alterar o saldo.');const costCents=v.costCents??old?.costCents??0;if(!Number.isFinite(costCents)||costCents<0||costCents>1e8||Math.abs(costCents*1000-Math.round(costCents*1000))>1e-7)fail('Custo unitário inválido.');const priceCents=v.kind==='product'?integer(v.priceCents,'Preço de venda',1):0;const barcode=text(v.barcode,31);if(barcode.length>30||barcode&&!/^[a-zA-Z0-9._-]+$/.test(barcode))fail('Código de barras inválido.');if(barcode&&s.inventory.some(i=>i.id!==id&&i.barcode===barcode))fail('Código de barras já cadastrado.');const expiryEnabled=v.expiryEnabled===true,expiryDate=v.expiryDate?validDate(v.expiryDate,'a validade'):null;if(expiryEnabled&&!expiryDate)fail('Informe a validade deste item.');if(old&&(old.physical||old.reserved)&&(old.expiryEnabled!==expiryEnabled||old.expiryDate!==expiryDate))fail('Esvazie e confira o estoque antes de alterar sua validade.');const record={id,name:required(v.name,'o nome do item'),kind:v.kind,unit:v.unit,physical,reserved:old?.reserved||0,min,costCents,priceCents,barcode,expiryEnabled,expiryDate};if(old)Object.assign(old,record);else{s.inventory.push(record);if(physical)move(s,c,record,'initial',physical,{physicalDelta:physical});}audit(s,c,{inventoryId:id,previous:state.inventory.find(i=>i.id===id)||null,current:record});break;
    }
    case 'ADJUST_STOCK':case 'COUNT_STOCK':case 'LOSS_STOCK':{
      manager(c);const i=stockFor(s,c.inventoryId),reason=required(c.reason,'o motivo do movimento');let delta;if(c.type==='COUNT_STOCK')delta=quantity(c.quantity,'Quantidade contada',i.unit)-i.physical;else if(c.type==='LOSS_STOCK'){const q=quantity(c.quantity,'Quantidade perdida',i.unit);if(!q)fail('Informe perda positiva.');delta=-q;}else{if(!Number.isFinite(c.quantity)||!c.quantity)fail('Informe ajuste diferente de zero.');quantity(Math.abs(c.quantity),'Quantidade do ajuste',i.unit);delta=c.quantity;}
      if(delta>0&&i.expiryEnabled){const expiryDate=c.expiryDate?validDate(c.expiryDate,'a validade'):i.expiryDate;if(!expiryDate)fail('Informe a validade da entrada.');if(i.physical>0&&expiryDate!==i.expiryDate)fail('Validade diferente exige cadastro/lote separado nesta demonstração.');if(i.physical===0)i.expiryDate=expiryDate;}
      const physical=roundQty(i.physical+delta);quantity(physical,'Saldo final',i.unit);if(physical<i.reserved)fail('Movimento não pode comprometer estoque reservado.');i.physical=physical;move(s,c,i,c.type==='COUNT_STOCK'?'count':c.type==='LOSS_STOCK'?'loss':'adjust',delta,{physicalDelta:delta,reason});audit(s,c,{inventoryId:i.id,quantity:delta,reason});break;
    }
    case 'SET_BUSINESS_DATE':{
      manager(c);const d=validDate(c.businessDate,'a data de referência');if(s.inventory.some(i=>i.reserved&&expired(s,i,d)))fail('A nova data venceria itens reservados. Regularize os atendimentos primeiro.');s.businessDate=d;audit(s,c,{businessDate:d});break;
    }
    case 'CLOSE_SHIFT':{
      manager(c);open(s);if(s.orders.some(o=>isDue(s,o)&&(isOperationalOpen(o)||petOrderTotals(s,o).balanceCents>0)))fail('Existem atendimentos, vendas ou contas exigíveis em aberto.');if(s.orders.some(o=>petOrderTotals(s,o).refundDueCents>0))fail('Existem devoluções financeiras pendentes.');const totals=petReport(s);s.shift.status='closed';s.shift.closedAt=now();s.shift.totals=totals;audit(s,c);break;
    }
    case 'OPEN_SHIFT':{
      manager(c);if(s.shift.status!=='closed')fail('O turno atual já está aberto.');s.shifts.push(structuredClone(s.shift));s.shift={id:`turno-${s.shifts.length+1}`,status:'open',openedAt:now(),closedAt:null};audit(s,c);break;
    }
    default:fail('Operação não reconhecida.');
  }
  validateTotals(s);Object.defineProperty(s.processedCommands,c.id,{value:sig,enumerable:true,writable:true,configurable:true});s.revision=(s.revision||0)+1;return s;
}
