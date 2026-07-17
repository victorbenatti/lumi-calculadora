import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const PROMPT_VERSION = 'lumi-business-v1';
const periods = ['current-month', 'last-30-days', 'last-90-days', 'all'] as const;
type Period = typeof periods[number];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;

function getStartDate(period: Period, now: Date) {
  if (period === 'all') return null;
  if (period === 'current-month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (period === 'last-30-days' ? 30 : 90));
  return start;
}

function validateReport(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('A IA retornou um relatório inválido.');
  const report = value as Record<string, unknown>;
  if (typeof report.resumo_executivo !== 'string' || !Array.isArray(report.insights) ||
      !Array.isArray(report.recomendacoes) || !Array.isArray(report.produtos_em_foco) ||
      !Array.isArray(report.limitacoes) || !['baixa', 'media', 'alta'].includes(String(report.confianca))) {
    throw new Error('A resposta da IA não segue o formato esperado.');
  }
  return report;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Sessão não encontrada.' }, 401);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!apiKey || !supabaseUrl || !anonKey) throw new Error('Secrets do backend não configurados.');

    const body = await req.json().catch(() => ({}));
    const period = body.period as Period;
    if (!periods.includes(period)) return json({ error: 'Período inválido.' }, 400);
    if (body.includeCustomerNames !== true) return json({ error: 'É necessário confirmar o processamento dos nomes.' }, 400);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Sessão inválida ou expirada.' }, 401);

    const now = new Date();
    const start = getStartDate(period, now);
    let salesQuery = supabase.from('vendas').select('*').order('data_venda', { ascending: true });
    let withdrawalsQuery = supabase.from('financeiro_retiradas').select('*').order('data_retirada', { ascending: true });
    if (start) {
      salesQuery = salesQuery.gte('data_venda', dateOnly(start));
      withdrawalsQuery = withdrawalsQuery.gte('data_retirada', dateOnly(start));
    }

    const [productsResult, salesResult, tripsResult, configsResult, withdrawalsResult] = await Promise.all([
      supabase.from('produtos').select('*').order('nome'),
      salesQuery,
      supabase.from('viagens').select('*').order('data', { ascending: true }),
      supabase.from('financeiro_configuracoes').select('*').eq('ativo', true).order('created_at', { ascending: false }).limit(1),
      withdrawalsQuery,
    ]);
    const queryError = productsResult.error || salesResult.error || tripsResult.error || configsResult.error || withdrawalsResult.error;
    if (queryError) throw new Error(`Não foi possível consultar os dados: ${queryError.message}`);

    const products = productsResult.data || [];
    const sales = salesResult.data || [];
    const trips = tripsResult.data || [];
    const withdrawals = withdrawalsResult.data || [];
    const config = configsResult.data?.[0] || { caixa_percentual: 0.1 };
    const productsById = new Map(products.map((product) => [product.id, product]));

    const saleRows = sales.map((sale) => {
      const product = productsById.get(sale.produto_id);
      const cost = finite(sale.custo_unitario_snapshot) || finite(product?.custo_final_brl);
      const grossProfit = sale.lucro_bruto_snapshot === null ? finite(sale.preco_venda) - cost : finite(sale.lucro_bruto_snapshot);
      return {
        produto_id: sale.produto_id,
        data: sale.data_venda,
        cliente: sale.cliente,
        produto: product?.nome || 'Produto removido',
        status: sale.status_pagamento,
        preco_venda: finite(sale.preco_venda),
        custo: cost,
        lucro_bruto: grossProfit,
        margem_percentual: sale.preco_venda > 0 ? Number(((grossProfit / sale.preco_venda) * 100).toFixed(2)) : 0,
      };
    });
    const paid = saleRows.filter((sale) => sale.status === 'pago');
    const pending = saleRows.filter((sale) => sale.status === 'pendente');
    const totals = paid.reduce((acc, sale) => ({
      receita: acc.receita + sale.preco_venda,
      custo: acc.custo + sale.custo,
      lucro_bruto: acc.lucro_bruto + sale.lucro_bruto,
    }), { receita: 0, custo: 0, lucro_bruto: 0 });
    const withdrawalsTotal = withdrawals.reduce((sum, item) => sum + finite(item.valor), 0);
    const productPerformance = products.map((product) => {
      const productSales = paid.filter((sale) => sale.produto_id === product.id);
      const revenue = productSales.reduce((sum, sale) => sum + sale.preco_venda, 0);
      const profit = productSales.reduce((sum, sale) => sum + sale.lucro_bruto, 0);
      const salePrice = finite(product.preco_venda_brl) || finite(product.custo_final_brl) * 1.3;
      return {
        nome: product.nome,
        categoria: product.categoria,
        tipo: product.tipo,
        criado_em: product.created_at,
        estoque: finite(product.estoque),
        custo: finite(product.custo_final_brl),
        preco_referencia: salePrice,
        vendas_pagas: productSales.length,
        receita: revenue,
        lucro_bruto: profit,
        margem_preco_referencia_percentual: salePrice > 0 ? Number((((salePrice - finite(product.custo_final_brl)) / salePrice) * 100).toFixed(2)) : 0,
      };
    });

    const dataset = {
      periodo: { codigo: period, inicio: start ? dateOnly(start) : null, fim: dateOnly(now) },
      resumo_calculado: {
        ...totals,
        roi_percentual: totals.custo > 0 ? Number(((totals.lucro_bruto / totals.custo) * 100).toFixed(2)) : 0,
        margem_bruta_percentual: totals.receita > 0 ? Number(((totals.lucro_bruto / totals.receita) * 100).toFixed(2)) : 0,
        vendas_pagas: paid.length,
        vendas_pendentes: pending.length,
        receita_pendente: pending.reduce((sum, sale) => sum + sale.preco_venda, 0),
        retiradas: withdrawalsTotal,
        reserva_caixa_estimada: totals.lucro_bruto * finite(config.caixa_percentual),
      },
      produtos: productPerformance,
      vendas: saleRows,
      viagens: trips.map((trip) => ({ data: trip.data, status: trip.status, custo_logistica: trip.custo_logistica, cotacao_dolar: trip.cotacao_dolar })),
      retiradas: withdrawals.map((item) => ({ data: item.data_retirada, pessoa: item.pessoa, valor: item.valor, observacao: item.observacao })),
    };

    const prompt = `Você é um consultor sênior de varejo de alta perfumaria da Lumi Imports. Analise apenas os dados fornecidos. Os números em resumo_calculado são a fonte de verdade: não os recalcule nem invente informações. Considere amostra, período e tempo em estoque antes de concluir que um produto está parado. Priorize perfumes árabes quando houver oportunidade comercial. Produza recomendações consultivas, específicas e acionáveis, sem ordenar alterações automáticas. Responda somente JSON com este formato exato: {"resumo_executivo":"string","confianca":"baixa|media|alta","limitacoes":["string"],"insights":[{"severidade":"critica|atencao|oportunidade","titulo":"string","descricao":"string","evidencia":"string"}],"recomendacoes":[{"prioridade":1,"area":"produtos|estoque|vendas|financeiro","acao":"string","motivo":"string","impacto_esperado":"string"}],"produtos_em_foco":[{"produto":"string","acao":"string","justificativa":"string"}]}. Limite a 6 insights, 6 recomendações ordenadas e 6 produtos. Dados: ${JSON.stringify(dataset)}`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    });
    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) throw new Error(geminiData?.error?.message || 'Falha na comunicação com o Gemini.');
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error('O Gemini não retornou conteúdo.');
    const report = validateReport(JSON.parse(responseText));
    const usage = geminiData.usageMetadata || {};
    const counts = { produtos: products.length, vendas: sales.length, viagens: trips.length, retiradas: withdrawals.length };

    const { data: saved, error: saveError } = await supabase.from('analises_ia').insert({
      created_by: user.id,
      periodo: period,
      data_inicio: start ? dateOnly(start) : null,
      data_fim: dateOnly(now),
      relatorio: report,
      modelo: MODEL,
      versao_prompt: PROMPT_VERSION,
      contagem_registros: counts,
      tokens_entrada: usage.promptTokenCount ?? null,
      tokens_saida: usage.candidatesTokenCount ?? null,
    }).select('*').single();
    if (saveError) throw new Error(`A análise foi gerada, mas não pôde ser salva: ${saveError.message}`);

    return json(saved);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado na análise.' }, 500);
  }
});
