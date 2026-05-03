import type { Database } from '../types/supabase';

type Product = Database['public']['Tables']['produtos']['Row'];
type Sale = Database['public']['Tables']['vendas']['Row'];
export type FinancialConfig = Database['public']['Tables']['financeiro_configuracoes']['Row'];
export type FinancialWithdrawal = Database['public']['Tables']['financeiro_retiradas']['Row'];

export type FinancePeriod = 'current-month' | 'last-30-days' | 'all';

export const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  id: '',
  created_at: '',
  nome: 'Regra padrao Lumi V1',
  reposicao_percentual: 1,
  caixa_percentual: 0.1,
  split_voce_percentual: 0.5,
  split_mae_percentual: 0.5,
  ativo: true,
};

export type SaleFinancialSnapshot = {
  custo_unitario_snapshot: number;
  reposicao_snapshot: number;
  lucro_bruto_snapshot: number;
  reserva_caixa_snapshot: number;
  lucro_distribuivel_snapshot: number;
  lucro_voce_snapshot: number;
  lucro_mae_snapshot: number;
  financeiro_estimado: boolean;
  financeiro_configuracao_id: string | null;
};

export type SaleFinancialRow = SaleFinancialSnapshot & {
  id: string;
  created_at: string;
  data_venda: string;
  cliente: string;
  produto_id: string;
  product_name: string;
  preco_venda: number;
  status_pagamento: Sale['status_pagamento'];
};

const toNumber = (value: number | null | undefined) => (
  typeof value === 'number' && Number.isFinite(value) ? value : 0
);

export const formatCurrency = (val: number) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
);

export const getActiveFinancialConfig = (configs: FinancialConfig[]) => {
  return configs.find(config => config.ativo) || DEFAULT_FINANCIAL_CONFIG;
};

export const calculateSaleFinancials = (
  salePrice: number,
  unitCost: number,
  config: FinancialConfig = DEFAULT_FINANCIAL_CONFIG
): SaleFinancialSnapshot => {
  const grossProfit = salePrice - unitCost;
  const cashReserve = grossProfit * config.caixa_percentual;
  const distributableProfit = grossProfit - cashReserve;

  return {
    custo_unitario_snapshot: unitCost,
    reposicao_snapshot: unitCost * config.reposicao_percentual,
    lucro_bruto_snapshot: grossProfit,
    reserva_caixa_snapshot: cashReserve,
    lucro_distribuivel_snapshot: distributableProfit,
    lucro_voce_snapshot: distributableProfit * config.split_voce_percentual,
    lucro_mae_snapshot: distributableProfit * config.split_mae_percentual,
    financeiro_estimado: false,
    financeiro_configuracao_id: config.id || null,
  };
};

export const getSaleFinancialRow = (
  sale: Sale,
  product: Product | undefined,
  config: FinancialConfig = DEFAULT_FINANCIAL_CONFIG
): SaleFinancialRow => {
  const hasSnapshot = sale.custo_unitario_snapshot !== null;
  const snapshot = hasSnapshot
    ? {
      custo_unitario_snapshot: toNumber(sale.custo_unitario_snapshot),
      reposicao_snapshot: toNumber(sale.reposicao_snapshot),
      lucro_bruto_snapshot: toNumber(sale.lucro_bruto_snapshot),
      reserva_caixa_snapshot: toNumber(sale.reserva_caixa_snapshot),
      lucro_distribuivel_snapshot: toNumber(sale.lucro_distribuivel_snapshot),
      lucro_voce_snapshot: toNumber(sale.lucro_voce_snapshot),
      lucro_mae_snapshot: toNumber(sale.lucro_mae_snapshot),
      financeiro_estimado: sale.financeiro_estimado,
      financeiro_configuracao_id: sale.financeiro_configuracao_id,
    }
    : {
      ...calculateSaleFinancials(sale.preco_venda, product?.custo_final_brl || 0, config),
      financeiro_estimado: true,
    };

  return {
    ...snapshot,
    id: sale.id,
    created_at: sale.created_at,
    data_venda: sale.data_venda,
    cliente: sale.cliente,
    produto_id: sale.produto_id,
    product_name: product?.nome || 'Produto removido',
    preco_venda: sale.preco_venda,
    status_pagamento: sale.status_pagamento,
  };
};

export const getPeriodStart = (period: FinancePeriod) => {
  const now = new Date();

  if (period === 'current-month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (period === 'last-30-days') {
    const date = new Date(now);
    date.setDate(date.getDate() - 30);
    return date;
  }

  return null;
};

export const isWithinPeriod = (dateValue: string, period: FinancePeriod) => {
  const start = getPeriodStart(period);
  if (!start) return true;

  return new Date(dateValue) >= start;
};

export const buildFinancialRows = (
  sales: Sale[],
  products: Product[],
  config: FinancialConfig = DEFAULT_FINANCIAL_CONFIG,
  period: FinancePeriod = 'all'
) => {
  return sales
    .filter(sale => isWithinPeriod(sale.data_venda, period))
    .map(sale => getSaleFinancialRow(
      sale,
      products.find(product => product.id === sale.produto_id),
      config
    ));
};

export const summarizeFinancialRows = (
  rows: SaleFinancialRow[],
  withdrawals: FinancialWithdrawal[] = [],
  period: FinancePeriod = 'all'
) => {
  const paidRows = rows.filter(row => row.status_pagamento === 'pago');
  const pendingRows = rows.filter(row => row.status_pagamento === 'pendente');
  const periodWithdrawals = withdrawals.filter(withdrawal => isWithinPeriod(withdrawal.data_retirada, period));

  const totals = paidRows.reduce((acc, row) => {
    acc.revenue += row.preco_venda;
    acc.cost += row.custo_unitario_snapshot;
    acc.replacement += row.reposicao_snapshot;
    acc.cashReserve += row.reserva_caixa_snapshot;
    acc.grossProfit += row.lucro_bruto_snapshot;
    acc.distributableProfit += row.lucro_distribuivel_snapshot;
    acc.yourProfit += row.lucro_voce_snapshot;
    acc.motherProfit += row.lucro_mae_snapshot;
    return acc;
  }, {
    revenue: 0,
    cost: 0,
    replacement: 0,
    cashReserve: 0,
    grossProfit: 0,
    distributableProfit: 0,
    yourProfit: 0,
    motherProfit: 0,
  });

  const pendingRevenue = pendingRows.reduce((sum, row) => sum + row.preco_venda, 0);
  const yourWithdrawals = periodWithdrawals
    .filter(withdrawal => withdrawal.pessoa === 'voce')
    .reduce((sum, withdrawal) => sum + withdrawal.valor, 0);
  const motherWithdrawals = periodWithdrawals
    .filter(withdrawal => withdrawal.pessoa === 'mae')
    .reduce((sum, withdrawal) => sum + withdrawal.valor, 0);

  return {
    ...totals,
    pendingRevenue,
    withdrawals: yourWithdrawals + motherWithdrawals,
    yourWithdrawals,
    motherWithdrawals,
    yourBalance: totals.yourProfit - yourWithdrawals,
    motherBalance: totals.motherProfit - motherWithdrawals,
    paidCount: paidRows.length,
    pendingCount: pendingRows.length,
    estimatedCount: paidRows.filter(row => row.financeiro_estimado).length,
  };
};

/**
 * Taxas progressivas simuladas de maquininha de cartão.
 * ATENÇÃO: Ajuste estes multiplicadores conforme o contrato real da sua adquirente
 * (ex: PagSeguro, Stone, Mercado Pago).
 * 
 * Exemplo: 1.042 significa 4.2% de taxa total sobre o valor da venda.
 */
export const CREDIT_CARD_RATES: Record<number, number> = {
  1: 1.0420,  // 4.2%
  2: 1.0609,  // 6.09%
  3: 1.0701,  // 7.01%
  4: 1.0791,  // 7.91%
  5: 1.0880,  // 8.80%
  6: 1.0967,  // 9.67%
  7: 1.1259,  // 12.59%
  8: 1.1342,  // 13.42%
  9: 1.1425,  // 14.25%
  10: 1.1506, // 15.06%
  11: 1.1587, // 15.87%
  12: 1.1653, // 16.53%
};

/**
 * Calcula o valor da parcela aplicando a taxa de juros correspondente.
 * 
 * @param cashPrice Preço à vista original.
 * @param installments Número de parcelas desejadas (padrão: 12).
 * @returns O valor de CADA parcela já com os juros embutidos.
 */
export function calculateInstallment(cashPrice: number, installments: number = 12): number {
  const rateMultiplier = CREDIT_CARD_RATES[installments] || 1.20; // fallback para 12x
  const totalWithInterest = cashPrice * rateMultiplier;
  return totalWithInterest / installments;
}
