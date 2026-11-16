(()=>{'use strict';
const options={
 acaiteria:{label:'Açaíteria modelo',caption:'Pedidos e personalização de produtos',url:'../demonstracao-acaiteria/',title:'Demonstração completa de açaíteria com dados fictícios'},
 lojas:{label:'Gestão de lojas',caption:'Mercadinho, tabacaria ou agropecuária',url:'../demonstracao-lojas/',title:'Demonstração de gestão de lojas com dados fictícios'},
 equipes:{label:'Equipe comercial',caption:'Clientes, pedidos e mensagens prontas',url:'../demo.html?modulo=equipe',title:'Demonstração de equipe comercial com dados fictícios'}
};
const frame=document.getElementById('hub-iframe'),loader=document.getElementById('hub-loader');
const label=document.getElementById('hub-app-label'),caption=document.getElementById('hub-demo-caption');
const fullscreen=document.getElementById('hub-fullscreen');
let current='';
function select(name,force=false){if(!options[name])name='acaiteria';const info=options[name];if(name===current&&!force)return;current=name;document.querySelectorAll('[data-demo]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.demo===name)));label.textContent=info.label;caption.textContent=info.caption;fullscreen.href=info.url;frame.title=info.title;loader.hidden=false;frame.src=info.url;if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);}
frame.addEventListener('load',()=>{loader.hidden=true});
document.querySelectorAll('[data-demo]').forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.demo)));
document.getElementById('hub-reload').addEventListener('click',()=>select(current,true));
window.addEventListener('hashchange',()=>select(location.hash.slice(1)));
select(location.hash.slice(1));
})();