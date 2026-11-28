#!/usr/bin/env python3
"""Atualiza apenas os quatro cartões finais da vitrine da Skye, preservando o restante do site.
Uso: python3 aplicar_previews.py /caminho/da/pasta/do/site
"""
from pathlib import Path
import sys, re, shutil

segments=[
 ('restaurante','Restaurante e lanchonete'),
 ('adega','Adega e loja de bebidas'),
 ('petshop','Pet shop'),
 ('hotel','Hotel e pousada'),
]

source=Path(__file__).resolve().parent
site=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else None
if not site or not (site/'index.html').is_file():
 raise SystemExit('Uso: python3 aplicar_previews.py /pasta/com/index.html')

html=site/'index.html'
s=html.read_text(encoding='utf-8')
css=site/'styles.css'
if not css.exists():
 raise SystemExit('Não foi encontrado styles.css na pasta do site. Nenhum arquivo foi alterado.')
# Validate first, before updating
for key,title in segments:
 if re.search(r'<h3[^>]*>\s*'+re.escape(title)+r'\s*</h3>',s,re.I) is None:
  raise SystemExit('Não encontrei o cartão "'+title+'" no index.html. Nenhum arquivo foi alterado.')

for key,title in segments:
 heading=re.search(r'<h3[^>]*>\s*'+re.escape(title)+r'\s*</h3>',s,re.I)
 end=heading.end()
 start=s.rfind('<article',0,heading.start())
 stop=s.find('</article>',end)
 if start<0 or stop<0:raise SystemExit('Não consegui identificar o cartão '+title)
 block=s[start:stop]
 cta=re.search(r'<a[^>]+class=["\'][^"\']*demo-platform-cta[^"\']*["\'][^>]*href=["\']([^"\']+)["\']',block,re.I)
 if not cta:
  cta=re.search(r'<a[^>]+href=["\']([^"\']+)["\'][^>]+class=["\'][^"\']*demo-platform-cta',block,re.I)
 url=cta.group(1) if cta else f'demonstracao-{key}/'
 preview=f'''<a class="demo-mini-preview demo-mini-system" href="{url}" aria-label="Abrir {title}"><img src="assets/previews/{key}.webp" loading="lazy" decoding="async" width="1440" height="790" alt="Prévia demonstrativa de {title}, criada com dados fictícios"/><span class="demo-preview-tag">PRÉVIA DEMONSTRATIVA</span></a>'''
 existing=re.search(r'<(?:div|a)[^>]*class=["\'][^"\']*demo-mini-preview[^"\']*["\'][^>]*>.*?</(?:div|a)>',block,re.I|re.S)
 if existing:
  block=block[:existing.start()]+preview+block[existing.end():]
 else:
  ctop=re.search(r'<div[^>]+class=["\'][^"\']*demo-platform-card-top[^"\']*["\'][^>]*>.*?</div>',block,re.I|re.S)
  if not ctop:raise SystemExit('Cartão sem topo reconhecível: '+title)
  block=block[:ctop.end()]+'\n'+preview+'\n'+block[ctop.end():]
 s=s[:start]+block+s[stop:]

oldcss=css.read_text(encoding='utf-8')
cssmarker='/* SKYE_PREVIEWS_SEGMENTOS_v63 */'
newcss='''
/* SKYE_PREVIEWS_SEGMENTOS_v63 */
.demo-mini-preview.demo-mini-system{display:block;padding:0;position:relative;background:#eaf0f5;overflow:hidden;text-decoration:none;isolation:isolate;border:1px solid var(--page-border)}
.demo-mini-system img{display:block;width:100%;height:100%;object-fit:cover;object-position:top left;transition:transform .25s ease}
.demo-mini-system:hover img{transform:scale(1.035)}
.demo-mini-system:focus-visible{outline:3px solid #ffcb4d;outline-offset:3px}
.demo-preview-tag{position:absolute;right:9px;bottom:9px;background:rgba(11,33,61,.92);color:#fff;border:1px solid #ffffff44;border-radius:99px;padding:6px 8px;font-size:8px;font-weight:850;letter-spacing:.07em;pointer-events:none}
'''
# Write only after all four matches succeed
assets=site/'assets'/'previews';assets.mkdir(parents=True,exist_ok=True)
for key,title in segments:
 shutil.copy2(source/'previews'/f'{key}.webp',assets/f'{key}.webp')
if cssmarker not in oldcss:css.write_text(oldcss+'\n'+newcss,encoding='utf-8')
html.write_text(s,encoding='utf-8')
print('Atualização concluída nos quatro cartões, preservando os links e as outras seções.')
