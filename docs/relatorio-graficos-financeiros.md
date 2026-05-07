# Relatorio da Implementacao dos Graficos Financeiros

## Resumo

Foi implementada uma camada visual e analitica no painel financeiro da Lumi para transformar os dados de vendas, custos, lucro, caixa e retiradas em graficos e insights uteis. A implementacao nao usa IA nem bibliotecas externas de graficos neste momento; os graficos foram criados com React, SVG e Tailwind, mantendo o projeto leve e simples de manter.

O objetivo principal foi ajudar a ler rapidamente:

- quanto entrou de faturamento pago;
- quanto ainda falta entrar em vendas pendentes;
- quanto foi separado para reposicao, caixa e lucro distribuivel;
- quais produtos mais geram lucro;
- quando existem sinais de atencao no financeiro.

## Arquivos Alterados

- `src/components/FinancialDashboard.tsx`
  - Recebeu o novo bloco de graficos dentro do painel financeiro.

- `src/components/FinancialCharts.tsx`
  - Novo componente responsavel pela renderizacao dos graficos e cards de insights.

- `src/utils/finance.ts`
  - Recebeu novas funcoes de agregacao financeira para tendencias, ranking de produtos, status de pagamentos e insights automaticos.

## Graficos Implementados

### 1. Evolucao financeira

Mostra a evolucao do financeiro ao longo do tempo, considerando apenas vendas pagas.

Leitura:

- Barras marrons: faturamento pago.
- Barras verdes: reserva de caixa.
- Linha verde: lucro distribuivel.

Uso pratico:

- Se o faturamento sobe, mas a linha de lucro nao acompanha, pode existir queda de margem.
- Se o caixa fica baixo em relacao ao faturamento, pode ser necessario revisar a regra de reserva.
- Em filtros curtos, o grafico agrupa por dia. No filtro `Tudo`, agrupa por mes.

### 2. Insights uteis

Mostra alertas e leituras automaticas calculadas com regras fixas, sem IA.

Insights possiveis:

- Produto lider em lucro.
- Lucro concentrado.
- Receita a confirmar.
- Pendencias relevantes.
- Retiradas sob controle.
- Retiradas altas no periodo.
- Margem apertada.
- Caixa sensivel.
- Financeiro saudavel.

Uso pratico:

- Serve como uma leitura rapida do que merece atencao antes de olhar a tabela completa.
- Ajuda a identificar dependencia de poucos produtos, excesso de pendencias ou margem baixa.

### 3. Destino do dinheiro

Mostra como o dinheiro das vendas pagas esta sendo separado.

Leitura:

- Reposicao: valor reservado para recomprar mercadoria.
- Caixa: reserva da empresa.
- Lucro distribuivel: valor disponivel para divisao entre Victor e Mirella.

Uso pratico:

- Ajuda a entender se o dinheiro esta indo mais para estoque, caixa ou distribuicao.
- Facilita revisar se a regra financeira ativa esta equilibrada.

### 4. Pago vs pendente

Compara receita ja realizada com receita ainda prevista.

Leitura:

- Verde: vendas pagas.
- Amarelo: vendas pendentes.

Uso pratico:

- Se o amarelo estiver alto, existe receita prometida que ainda nao virou caixa.
- Ajuda a separar resultado real de expectativa de recebimento.

### 5. Produtos que mais geram lucro

Ranking dos produtos com maior lucro bruto no periodo filtrado.

Leitura:

- O ranking usa lucro bruto, nao apenas faturamento.
- Lucro bruto = preco de venda - custo unitario salvo no snapshot.
- A margem exibida mostra o percentual de lucro bruto sobre o preco de venda.

Uso pratico:

- Ajuda a decidir quais produtos recomprar.
- Mostra quais perfumes realmente trazem melhor resultado financeiro.
- Evita confundir produto caro com produto lucrativo.

## Como os Insights Sao Calculados

### Produto lider em lucro / Lucro concentrado

O sistema pega o produto pago com maior lucro bruto no periodo.

Formula:

```txt
lucro_bruto = preco_venda - custo_unitario_snapshot
```

Se o produto lider representa 35% ou mais do lucro bruto total do periodo, o insight vira `Lucro concentrado`.

Se representa menos de 35%, o insight aparece como `Produto lider em lucro`.

### Receita a confirmar / Pendencias relevantes

O sistema soma todas as vendas com status `pendente` no filtro atual.

Formula:

```txt
receita_pendente = soma(preco_venda das vendas pendentes)
```

Depois compara esse valor com o faturamento pago.

Se a receita pendente for maior que 35% do faturamento pago, aparece como `Pendencias relevantes`.

### Retiradas sob controle / Retiradas altas

O sistema soma as retiradas de Victor e Mirella no periodo e compara com o lucro distribuivel.

Formula:

```txt
percentual_retirado = retiradas_totais / lucro_distribuivel
```

Se as retiradas forem maiores que 75% do lucro distribuivel, aparece como `Retiradas altas no periodo`.

### Margem apertada

O sistema conta vendas pagas com margem bruta abaixo de 25%.

Formula:

```txt
margem_bruta = lucro_bruto_snapshot / preco_venda
```

Se alguma venda paga ficar abaixo de 25%, aparece o alerta de margem apertada.

### Caixa sensivel

O sistema compara reserva de caixa com a receita pendente.

Regra:

```txt
reserva_caixa < receita_pendente * 0.15
```

Se isso acontecer, aparece o alerta de caixa sensivel.

### Financeiro saudavel

Quando nenhuma regra de atencao e acionada, o painel mostra que o financeiro esta saudavel no filtro atual.

## Observacoes Tecnicas

- A implementacao usa os snapshots financeiros salvos nas vendas.
- Vendas antigas sem snapshot ainda podem ser estimadas pela regra financeira ativa, seguindo a logica ja existente no projeto.
- Os graficos respeitam o filtro selecionado no painel: `Mes atual`, `30 dias` ou `Tudo`.
- A versao mobile foi ajustada para nao exigir rolagem lateral no bloco de graficos.
- Nenhuma alteracao de banco foi necessaria.
- Nenhuma dependencia externa nova foi adicionada.

## Validacoes Realizadas

Foram executadas as validacoes principais do projeto:

```txt
npx tsc --noEmit --pretty false -p tsconfig.app.json
npm run lint
npm run build
```

Todas passaram sem erros.
