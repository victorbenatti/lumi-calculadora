import {
  AlertTriangle,
  BarChart3,
  CircleCheck,
  Info,
  Lightbulb,
  PackageSearch,
  PieChart,
  Scale,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import {
  buildFinancialInsights,
  buildFinancialTrend,
  buildProductPerformance,
  buildStatusBreakdown,
  formatCurrency,
  type FinancePeriod,
  type FinancialInsight,
  type FinancialSummary,
  type FinancialWithdrawal,
  type SaleFinancialRow,
} from '../utils/finance';

type Props = {
  rows: SaleFinancialRow[];
  summary: FinancialSummary;
  period: FinancePeriod;
  financialWithdrawals: FinancialWithdrawal[];
};

const formatPercent = (value: number) => (
  new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 }).format(value)
);

const emptyState = (message: string) => (
  <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-brand-brown/15 bg-brand-bg/40 px-4 text-center text-sm text-brand-brown/55">
    {message}
  </div>
);

const insightStyles: Record<FinancialInsight['tone'], { icon: typeof Info; className: string }> = {
  success: {
    icon: CircleCheck,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-950',
  },
  info: {
    icon: Info,
    className: 'border-sky-200 bg-sky-50 text-sky-950',
  },
};

function TrendChart({ rows, period }: Pick<Props, 'rows' | 'period'>) {
  const trend = buildFinancialTrend(rows, period);

  if (trend.length === 0) {
    return emptyState('Sem vendas pagas para desenhar a evolucao.');
  }

  const width = 720;
  const height = 230;
  const left = 34;
  const right = 18;
  const top = 18;
  const bottom = 42;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(
    1,
    ...trend.flatMap(point => [point.revenue, point.distributableProfit, point.cashReserve])
  );
  const step = trend.length > 1 ? chartWidth / (trend.length - 1) : 0;
  const barWidth = Math.max(8, Math.min(26, chartWidth / Math.max(trend.length, 1) * 0.42));
  const labelStep = Math.max(1, Math.ceil(trend.length / 4));
  const getX = (index: number) => trend.length === 1 ? left + chartWidth / 2 : left + index * step;
  const getY = (value: number) => top + chartHeight - (Math.max(value, 0) / maxValue) * chartHeight;
  const profitPath = trend
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.distributableProfit)}`)
    .join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-full" role="img" aria-label="Evolucao financeira">
        {[0, 0.25, 0.5, 0.75, 1].map(grid => {
          const y = top + chartHeight - grid * chartHeight;
          return (
            <line key={grid} x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(92, 64, 51, 0.09)" />
          );
        })}

        {trend.map((point, index) => {
          const x = getX(index);
          const revenueHeight = (Math.max(point.revenue, 0) / maxValue) * chartHeight;
          const cashHeight = (Math.max(point.cashReserve, 0) / maxValue) * chartHeight;

          return (
            <g key={point.key}>
              <rect
                x={x - barWidth}
                y={top + chartHeight - revenueHeight}
                width={barWidth}
                height={revenueHeight}
                rx="4"
                fill="#8b6f47"
                opacity="0.82"
              >
                <title>{`${point.label}: ${formatCurrency(point.revenue)} faturado`}</title>
              </rect>
              <rect
                x={x + 2}
                y={top + chartHeight - cashHeight}
                width={barWidth * 0.62}
                height={cashHeight}
                rx="4"
                fill="#0f766e"
                opacity="0.72"
              >
                <title>{`${point.label}: ${formatCurrency(point.cashReserve)} em caixa`}</title>
              </rect>
              {(index % labelStep === 0 || index === trend.length - 1) && (
                <text x={x} y={height - 14} textAnchor="middle" className="fill-brand-brown/55 text-[11px]">
                  {point.label}
                </text>
              )}
            </g>
          );
        })}

        <path d={profitPath} fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {trend.map((point, index) => (
          <circle key={`${point.key}-profit`} cx={getX(index)} cy={getY(point.distributableProfit)} r="3.5" fill="#047857">
            <title>{`${point.label}: ${formatCurrency(point.distributableProfit)} distribuivel`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

function AllocationChart({ summary }: Pick<Props, 'summary'>) {
  const items = [
    { label: 'Reposicao', value: summary.replacement, className: 'bg-amber-600', textClassName: 'text-amber-900' },
    { label: 'Caixa', value: summary.cashReserve, className: 'bg-stone-700', textClassName: 'text-stone-900' },
    { label: 'Lucro distribuivel', value: summary.distributableProfit, className: 'bg-emerald-700', textClassName: 'text-emerald-900' },
  ];
  const total = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);

  if (total <= 0) {
    return emptyState('Sem faturamento pago para compor reservas e lucro.');
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-brand-bg">
        {items.map(item => (
          <div
            key={item.label}
            className={item.className}
            style={{ width: `${Math.max(2, (Math.max(item.value, 0) / total) * 100)}%` }}
            title={`${item.label}: ${formatCurrency(item.value)}`}
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(item => (
          <div key={item.label} className="rounded-lg border border-brand-brown/10 bg-white p-3">
            <p className={`text-xs font-semibold uppercase ${item.textClassName}`}>{item.label}</p>
            <p className="mt-1 text-base font-bold text-brand-brown">{formatCurrency(item.value)}</p>
            <p className="text-xs text-brand-brown/55">{formatPercent(Math.max(item.value, 0) / total)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChart({ rows }: Pick<Props, 'rows'>) {
  const status = buildStatusBreakdown(rows);
  const total = status.paidRevenue + status.pendingRevenue;

  if (total <= 0) {
    return emptyState('Sem vendas pagas ou pendentes no filtro atual.');
  }

  const paidWidth = (status.paidRevenue / total) * 100;
  const pendingWidth = (status.pendingRevenue / total) * 100;

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-brand-bg">
        <div className="bg-emerald-700" style={{ width: `${paidWidth}%` }} title={`Pago: ${formatCurrency(status.paidRevenue)}`} />
        <div className="bg-amber-500" style={{ width: `${pendingWidth}%` }} title={`Pendente: ${formatCurrency(status.pendingRevenue)}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
          <p className="text-xs font-semibold uppercase">Pago</p>
          <p className="mt-1 text-lg font-bold">{formatCurrency(status.paidRevenue)}</p>
          <p className="text-xs opacity-70">{status.paidCount} venda{status.paidCount === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
          <p className="text-xs font-semibold uppercase">Pendente</p>
          <p className="mt-1 text-lg font-bold">{formatCurrency(status.pendingRevenue)}</p>
          <p className="text-xs opacity-70">{status.pendingCount} venda{status.pendingCount === 1 ? '' : 's'}</p>
        </div>
      </div>
    </div>
  );
}

function ProductRanking({ rows }: Pick<Props, 'rows'>) {
  const products = buildProductPerformance(rows, 5);
  const maxProfit = Math.max(1, ...products.map(product => product.grossProfit));

  if (products.length === 0) {
    return emptyState('Sem produtos pagos para calcular ranking.');
  }

  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div key={product.productId} className="rounded-lg border border-brand-brown/10 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-brown">{index + 1}. {product.productName}</p>
              <p className="text-xs text-brand-brown/55">
                {product.salesCount} venda{product.salesCount === 1 ? '' : 's'} - margem {formatPercent(product.marginPercent)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-emerald-800">{formatCurrency(product.grossProfit)}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-bg">
            <div
              className="h-full rounded-full bg-emerald-700"
              style={{ width: `${Math.max(5, (Math.max(product.grossProfit, 0) / maxProfit) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SmartInsights({ rows, period, financialWithdrawals }: Omit<Props, 'summary'>) {
  const insights = buildFinancialInsights(rows, financialWithdrawals, period);

  return (
    <div className="space-y-3">
      {insights.map(insight => {
        const Icon = insightStyles[insight.tone].icon;
        return (
          <div key={`${insight.title}-${insight.description}`} className={`rounded-lg border p-3 ${insightStyles[insight.tone].className}`}>
            <div className="flex gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-bold">{insight.title}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-80">{insight.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FinancialCharts({ rows, summary, period, financialWithdrawals }: Props) {
  const grossMargin = summary.revenue > 0 ? summary.grossProfit / summary.revenue : 0;
  const netSplitMargin = summary.revenue > 0 ? summary.distributableProfit / summary.revenue : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="bg-white border-brand-brown/10 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-brand-brown">
                <BarChart3 className="h-5 w-5 text-brand-brown/60" />
                Evolucao financeira
              </CardTitle>
              <CardDescription>Faturamento pago, caixa e lucro distribuivel no periodo.</CardDescription>
            </div>
            <div className="hidden rounded-lg border border-brand-brown/10 bg-brand-bg/60 px-3 py-2 text-right sm:block">
              <p className="text-xs uppercase text-brand-brown/55">Margem bruta</p>
              <p className="text-lg font-bold text-brand-brown">{formatPercent(grossMargin)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TrendChart rows={rows} period={period} />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-brown/65">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#8b6f47]" /> Faturamento</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#0f766e]" /> Caixa</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-5 rounded-full bg-[#047857]" /> Lucro distribuivel</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-brand-brown/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-brown">
            <Lightbulb className="h-5 w-5 text-amber-700" />
            Insights uteis
          </CardTitle>
          <CardDescription>Sinais automaticos calculados pelos dados do financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <SmartInsights rows={rows} period={period} financialWithdrawals={financialWithdrawals} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 xl:col-span-2">
        <Card className="bg-white border-brand-brown/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-brown">
              <PieChart className="h-5 w-5 text-amber-700" />
              Destino do dinheiro
            </CardTitle>
            <CardDescription>Reposicao, caixa e lucro distribuivel sobre vendas pagas.</CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationChart summary={summary} />
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-brown/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-brown">
              <Scale className="h-5 w-5 text-emerald-700" />
              Pago vs pendente
            </CardTitle>
            <CardDescription>Separacao entre caixa realizado e receita ainda prevista.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusChart rows={rows} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-brand-brown/10 shadow-sm xl:col-span-2">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-brand-brown">
                <PackageSearch className="h-5 w-5 text-emerald-700" />
                Produtos que mais geram lucro
              </CardTitle>
              <CardDescription>Ranking por lucro bruto em vendas pagas.</CardDescription>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              Lucro distribuivel: <strong>{formatCurrency(summary.distributableProfit)}</strong> - {formatPercent(netSplitMargin)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductRanking rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
