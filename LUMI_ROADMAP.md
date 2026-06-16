# LUMI Imports — Roadmap E-commerce

## Contexto
A LUMI é uma SPA React 19 + Vite + Supabase: catálogo dinâmico, carrinho persistente
(`localStorage`) e um ERP/admin maduro (estoque, viagens, vendas, financeiro). O
ponto cego é a venda: o checkout é apenas um link de WhatsApp — nenhum pedido é
gravado, não há pagamento, frete nem baixa de estoque na compra online. Há ainda
duas falhas de segurança críticas (RLS provavelmente ausente em `produtos`/`vendas`/
`viagens` e a chave do Gemini exposta no bundle) e zero cobertura de testes.
**Complexidade atual: ~38%** — catálogo + carrinho prontos, checkout real inexistente.

## Princípios
- TDD: teste primeiro, código depois
- Entregas pequenas e mergeáveis
- Cada task tem critério de aceite verificável
- Priorizar o que destrava receita

## Fases

### Fase 1 — Correções críticas (bloqueadores)

#### TASK-001: Configurar ambiente de testes
- **Objetivo:** habilitar TDD em todo o roadmap (hoje não há test runner).
- **Prioridade:** 🔴
- **Estimativa:** 3h
- **Depende de:** nenhuma
- **Spec (escrever ANTES do código):**
```ts
describe('ambiente de testes', () => {
  it('deve rodar vitest com jsdom e Testing Library', () => { /* teste smoke de um componente */ })
  it('deve falhar quando um teste de exemplo quebra', () => { /* asserção intencionalmente válida */ })
})
```
- **Critério de aceite:**
  - [ ] Testes passando (`npm test`)
  - [ ] `vitest`, `@testing-library/react`, `jsdom` instalados como devDependencies
  - [ ] Script `test` no `package.json` e config em `vite.config.ts`
- **Arquivos afetados:** `package.json`, `vite.config.ts`, `src/test/setup.ts`

#### TASK-002: Habilitar RLS em produtos, vendas e viagens
- **Objetivo:** impedir que a anon key (exposta no bundle) escreva/leia dados sensíveis.
- **Prioridade:** 🔴
- **Estimativa:** 4h
- **Depende de:** TASK-001
- **Spec (escrever ANTES do código):**
```ts
describe('RLS produtos/vendas/viagens', () => {
  it('deve permitir leitura pública de produtos via anon key', async () => { /* select ok */ })
  it('deve falhar quando anon key tenta inserir/atualizar produto', async () => { /* insert negado */ })
  it('deve falhar quando anon key lê vendas ou viagens', async () => { /* select negado */ })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] `produtos`: SELECT público, INSERT/UPDATE/DELETE só `authenticated`
  - [ ] `vendas` e `viagens`: todo acesso restrito a `authenticated`
  - [ ] Migration versionada e aplicada
- **Arquivos afetados:** `supabase/migrations/2026XXXX_catalog_rls.sql`

#### TASK-003: Mover enriquecimento de IA para Edge Function
- **Objetivo:** tirar `VITE_GEMINI_API_KEY` do bundle do cliente.
- **Prioridade:** 🔴
- **Estimativa:** 5h
- **Depende de:** TASK-001
- **Spec (escrever ANTES do código):**
```ts
describe('enrichPerfumeData', () => {
  it('deve retornar atributos do perfume chamando a Edge Function', async () => { /* mock fetch */ })
  it('deve falhar quando a chamada não está autenticada', async () => { /* 401 */ })
  it('deve falhar quando a IA retorna JSON inválido', async () => { /* erro tratado */ })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Chave do Gemini só existe no ambiente da Edge Function (não no bundle)
  - [ ] Edge Function exige sessão `authenticated`
  - [ ] `useInventoryForm` consome a function sem mudança de UX
- **Arquivos afetados:** `supabase/functions/enrich-perfume/index.ts`, `src/lib/gemini.ts`

#### TASK-004: Reconciliar preço e estoque do carrinho com o catálogo
- **Objetivo:** evitar que o carrinho mostre/finalize preços e estoques desatualizados.
- **Prioridade:** 🟡
- **Estimativa:** 4h
- **Depende de:** TASK-001
- **Spec (escrever ANTES do código):**
```ts
describe('reconciliação do carrinho', () => {
  it('deve atualizar price e estoque do item com base no produto atual', () => { ... })
  it('deve manter o item e marcar indisponível quando o produto esgota', () => { ... })
  it('deve falhar (rejeitar) item de localStorage com formato corrompido', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Itens do carrinho refletem preço/estoque atuais ao carregar a página
  - [ ] Produto esgotado permanece visível no drawer marcado como indisponível
- **Arquivos afetados:** `src/contexts/CartContext.tsx`, `src/contexts/cart.ts`, `src/components/CartDrawer.tsx`

#### TASK-005: Estado de erro no carregamento do catálogo
- **Objetivo:** não mostrar "Nenhuma fragrância encontrada" quando o fetch falha.
- **Prioridade:** 🟡
- **Estimativa:** 2h
- **Depende de:** TASK-001
- **Spec (escrever ANTES do código):**
```ts
describe('Catalogo - erro de fetch', () => {
  it('deve exibir bloco de erro com botão de retry quando o fetch falha', () => { ... })
  it('deve falhar (não exibir vazio) quando há erro mas existem produtos em cache', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] UI de erro distinta do estado vazio, com "Tentar novamente"
  - [ ] Remover `setTimeout` artificial de loading (`Catalogo.tsx:252`)
- **Arquivos afetados:** `src/pages/Catalogo.tsx`

### Fase 2 — MVP de venda (mínimo para faturar)

#### TASK-006: Modelar tabelas de pedidos
- **Objetivo:** persistir pedidos do cliente (hoje a venda morre no WhatsApp).
- **Prioridade:** 🔴
- **Estimativa:** 5h
- **Depende de:** TASK-002
- **Spec (escrever ANTES do código):**
```ts
describe('schema pedidos', () => {
  it('deve criar pedido com itens, endereço, frete e status', () => { ... })
  it('deve falhar quando pedido referencia produto inexistente', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Tabelas `pedidos` e `pedido_itens` com RLS (cliente vê só os seus)
  - [ ] `pedido_itens` guarda snapshot de preço/nome no momento da compra
  - [ ] `src/types/supabase.ts` atualizado
- **Arquivos afetados:** `supabase/migrations/2026XXXX_orders.sql`, `src/types/supabase.ts`

#### TASK-007: RPC atômica de criação de pedido + baixa de estoque
- **Objetivo:** fechar pedido e debitar estoque numa transação (sem overselling).
- **Prioridade:** 🔴
- **Estimativa:** 6h
- **Depende de:** TASK-006
- **Spec (escrever ANTES do código):**
```ts
describe('criar_pedido (RPC)', () => {
  it('deve criar o pedido e debitar o estoque de cada item', async () => { ... })
  it('deve falhar e não gravar nada quando um item excede o estoque', async () => { ... })
  it('deve falhar quando duas chamadas concorrem pelo mesmo último item', async () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Função Postgres transacional valida estoque antes de debitar
  - [ ] Pedido nasce com status `aguardando_pagamento`
- **Arquivos afetados:** `supabase/migrations/2026XXXX_criar_pedido_rpc.sql`

#### TASK-008: Cálculo de frete
- **Objetivo:** mostrar custo de envio antes do pagamento.
- **Prioridade:** 🔴
- **Estimativa:** 8h (flat rate: 3h)
- **Depende de:** TASK-006
- **Spec (escrever ANTES do código):**
```ts
describe('cálculo de frete', () => {
  it('deve retornar opções de frete para um CEP válido', async () => { ... })
  it('deve falhar quando o CEP é inválido', async () => { ... })
  it('deve aplicar frete grátis acima do valor mínimo', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Frete calculado por CEP e somado ao total do pedido
  - [ ] Regra de frete grátis configurável
- **Arquivos afetados:** `src/lib/shipping.ts`, `supabase/functions/cotar-frete/index.ts`
- **Nota:** provider depende de decisão pendente (ver fim do arquivo).

#### TASK-009: Página de checkout
- **Objetivo:** coletar identificação, endereço e frete antes do pagamento.
- **Prioridade:** 🔴
- **Estimativa:** 10h
- **Depende de:** TASK-007, TASK-008
- **Spec (escrever ANTES do código):**
```ts
describe('Checkout', () => {
  it('deve avançar para pagamento com endereço e frete válidos', () => { ... })
  it('deve falhar quando campos obrigatórios do endereço faltam', () => { ... })
  it('deve falhar quando o carrinho está vazio', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Rota `/checkout` com resumo do pedido, endereço e seleção de frete
  - [ ] Validação de CEP, e-mail e telefone
  - [ ] Chama `criar_pedido` ao confirmar
- **Arquivos afetados:** `src/pages/Checkout.tsx`, `src/App.tsx`

#### TASK-010: Integração de pagamento Pix
- **Objetivo:** receber pagamento online (destrava a receita).
- **Prioridade:** 🔴
- **Estimativa:** 12h
- **Depende de:** TASK-009
- **Spec (escrever ANTES do código):**
```ts
describe('pagamento Pix', () => {
  it('deve gerar cobrança Pix (QR + copia-e-cola) para um pedido', async () => { ... })
  it('deve marcar o pedido como pago ao receber o webhook de confirmação', async () => { ... })
  it('deve falhar quando o webhook tem assinatura inválida', async () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Cobrança Pix gerada via Edge Function (credenciais fora do bundle)
  - [ ] Webhook valida assinatura e atualiza status do pedido
- **Arquivos afetados:** `supabase/functions/criar-cobranca/index.ts`, `supabase/functions/webhook-pagamento/index.ts`, `src/pages/Checkout.tsx`
- **Nota:** gateway depende de decisão pendente.

#### TASK-011: E-mail transacional de confirmação
- **Objetivo:** confirmar o pedido ao cliente após o pagamento.
- **Prioridade:** 🟡
- **Estimativa:** 4h
- **Depende de:** TASK-010
- **Spec (escrever ANTES do código):**
```ts
describe('e-mail de confirmação', () => {
  it('deve enviar e-mail com itens e total ao confirmar o pagamento', async () => { ... })
  it('deve falhar de forma silenciosa sem travar o webhook quando o envio falha', async () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] E-mail disparado pelo webhook de pagamento confirmado
  - [ ] Falha de envio não reverte o status do pedido
- **Arquivos afetados:** `supabase/functions/webhook-pagamento/index.ts`, `supabase/functions/_shared/email.ts`

#### TASK-012: Página de confirmação do pedido
- **Objetivo:** dar feedback claro de sucesso pós-checkout.
- **Prioridade:** 🟡
- **Estimativa:** 3h
- **Depende de:** TASK-010
- **Spec (escrever ANTES do código):**
```ts
describe('Pedido confirmado', () => {
  it('deve exibir número do pedido e resumo ao acessar /pedido/:id', () => { ... })
  it('deve falhar (404) quando o pedido não existe ou não é do usuário', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Rota `/pedido/:id` com número, itens, total e status
  - [ ] Carrinho é limpo após sucesso
- **Arquivos afetados:** `src/pages/PedidoConfirmado.tsx`, `src/App.tsx`, `src/contexts/CartContext.tsx`

### Fase 3 — Operação (estoque, pedidos, pós-venda)

#### TASK-013: Gestão de pedidos no admin
- **Objetivo:** permitir à LUMI processar e despachar pedidos.
- **Prioridade:** 🔴
- **Estimativa:** 8h
- **Depende de:** TASK-010
- **Spec (escrever ANTES do código):**
```ts
describe('Admin - pedidos', () => {
  it('deve listar pedidos com status e permitir avançar para "enviado"', () => { ... })
  it('deve falhar quando tenta enviar pedido ainda não pago', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Nova aba "Pedidos" no Admin com filtro por status
  - [ ] Transições de status válidas (pago → separando → enviado → entregue)
- **Arquivos afetados:** `src/components/OrdersManager.tsx`, `src/pages/Admin.tsx`

#### TASK-014: Webhook → status + código de rastreio
- **Objetivo:** registrar rastreio e refletir status para o cliente.
- **Prioridade:** 🟡
- **Estimativa:** 5h
- **Depende de:** TASK-013
- **Spec (escrever ANTES do código):**
```ts
describe('rastreio do pedido', () => {
  it('deve salvar código de rastreio e marcar pedido como enviado', () => { ... })
  it('deve falhar quando o código de rastreio é vazio', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Campo de rastreio no pedido, editável pelo admin
  - [ ] Cliente vê o status/rastreio
- **Arquivos afetados:** `src/components/OrdersManager.tsx`, `supabase/migrations/2026XXXX_order_tracking.sql`

#### TASK-015: Área do cliente
- **Objetivo:** login do cliente + histórico de pedidos.
- **Prioridade:** 🟡
- **Estimativa:** 8h
- **Depende de:** TASK-006
- **Spec (escrever ANTES do código):**
```ts
describe('Área do cliente', () => {
  it('deve listar apenas os pedidos do cliente logado', () => { ... })
  it('deve falhar (redirect login) quando não há sessão', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Rota `/minha-conta` com login/cadastro de cliente e histórico
  - [ ] RLS garante isolamento entre clientes
- **Arquivos afetados:** `src/pages/MinhaConta.tsx`, `src/App.tsx`

#### TASK-016: Cupons de desconto
- **Objetivo:** suportar promoções e campanhas.
- **Prioridade:** 🟢
- **Estimativa:** 6h
- **Depende de:** TASK-009
- **Spec (escrever ANTES do código):**
```ts
describe('cupom de desconto', () => {
  it('deve aplicar desconto percentual válido ao total', () => { ... })
  it('deve falhar quando o cupom está expirado ou inexistente', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Tabela `cupons` + validação no checkout (server-side)
  - [ ] Desconto refletido no `criar_pedido`
- **Arquivos afetados:** `supabase/migrations/2026XXXX_coupons.sql`, `src/pages/Checkout.tsx`

#### TASK-017: Emissão de NF-e
- **Objetivo:** conformidade fiscal da venda.
- **Prioridade:** 🟢
- **Estimativa:** 12h
- **Depende de:** TASK-013
- **Spec (escrever ANTES do código):**
```ts
describe('NF-e', () => {
  it('deve emitir nota para um pedido pago e anexar a chave de acesso', async () => { ... })
  it('deve falhar quando faltam dados fiscais do produto', async () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Integração com emissor fiscal via Edge Function
  - [ ] Chave/PDF da nota vinculados ao pedido
- **Arquivos afetados:** `supabase/functions/emitir-nfe/index.ts`, `src/components/OrdersManager.tsx`
- **Nota:** emissor fiscal depende de decisão pendente.

### Fase 4 — Crescimento (SEO, automações, retenção)

#### TASK-018: SEO de páginas de produto (prerender + meta + JSON-LD)
- **Objetivo:** tornar produtos indexáveis e ricos em busca/redes sociais.
- **Prioridade:** 🟡
- **Estimativa:** 10h
- **Depende de:** nenhuma
- **Spec (escrever ANTES do código):**
```ts
describe('SEO produto', () => {
  it('deve renderizar title, description e og:image específicos do produto', () => { ... })
  it('deve incluir JSON-LD Product/Offer com preço e disponibilidade', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Meta tags dinâmicas por produto
  - [ ] JSON-LD `Product` válido (Rich Results Test)
  - [ ] Estratégia de prerender/SSG decidida e aplicada
- **Arquivos afetados:** `src/pages/ProdutoDetalhe.tsx`, `vite.config.ts`, `index.html`
- **Nota:** prerender vs. migração de framework é decisão pendente.

#### TASK-019: sitemap.xml e robots.txt
- **Objetivo:** permitir indexação dirigida pelos buscadores.
- **Prioridade:** 🟡
- **Estimativa:** 3h
- **Depende de:** nenhuma
- **Spec (escrever ANTES do código):**
```ts
describe('sitemap', () => {
  it('deve gerar uma entrada por produto com slug e lastmod', () => { ... })
  it('deve falhar (não listar) produtos sem slug', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] `sitemap.xml` gerado no build com todos os produtos
  - [ ] `robots.txt` com referência ao sitemap
- **Arquivos afetados:** `scripts/generate-sitemap.ts`, `public/robots.txt`, `package.json`

#### TASK-020: Recuperação de carrinho abandonado
- **Objetivo:** recuperar receita de checkouts não finalizados.
- **Prioridade:** 🟢
- **Estimativa:** 6h
- **Depende de:** TASK-011, TASK-015
- **Spec (escrever ANTES do código):**
```ts
describe('carrinho abandonado', () => {
  it('deve enviar lembrete para pedido aguardando_pagamento após X horas', async () => { ... })
  it('deve falhar (não enviar) quando o pedido já foi pago', async () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Job agendado detecta pedidos parados e dispara e-mail
  - [ ] Não envia para pedidos pagos/cancelados
- **Arquivos afetados:** `supabase/functions/carrinho-abandonado/index.ts`

#### TASK-021: Reviews de produto
- **Objetivo:** prova social real na página de produto.
- **Prioridade:** 🟢
- **Estimativa:** 7h
- **Depende de:** TASK-006
- **Spec (escrever ANTES do código):**
```ts
describe('reviews', () => {
  it('deve exibir média de notas e avaliações aprovadas do produto', () => { ... })
  it('deve permitir avaliar apenas quem comprou o produto', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Tabela `avaliacoes` com moderação
  - [ ] Média e contagem na página de produto + JSON-LD `aggregateRating`
- **Arquivos afetados:** `supabase/migrations/2026XXXX_reviews.sql`, `src/pages/ProdutoDetalhe.tsx`

#### TASK-022: Limpeza de dependências e acessibilidade do ProductCard
- **Objetivo:** reduzir bundle e corrigir navegação por teclado.
- **Prioridade:** 🟢
- **Estimativa:** 3h
- **Depende de:** nenhuma
- **Spec (escrever ANTES do código):**
```ts
describe('ProductCard a11y', () => {
  it('deve navegar para o produto ao pressionar Enter sobre o card', () => { ... })
  it('deve falhar quando o card não é focável por teclado', () => { ... })
})
```
- **Critério de aceite:**
  - [ ] Testes passando
  - [ ] Navegação do card via elemento focável (`<a>`/`<button>`)
  - [ ] `motion`/`framer-motion` unificados; `shadcn`/`ogl`/`@base-ui/react` removidos se sem uso
  - [ ] `npm run build` sem aumento de bundle
- **Arquivos afetados:** `src/components/ProductCard.tsx`, `package.json`

---

## Quick wins (<2h, alto impacto)
- Corrigir `index.html`: favicon JPEG declarado como `image/svg+xml` (`index.html:5`) e `og:image` em SVG (`index.html:14`, trocar por PNG/JPG).
- Remover `setTimeout` artificial de loading em `Catalogo.tsx:252` e `ProdutoDetalhe.tsx:77`.
- Remover página/rota morta `DiaDasMaes` (`App.tsx:56`, `src/pages/DiaDasMaes.tsx`).
- Mover `shadcn` (CLI) para devDependencies e eliminar `motion` duplicado de `framer-motion` no `package.json`.
- `parseMoneyInput` (`src/utils/parsing.ts:20`): aplicar guarda `Number.isFinite` para não retornar `NaN`.

## Riscos técnicos
- **RLS provavelmente ausente** em `produtos`/`vendas`/`viagens`: a anon key vai no bundle do cliente — qualquer pessoa poderia ler vendas/financeiro e alterar preços/estoque. Verificar no painel Supabase com urgência (TASK-002).
- **Chave do Gemini exposta** no bundle (`src/lib/gemini.ts:16`) — risco de abuso e custo (TASK-003).
- **Overselling**: a compra online não debita estoque (não há pedido). Mitigado só na TASK-007.
- **`/admin` sem checagem de role** (`ProtectedRoute.tsx`): qualquer usuário autenticado no projeto Supabase entra. Avaliar claim de admin ao implementar a área do cliente (TASK-015).
- **CSR puro**: SEO de produto fraco até a TASK-018; pode exigir reescrita parcial da camada de roteamento.
- Carregamento integral do catálogo (`Catalogo.tsx:242`) não escala — revisar para paginação server-side conforme o catálogo cresce.

## Decisões pendentes (precisam de resposta antes de seguir)
1. **Gateway de pagamento** (TASK-010): Asaas, Mercado Pago ou Pagar.me? O AGENTS.md cita "Asaas/Pix" — confirmar.
2. **Provider de frete** (TASK-008): Melhor Envio, Correios direto, ou frete fixo/grátis no MVP?
3. **Estratégia de SEO/render** (TASK-018): prerender estático sobre o Vite atual, ou migração para Next.js/Remix (SSR)?
4. **Emissor fiscal** (TASK-017): qual serviço de NF-e (eNotas, NFe.io, Bling)? Ou postergar até validar volume?
5. **Variações de produto**: hoje cada volume é um produto separado. Manter assim ou modelar variações (volume/aroma) sob um produto-pai?
6. **Cadastro de cliente**: login obrigatório ou checkout como convidado (guest checkout) no MVP?
