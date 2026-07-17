import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { AlertTriangle, Award, CircleDollarSign, HandCoins, Package, TrendingUp } from 'lucide-react';
import type { Database } from '../types/supabase';
import {
  buildAvailableSaleMonths,
  buildFinancialRowsForMonth,
  buildProductPerformance,
  DEFAULT_FINANCIAL_CONFIG,
  formatCurrency,
  formatMonthKeyLabel,
  summarizeFinancialRows,
  type FinancialConfig,
} from '../utils/finance';

type Sale = Database['public']['Tables']['vendas']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];
type Trip = Database['public']['Tables']['viagens']['Row'];

interface Props {
  sales: Sale[];
  products: Product[];
  trips: Trip[];
  financialConfig?: FinancialConfig;
}

const LOW_STOCK_THRESHOLD = 1;

export function DashboardOverview({ sales, products, trips, financialConfig = DEFAULT_FINANCIAL_CONFIG }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const availableMonths = useMemo(() => buildAvailableSaleMonths(sales), [sales]);

  const { totalRevenue, netProfit, roi } = useMemo(() => {
    const rows = buildFinancialRowsForMonth(sales, products, financialConfig, selectedMonth);
    const summary = summarizeFinancialRows(rows);
    const returnOnInvest = summary.cost > 0 ? (summary.grossProfit / summary.cost) * 100 : 0;

    return {
      totalRevenue: summary.revenue,
      netProfit: summary.grossProfit,
      roi: returnOnInvest
    };
  }, [sales, products, financialConfig, selectedMonth]);

  const bestSellingProduct = useMemo(() => {
    const allTimeRows = buildFinancialRowsForMonth(sales, products, financialConfig, 'all');
    return buildProductPerformance(allTimeRows, 1, 'salesCount')[0] ?? null;
  }, [sales, products, financialConfig]);

  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.estoque ?? 0), 0),
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter(p => p.estoque > 0 && p.estoque <= LOW_STOCK_THRESHOLD),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter(p => p.estoque <= 0),
    [products]
  );

  const reposicaoProducts = [...outOfStockProducts, ...lowStockProducts];

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border-brand-brown/10">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-brand-brown">Visão Financeira</CardTitle>
            <CardDescription className="text-brand-brown/70">Resumo de receitas e lucros (Vendas Pagas).</CardDescription>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 w-full rounded-md border border-brand-brown/20 bg-white px-3 text-sm font-medium text-brand-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown sm:w-56"
          >
            <option value="all">Todo o período</option>
            {availableMonths.map(monthKey => (
              <option key={monthKey} value={monthKey}>{formatMonthKeyLabel(monthKey)}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-brand-bg border border-brand-brown/20 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-brown/80">Receita Total</p>
              <h3 className="text-2xl font-bold text-brand-brown mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <CircleDollarSign className="text-brand-brown/30 h-8 w-8" />
          </div>

          <div className="rounded-xl bg-[#e3eedd] border border-emerald-900/10 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900/80">Lucro Bruto</p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(netProfit)}</h3>
            </div>
            <HandCoins className="text-emerald-900/30 h-8 w-8" />
          </div>

          <div className="rounded-xl bg-white border border-brand-brown/20 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-brown/80">ROI em Tempo Real</p>
              <h3 className="text-2xl font-bold text-brand-brown mt-1">{roi.toFixed(2)}%</h3>
            </div>
            <TrendingUp className="text-brand-brown/30 h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-brand-brown/10">
        <CardHeader>
          <CardTitle className="text-brand-brown">Resumo de Produtos</CardTitle>
          <CardDescription className="text-brand-brown/70">Estoque, desempenho e alertas de reposição.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-brand-bg border border-brand-brown/20 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-brown/80">Produtos Cadastrados</p>
                <h3 className="text-2xl font-bold text-brand-brown mt-1">{products.length}</h3>
                <p className="text-xs text-brand-brown/55 mt-1">{trips.length} viagens registradas</p>
              </div>
              <Package className="text-brand-brown/30 h-8 w-8" />
            </div>

            <div className="rounded-xl bg-brand-bg border border-brand-brown/20 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-brown/80">Tamanho do Estoque</p>
                <h3 className="text-2xl font-bold text-brand-brown mt-1">{totalStockUnits} un.</h3>
                <p className="text-xs text-brand-brown/55 mt-1">unidades disponíveis no total</p>
              </div>
              <Package className="text-brand-brown/30 h-8 w-8" />
            </div>

            <div className="rounded-xl bg-[#e3eedd] border border-emerald-900/10 p-4 shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-900/80">Produto Mais Vendido</p>
                <h3 className="text-lg font-bold text-emerald-900 mt-1 truncate">
                  {bestSellingProduct ? bestSellingProduct.productName : 'Sem vendas ainda'}
                </h3>
                {bestSellingProduct && (
                  <p className="text-xs text-emerald-900/60 mt-1">{bestSellingProduct.salesCount} venda(s) pagas</p>
                )}
              </div>
              <Award className="text-emerald-900/30 h-8 w-8 shrink-0" />
            </div>
          </div>

          {reposicaoProducts.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">Possível momento de reposição</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-80">
                    {outOfStockProducts.length > 0 && `${outOfStockProducts.length} produto(s) esgotado(s)`}
                    {outOfStockProducts.length > 0 && lowStockProducts.length > 0 && ' e '}
                    {lowStockProducts.length > 0 && `${lowStockProducts.length} produto(s) com estoque baixo (≤ ${LOW_STOCK_THRESHOLD} un.)`}.
                  </p>
                  <p className="mt-2 text-xs font-medium truncate">
                    {reposicaoProducts.slice(0, 5).map(p => p.nome).join(', ')}
                    {reposicaoProducts.length > 5 ? '…' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
