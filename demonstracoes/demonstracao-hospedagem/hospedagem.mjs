import {openRequestedGuide} from './src/shared.mjs';
import { inventory, totals, nextDate } from './src/hotel-domain.mjs';
import { createHotelStore, HOTEL_STORAGE_KEY } from './src/hotel-storage.mjs';
const connected=location.port==='4175'&&new URLSearchParams(location.search).has('conector');
async function backend(path,command){
 const response=await fetch('/connector/'+path,command?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(command)}:{});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Conector indisponível.');return result;
}
const store=connected?{read:()=>backend('state'),transact:c=>backend('command',c)}:createHotelStore(), main=document.querySelector('#hotel'),sheet=document.querySelector('#sheet'), editor=document.querySelector('#editor'), role=document.querySelector('#role');
let s=await store.read(), tab='Calendário', calendarDay=s.businessDate, period=s.businessDate, opened='',pending='',target='',timer;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const day=d=>d.split('-').reverse().join('/');
const cat=id=>s.categories.find(x=>x.id===id)?.name;
const btn=(name,action,id='',primary=false)=>`<button type="button" class="hotel-btn ${primary?'main':''}" data-action="${action}" data-id="${esc(id)}">${esc(name)}</button>`;
const empty=text=>`<p class="hotel-muted">${esc(text)}</p>`;
const panel=(title,body)=>`<section class="hotel-panel"><h3>${esc(title)}</h3>${body}</section>`;
const selected=()=>s.reservations.find(r=>r.id===opened);
const active=r=>['Confirmada','Hospedado'].includes(r.status);
const labelAction={guest:'Cadastro de hóspede',reviseExternal:'Simular alteração de datas',cancelExternal:'Simular cancelamento no canal',settle:'Conciliar repasse',reserve:'Nova reserva',simulate:'Importar reserva simulada',change:'Alterar reserva / atribuir quarto',checkin:'Check-in',checkout:'Check-out',consume:'Lançar consumo',receive:'Receber valor',cancel:'Cancelar reserva',refund:'Estornar crédito',block:'Bloquear quarto',unblock:'Liberar bloqueio',clean:'Atualizar limpeza',date:'Avançar data',rate:'Alterar diária',sync:'Processar fila local',reset:'Reiniciar hospedagem'};
let guestQuery='',statusFilter='';
function filteredReservations(){
 const query=guestQuery.trim().toLocaleLowerCase('pt-BR');
 return list(s.reservations.filter(r=>(!statusFilter||r.status===statusFilter)&&[r.guest,r.externalId,r.unit.room].some(v=>String(v??'').toLocaleLowerCase('pt-BR').includes(query))).reverse());
}
function reservationSearch(){
 return `<div class="hotel-actions hotel-filters"><label>Hóspede, código ou quarto <input type="search" id="guest-search" value="${esc(guestQuery)}"></label>${select('Situação','reservationStatus',[['','Todas'],...choices(['Confirmada','Hospedado','Encerrada','Cancelada'])],statusFilter)}</div><div id="res-results" aria-live="polite">${filteredReservations()}</div>`;
}
function list(rows){return rows.length?rows.map(r=>`<div class="hotel-row"><div><b>${esc(r.guest)}</b><br>${day(r.start)} a ${day(r.end)} · ${cat(r.unit.categoryId)} · ${r.unit.room?'Quarto '+r.unit.room:'A atribuir'} · ${r.status}</div>${btn('Abrir conta e reserva','detail',r.id)}</div>`).join(''):empty('Nenhuma reserva neste grupo.');}
function reservationActions(r){
 const t=totals(s,r),confirmed=r.status==='Confirmada';
 let actions=confirmed?['change','checkin','cancel']:[];
 if(r.status==='Hospedado')actions.push('checkout');
 if(active(r))actions.push('consume','receive');
 if(t.balance<0&&role.value==='Gestão')actions.push('refund');
 const external=s.connector?.bookings.find(b=>b.reservationId===r.id);
 if(external){
   actions=actions.filter(a=>a!=='cancel'&&(a!=='receive'||(external.collector!=='unknown'&&t.balance>0)));
   if(confirmed&&role.value==='Gestão')actions.push('reviseExternal','cancelExternal');
   if(!external.cancelled&&external.expected>external.actual&&role.value==='Gestão')actions.push('settle');
 }
 return actions;
}
function detail(r){
 return bookingDetail(r,totals(s,r),s.connector?.bookings.find(b=>b.reservationId===r.id),reservationActions(r));
}
function bookingDetail(r,t,external,actions){
 const rows=values=>`<dl class="stay-fields">${values.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
 const stay=[['Chegada',day(r.start)],['Saída',day(r.end)],['Quarto',r.unit.room||'A atribuir'],['Categoria',cat(r.unit.categoryId)],['Hóspedes',r.unit.people],['Origem',[r.source,r.externalId].filter(Boolean).join(' · ')]];
 if(r.discountPercent)stay.push(['Tarifa fidelidade',`−${r.discountPercent}% nas diárias`]);
 if(r.checkin)stay.push(['Ficha de check-in',`Concluída em ${day(r.checkin.day)}`]);
 const values=[['Diárias',money(t.lodging)],['Consumos',money(t.extras)],['Total',money(t.total)],[external?'Recebido do hóspede':'Recebido líquido',money(t.paid)]];
 const balance=t.balance<0?'Crédito a devolver':external?'Saldo do hóspede':'Saldo';
 const channel=external?`<h4>Cobrança pelo canal ou pela hospedagem</h4>${rows([
   ['Responsável',({ota:'Canal',property:'Hospedagem',unknown:'A conferir'})[external.collector]],
   ['Comissão',external.commission==null?'Pendente':money(external.commission)],
   ['Repasse previsto',external.expected==null?'Pendente':money(external.expected)],
   ['Repasse efetivo',money(external.actual)]
 ])}`:'';
 const entries=[
   ...r.unit.rates.map(n=>[day(n.day),money(n.price)]),
   ...r.items.map(x=>[x.name,money(x.amount)]),
   ...s.receipts.filter(x=>x.reservationId===r.id).map(x=>[[day(x.day),x.kind,x.method].join(' · '),money(x.amount)])
 ];
 return `<section class="hotel-panel stay-detail" aria-label="Detalhes da reserva">
 <header class="stay-header"><div><p class="hotel-muted">Reserva</p><h2>${esc(r.guest)}</h2></div><span class="stay-status" data-status="${esc(r.status)}">${esc(r.status)}</span></header>
 <section><h3>Estadia</h3>${rows(stay)}</section>
 <section><h3>Conta da estadia</h3>${rows(values)}<div class="stay-balance"><span>${balance}</span><strong>${money(Math.abs(t.balance))}</strong></div>${channel}
 <details class="stay-entries"><summary>Diárias, consumos e recebimentos</summary>${rows(entries)}</details></section>
 <div class="hotel-actions stay-actions">${actions.map(a=>btn(labelAction[a],a,r.id,['receive','checkin'].includes(a))).join('')}${btn('Voltar','back')}</div></section>`;
}

function roomCards(rooms,date=s.businessDate,cleaning=false){
 if(!rooms.length)return empty('Todos os quartos estão limpos.');
 const today=date===s.businessDate;
 return `<section class="room-overview"><h3>Quartos em ${day(date)}</h3><p class="hotel-muted">A tabela por categoria inclui as reservas sem quarto atribuído.</p><div class="room-grid">${rooms.map(q=>{
  const occupied=today&&s.reservations.some(r=>r.status==='Hospedado'&&r.unit.room===q.id);
  const reserved=s.reservations.some(r=>active(r)&&r.unit.room===q.id&&r.start<=date&&date<r.end);
  const blocked=s.blocks.some(b=>b.room===q.id&&b.start<=date&&date<b.end);
  const [tone,status]=occupied?['occupied','Ocupado']:blocked?['blocked','Manutenção']:reserved?['reserved','Reservado']:['free','Sem reserva atribuída'];
  const capacity=s.categories.find(c=>c.id===q.categoryId).capacity;
  return `<article class="room-card ${tone}"><header><span class="room-house" aria-hidden="true"></span><div><h4>Quarto ${q.id}</h4><p>${cat(q.categoryId)}</p></div></header><span class="room-chip">${status}</span><div class="room-capacity"><span class="room-people" aria-hidden="true">${'<i></i>'.repeat(capacity)}</span>Até ${capacity} pessoas</div>${today?`<p class="room-clean">Limpeza · ${q.cleaning}</p>`:''}${cleaning&&!occupied&&role.value!=='Recepção'?btn('Atualizar limpeza','clean',q.id):''}</article>`;
 }).join('')}</div></section>`;
}
function prep(rooms){return roomCards(rooms,s.businessDate,true);}
function map(){
 const days=Array.from({length:7},(_,i)=>nextDate(period,i));
 const bookings=s.reservations.filter(r=>active(r)&&r.start<=days.at(-1)&&r.end>period);
 return `<label>Período de sete noites a partir de <input type="date" id="period" value="${period}"></label>`+panel('Disponibilidade por categoria e noite',`<div class="hotel-table"><table><thead><tr><th>Categoria</th>${days.map(d=>`<th>${day(d).slice(0,5)}</th>`).join('')}</tr></thead><tbody>${s.categories.map(c=>`<tr><th>${c.name}</th>${days.map(d=>`<td>${inventory(s,c.id,d)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)+roomCards(s.rooms,period)+`<div class="desktop-map">${panel('Mapa de acomodações',`<div class="hotel-table"><table><thead><tr><th>Quarto</th>${days.map(d=>`<th>${day(d).slice(0,5)}</th>`).join('')}</tr></thead><tbody>${s.rooms.map(q=>`<tr><th>${q.id}</th>${days.map(d=>{const r=bookings.find(x=>x.unit.room===q.id&&x.start<=d&&d<x.end),block=s.blocks.some(x=>x.room===q.id&&x.start<=d&&d<x.end);return `<td class="${r||block?'busy':''}">${r?esc(r.guest):block?'Manutenção':'Livre'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`)}</div><div class="mobile-agenda">${panel('Chegadas e saídas no período',list(s.reservations.filter(r=>r.status!=='Cancelada'&&(days.includes(r.start)||days.includes(r.end))).sort((a,b)=>a.start.localeCompare(b.start))))}</div>`+panel('Reservas a atribuir',list(bookings.filter(r=>!r.unit.room)));
}
function guestsPanel(){
 return panel('Cadastro de hóspedes',`<p>Use somente dados fictícios. Hóspedes participantes podem escolher a tarifa fidelidade de 10% em reservas diretas.</p>${btn('Novo hóspede','guest', '',true)}${(s.guests||[]).map(g=>`<div class="hotel-row"><div><strong>${esc(g.name)}</strong><br>${g.loyalty?'Participante da fidelidade':'Cadastro padrão'} · ${(s.reservations.filter(r=>r.guestId===g.id)).length} reserva(s)</div>${btn('Editar cadastro','guest',g.id)}</div>`).join('')}`)+panel('Mensagens de aniversário · simulação',`<p>A data de operação gera uma mensagem por hóspede e ano para quem autorizou o contato. O histórico fica nesta demonstração.</p>${(s.birthdayMessages||[]).slice().reverse().map(m=>`<p>${day(m.day)} · ${esc(m.text)} · ${m.status}</p>`).join('')||empty('Nenhuma mensagem simulada para aniversários.')}`);
}
function guestFields(g,name){
 return `${field('Nome completo',name,'text',g?.name||'')}<label>Contato fictício <input name="contact" maxlength="120" value="${esc(g?.contact||'')}"></label><label>Data de nascimento <input type="date" name="birth" max="${s.businessDate}" value="${esc(g?.birth||'')}"></label><label><span><input type="checkbox" name="loyalty" ${g?.loyalty?'checked':''}> Participa da fidelidade</span></label><label><span><input type="checkbox" name="birthdayConsent" ${g?.birthdayConsent?'checked':''}> Autoriza mensagens de aniversário</span></label>`;
}
function calendar(){
 const first=calendarDay.slice(0,7)+'-01';
 const weekday=new Date(first+'T12:00:00Z').getUTCDay();
 const start=nextDate(first,-weekday);
 const month=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(first+'T12:00:00Z'));
 const sameMonth=date=>date.slice(0,7)===first.slice(0,7);
 const activeReservations=s.reservations.filter(active);
 const daily=date=>activeReservations.filter(r=>r.start<=date&&date<=r.end);
 const cells=Array.from({length:42},(_,i)=>nextDate(start,i));
 while(!sameMonth(cells.at(-7)))cells.splice(-7);
 const cards=daily(calendarDay).map(r=>{
  const event=r.end===calendarDay?'Saída':r.start===calendarDay?'Chegada':'Estadia';
  const actions=reservationActions(r).filter(a=>a!=='checkin'||calendarDay===s.businessDate&&r.start<=calendarDay&&calendarDay<r.end);
  return `<article class="hotel-row agenda-row"><div><strong>${esc(r.guest)}</strong><p>${event} · ${esc(r.status)} · ${r.unit.room?'Quarto '+esc(r.unit.room):'Quarto a atribuir'}</p></div><div class="hotel-actions">${btn('Abrir conta e reserva','detail',r.id)}${actions.map(a=>btn(labelAction[a],a,r.id)).join('')}</div></article>`;
 }).join('');
 return `<div class="agenda-layout"><section class="hotel-panel calendar-panel" aria-label="Calendário mensal"><div class="calendar-toolbar">${btn('Mês anterior','calendar-prev')}<h3>${month}</h3>${btn('Próximo mês','calendar-next')}</div>
 <div class="calendar-grid">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<span class="calendar-weekday">${d}</span>`).join('')}${cells.map(date=>{
  const count=daily(date).length;
  return `<button type="button" class="calendar-day ${sameMonth(date)?'':'other-month'}" data-action="calendar-day" data-id="${date}" aria-pressed="${date===calendarDay}" ${date===s.businessDate?'aria-current="date"':''} aria-label="${day(date)}, ${count} ${count===1?'reserva':'reservas'}"><strong>${Number(date.slice(-2))}</strong>${count?`<small>${count}</small>`:''}</button>`;
 }).join('')}</div><div class="hotel-actions calendar-tools">${btn('Dia de operação','calendar-today')}<label>Ir para a data <input type="date" id="calendar-date" value="${calendarDay}"></label></div></section>
 <section class="hotel-panel calendar-agenda"><div class="calendar-toolbar"><h3>Agenda de ${day(calendarDay)}</h3>${calendarDay>=s.businessDate?btn('Reservar nesta data','calendar-reserve','',true):''}</div>
 <p class="hotel-muted">Chegadas, estadias e saídas previstas. O número no calendário mostra as reservas ativas do dia.</p>
 ${calendarDay>=s.businessDate?`<div class="calendar-availability" aria-label="Disponibilidade por categoria">${s.categories.map(c=>`<span>${esc(c.name)} <strong>${inventory(s,c.id,calendarDay)}</strong></span>`).join('')}</div>`:''}
 ${cards||empty('Nenhuma reserva nesta data.')}</section></div>`;
}
function render(){
 const cleaning=role.value==='Limpeza',manager=role.value==='Gestão',tabs=cleaning?['Hoje','Quartos']:['Calendário','Hoje','Reservas','Mapa','Quartos',...(!connected?['Hóspedes']:[]),...(manager?['Tarifas','Canais','Histórico']:[])];
 if(!tabs.includes(tab))tab='Hoje';
 const dirty=s.rooms.filter(q=>q.cleaning!=='Limpo'),arrivals=s.reservations.filter(r=>r.status==='Confirmada'&&r.start===s.businessDate),departures=s.reservations.filter(r=>r.status==='Hospedado'&&r.end<=s.businessDate);
 let content='';
 if(tab==='Calendário')content=selected()?detail(selected()):calendar();
 else if(tab==='Hoje'){
 const groups=cleaning?[]:[['Chegadas',arrivals],['Saídas previstas ou vencidas',departures],['Contas com saldo ou crédito',s.reservations.filter(r=>totals(s,r).balance!==0)]];
 content=`<div class="hotel-grid">${[...groups,['Quartos a preparar',dirty]].map(([name,rows])=>`<div class="hotel-card"><h3>${name}</h3><strong>${rows.length}</strong></div>`).join('')}</div>`+groups.map(([name,rows])=>panel(name,list(rows))).join('')+panel('Preparação',prep(dirty));
 }else if(tab==='Reservas')content=selected()?detail(selected()):reservationSearch();
 else if(tab==='Hóspedes')content=guestsPanel();
 else if(tab==='Mapa')content=map();
 else if(tab==='Quartos')content=prep(s.rooms)+panel('Manutenção', (manager?btn('Bloquear quarto','block'):'')+s.blocks.map(b=>`<p>Quarto ${b.room} · ${day(b.start)} a ${day(b.end)} · ${esc(b.note)} ${manager?btn('Liberar','unblock',b.id):''}</p>`).join(''));
 else if(tab==='Tarifas')content=s.plans.map(p=>panel(cat(p.categoryId),`<p>${p.name} · Até ${s.categories.find(c=>c.id===p.categoryId).capacity} pessoas · ${money(p.price)} por noite</p>${btn('Alterar diária','rate',p.id)}`)).join('');
 else if(tab==='Canais'&&connected)content=panel('Booking.com · fornecedor simulado',`<p>Worker local ativo enquanto o processo estiver em execução. As reservas recebidas aparecem em Reservas.</p><p>Última sincronização: ${s.connector.lastSuccess?new Date(s.connector.lastSuccess).toLocaleString('pt-BR'):'Aguardando'} · Pendências: ${s.connector.pending}</p><p>${esc(s.connector.error||'Sem erros registrados.')}</p>${btn('Importar reserva simulada','simulate')} ${btn('Solicitar reconciliação','sync')}`)+panel('Alterações locais',s.outbox.slice().reverse().map(e=>`<p>${esc(labelAction[e.type])} · ${esc(e.status)}</p>`).join('')||empty('Fila vazia.'));
 else if(tab==='Canais')content=panel('Simulação local de canal',`<p>Importe uma reserva fictícia por categoria e processe a fila de alterações neste navegador. A validação externa da Booking.com via Channex aguarda acesso autorizado ao ambiente de testes.</p><p>Propriedade ${s.channel.propertyCode} · Canal ${s.channel.channelId}</p>${s.channel.mapping.map(m=>`<p>${cat(m.categoryId)} · ${m.externalCategory} / ${m.externalPlan}</p>`).join('')}<div class="hotel-actions">${btn(labelAction.simulate,'simulate')}${btn(labelAction.sync,'sync')}</div>`)+panel('Fila de alterações',s.outbox.slice().reverse().map(e=>`<p>${esc(labelAction[e.type])} · ${e.status}</p>`).join('')||empty('Fila vazia.'));
 else content=panel('Histórico da pousada',s.history.slice().reverse().map(h=>`<p>${day(h.day)} · ${h.actor} · ${esc(labelAction[h.type])} · ${esc(h.note||h.target)}</p>`).join('')||empty('Nenhuma operação registrada.'));
 main.innerHTML=`<section class="hotel-title"><div><p class="eyebrow">POUSADA NUVENS · DEMONSTRAÇÃO</p><h1>${tab}</h1><p>Data de operação · ${day(s.businessDate)}</p></div><div class="hotel-actions">${cleaning?'':btn('Roteiro','guide')}${manager?btn('Avançar data','date'):''}${cleaning?'':btn('Nova reserva','reserve','',true)}</div></section><nav class="hotel-nav">${tabs.map(t=>`<button data-tab="${t}" aria-current="${t===tab?'page':'false'}">${t}</button>`).join('')}</nav>${content}<footer><a href="/#demonstracoes" target="_top">Central SKYE</a>${manager&&!connected?btn('Reiniciar hospedagem','reset'):''}</footer>`;
}
const field=(title,name,type='text',value='')=>`<label>${title}<input required name="${name}" type="${type}" value="${esc(value)}" ${type==='number'?'min="0.01" step="0.01"':''}></label>`;
const select=(title,name,opts,value)=>`<label>${title}<select name="${name}">${opts.map(([k,v])=>`<option value="${esc(k)}" ${k===value?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
const choices=arr=>arr.map(x=>[x,x]);
function hotelGuide(){
 pending='guide';
 const rate=s.plans.find(p=>p.id==='flex-1').price;
 editor.innerHTML=`<h2>Uma estadia na Pousada Nuvens</h2><ol class="guide"><li><strong>Reserve duas noites Standard.</strong> Use a data de operação e deixe o quarto a atribuir. Com a tarifa atual de ${money(rate)}, as diárias somam ${money(rate*2)}.</li><li><strong>Consulte o mapa.</strong> A reserva ocupa uma vaga em cada noite. Atribua um quarto Standard disponível e limpo e faça check-in.</li><li><strong>Confira a conta.</strong> No cenário inicial, registre R$ 150 como sinal e R$ 40 de frigobar. O total é R$ 540 e o saldo é R$ 390. Se a tarifa foi editada, confira os valores na conta.</li><li><strong>Quite o saldo e faça check-out.</strong> Em Hoje, o quarto aparece a preparar. Use o perfil Limpeza para marcá-lo como limpo.</li></ol><div class="hotel-actions">${btn('Abrir nova reserva','start-guide','',true)}${btn('Fechar','dismiss')}</div>`;
 sheet.showModal();
}
function show(action,id,reserveDate=s.businessDate){
 pending=action;target=id;
 const r=s.reservations.find(x=>x.id===id);
 let body='';
 if(action==='guest')body=guestFields((s.guests||[]).find(g=>g.id===id),'name');
 if(action==='checkin'&&!connected){
  const g=(s.guests||[]).find(x=>x.id===r.guestId);
  body=`<p>Quarto ${esc(r.unit.room||'a atribuir')} · ${r.unit.people} pessoa(s)</p>`+select('Cadastro existente','guestId',[['','Criar cadastro'],...(s.guests||[]).map(g=>[g.id,g.name])],r.guestId)+guestFields(g||{name:r.guest},'name');
 }
 if(['reserve','simulate','change'].includes(action)){
 body=(action==='change'||(connected&&action==='simulate')?'':field('Hóspede','guest'))+(action==='simulate'?field('Código externo fictício','externalId'):'')+field('Chegada','start','date',r?.start||reserveDate)+field('Saída','end','date',r?.end||nextDate(reserveDate,2))+select('Categoria e plano','planId',s.plans.map(p=>[p.id,cat(p.categoryId)+' · '+p.name+' · '+money(p.price)]),r?.unit.planId)+field('Pessoas','people','number',r?.unit.people||2)+(connected&&action==='simulate'?'':select('Acomodação','room',[['','Atribuir depois'],...s.rooms.map(q=>[q.id,'Quarto '+q.id+' · '+cat(q.categoryId)])],r?.unit.room));
 if(action==='reserve'&&!connected)body+=select('Hóspede cadastrado','guestId',[['','Nome avulso'],...(s.guests||[]).map(g=>[g.id,g.name])])+ '<label><span><input type="checkbox" name="promo"> Aplicar tarifa fidelidade · 10% nas diárias</span></label>';
 }else if(action==='receive')body=select('Lançamento','kind',choices(['Sinal','Pagamento']))+select('Forma','method',choices(['Pix','Dinheiro','Cartão']));
 if(['consume','receive','refund','rate'].includes(action))body+=field('Valor (R$)','amount','number',action==='receive'?Math.max(0,totals(s,r).balance)/100:'');
 if(['consume','refund','cancel','block'].includes(action))body+=field(action==='consume'?'Descrição':'Motivo','note');
 if(action==='block')body+=select('Quarto','room',s.rooms.map(q=>[q.id,q.id]))+field('Início','start','date',s.businessDate)+field('Fim','end','date',nextDate(s.businessDate));
 if(action==='clean')body+=select('Situação da limpeza','cleaning',choices(['Em limpeza','Limpo','A preparar']));
 if(action==='settle'){const b=s.connector.bookings.find(x=>x.reservationId===id);body=field('Referência do comprovante fictício','reference')+field('Valor (R$)','amount','number',(b.expected-b.actual)/100);}
 if(action==='reviseExternal')body=field('Chegada','start','date',r.start)+field('Saída','end','date',r.end);
 if(action==='date')body=field('Data de operação','day','date',nextDate(s.businessDate));
 if(action==='reset')body='<p>Apagar todos os registros da demonstração de hospedagem neste navegador?</p>';
 if(action==='checkout')body='<p>Encerrar a conta e encaminhar o quarto para limpeza? A saída antecipada mantém as diárias contratadas.</p>';
 editor.innerHTML=`<h2>${labelAction[action]}</h2>${body}<p role="alert"></p><div class="hotel-actions"><button class="hotel-btn main">Confirmar</button>${btn('Voltar','dismiss')}</div>`;
 if(editor.elements.planId&&editor.elements.room){
 const filter=()=>{const category=s.plans.find(p=>p.id===editor.elements.planId.value).categoryId;for(const option of editor.elements.room.options)option.disabled=!!option.value&&!s.rooms.some(q=>q.id===option.value&&q.categoryId===category);if(editor.elements.room.selectedOptions[0]?.disabled)editor.elements.room.value='';};
 editor.elements.planId.onchange=filter;filter();
 }
 if(editor.elements.guestId){
  editor.elements.guestId.onchange=()=>{
   const g=(s.guests||[]).find(x=>x.id===editor.elements.guestId.value);
   if(action==='reserve'){
    editor.elements.guest.readOnly=Boolean(g);
    if(g)editor.elements.guest.value=g.name;
   }
   if(action==='checkin'){
    editor.elements.name.value=g?.name||r.guest;
    editor.elements.contact.value=g?.contact||'';
    editor.elements.birth.value=g?.birth||'';
    editor.elements.loyalty.checked=Boolean(g?.loyalty);
    editor.elements.birthdayConsent.checked=Boolean(g?.birthdayConsent);
   }
  };
 }
 sheet.showModal();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.tab){tab=b.dataset.tab;opened='';render();return;}
 const action=b.dataset.action;if(!action)return;
 if(action==='guide'){hotelGuide();return;}
 if(action==='start-guide'){sheet.close();show('reserve','');return;}
 if(action==='dismiss'){sheet.close();return;}
 if(action==='calendar-day'||action==='calendar-today'){calendarDay=action==='calendar-day'?b.dataset.id:s.businessDate;render();return;}
 if(action==='calendar-prev'||action==='calendar-next'){
  const [year,month]=calendarDay.split('-').map(Number);
  calendarDay=new Date(Date.UTC(year,month-1+(action==='calendar-next'?1:-1),1)).toISOString().slice(0,10);render();return;
 }
 if(action==='calendar-reserve'){show('reserve','',calendarDay);return;}
 if(action==='detail'){tab=tab==='Calendário'?'Calendário':'Reservas';opened=b.dataset.id;render();return;}
 if(action==='back'){opened='';render();return;}
 show(action,b.dataset.id);
});
editor.onsubmit=async e=>{
 e.preventDefault();if(pending==='guide')return;const submit=editor.querySelector('button');if(submit.disabled)return;
 submit.disabled=true;
 try{
 const data=Object.fromEntries(new FormData(editor)),id=crypto.randomUUID();
 if(data.amount)data.amount=Math.round(Number(data.amount)*100);
 if(data.people)data.people=Number(data.people);
 if(data.planId)data.categoryId=s.plans.find(p=>p.id===data.planId).categoryId;
 if(pending==='clean')data.room=target;
 if(pending==='guest')data.guestId=target;
 if(pending==='rate')data.planId=target;
 s=pending==='reset'?await store.reset():await store.transact({...data,id,actor:role.value,type:pending,reservationId:target,blockId:target});
 if(pending==='simulate'&&connected){tab='Canais';opened='';}else if(pending==='reserve'&&tab==='Calendário'){calendarDay=data.start;opened='';}else if(['reserve','simulate'].includes(pending)){tab='Reservas';opened=id;}
 if(['date','reset'].includes(pending)){period=s.businessDate;calendarDay=s.businessDate;}
 sheet.close();render();const notice=document.querySelector('#notice');notice.textContent='Operação concluída.';clearTimeout(timer);timer=setTimeout(()=>notice.textContent='',2400);
 }catch(error){editor.querySelector('[role=alert]').textContent=error.message;}finally{submit.disabled=false;}
};
role.onchange=()=>{opened='';tab=role.value==='Limpeza'?'Hoje':'Calendário';render();};
main.oninput=e=>{if(e.target.id==='guest-search'){guestQuery=e.target.value;document.querySelector('#res-results').innerHTML=filteredReservations();}};
main.onchange=e=>{if(e.target.id==='calendar-date'&&e.target.value){calendarDay=e.target.value;render();return;}if(e.target.name==='reservationStatus'){statusFilter=e.target.value;document.querySelector('#res-results').innerHTML=filteredReservations();}if(e.target.id==='period'&&/^\d{4}-\d\d-\d\d$/.test(e.target.value)){period=e.target.value;render();}};
if(connected)setInterval(async()=>{if(sheet.open||document.activeElement?.closest('.hotel-filters'))return;try{const latest=await store.read();if(!sheet.open){s=latest;render();}}catch{document.querySelector('#notice').textContent='Worker indisponível. Confira o processo local.';}},5000);
window.addEventListener('storage',e=>{if(!connected&&e.key===HOTEL_STORAGE_KEY){s=store.read();render();}});
render();
if(!connected)openRequestedGuide(hotelGuide);
