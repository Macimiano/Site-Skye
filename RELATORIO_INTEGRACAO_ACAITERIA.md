# SKYE — Prévia da integração da demonstração de açaiteria

Data da preparação: 14/11/2026

## Situação da publicação analisada

O repositório informa que o site institucional está preparado para publicação estática na Vercel. A raiz também conserva `server.cjs`, `package.json` e `railway.json`, permitindo publicação pelo Railway. A integração foi feita de forma compatível com os dois cenários:

- na Vercel, a pasta `demonstracao-acaiteria/` funciona como conteúdo estático;
- no Railway, `server.cjs` passa a autorizar a nova rota e seus quatro arquivos públicos;
- não é necessária alteração de DNS quando a atualização é publicada no mesmo projeto atualmente ligado ao domínio;
- nenhuma publicação foi realizada nesta etapa.

O domínio `www.skyegestao.com.br` não pôde ser resolvido pelo ambiente de testes em 14/11/2026. Por isso, a confirmação do provedor atual baseia-se na documentação e nos arquivos do repositório; a validação final do domínio deve ser feita no painel da Vercel antes de publicar.

## O que foi integrado

- nova rota local e futura rota pública: `/demonstracao-acaiteria/`;
- acesso pelo destaque inicial e pela seção de demonstrações do site institucional;
- link de retorno da demonstração para o site da SKYE;
- funcionamento inteiramente no navegador, sem banco, API ou serviço externo;
- dados persistidos apenas no armazenamento local do navegador;
- botão **Restaurar exemplos** para reiniciar a apresentação.

## Catálogo configurado

- 6 tamanhos e preços: 150 ml (R$ 12), 200 ml (R$ 15), 330 ml (R$ 18), 440 ml (R$ 22), 550 ml (R$ 25) e 770 ml (R$ 28);
- 17 opções de açaí, creme ou gelato;
- 14 coberturas;
- 19 acompanhamentos;
- coberturas e acompanhamentos incluídos no valor do copo, sem limite comercial inventado;
- uma base obrigatória por copo para representar a escolha do tipo principal.

## Comportamentos reproduzidos

- montagem visual de copos;
- vários copos no mesmo pedido;
- edição e remoção de itens;
- cálculo automático pelo tamanho;
- cadastro fictício de clientes;
- montagem do pedido até a etapa comercial, com conclusão e pagamentos bloqueados;
- histórico e andamento de pedidos;
- estoque e fichas técnicas simulados;
- contas, indicadores e relatório de vendas coerentes com os registros locais;
- mensagens e integrações apresentadas apenas como simulações;
- restauração completa da demonstração.

## Limitações comerciais da amostra

- pagamentos e conclusão de pedidos ficam bloqueados;
- cadastros operacionais e alterações permanentes não são gravados;
- movimentações de estoque, financeiro, cardápio, usuários e configurações ficam somente para consulta;
- comandas, mensagens externas e mudanças de situação do pedido ficam bloqueadas;
- toda tentativa de usar um recurso restrito mostra um convite para falar com a SKYE;
- o WhatsApp comercial utilizado é `(19) 99849-1844` (`5519998491844` no link).

## Arquivos alterados na prévia

- `index.html` — adiciona acessos para a demonstração;
- `server.cjs` — libera a rota no modo Railway e mantém arquivos internos bloqueados;
- `README.md` — documenta a nova pasta e o checklist;
- `demonstracao-acaiteria/index.html`;
- `demonstracao-acaiteria/style.css`;
- `demonstracao-acaiteria/config.js`;
- `demonstracao-acaiteria/app.js`.

Os demais arquivos institucionais foram comparados com a origem e permaneceram iguais.

## Testes executados

- sintaxe dos JavaScripts principais;
- integridade dos links e arquivos locais das páginas institucionais;
- presença da rota estática e da autorização correspondente no servidor opcional;
- regras responsivas para telas menores;
- contagem e preços do catálogo;
- navegação pelos principais módulos;
- seleção de vários itens sem acréscimo indevido;
- edição e remoção de copos;
- pedido com mais de um copo e total calculado;
- bloqueio da conclusão, do pagamento e de novos cadastros;
- preservação do histórico fictício apenas para consulta;
- restauração dos dados fictícios;
- ausência de chamadas externas durante o fluxo testado;
- busca por identificações do projeto original na nova demonstração.

Resultado: todos os testes automatizados concluíram com sucesso.

## Publicação futura, somente após aprovação

1. Conferir esta pasta de prévia.
2. Copiar somente as alterações aprovadas para o repositório `Site-Skye`.
3. Fazer commit e push na mesma branch já conectada ao projeto da Vercel.
4. Aguardar o deploy do mesmo projeto, sem criar outro projeto e sem alterar DNS.
5. Testar a página inicial, `demo.html`, `/demonstracao-acaiteria/`, WhatsApp, política de privacidade e navegação móvel no domínio oficial.

Antes da publicação foi criado o arquivo de recuperação `Site-Skye-recuperacao-2026-11-14.zip`.
