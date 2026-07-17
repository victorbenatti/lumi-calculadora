import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, Clock3, History, Lightbulb, LoaderCircle, Sparkles, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database, Json } from '../types/supabase';
import type { AIAnalysisPeriod, AIAnalysisRecordCounts, AIAnalysisReport, AIInsightSeverity } from '../types/ai-analysis';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

type AnalysisRow = Database['public']['Tables']['analises_ia']['Row'];

const periodLabels: Record<AIAnalysisPeriod, string> = {
  'current-month': 'Mês atual',
  'last-30-days': 'Últimos 30 dias',
  'last-90-days': 'Últimos 90 dias',
  all: 'Todo o histórico',
};

const severityStyles: Record<AIInsightSeverity, string> = {
  critica: 'border-red-200 bg-red-50 text-red-950',
  atencao: 'border-amber-200 bg-amber-50 text-amber-950',
  oportunidade: 'border-emerald-200 bg-emerald-50 text-emerald-950',
};

function parseReport(value: Json): AIAnalysisReport | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  if (typeof value.resumo_executivo !== 'string' || !Array.isArray(value.insights) || !Array.isArray(value.recomendacoes)) return null;
  return value as unknown as AIAnalysisReport;
}

function toCounts(value: Json): AIAnalysisRecordCounts | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const keys = ['produtos', 'vendas', 'viagens', 'retiradas'] as const;
  if (!keys.every((key) => typeof value[key] === 'number')) return null;
  return value as unknown as AIAnalysisRecordCounts;
}

export function AIAnalysisCard() {
  const [period, setPeriod] = useState<AIAnalysisPeriod>('last-30-days');
  const [consent, setConsent] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.from('analises_ia').select('*').order('created_at', { ascending: false }).limit(20).then(({ data, error: historyError }) => {
      if (!active) return;
      if (historyError) setError('Não foi possível carregar o histórico de análises.');
      if (data) {
        setAnalyses(data);
        setSelectedId(data[0]?.id ?? null);
      }
      setLoadingHistory(false);
    });
    return () => { active = false; };
  }, []);

  const selected = useMemo(() => analyses.find((item) => item.id === selectedId) ?? null, [analyses, selectedId]);
  const report = selected ? parseReport(selected.relatorio) : null;
  const counts = selected ? toCounts(selected.contagem_registros) : null;

  const generate = async () => {
    if (!consent || generating) return;
    const samePeriod = analyses.find((item) => item.periodo === period);
    if (samePeriod && !window.confirm(`Já existe uma análise de ${periodLabels[period]}. Gerar outra consumirá uma nova chamada do Gemini. Deseja continuar?`)) {
      setSelectedId(samePeriod.id);
      return;
    }
    setGenerating(true);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke<AnalysisRow>('analyze-business', {
      body: { period, includeCustomerNames: true },
    });
    if (invokeError || !data) {
      setError(invokeError?.message || 'Não foi possível gerar a análise. Tente novamente.');
    } else {
      setAnalyses((current) => [data, ...current]);
      setSelectedId(data.id);
      setConsent(false);
    }
    setGenerating(false);
  };

  return (
    <Card className="overflow-hidden border-brand-brown/15 bg-gradient-to-br from-white via-white to-[#f2ecdf] shadow-md">
      <CardHeader className="border-b border-brand-brown/10 bg-brand-brown text-brand-bg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-bg/15"><BrainCircuit className="h-6 w-6" /></span>
            <div><CardTitle className="flex items-center gap-2 text-brand-bg">Consultoria Lumi IA <Sparkles className="h-4 w-4" /></CardTitle><CardDescription className="mt-1 text-brand-bg/70">Diagnóstico estratégico sob demanda, sem alterações automáticas.</CardDescription></div>
          </div>
          {analyses.length > 0 && (
            <label className="flex min-w-0 items-center gap-2 text-xs text-brand-bg/75"><History className="h-4 w-4 shrink-0" />
              <select value={selectedId || ''} onChange={(event) => setSelectedId(event.target.value)} className="h-9 min-w-0 max-w-72 rounded-md border border-brand-bg/20 bg-white/10 px-2 text-brand-bg outline-none [&>option]:text-brand-brown">
                {analyses.map((item) => <option key={item.id} value={item.id}>{new Date(item.created_at).toLocaleString('pt-BR')} · {periodLabels[item.periodo]}</option>)}
              </select>
            </label>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 rounded-xl border border-brand-brown/10 bg-white/80 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-brand-brown">Período da nova análise
              <select value={period} onChange={(event) => setPeriod(event.target.value as AIAnalysisPeriod)} className="mt-1.5 h-10 w-full rounded-md border border-brand-brown/20 bg-white px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-brown/30 sm:max-w-xs">
                {Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="flex max-w-3xl items-start gap-2 text-xs leading-relaxed text-brand-brown/70"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-brown" />Confirmo o envio ao Gemini dos dados comerciais deste período, incluindo nomes de clientes. O conjunto bruto não será duplicado no histórico da Lumi.</label>
          </div>
          <Button onClick={generate} disabled={!consent || generating} className="h-10 bg-brand-brown px-4 text-brand-bg hover:bg-brand-brown/90">{generating ? <><LoaderCircle className="animate-spin" /> Analisando o negócio…</> : <><Sparkles /> Gerar análise com IA</>}</Button>
        </div>

        {error && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {loadingHistory && <div className="flex items-center justify-center gap-2 py-10 text-sm text-brand-brown/60"><LoaderCircle className="animate-spin" /> Carregando análises…</div>}
        {!loadingHistory && !report && <div className="rounded-xl border border-dashed border-brand-brown/20 py-10 text-center"><Lightbulb className="mx-auto mb-3 h-8 w-8 text-brand-brown/30" /><p className="font-bold">Nenhuma análise gerada ainda</p><p className="mt-1 text-sm text-brand-brown/60">Escolha o período e gere o primeiro diagnóstico quando quiser.</p></div>}

        {report && selected && (
          <div className="space-y-5">
            <div className="rounded-xl border border-brand-brown/10 bg-brand-bg p-4"><div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-brand-brown/55"><Clock3 className="h-3.5 w-3.5" /> {new Date(selected.created_at).toLocaleString('pt-BR')} · {periodLabels[selected.periodo]} · confiança {report.confianca}{counts && ` · ${counts.vendas} vendas e ${counts.produtos} produtos`}</div><p className="text-sm leading-relaxed text-brand-brown">{report.resumo_executivo}</p></div>
            {report.insights.length > 0 && <section><h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold"><AlertCircle className="h-4 w-4" /> Alertas e oportunidades</h4><div className="grid gap-3 md:grid-cols-2">{report.insights.map((insight, index) => <article key={`${insight.titulo}-${index}`} className={`rounded-lg border p-3 ${severityStyles[insight.severidade] || severityStyles.atencao}`}><p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">{insight.severidade}</p><h5 className="mt-1 text-sm font-bold">{insight.titulo}</h5><p className="mt-1 text-xs leading-relaxed opacity-85">{insight.descricao}</p><p className="mt-2 text-xs font-semibold opacity-65">Evidência: {insight.evidencia}</p></article>)}</div></section>}
            {report.recomendacoes.length > 0 && <section><h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Target className="h-4 w-4" /> Plano de ação recomendado</h4><div className="space-y-2">{report.recomendacoes.map((item, index) => <article key={`${item.prioridade}-${index}`} className="grid gap-2 rounded-lg border border-brand-brown/10 bg-white p-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-brown text-sm font-extrabold text-brand-bg">{item.prioridade}</span><div><div className="flex flex-wrap items-center gap-2"><h5 className="text-sm font-bold">{item.acao}</h5><span className="rounded-full bg-brand-bg px-2 py-0.5 text-[10px] font-bold uppercase">{item.area}</span></div><p className="mt-1 text-xs leading-relaxed text-brand-brown/70">{item.motivo}</p><p className="mt-1 text-xs font-semibold text-emerald-800">Impacto esperado: {item.impacto_esperado}</p></div></article>)}</div></section>}
            {report.produtos_em_foco.length > 0 && <section><h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold"><CheckCircle2 className="h-4 w-4" /> Produtos em foco</h4><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{report.produtos_em_foco.map((item, index) => <article key={`${item.produto}-${index}`} className="rounded-lg border border-brand-brown/10 bg-white p-3"><h5 className="truncate text-sm font-bold">{item.produto}</h5><p className="mt-1 text-xs font-semibold text-brand-brown">{item.acao}</p><p className="mt-1 text-xs leading-relaxed text-brand-brown/60">{item.justificativa}</p></article>)}</div></section>}
            {report.limitacoes.length > 0 && <div className="rounded-lg bg-brand-brown/5 p-3 text-xs text-brand-brown/60"><strong>Limitações desta leitura:</strong> {report.limitacoes.join(' · ')}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
