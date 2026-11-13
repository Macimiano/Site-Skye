# Skye Gestão e Inovação — Site institucional v4.0

**Pronto para deploy estático na Vercel.** Mantém a identidade original, a galeria de prints reais, o atendimento em Socorro e região, o WhatsApp comercial e os modos claro/escuro.

## Alterações desta versão

- Título principal: **“Sua empresa é única. Seu sistema também deveria ser.”**
- Captura real do Corte Certo em destaque maior na página inicial, com clique para ampliar.
- Captura de equipe comercial ampliável, com a identificação **SPM ocultada** na imagem utilizada.
- Galeria de sete imagens com filtros, navegação e zoom manual de 100% a 300%.
- **Demonstração interativa em `demo.html`**, acessível pelo hero e pelo portfólio, com duas experiências:
  - **Gestão comercial**: visão geral, pedido de teste, estoque e histórico de pedidos.
  - **Equipe de vendas**: carteira, retornos, mensagens editáveis, pré-visualização e simulação de contato realizado.
- A demonstração usa **somente dados fictícios** no navegador. Não possui backend, cadastro, integração, envio de mensagens ou persistência; recarregar a página reinicia a experiência. Não representa uma instalação funcional dos sistemas reais.
- Foto original enviada da praça de **Socorro (SP)** continua na seção de visita presencial.
- Mantido o canal de WhatsApp `(19) 99849-1844`.

## Estrutura

- `index.html` — site institucional.
- `styles.css`, `script.js`, `config.js` — aparência e interações do site.
- `demo.html`, `demo.css`, `demo.js` — demonstração independente, sem servidor.
- `privacidade.html` — informações sobre o formulário de contato.
- `assets/` — logotipo original, fotos e prints reais.

## Atualizar o MESMO projeto na Vercel

**Não faça upload de outro ZIP pelo Vercel Drop se você deseja preservar o projeto e o domínio atuais.**

**Com GitHub conectado:** substitua os arquivos na raiz do repositório e faça um commit na branch de produção. O mesmo projeto da Vercel publicará a atualização.

**Se você ainda usa somente o Vercel Drop:** descompacte o ZIP em uma pasta, abra o terminal nessa pasta e execute:

```sh
npx vercel login
npx vercel link
npx vercel --prod
```

No comando `vercel link`, **escolha o projeto da Skye já existente**, não um projeto novo. O domínio já associado a esse projeto permanece configurado; a correção do DNS no Registro.br é independente do conteúdo publicado.

> A Vercel restringe o uso do plano Hobby a projetos pessoais e não comerciais. Confira o plano empresarial adequado ao site da Skye.

## Checklist após publicar

1. Visite o domínio e confirme que está apontando para a Vercel.
2. Abra a tela real do Corte Certo e teste **+**, **−**, **Ajustar à tela**, **Próxima** e **Fechar**.
3. Faça o mesmo com a tela de equipe comercial; confirme que a marca SPM não aparece.
4. Use a **demonstração interativa** em `demo.html` e registre um pedido fictício; teste também os modelos de mensagem.
5. Confira no celular, em modo claro/escuro e os links de WhatsApp.
6. Revise a política de privacidade e as autorizações de divulgação dos prints antes de campanhas públicas.

## Canal comercial

O WhatsApp está configurado em `config.js` como `5519998491844`. O formulário **não envia dados automaticamente**: ele prepara uma mensagem para abertura do WhatsApp, para o visitante revisar e enviar.


## Música ambiente (nova versão)
- `assets/audio/skye-ambiente-original.mp3`: composição instrumental original da Skye, suave e discreta (72 s em loop), sem necessidade de licença de terceiros.
- `ambient.css` e `ambient.js`: botão de música acessível em todas as páginas, com início **apenas após clique** (políticas de autoplay dos navegadores).
- Reproduz em volume baixo, permite pausar, repete em loop e pausa ao mudar de aba. Ao trocar de página, é necessário clicar novamente para ativar: o site é estático e não mantém um player contínuo entre carregamentos.
- Não há necessidade de instalar dependências ou configurar serviços adicionais na Vercel.
