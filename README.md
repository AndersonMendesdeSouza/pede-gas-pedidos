# Pede Gás Pedidos

Versão web em React + TypeScript + Vite dos fluxos do `pedegas-app`. As telas usam HTML e CSS responsivos; não dependem de React Native ou Expo. Nenhuma dependência foi adicionada na migração.

## Executar localmente

Com as dependências já presentes, execute nesta pasta:

```bash
npm run dev
```

Abra o endereço informado pelo Vite. A navegação usa URLs como `/#/pedidos`, que permitem recarregar páginas em hospedagens estáticas sem configurar reescrita de rotas.

Por padrão, no desenvolvimento, `/api` passa pelo proxy do Vite para `https://pede-gas-api.onrender.com`. Para usar outra API, configure `API_PROXY_TARGET` em um arquivo `.env.local`, conforme `.env.example`. O proxy existe apenas no servidor de desenvolvimento.

Para produção, `VITE_API_URL` define a URL pública da API; o padrão é a mesma API do app. O domínio do site precisa estar permitido em `CORS_ORIGIN` no backend. O build não modifica essa configuração nem publica o site.

Variáveis `VITE_*` são públicas no navegador: nunca coloque senhas ou chaves secretas nelas.

## Funcionalidades migradas

| App original             | Versão web                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| Apresentação inicial     | Modal com três passos, exibido no primeiro acesso                                                 |
| Início                   | Mesmo catálogo, preços e imagens, categorias e busca                                              |
| Carrinho                 | Quantidades, remoção, armazenamento local e resumo                                                |
| Checkout                 | Endereços salvos, Pix/cartão/dinheiro na entrega, observações e criação na API                       |
| Login e cadastro         | Integração real; cadastro sempre envia `customer`                                                 |
| Recuperação              | Solicita o endpoint existente e informa que a redefinição ainda não está disponível               |
| Endereços                | Aba no menu e na barra inferior; cadastro, edição, exclusão com confirmação e seleção do padrão    |
| Pedidos                  | Listagem, filtros, detalhes, cancelamento permitido pela API e acompanhamento por status          |
| Perfil                   | Dados reais, edição e alteração de senha autenticada                                              |
| Administração            | Dashboard, filtros, aceitar, cancelar, sair para entrega e finalizar entrega                      |
| Histórico administrativo | Pedidos reais entregues/cancelados, período e indicadores calculados a partir da API              |
| Notificações             | Avisos derivados dos pedidos reais; leitura, som opcional e avisos do navegador quando suportados |

Os pedidos atualizam a cada 15 segundos com a aba visível e ao voltar para a janela. As permissões continuam sendo verificadas pela API; o papel confirmado por `/users/me` seleciona as telas. O JWT fica em `sessionStorage` e dura a sessão da aba. Senhas não são armazenadas. O carrinho e a apresentação inicial ficam em `localStorage`; os avisos são separados por ID de usuário.

Os serviços ficam em `src/services`, os contratos em `src/types.ts`, os dados do catálogo em `src/data/catalog.ts` e cada fluxo em `src/pages`. `AppProvider` compartilha sessão, carrinho, endereços e pedidos entre as telas. A montagem do pedido e os cálculos ficam em `src/utils/order.ts`.

## Diferenças e limitações herdadas

- **Recuperação de senha:** a API atual apenas retorna um código aleatório; não envia e-mail, não persiste/verifica código e não oferece endpoint para redefinir a senha. O site não mostra uma falsa confirmação de troca. Alterar a senha estando autenticado continua disponível no perfil.
- **Preço do P45:** preservado em R$ 115,00, exatamente como no catálogo do app. Confirme o preço comercial antes de usar em produção.
- **Localização:** o navegador fornece coordenadas, com permissão e contexto seguro (HTTPS ou localhost). Para preencher rua/bairro automaticamente, configure `VITE_REVERSE_GEOCODING_URL` com um serviço compatível e autorizado para seu tráfego. Sem isso, as coordenadas são exibidas e o endereço é preenchido manualmente. O site não transmite localização a um provedor externo por padrão.
- **Rastreamento:** o acompanhamento usa o status real. O mapa, entregador e previsão do app são ilustrativos; não há endpoint de rastreamento GPS na API.
- **Push:** tokens Expo não funcionam na web. Os avisos implementados dependem do site aberto. Push com o site fechado exige service worker, assinatura Web Push e envio pelo backend, ainda não implementados. Alguns navegadores móveis não suportam avisos sem service worker.
- **Atualização do app:** a trava de versão/download do APK não se aplica ao site.
- **CORS:** a API limita origens. Libere o domínio de produção explicitamente no servidor; o site não remove essa proteção.

## Pendências de segurança no backend

Pendências identificadas na API:

1. O cadastro público aceita `role: admin` e o service persiste o papel recebido. Enviar `customer` pelo site não impede chamadas diretas maliciosas. O servidor precisa fixar o papel de cliente no cadastro público.
2. Os preços dos pedidos vêm do cliente. A API verifica a aritmética, mas não consulta um catálogo confiável. O servidor precisa definir os preços para impedir manipulação.
3. A consulta de usuário por ID tem a verificação de propriedade comentada. Revisar o acesso a dados de outros usuários no backend.

Estas correções devem ser tratadas separadamente e autorizadas antes da publicação para clientes.

## Verificação

```bash
npm run lint
npm run build
node --experimental-strip-types --test tests/order.test.ts tests/api.test.mjs tests/render.test.mjs
```

Os testes usam o executor nativo do Node (versão 22.18+ recomendada) e dependências já existentes. Verificam totais, endereço, quantidades, navegação, contrato HTTP, autenticação, erros, expiração de sessão e renderização das telas. A renderização em testes não verifica layout ou cliques no navegador. As chamadas de teste são isoladas e não acessam a produção.

Para conferir os fluxos manualmente sem criar dados reais, use duas janelas do terminal:

```bash
node tests/mock-api.mjs
```

```bash
API_PROXY_TARGET=http://127.0.0.1:4318 npm run dev -- --port 5174
```

No site de teste, entre como `cliente@teste.local` ou `admin@teste.local`, com a senha fictícia `Teste123`. O servidor de teste guarda tudo apenas na memória, aceita as principais operações de pedidos/endereços e não implementa cadastro/recuperação. Ele não substitui validação final contra uma API de homologação. Ao encerrar, os dados desaparecem. Não publique o servidor de teste.

Roteiro manual: adicionar produtos, alterar quantidade, entrar, abrir a aba Endereços, cadastrar endereço, concluir um pedido e acompanhar. Depois, sair e entrar como administrador para aceitar o pedido, iniciar a entrega e finalizar; voltar ao cliente e verificar o status. Conferir também exclusão de endereço, erro de login, notificações, recarregamento e telas em larguras de 360px, 768px e desktop.
