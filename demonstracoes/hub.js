(()=>{'use strict';
const demos={
 acaiteria:{label:'Açaíteria modelo',caption:'Pedidos e personalização de produtos',url:'../demonstracao-acaiteria/',title:'Demonstração de açaíteria com dados fictícios'},
 equipes:{label:'Equipe de vendas',caption:'Carteira, rotas, visitas, cotações, recuperação e desempenho',url:'../demonstracao-equipes/',title:'Demonstração limitada de equipe de vendas com dados fictícios'},
 'corte-certo':{label:'Corte Certo · Distribuidoras',caption:'Clientes, cotações, pedidos e estoque por lotes · dados fictícios',url:'../demonstracao-corte-certo/sistema.html',fullscreen:'../demonstracao-corte-certo/',title:'Corte Certo: demonstração limitada para distribuidoras com dados fictícios'}
};
const shopLabels={mercadinho:'Mercadinho',tabacaria:'Tabacaria',agropecuaria:'Agropecuária'};
const contactOptions={
 acaiteria:['Quero ver isso na minha açaíteria','para açaíterias'],
 lojas:['Quero ver isso na minha loja','para lojas e comércio'],
 equipes:['Quero ver isso com minha equipe','para equipes de vendas'],
 'corte-certo':['Quero ver isso na minha distribuidora','para distribuidoras e atacado'],
 mercadinho:['Quero ver isso no meu mercadinho','para mercadinhos'],
 tabacaria:['Quero ver isso na minha tabacaria','para tabacarias'],
 agropecuaria:['Quero ver isso na minha agropecuária','para agropecuárias']
};
const contact=document.getElementById('hub-contact');
const whatsapp=window.SKYE_CONFIG?.whatsapp||'5519981588431';
const frame=document.getElementById('hub-iframe'),loader=document.getElementById('hub-loader');
const label=document.getElementById('hub-app-label'),caption=document.getElementById('hub-demo-caption');
const fullscreen=document.getElementById('hub-fullscreen'),shopPicker=document.getElementById('hub-shop-picker');
const demoFrame=document.getElementById('demo-app'),changeVersion=document.getElementById('hub-change-version');
let current='',currentSegment=null;
function tabs(name){document.querySelectorAll('[data-demo]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.demo===name)));}
function changeHash(name){if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);}
function updateContact(key){
 const [action,segment]=contactOptions[key];
 contact.textContent=action;
 const message='Olá! Vi a demonstração da Skye '+segment+' e gostaria de entender como esse sistema pode funcionar no meu negócio.';
 contact.href='https://wa.me/'+whatsapp+'?text='+encodeURIComponent(message);
}
function showShopPicker(){
 current='lojas';currentSegment=null;tabs('lojas');
 shopPicker.hidden=false;demoFrame.hidden=true;changeVersion.hidden=true;
 frame.removeAttribute('src');loader.hidden=true;updateContact('lojas');changeHash('lojas');
}
function openDemo(name,force=false){
 if(name==='lojas'){showShopPicker();return;}
 if(!Object.hasOwn(demos,name))name='acaiteria';
 if(name===current&&!force)return;
 current=name;currentSegment=null;tabs(name);shopPicker.hidden=true;demoFrame.hidden=false;
 changeVersion.hidden=true;
 const info=demos[name];label.textContent=info.label;caption.textContent=info.caption;
 fullscreen.href=info.fullscreen||info.url;frame.title=info.title;loader.hidden=false;frame.src=info.url;
 updateContact(name);changeHash(name);
}
function chooseShopSegment(which){
 if(!Object.hasOwn(shopLabels,which))return;
 current='lojas';currentSegment=which;tabs('lojas');
 shopPicker.hidden=true;demoFrame.hidden=false;changeVersion.hidden=false;
 label.textContent='Gestão de lojas · '+shopLabels[which];
 caption.textContent='Catálogo próprio para esta versão · dados fictícios';
 const url='../demonstracao-lojas/?tipo='+encodeURIComponent(which);
 fullscreen.href=url;frame.title='Demonstração de '+shopLabels[which]+' com dados fictícios';
 loader.hidden=false;frame.src=url;updateContact(which);changeHash('lojas/'+which);
}
frame.addEventListener('load',()=>loader.hidden=true);
document.querySelectorAll('[data-demo]').forEach(btn=>btn.addEventListener('click',()=>openDemo(btn.dataset.demo)));
document.querySelectorAll('[data-shop-segment]').forEach(btn=>btn.addEventListener('click',()=>chooseShopSegment(btn.dataset.shopSegment)));
changeVersion.addEventListener('click',showShopPicker);
document.getElementById('hub-reload').addEventListener('click',()=>{
 if(current==='lojas'&&currentSegment)chooseShopSegment(currentSegment);
 else openDemo(current,true);
});
function openFromHash(){
 const hash=location.hash.slice(1);
 if(hash.startsWith('lojas/')){
  const segment=hash.slice('lojas/'.length);
  if(Object.hasOwn(shopLabels,segment)){chooseShopSegment(segment);return;}
  showShopPicker();return;
 }
 openDemo(hash);
}
window.addEventListener('hashchange',openFromHash);
window.addEventListener('message',event=>{
 if(current!=='lojas'||!currentSegment||event.origin!==location.origin||event.source!==frame.contentWindow)return;
 if(event.data?.type==='skye-shop-segment'&&Object.hasOwn(shopLabels,event.data.segment)){
  currentSegment=event.data.segment;
  label.textContent='Gestão de lojas · '+shopLabels[currentSegment];
  fullscreen.href='../demonstracao-lojas/?tipo='+encodeURIComponent(currentSegment);
  updateContact(currentSegment);changeHash('lojas/'+currentSegment);
 }
});
openFromHash();
})();
