const DAY = 86400000;
export const scope = { companyId: 'skye-hotel-demo', propertyId: 'pousada-nuvens' };
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function dateNumber(value) {
  const n = Date.parse(value + 'T00:00:00Z');
  requireValue(/^\d{4}-\d\d-\d\d$/.test(value) && Number.isFinite(n) && new Date(n).toISOString().slice(0,10) === value, 'Data inválida.');
  return n;
}
export function dates(start, end) {
  const a = dateNumber(start), b = dateNumber(end);
  requireValue(b > a && b - a <= 366 * DAY, 'Informe uma saída posterior à chegada, em até 366 noites.');
  return Array.from({length:(b-a)/DAY}, (_, i) => new Date(a+i*DAY).toISOString().slice(0,10));
}
export function nextDate(day, count=1) { return new Date(dateNumber(day)+count*DAY).toISOString().slice(0,10); }
export function createHotelDemoState() {
  const categories = ['Standard','Superior','Família'].map((name,i)=>({id:String(i+1),name,capacity:i+2}));
  return {schemaVersion:1,...scope,businessDate:'2026-11-28',categories,
    plans:categories.map((c,i)=>({id:'flex-'+c.id,categoryId:c.id,name:'Flexível',price:25000+i*10000})),
    rooms:categories.flatMap(c=>[1,2,3,4].map(n=>({id:c.id+'0'+n,categoryId:c.id,cleaning:'Limpo'}))),
    reservations:[],blocks:[],receipts:[],history:[],outbox:[],processed:[],
    channel:{...scope,environment:'simulation',channelId:'booking-demo',propertyCode:'DEMO-NUVENS',
      mapping:categories.map(c=>({categoryId:c.id,externalCategory:'CAT-'+c.id,planId:'flex-'+c.id,externalPlan:'FLEX-'+c.id}))}};
}
const overlaps = (a,b) => a.start < b.end && b.start < a.end;
const active = r => ['Confirmada','Hospedado'].includes(r.status);
function commitments(s,cat) {
  return [...s.blocks.filter(b=>s.rooms.some(q=>q.id===b.room && q.categoryId===cat)),
    ...s.reservations.filter(r=>active(r) && r.unit.categoryId===cat).map(r=>({start:r.start,end:r.end,room:r.unit.room}))];
}
// Search an assignment for every floating stay. A room stays fixed across all its nights.
function feasible(s,cat) {
  const rooms=s.rooms.filter(q=>q.categoryId===cat), stays=commitments(s,cat);
  const calendars=new Map(rooms.map(q=>[q.id,[]]));
  for (const stay of stays.filter(x=>x.room)) {
    const list=calendars.get(stay.room);
    if (!list || list.some(x=>overlaps(x,stay))) return false;
    list.push(stay);
  }
  const floating=stays.filter(x=>!x.room).sort((a,b)=>a.start.localeCompare(b.start));
  function fit(i) {
    if(i===floating.length) return true;
    const stay=floating[i], seen=new Set();
    for(const list of calendars.values()){
      if(list.some(x=>overlaps(x,stay))) continue;
      const future=JSON.stringify(list.filter(x=>x.end>stay.start).map(x=>[x.start,x.end]).sort());
      if(seen.has(future)) continue;
      seen.add(future);list.push(stay);
      if(fit(i+1)) return true;
      list.pop();
    }
    return false;
  }
  return fit(0);
}
export function inventory(s,cat,day) {
  return s.rooms.filter(q=>q.categoryId===cat).length-commitments(s,cat).filter(x=>x.start<=day && day<x.end).length;
}
export function totals(s,r) {
  const lodging=r.unit.rates.reduce((a,n)=>a+n.price,0);
  const extras=r.items.reduce((a,n)=>a+n.amount,0);
  const paid=s.receipts.filter(x=>x.reservationId===r.id).reduce((a,n)=>a+n.amount,0);
  const total=r.status==='Cancelada'?0:lodging+extras;
  return {lodging,extras,total,paid,balance:total-paid-(r.collector==='ota'&&r.status!=='Cancelada'?lodging:0)};
}
function amount(value) { requireValue(Number.isSafeInteger(value)&&value>0&&value<=100000000,'Valor fora do limite.'); return value; }
function label(value) { requireValue(typeof value==='string'&&value.trim(),'Preencha os campos obrigatórios.');return value.trim(); }
function saveGuest(s, data, id){
 const name=label(data.name);
 const birth=data.birth||'';
 if(birth)requireValue(dateNumber(birth)<=dateNumber(s.businessDate),'Nascimento posterior à data de operação.');
 const record={id,name,birth,contact:String(data.contact||'').trim().slice(0,120),loyalty:data.loyalty==='on',birthdayConsent:data.birthdayConsent==='on'};
 requireValue(name.length<=100,'Nome longo demais.');
 s.guests=(s.guests||[]).filter(g=>g.id!==id).concat(record);
 return record;
}
function scheduleBirthdays(s){
 const day=s.businessDate, year=day.slice(0,4);
 s.birthdayMessages??=[];
 for(const g of s.guests||[]){
  if(!g.birthdayConsent||!g.contact||!g.birth||g.birth.slice(5)!==day.slice(5))continue;
  if(s.birthdayMessages.some(m=>m.guestId===g.id&&m.year===year))continue;
  s.birthdayMessages.push({guestId:g.id,year,day,text:`Feliz aniversário, ${g.name}! A Pousada Nuvens deseja um ótimo dia.`,status:'Simulada'});
 }
}
export function dispatchHotel(old,c) {
  const id=label(c.id);
  if(old.processed.includes(id)) return old;
  const s=structuredClone(old), manager=c.actor==='Gestão';
  requireValue(manager || (c.actor==='Limpeza'?c.type==='clean':c.actor==='Recepção'&&['guest','reserve','change','checkin','checkout','consume','receive','cancel'].includes(c.type)), 'Ação indisponível para este perfil.');
  const r=s.reservations.find(x=>x.id===c.reservationId);
  const q=s.rooms.find(x=>x.id===c.room);
  if(['change','checkin','checkout','receive','consume','cancel','refund'].includes(c.type)) requireValue(r,'Reserva não encontrada.');
  let audit=c.note?.trim()||'';
  switch(c.type){
    case 'guest': {
      const existing=(s.guests||[]).find(g=>g.id===c.guestId);
      requireValue(!c.guestId||existing,'Cadastro não encontrado.');
      saveGuest(s,c,existing?.id||id);break;
    }
    case 'simulate':
    case 'reserve':
    case 'change': {
      const modifying=c.type==='change';
      requireValue(!modifying || r.status==='Confirmada','Apenas reservas confirmadas podem ser alteradas.');
      const start=c.start,end=c.end,nights=dates(start,end),cat=s.categories.find(x=>x.id===c.categoryId);
      requireValue(start>=s.businessDate,'Chegada anterior à data de operação.');
      const plan=s.plans.find(p=>p.id===c.planId && p.categoryId===cat?.id);
      requireValue(cat && plan,'Categoria e plano incompatíveis.');
      requireValue(Number.isInteger(c.people)&&c.people>=1&&c.people<=cat.capacity,'Capacidade excedida ou inválida.');
      requireValue(!c.room||q?.categoryId===cat.id,'Quarto incompatível.');
      if(c.type==='simulate'){
        label(c.externalId);
        requireValue(!s.reservations.some(x=>x.externalId===c.externalId),'Código externo já importado.');
      }
      const booking=modifying?r:{...scope,id:id,guest:label(c.guest),status:'Confirmada',items:[],
        source:c.type==='simulate'?'Canal simulado':'Direta',externalId:c.type==='simulate'?c.externalId:null};
      if(!modifying&&c.type==='reserve'){
        const guest=(s.guests||[]).find(g=>g.id===c.guestId);
        requireValue(!c.guestId||guest,'Cadastro não encontrado.');
        requireValue(c.promo!=='on'||guest?.loyalty,'Selecione um hóspede participante da fidelidade.');
        if(guest){booking.guestId=guest.id;booking.guest=guest.name;}
        if(c.promo==='on')booking.discountPercent=10;
      }
      const nightlyPrice=Math.round(plan.price*(100-(booking.discountPercent||0))/100);
      const previous=booking.unit;
      booking.start=start;booking.end=end;
      booking.unit={id:previous?.id||id+'-1',categoryId:cat.id,planId:plan.id,room:c.room||null,people:c.people,
        rates:nights.map(day=>({day,price:(previous?.planId===plan.id && previous.rates.find(x=>x.day===day)?.price)||nightlyPrice}))};
      if(!modifying)s.reservations.push(booking);
      requireValue(feasible(s,cat.id),'Sem disponibilidade durante toda a estadia.');
      audit=[booking.guest,start,end,cat.name,c.room||'Sem atribuição'].join(' · ');
      break;
    }
    case 'block':
      requireValue(q,'Quarto inválido.');dates(c.start,c.end);label(c.note);
      requireValue(c.start>=s.businessDate,'Bloqueio anterior à data de operação.');
      s.blocks.push({id,room:q.id,start:c.start,end:c.end,note:c.note});
      requireValue(feasible(s,q.categoryId),'Bloqueio conflita com estadias ou manutenção.');break;
    case 'unblock':
      requireValue(s.blocks.some(x=>x.id===c.blockId),'Bloqueio não encontrado.');
      s.blocks=s.blocks.filter(x=>x.id!==c.blockId);break;
    case 'checkin': {
      const room=s.rooms.find(x=>x.id===r.unit.room);
      requireValue(r.status==='Confirmada'&&r.start<=s.businessDate&&s.businessDate<r.end,'Confira o período e a situação da reserva.');
      requireValue(room?.cleaning==='Limpo'&&!s.reservations.some(x=>x.status==='Hospedado'&&x.unit.room===room.id),'Atribua um quarto limpo e desocupado.');
      if(c.name!==undefined){
        const guestId=c.guestId||r.guestId;
        requireValue(!guestId||(s.guests||[]).some(g=>g.id===guestId),'Cadastro não encontrado.');
        const guest=saveGuest(s,c,guestId||id);
        r.guestId=guest.id;r.guest=guest.name;
        r.checkin={day:s.businessDate,guestId:guest.id,people:r.unit.people};
      }
      r.status='Hospedado';break;
    }
    case 'checkout':
      requireValue(r.status==='Hospedado'&&totals(s,r).balance===0,'Quite a conta e os estornos antes da saída.');
      r.status='Encerrada';s.rooms.find(x=>x.id===r.unit.room).cleaning='A preparar';break;
    case 'clean':
      requireValue(q&&!s.reservations.some(x=>x.status==='Hospedado'&&x.unit.room===q.id),'Quarto ocupado ou inválido.');
      requireValue(['A preparar','Em limpeza','Limpo'].includes(c.cleaning),'Situação inválida.');
      q.cleaning=c.cleaning;audit=q.id+' · '+q.cleaning;break;
    case 'consume':
      requireValue(active(r),'Conta encerrada.');r.items.push({id,name:label(c.note),amount:amount(c.amount)});break;
    case 'receive':
      requireValue(active(r)&&amount(c.amount)<=totals(s,r).balance,'Valor excede o saldo ou a conta está encerrada.');
      requireValue(['Sinal','Pagamento'].includes(c.kind)&&['Pix','Dinheiro','Cartão'].includes(c.method),'Escolha tipo e forma de recebimento.');
      s.receipts.push({id,reservationId:r.id,day:s.businessDate,amount:c.amount,kind:c.kind,method:c.method});break;
    case 'cancel':
      requireValue(r.status==='Confirmada','Somente reservas confirmadas podem ser canceladas.');label(c.note);r.status='Cancelada';break;
    case 'refund':
      requireValue(amount(c.amount)<=-totals(s,r).balance,'Estorno excede o crédito do hóspede.');label(c.note);
      s.receipts.push({id,reservationId:r.id,day:s.businessDate,amount:-c.amount,kind:'Estorno',method:'Devolução',note:c.note});break;
    case 'date':dateNumber(c.day);requireValue(c.day>=s.businessDate,'A data operacional só pode avançar.');s.businessDate=c.day;break;
    case 'rate': {
      const plan=s.plans.find(p=>p.id===c.planId);requireValue(plan,'Plano inválido.');plan.price=amount(c.amount);break;
    }
    case 'sync':
      for(const event of s.outbox.filter(x=>x.status==='Pendente')) event.status='Processado localmente';
      break;
    default: throw new Error('Operação desconhecida.');
  }
  if(['reserve','simulate','change','cancel','checkout','block','unblock','rate'].includes(c.type))
    s.outbox.push({...scope,id,type:c.type,reservationId:r?.id||(['simulate','reserve'].includes(c.type)?id:null),status:'Pendente'});
  s.history.push({id,day:s.businessDate,actor:c.actor,type:c.type,target:r?.id||c.room||'',note:audit});
  if(['guest','checkin','date'].includes(c.type))scheduleBirthdays(s);
  s.processed.push(id);return s;
}
