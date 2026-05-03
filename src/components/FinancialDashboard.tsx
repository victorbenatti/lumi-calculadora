import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Coins,
  HandCoins,
  Landmark,
  PiggyBank,
  Save,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import {
  buildFinancialRows,
  DEFAULT_FINANCIAL_CONFIG,
  formatCurrency,
  summarizeFinancialRows,
  type FinancePeriod,
  type FinancialConfig,
  type FinancialWithdrawal,
} from '../utils/finance';

type Product = Database['public']['Tables']['produtos']['Row'];
type Sale = Database['public']['Tables']['vendas']['Row'];

interface Props {
  sales: Sale[];
  products: Product[];
  financialConfig?: FinancialConfig;
  financialWithdrawals: FinancialWithdrawal[];
  refetch: () => void;
}

const periodLabels: Record<FinancePeriod, string> = {
  'current-month': 'Mês atual',
  'last-30-days': '30 dias',
  all: 'Tudo',
};

const toPercentInput = (value: number) => String(Number((value * 100).toFixed(2)));

const parseDecimalInput = (value: string) => {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

export function FinancialDashboard({
  sales,
  products,
  financialConfig = DEFAULT_FINANCIAL_CONFIG,
  financialWithdrawals,
  refetch,
}: Props) {
  const [period, setPeriod] = useState<FinancePeriod>('all');
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingWithdrawal, setSavingWithdrawal] = useState(false);
  const [cashPercent, setCashPercent] = useState(toPercentInput(financialConfig.caixa_percentual));
  const [replacementPercent, setReplacementPercent] = useState(toPercentInput(financialConfig.reposicao_percentual));
  const [yourPercent, setYourPercent] = useState(toPercentInput(financialConfig.split_voce_percentual));
  const [motherPercent, setMotherPercent] = useState(toPercentInput(financialConfig.split_mae_percentual));
  const [withdrawalPerson, setWithdrawalPerson] = useState<'voce' | 'mae'>('voce');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(todayInputValue());
  const [withdrawalNote, setWithdrawalNote] = useState('');

  useEffect(() => {
    setCashPercent(toPercentInput(financialConfig.caixa_percentual));
    setReplacementPercent(toPercentInput(financialConfig.reposicao_percentual));
    setYourPercent(toPercentInput(financialConfig.split_voce_percentual));
    setMotherPercent(toPercentInput(financialConfig.split_mae_percentual));
  }, [financialConfig]);

  const rows = useMemo(
    () => buildFinancialRows(sales, products, financialConfig, period),
    [sales, products, financialConfig, period]
  );

  const summary = useMemo(
    () => summarizeFinancialRows(rows, financialWithdrawals, period),
    [rows, financialWithdrawals, period]
  );

  const visibleRows = rows.filter(row => row.status_pagamento !== 'cancelada');
  const visibleWithdrawals = financialWithdrawals.filter(withdrawal => {
    if (period === 'all') return true;
    const withdrawalDateValue = new Date(withdrawal.data_retirada);
    const now = new Date();
    const start = period === 'current-month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(new Date().setDate(now.getDate() - 30));

    return withdrawalDateValue >= start;
  });

  const handleSaveConfig = async () => {
    const nextCashPercent = parseDecimalInput(cashPercent) / 100;
    const nextReplacementPercent = parseDecimalInput(replacementPercent) / 100;
    const nextYourPercent = parseDecimalInput(yourPercent) / 100;
    const nextMotherPercent = parseDecimalInput(motherPercent) / 100;

    if (nextCashPercent < 0 || nextReplacementPercent < 0) {
      return alert('Percentuais de caixa e reposição não podem ser negativos.');
    }

    if (Math.abs((nextYourPercent + nextMotherPercent) - 1) > 0.0001) {
      return alert('A divisão entre você e sua mãe precisa fechar 100%.');
    }

    setSavingConfig(true);
    try {
      const { data: newConfig, error: insertError } = await supabase
        .from('financeiro_configuracoes')
        .insert({
          nome: 'Regra padrao Lumi V1',
          reposicao_percentual: nextReplacementPercent,
          caixa_percentual: nextCashPercent,
          split_voce_percentual: nextYourPercent,
          split_mae_percentual: nextMotherPercent,
          ativo: true,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (newConfig?.id) {
        const { error: deactivateError } = await supabase
          .from('financeiro_configuracoes')
          .update({ ativo: false })
          .neq('id', newConfig.id);

        if (deactivateError) throw deactivateError;
      }

      refetch();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar regra financeira.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddWithdrawal = async () => {
    const amount = parseDecimalInput(withdrawalAmount);
    if (amount <= 0) return alert('Informe um valor de retirada válido.');

    setSavingWithdrawal(true);
    try {
      const { error } = await supabase
        .from('financeiro_retiradas')
        .insert({
          pessoa: withdrawalPerson,
          valor: amount,
          data_retirada: withdrawalDate,
          observacao: withdrawalNote.trim() || null,
        });

      if (error) throw error;

      setWithdrawalAmount('');
      setWithdrawalNote('');
      setWithdrawalDate(todayInputValue());
      refetch();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erro ao registrar retirada.');
    } finally {
      setSavingWithdrawal(false);
    }
  };

  const metricCards = [
    { label: 'Faturamento pago', value: summary.revenue, icon: CircleDollarSign, tone: 'bg-brand-bg text-brand-brown' },
    { label: 'Custo vendido', value: summary.cost, icon: WalletCards, tone: 'bg-white text-brand-brown' },
    { label: 'Reposição', value: summary.replacement, icon: PiggyBank, tone: 'bg-amber-50 text-amber-900' },
    { label: 'Caixa da empresa', value: summary.cashReserve, icon: Landmark, tone: 'bg-stone-100 text-stone-900' },
    { label: 'Lucro distribuível', value: summary.distributableProfit, icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-900' },
    { label: 'Saldo Victor', value: summary.yourBalance, icon: HandCoins, tone: 'bg-sky-50 text-sky-900' },
    { label: 'Saldo Mirella', value: summary.motherBalance, icon: Coins, tone: 'bg-rose-50 text-rose-900' },
    { label: 'Retiradas feitas', value: summary.withdrawals, icon: Banknote, tone: 'bg-white text-brand-brown' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-brown">Financeiro Lumi</h2>
          <p className="text-sm text-brand-brown/70">
            Vendas pagas viram reposição, caixa e lucro distribuível com snapshot histórico.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(periodLabels) as FinancePeriod[]).map(item => (
            <Button
              key={item}
              variant={period === item ? 'default' : 'outline'}
              onClick={() => setPeriod(item)}
              className={period === item ? 'bg-brand-brown text-brand-bg' : 'border-brand-brown/20 text-brand-brown'}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {periodLabels[item]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`rounded-lg border border-brand-brown/10 p-4 shadow-sm ${tone}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
                <p className="mt-2 text-xl font-bold tracking-tight">{formatCurrency(value)}</p>
              </div>
              <Icon className="h-5 w-5 opacity-45" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-white border-brand-brown/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-brand-brown">Regra financeira ativa</CardTitle>
            <CardDescription>
              Alterações valem para novas vendas. Vendas antigas mantêm os snapshots já salvos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-brand-brown">Reposição (%)</Label>
                <Input value={replacementPercent} onChange={(e) => setReplacementPercent(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label className="text-brand-brown">Caixa (%)</Label>
                <Input value={cashPercent} onChange={(e) => setCashPercent(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label className="text-brand-brown">Victor (%)</Label>
                <Input value={yourPercent} onChange={(e) => setYourPercent(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label className="text-brand-brown">Mirella (%)</Label>
                <Input value={motherPercent} onChange={(e) => setMotherPercent(e.target.value)} inputMode="decimal" />
              </div>
            </div>
            <Button onClick={handleSaveConfig} disabled={savingConfig} className="bg-brand-brown text-brand-bg hover:bg-brand-brown/90">
              <Save className="h-4 w-4 mr-2" />
              {savingConfig ? 'Salvando...' : 'Salvar nova regra'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-brown/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-brand-brown">Registrar retirada</CardTitle>
            <CardDescription>Retiradas abatem apenas o saldo da pessoa selecionada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-brand-brown">Pessoa</Label>
                <select
                  value={withdrawalPerson}
                  onChange={(e) => setWithdrawalPerson(e.target.value as 'voce' | 'mae')}
                  className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm text-brand-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown"
                >
                  <option value="voce">Victor</option>
                  <option value="mae">Mirella</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-brand-brown">Valor</Label>
                <Input value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} inputMode="decimal" placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Data</Label>
              <Input type="date" value={withdrawalDate} onChange={(e) => setWithdrawalDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Observação</Label>
              <Input value={withdrawalNote} onChange={(e) => setWithdrawalNote(e.target.value)} placeholder="Opcional" />
            </div>
            <Button onClick={handleAddWithdrawal} disabled={savingWithdrawal} className="w-full bg-brand-brown text-brand-bg hover:bg-brand-brown/90">
              {savingWithdrawal ? 'Registrando...' : 'Registrar retirada'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-brand-brown/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-brand-brown">Vendas e reservas</CardTitle>
          <CardDescription>
            {summary.paidCount} vendas pagas, {summary.pendingCount} pendentes e {summary.estimatedCount} snapshots estimados no período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Receita pendente prevista: <strong>{formatCurrency(summary.pendingRevenue)}</strong>. Despesas operacionais da V1 ficam cobertas pela reserva de caixa.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-brand-brown/10 text-xs uppercase text-brand-brown/60">
                <tr>
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3">Cliente / Produto</th>
                  <th className="px-3 py-3">Venda</th>
                  <th className="px-3 py-3">Custo</th>
                  <th className="px-3 py-3">Reposição</th>
                  <th className="px-3 py-3">Caixa</th>
                  <th className="px-3 py-3">Você</th>
                  <th className="px-3 py-3">Mãe</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5 text-brand-brown">
                {visibleRows.map(row => (
                  <tr key={row.id}>
                    <td className="px-3 py-3">{new Date(row.data_venda).toLocaleDateString('pt-BR')}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{row.cliente}</div>
                      <div className="text-xs text-brand-brown/60">{row.product_name}</div>
                    </td>
                    <td className="px-3 py-3 font-semibold">{formatCurrency(row.preco_venda)}</td>
                    <td className="px-3 py-3">{formatCurrency(row.custo_unitario_snapshot)}</td>
                    <td className="px-3 py-3">{formatCurrency(row.reposicao_snapshot)}</td>
                    <td className="px-3 py-3">{formatCurrency(row.reserva_caixa_snapshot)}</td>
                    <td className="px-3 py-3 font-semibold text-sky-800">{formatCurrency(row.lucro_voce_snapshot)}</td>
                    <td className="px-3 py-3 font-semibold text-rose-800">{formatCurrency(row.lucro_mae_snapshot)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`w-max rounded-full px-2 py-1 text-xs font-semibold ${row.status_pagamento === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {row.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                        {row.financeiro_estimado && (
                          <span className="w-max rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-700">
                            Estimado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-brand-brown/50">
                      Nenhuma venda no período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-brand-brown/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-brand-brown">Retiradas registradas</CardTitle>
          <CardDescription>Histórico simples para manter o saldo distribuível sob controle.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-brown/10 text-xs uppercase text-brand-brown/60">
                <tr>
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3">Pessoa</th>
                  <th className="px-3 py-3">Valor</th>
                  <th className="px-3 py-3">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5 text-brand-brown">
                {visibleWithdrawals.map(withdrawal => (
                  <tr key={withdrawal.id}>
                    <td className="px-3 py-3">{new Date(withdrawal.data_retirada).toLocaleDateString('pt-BR')}</td>
                    <td className="px-3 py-3 font-semibold">{withdrawal.pessoa === 'voce' ? 'Você' : 'Mãe'}</td>
                    <td className="px-3 py-3">{formatCurrency(withdrawal.valor)}</td>
                    <td className="px-3 py-3 text-brand-brown/70">{withdrawal.observacao || '-'}</td>
                  </tr>
                ))}
                {visibleWithdrawals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-brand-brown/50">
                      Nenhuma retirada registrada no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
