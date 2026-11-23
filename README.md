# Skye Gestão e Inovação — site v5.4 (demonstração de vendedores ampliada)

Projeto estático preparado para implantação no projeto Vercel já existente.

## O que mudou

- A seção com sete prints foi removida da página inicial e substituída por três cartões de experiências práticas.
- Os três cartões abrem uma apresentação unificada em `demonstracoes/index.html`, com três abas e uma janela para explorar o sistema.
- A demonstração de **gestão de lojas** permanece totalmente no ZIP em `demonstracao-lojas/` (mercadinho, tabacaria e agropecuária).
- A demonstração de **equipe de vendas** foi reconstruída em `demonstracao-equipes/`, independente do sistema original, com exemplos e operações limitadas.
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
- `/demonstracao-equipes/` — demonstração limitada baseada na rotina de vendedores; `demo.html` redireciona à nova versão

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


## Versão 5.4 — Equipe comercial

- Removido o seletor redundante “Gestão comercial / Equipe de vendas”. O visitante acessa diretamente uma única demonstração específica de vendedores.
- Nova interface com módulos inspirados no projeto de equipe de vendas enviado: visão geral, carteira, recuperação, atividades, visitas externas, rotas, catálogo, cotações, vendas manuais, desempenho e mensagens prontas.
- A interface não usa logotipo, nome ou código do sistema original. A marca Skye aparece apenas no cabeçalho de navegação e na comunicação comercial.
- Limites por sessão: 4 contatos, 2 visitas, 2 cotações, 2 vendas manuais e 2 edições de mensagens. Atualizar/reiniciar restaura os exemplos. Nenhum dado persiste.
- Não há login, envio de WhatsApp, importação de PDF, custos, download, aprovação administrativa, integração com estoque, geolocalização, banco, pagamentos ou emissão fiscal.
- O produto comercial real não é um PDV: vendas são lançadas manualmente. Esta simulação respeita essa separação.
- A publicação ocorre via atualização do **projeto Vercel existente** e validação em `/demonstracoes/#equipes` e `/demonstracao-equipes/`. A criação do ZIP não publica automaticamente.


## v5.5 — Corte Certo / Distribuidoras

- A página principal agora inclui uma quarta demonstração: **Distribuidoras e atacado (Corte Certo)**.
- A central de demonstrações tem uma aba Corte Certo.
- `demonstracao-corte-certo/sistema.html`: versão pública limitada **original** fornecida pelo usuário, sem alterações no JavaScript e com CSP de hashes preservada.
- `demonstracao-corte-certo/index.html`: apresentação de tela inteira com identidade da Skye, botão para voltar às demonstrações e link comercial.
- A demonstração original é uma simulação em memória, com dados fictícios, **25 alterações por sessão**, sete áreas autorizadas (visão geral, clientes, recuperação, estoque, cotações, pedidos e descontos), sem conexões de rede.
- Não inclui servidor, banco, credenciais, arquivos internos do projeto Corte Certo nem módulo fiscal operacional.
- Endereço após publicar: `/demonstracoes/#corte-certo` (central) ou `/demonstracao-corte-certo/` (tela inteira).
- Não foi publicado automaticamente na Vercel. Atualize o projeto existente no seu repositório.

### Verificação antes de divulgar

Os arquivos HTML, caminhos de recursos, scripts JavaScript e hashes da política de segurança da demonstração do Corte Certo foram verificados. O teste visual automatizado não pôde ser executado por restrições do navegador neste ambiente. Após publicar na Vercel, teste em desktop e celular os links "Distribuidoras (Corte Certo)", "Abrir tela inteira" e o botão de reiniciar da demo. A Vercel e a conta do usuário não foram alteradas por este pacote.


## v5.6 — vídeo na abertura

- A imagem de destaque do Corte Certo foi substituída por um vídeo enviado pelo proprietário da Skye, exibindo a simulação de gestão para agropecuárias.
- Arquivo otimizado `assets/video/agropecuaria-demonstracao.mp4` (aprox. 2,9 MB), completo, com 2min43s, e cartaz `assets/video/agropecuaria-poster.webp`.
- Reproduz automaticamente em loop, **sem som** (`autoplay muted playsinline loop`); o usuário pode pausar, ativar a narração e ampliar. A música ambiente da Skye pausa quando a narração é ativada e vice-versa.
- Navegadores podem bloquear a reprodução automática em certas condições. O botão de reproduzir permanece disponível. Preferências de movimento reduzido e economia de dados são respeitadas.
- A nova seção comunica corretamente que o vídeo exibe uma **demonstração com dados fictícios**, e não o painel real de um cliente.
- O restante da página e as quatro demonstrações interativas foram preservados.
- Após publicação, confira a reprodução no domínio em desktop, Android e iOS, incluindo orientação do dispositivo e modo de economia de dados. O ZIP não publica sozinho na Vercel.


## Versão 5.7 — Vercel Web Analytics

Foi incluído o script oficial de análise de tráfego para sites estáticos na página inicial, na política de privacidade e nas páginas públicas das demonstrações de lojas, equipe de vendas, central de demonstrações e apresentação do Corte Certo.

### Ativação no painel da Vercel

1. Abra o projeto atual da Skye no dashboard da Vercel.
2. Acesse **Analytics** e clique em **Enable**, se ainda não estiver habilitado.
3. Faça um novo deploy do **mesmo projeto** usando os arquivos deste ZIP.
4. Visite o site publicado no domínio oficial e retorne ao painel **Analytics** para consultar visualizações e visitantes.
5. Se aparecer erro 404 para `/_vercel/insights/script.js`, confira se Analytics está habilitado no projeto e faça um novo deploy.

Como este site usa HTML e JavaScript puros, **não precisa** instalar Next.js, React nem o pacote `@vercel/analytics`.

O arquivo `demonstracao-corte-certo/sistema.html` mantém seu CSP e sandbox de segurança intactos; a visualização da página externa de apresentação é registrada. A demonstração da açaíteria continua entregue por rewrite externo e não recebe a inserção do script feita nos arquivos locais.

**Observação:** o carregamento do script e a contagem real de visitas só podem ser confirmados após a publicação na Vercel com Analytics habilitado.


## Atualização v5.9 — vídeo legendado

- Vídeo do topo substituído pela versão legendada enviada pelo cliente.
- O player mantém a proporção completa 1280×696, sem zoom ou corte, para preservar as legendas incorporadas na parte inferior.
- Autoplay sem som, áudio opcional, pausa e tela cheia preservados.
