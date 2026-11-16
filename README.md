# Skye Gestão e Inovação — site institucional v5.0

Pronto para hospedagem estática no mesmo projeto da Vercel (sem backend adicional).

## Alteração principal

Uma **nova demonstração de gestão de lojas** em `demonstracao-lojas/index.html`, acessível pelo site institucional na seção **Demonstrações**. A demonstração anterior, em `demo.html`, continua disponível.

### Origem e escopo

A estrutura funcional foi baseada no arquivo `Modelo-Gestao-Loja.zip` fornecido pelo proprietário. O original é um sistema FastAPI + SQLite com login e módulos de PDV, estoque, clientes, vendas, contas a pagar e funcionalidades adicionais.

Para não expor backend, usuários, chaves, clientes ou integrações em uma página pública, esta versão é uma **simulação estática e limitada**, com interface própria inspirada no modelo original. Não substitui uma instância real do sistema.

- Escolha entre Mercadinho, Tabacaria e Agropecuária; a seleção carrega exemplos próprios.
- Visão geral, frente de caixa, venda por unidade e por peso, estoque, vendas, clientes e fidelização, contas a pagar e relatórios.
- Até **6 novas vendas** e **2 clientes fictícios** por visita, para ilustração.
- Pagamentos apenas simulados; **não cobra, não gera Pix, não emite documentos fiscais, não importa arquivos**.
- Sem login, usuários administrativos, configurações, API, banco de dados ou integração com sistemas reais.
- Dados mantidos somente em memória no navegador; recarregar ou clicar em Reiniciar volta aos exemplos.

### Arquivos novos

- `demonstracao-lojas/index.html`
- `demonstracao-lojas/lojas.css`
- `demonstracao-lojas/lojas.js`

### Alterações no site

- Atualizado `index.html` com duas opções de demonstração em `#demonstracoes`.
- Atualizado `styles.css` com a apresentação responsiva da nova seção.
- Adicionado texto de privacidade referente à demonstração.
- Preservados a logo, o tema do site, a trilha ambiente, a galeria, a página anterior e o WhatsApp **(19) 98158-8431**.

### Atualizar o mesmo projeto da Vercel

**Não reenvie o ZIP pelo Vercel Drop como novo projeto.**

1. Extraia o ZIP mantendo a estrutura das pastas e o arquivo `index.html` na raiz.
2. Se o site estiver conectado ao GitHub, substitua o conteúdo do repositório e faça commit na branch de produção.
3. Se o projeto foi criado apenas pelo Vercel Drop, execute nesta pasta:

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

Em `vercel link`, escolha o projeto existente da Skye.

Após a publicação, a nova demo ficará em `/demonstracao-lojas/` no **mesmo domínio**. O endereço não estará disponível até o deploy.

Confira se o plano da Vercel permite uso comercial do site; o plano Hobby é restrito a uso pessoal/não comercial.

## Checklist

- Acessar `/#demonstracoes` e abrir as duas experiências.
- No novo simulador, fazer uma venda e verificar o histórico, estoque e relatório.
- Trocar o segmento (os exemplos se reiniciam) e testar venda por peso na agropecuária.
- Testar `Reiniciar`, responsividade, formulário do site e links do WhatsApp.

A publicação em produção depende do proprietário do projeto na Vercel. Nenhum deploy foi efetuado por este pacote.
