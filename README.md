# Skye Gestão e Inovação — site v5.2 (demonstrações unificadas)

Projeto estático preparado para implantação no projeto Vercel já existente.

## O que mudou

- A seção com sete prints foi removida da página inicial e substituída por três cartões de experiências práticas.
- Os três cartões abrem uma apresentação unificada em `demonstracoes/index.html`, com três abas e uma janela para explorar o sistema.
- A demonstração de **gestão de lojas** permanece totalmente no ZIP em `demonstracao-lojas/` (mercadinho, tabacaria e agropecuária).
- A demonstração de **equipe comercial** permanece totalmente no ZIP em `demo.html?modulo=equipe`.
- A demonstração da **açaíteria** usa a versão pública ORIGINAL da Skye hospedada no GitHub Pages, mas é acessada em `/demonstracao-acaiteria/` no próprio domínio via **rewrite externo da Vercel** (em `vercel.json`). O visitante não é redirecionado para outro domínio. O site de origem precisa continuar online; esta versão ainda depende do GitHub Pages para essa experiência.
- O hub oferece a opção **Abrir tela inteira**, permanecendo no endereço de `skyegestao.com.br`.
- O zoom do print do Corte Certo e da equipe comercial permanece nas áreas de abertura e de personalização do site, mesmo sem a galeria.
- Logotipo, tema automático, música ambiente, foto de Socorro e WhatsApp (19) 98158-8431 preservados.

## Rotas

- `/` — apresentação institucional
- `/demonstracoes/#acaiteria` — hub, açaíteria
- `/demonstracoes/#lojas` — hub, lojas
- `/demonstracoes/#equipes` — hub, equipe comercial
- `/demonstracao-acaiteria/` — açaíteria completa via proxy externo
- `/demonstracao-lojas/` — simulador limitado de comércio
- `/demo.html?modulo=equipe` — simulador limitado de equipe comercial

## Implantar

1. Extraia este ZIP.
2. Atualize **o mesmo repositório GitHub ligado ao projeto atual da Vercel**, com todos os arquivos e `vercel.json` na raiz. Faça commit na branch de produção.
3. Se seu projeto ainda é apenas Vercel Drop, use Vercel CLI `npx vercel link` para associar ao projeto **existente** e depois `npx vercel --prod`.
4. Teste **todas as três abas** em `https://www.skyegestao.com.br/demonstracoes/` no navegador. As regras do `vercel.json` só funcionam depois do deploy na Vercel; um servidor estático local não consegue executar o proxy da açaíteria.
5. Verifique os dois botões de ampliar telas reais e o WhatsApp.

## Dados e limitações

- Todos os exemplos são **fictícios** e não representam operações reais de clientes.
- A demo de açaíteria armazena alterações no navegador via localStorage. Demais experiências simulam operações sem acesso a banco de produção.
- O sistema de açaíteria original está em `https://github.com/Macimiano/skye-demo-gestao-comercial`, usado com permissão do proprietário. O proxy não inclui uma cópia local desse código neste ZIP.
- Em caso de indisponibilidade da origem GitHub Pages, a açaíteria pode não carregar. Para tornar as três experiências totalmente independentes de hospedagem externa, será necessário incorporar os quatro arquivos públicos `index.html`, `style.css`, `config.js` e `app.js` do repositório original na pasta `demonstracao-acaiteria/` e remover os rewrites.
- A opção de publicar diretamente na Vercel ainda depende de acesso à conta Vercel; o ZIP por si só não altera o site no ar.


## v5.3 — Escolha obrigatória de segmento para lojas

- A opção **Lojas e comércio** na central de demonstrações exibe uma tela com duas famílias bem separadas: **Comércio e conveniência** (Mercadinho e Tabacaria) e **Agropecuária**.
- A demonstração só é aberta quando o visitante clica ativamente em um dos três botões.
- O endereço `/demonstracao-lojas/` **sem parâmetro** também apresenta a seleção, sem carregar Mercadinho automaticamente.
- URLs com `?tipo=mercadinho`, `?tipo=tabacaria` e `?tipo=agropecuaria` abrem diretamente a versão selecionada a partir de um link explícito.
- Para mudar de segmento, use **Escolher outra versão** na central ou **Trocar versão** dentro da demonstração. A mudança reinicia os dados fictícios do segmento escolhido.
- Todas as demais demonstrações, o site institucional, o WhatsApp e a configuração Vercel foram preservados.
