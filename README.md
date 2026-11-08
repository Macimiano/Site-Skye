# Skye Gestão e Inovação — Site institucional (Vercel)

Versão **3.0**, com galeria de **7 prints reais** (sem o vídeo), tema claro/escuro e revisão de conteúdo e layout.

## Publicar na Vercel

**Para não perder o endereço atual:** atualize o **mesmo projeto** existente na Vercel. Caso esteja conectado ao GitHub, copie os arquivos da pasta para a raiz do repositório e faça um commit; o deploy é automático.

Caso a publicação original tenha sido pelo Vercel Drop e não haja GitHub conectado, é possível usar a Vercel CLI no diretório do site: `npx vercel link` (selecionando o projeto existente) e depois `npx vercel --prod`. Verifique que o projeto selecionado é o já publicado. Um novo envio no Drop pode criar outro projeto.

A estrutura é estática: `index.html`, `styles.css`, `script.js`, `config.js`, `privacidade.html` e `assets/` (com as subpastas). Não suba apenas o ZIP como arquivo dentro de outro diretório.

## Alterações

- Hero e seção de personalização com prints reais.
- Galeria com filtros por tema e ampliação de imagens (sem vídeo).
- Nome Corte Certo público; imagem de equipe comercial foi **recortada** para remover totalmente a marca SPM e o breadcrumb que a mencionava.
- Prints com informações desnecessárias de clientes / endereços de desenvolvimento foram recortados.
- Tema automático conforme preferência do sistema (`prefers-color-scheme`) e alternância manual opcional pelo ícone no menu. A escolha manual fica salva localmente.
- Revisão de textos comerciais com linguagem direta.
- Formulário prepara mensagem de WhatsApp; sem banco de dados de mensagens no site.

## Contato

WhatsApp no `config.js`: **5519998491844**. Para trocá-lo posteriormente, altere o valor `whatsapp`.

## Verificações sugeridas após o deploy

1. Abrir no desktop e no celular.
2. Verificar modo claro e escuro; o botão alterna Automático → Claro → Escuro.
3. Abrir galeria, filtrar projetos, ampliar prints e voltar ao fechar.
4. Testar WhatsApp e formulário.
5. Revisar a política de privacidade e as permissões de uso das imagens.

## Observação comercial

O site é institucional e não exige compra de domínio para funcionar em um endereço `*.vercel.app`. O plano Hobby da Vercel é restrito a atividades pessoais e não comerciais; verifique o plano adequado para um site empresarial.


## Versão 3.0 — aprimoramentos visuais
- Textos comerciais revisados com situações reais, sem promessas de resultados garantidos.
- Seção de visita em Socorro e região com etapas de consultoria e composição editorial de telas reais.
- Galeria hierarquizada com dois destaques e agrupamento responsivo, sem divulgar o nome SPM.
- Contraste reforçado nos temas automático, claro e escuro.
- Para atualizar um site já publicado, faça o deploy **no mesmo projeto** da Vercel (via GitHub integrado ou Vercel CLI), e não crie outro projeto no Drop.
