import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { StatCard } from './ui/StatCard';
import { Select } from './ui/Select';
import { AlertTriangle, Award, Boxes, CircleDollarSign, HandCoins, Package, TrendingUp } from 'lucide-react';
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
import { AIAnalysisCard } from './AIAnalysisCard';

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
      <AIAnalysisCard />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-brand-brown">Visão Financeira</CardTitle>
            <CardDescription>Resumo de receitas e lucros (Vendas Pagas).</CardDescription>
          </div>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-56"
          >
            <option value="all">Todo o período</option>
            {availableMonths.map(monthKey => (
              <option key={monthKey} value={monthKey}>{formatMonthKeyLabel(monthKey)}</option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Receita Total"
            value={formatCurrency(totalRevenue)}
            icon={CircleDollarSign}
          />
          <StatCard
            label="Lucro Bruto"
            value={formatCurrency(netProfit)}
            icon={HandCoins}
            tone="positive"
          />
          <StatCard
            label="ROI em Tempo Real"
            value={`${roi.toFixed(2)}%`}
            icon={TrendingUp}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-brown">Resumo de Produtos</CardTitle>
          <CardDescription>Estoque, desempenho e alertas de reposição.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Produtos Cadastrados"
              value={String(products.length)}
              hint={`${trips.length} viagens registradas`}
              icon={Package}
            />
            <StatCard
              label="Tamanho do Estoque"
              value={`${totalStockUnits} un.`}
              hint="unidades disponíveis no total"
              icon={Boxes}
            />
            <StatCard
              label="Produto Mais Vendido"
              value={bestSellingProduct ? bestSellingProduct.productName : 'Sem vendas'}
              hint={bestSellingProduct ? `${bestSellingProduct.salesCount} venda(s) pagas` : undefined}
              icon={Award}
              tone="positive"
            />
          </div>

          {reposicaoProducts.length > 0 && (
            <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-4 text-amber-950">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </span>
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
