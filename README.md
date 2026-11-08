# Skye Gestão e Inovação — site institucional v1.1

Site institucional responsivo para a Skye Gestão e Inovação, voltado à comercialização de sistemas de gestão sob medida. O pacote contém HTML, CSS e JavaScript, as imagens originais do logotipo, a apresentação em vídeo otimizada e um servidor Node.js mínimo para publicação no Railway. **Não requer banco de dados.**

## Destaques desta atualização

- Comparativo **Como está hoje / Com a Skye** (possibilidades, sem promessas de resultados quantificados).
- Consultoria inicial para entender processos e reais necessidades do cliente.
- Três etapas comerciais, da conversa até o sistema em funcionamento, sem alegar serviços fiscais ou emissão de documentos.
- **Visita presencial agendada para negócios de Socorro (SP) e região**, mediante disponibilidade.
- Demonstração em vídeo de 22 segundos de uma interface de sistema, fornecida pelo usuário, **sem autoplay**.
- Contato pelo WhatsApp comercial **(19) 99849-1844** e opção de solicitar visita no formulário.

## Arquivos

- `index.html`: página inicial, incluindo vídeo e novas seções.
- `styles.css`, `script.js`, `config.js`: visual, formulário e contatos.
- `privacidade.html`: informações básicas de privacidade, sujeitas a revisão.
- `assets/`: imagens originais fornecidas, favicon e `video/demonstracao-dormunt.mp4` (versão reduzida, sem áudio) com poster.
- `server.cjs` + `package.json`: servidor estático Node.js sem dependências para Railway.
- `railway.json`: configuração de deploy Railway.

## Publicação no Railway (sem domínio próprio)

1. Extraia este ZIP em uma pasta local. **O arquivo `index.html` deve ficar na raiz do repositório.**
2. Crie um repositório no GitHub, por exemplo `skye-site`, e envie os arquivos extraídos para ele. Pode ser repositório privado.
3. Entre no [Railway Dashboard](https://railway.com/dashboard), escolha **New Project → Deploy from GitHub repo** e selecione o repositório `skye-site`.
4. O Railway detectará `package.json` e iniciará `npm start`, usando a porta `PORT` fornecida pelo serviço.
5. Após concluir, use **Settings → Networking → Generate Domain** para receber um endereço `*.up.railway.app`.
6. Abra o site e teste navegação, reprodução do vídeo, botões, formulário e WhatsApp em computador e celular.
7. Futuramente, ao comprar o domínio, vincule-o em **Settings → Networking → Custom Domain** e configure os registros DNS indicados pelo Railway.

A hospedagem usa recursos do seu plano Railway e poderá aumentar o consumo faturado. O site só será público após o deploy.

## Outros provedores

Como o site em si é estático, `index.html`, `styles.css`, `script.js`, `config.js`, `privacidade.html` e `assets/` também podem ser publicados em Cloudflare Pages ou em uma hospedagem de sites estáticos. Nesses casos, `server.cjs` e `package.json` não são necessários.

## Como testar localmente

Com Node.js instalado, dentro da pasta:

```sh
npm start
```

Acesse `http://localhost:3000`.

## Contato e informações comerciais

WhatsApp da Skye configurado em `config.js`: `5519998491844`. O botão de visita abre uma mensagem pré-preenchida pedindo agendamento. O formulário não guarda dados em servidor: prepara a mensagem, que o usuário deve confirmar e enviar no WhatsApp.

## Revisões antes da publicação pública

1. **Confirme que você tem autorização para exibir o nome, o conteúdo e as interfaces do cliente/projeto "Dormunt Arena" no vídeo.** O vídeo foi fornecido pelo usuário e não passou por revisão jurídica de privacidade ou direitos de terceiros.
2. Verifique se nenhuma informação pessoal ou comercial confidencial aparece no vídeo.
3. Revise a política de privacidade e dados de contato.
4. Teste a reprodução em celulares e se as opções de visita estão claras.
5. As melhorias citadas na seção antes/depois são possibilidades condicionadas ao escopo; não representam promessas de aumento de lucros ou métricas reais.

O vídeo longo "Apresentação Said" **não foi incluído** no site, pois é mais apropriado para demonstrações detalhadas individuais.
