(()=>{'use strict';
const demos={
 acaiteria:{label:'Açaíteria modelo',caption:'Pedidos e personalização de produtos',url:'../demonstracao-acaiteria/',title:'Demonstração de açaíteria com dados fictícios'},
 equipes:{label:'Equipe de vendas',caption:'Carteira, rotas, visitas, cotações, recuperação e desempenho',url:'../demonstracao-equipes/',title:'Demonstração limitada de equipe de vendas com dados fictícios'},
 'corte-certo':{label:'Corte Certo · Distribuidoras',caption:'Clientes, cotações, pedidos e estoque por lotes · dados fictícios',url:'../demonstracao-corte-certo/sistema.html',fullscreen:'../demonstracao-corte-certo/',title:'Corte Certo: demonstração limitada para distribuidoras com dados fictícios'},
 restaurante:{label:'Restaurante e lanchonete',caption:'Comandas, cozinha e caixa · simulação limitada',url:'demonstracao-restaurante/index.html',title:'Demonstração limitada de restaurante com dados fictícios'},
 adega:{label:'Adega e loja de bebidas',caption:'Bebidas, vendas, estoque e reposição · simulação limitada',url:'demonstracao-adega/index.html',title:'Demonstração limitada de adega com dados fictícios'},
 petshop:{label:'Pet shop',caption:'Agenda de banho e tosa, serviços e clientes · simulação limitada',url:'demonstracao-petshop/index.html',title:'Demonstração limitada de pet shop com dados fictícios'},
 hotel:{label:'Hotel e pousada',caption:'Reservas, check-in e quartos · simulação limitada',url:'demonstracao-hospedagem/index.html',title:'Demonstração limitada de hotel com dados fictícios'}
};
const shopLabels={mercadinho:'Mercadinho',tabacaria:'Tabacaria',agropecuaria:'Agropecuária'};
const frame=document.getElementById('hub-iframe'),loader=document.getElementById('hub-loader');
const label=document.getElementById('hub-app-label'),caption=document.getElementById('hub-demo-caption');
const fullscreen=document.getElementById('hub-fullscreen'),shopPicker=document.getElementById('hub-shop-picker');
const demoFrame=document.getElementById('demo-app'),changeVersion=document.getElementById('hub-change-version');
let current='',currentSegment=null;
function tabs(name){document.querySelectorAll('[data-demo]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.demo===name)));}
function changeHash(name){if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);}
function showShopPicker(){
 current='lojas';currentSegment=null;tabs('lojas');
 shopPicker.hidden=false;demoFrame.hidden=true;changeVersion.hidden=true;
 frame.removeAttribute('src');loader.hidden=true;changeHash('lojas');
}
function openDemo(name,force=false){
 if(name==='lojas'){showShopPicker();return;}
 if(!demos[name])name='acaiteria';
 if(name===current&&!force)return;
 current=name;currentSegment=null;tabs(name);shopPicker.hidden=true;demoFrame.hidden=false;
 changeVersion.hidden=true;
 const info=demos[name];label.textContent=info.label;caption.textContent=info.caption;
 fullscreen.href=info.fullscreen||info.url;frame.title=info.title;loader.hidden=false;frame.src=info.url;
 changeHash(name);
}
function chooseShopSegment(which){
 if(!Object.prototype.hasOwnProperty.call(shopLabels,which))return;
 current='lojas';currentSegment=which;tabs('lojas');
 shopPicker.hidden=true;demoFrame.hidden=false;changeVersion.hidden=false;
 label.textContent='Gestão de lojas · '+shopLabels[which];
 caption.textContent='Catálogo próprio para esta versão · dados fictícios';
 const url='../demonstracao-lojas/?tipo='+encodeURIComponent(which);
 fullscreen.href=url;frame.title='Demonstração de '+shopLabels[which]+' com dados fictícios';
 loader.hidden=false;frame.src=url;changeHash('lojas');
}
frame.addEventListener('load',()=>loader.hidden=true);
document.querySelectorAll('[data-demo]').forEach(btn=>btn.addEventListener('click',()=>openDemo(btn.dataset.demo)));
document.querySelectorAll('[data-shop-segment]').forEach(btn=>btn.addEventListener('click',()=>chooseShopSegment(btn.dataset.shopSegment)));
changeVersion.addEventListener('click',showShopPicker);
document.getElementById('hub-reload').addEventListener('click',()=>{
 if(current==='lojas'&&currentSegment)chooseShopSegment(currentSegment);
 else openDemo(current,true);
});
window.addEventListener('hashchange',()=>openDemo(location.hash.slice(1)));
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
 if(event.data?.type==='skye-shop-segment'&&Object.prototype.hasOwnProperty.call(shopLabels,event.data.segment)){
  currentSegment=event.data.segment;
  label.textContent='Gestão de lojas · '+shopLabels[currentSegment];
  fullscreen.href='../demonstracao-lojas/?tipo='+encodeURIComponent(currentSegment);
 }
});
openDemo(location.hash.slice(1));
})();
