const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  try {
    if (!req.headers.get('Authorization')) return json({ error: 'Sessão não encontrada.' }, 401);
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!apiKey || !supabaseUrl || !anonKey) throw new Error('Secrets do backend não configurados.');
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: req.headers.get('Authorization')!, apikey: anonKey },
    });
    if (!authResponse.ok) return json({ error: 'Sessão inválida ou expirada.' }, 401);

    const { nomePerfume } = await req.json();
    if (typeof nomePerfume !== 'string' || !nomePerfume.trim() || nomePerfume.length > 160) {
      return json({ error: 'Informe um nome de perfume válido.' }, 400);
    }
    const prompt = `Atue como expert em perfumaria internacional e analise a fragrância ${JSON.stringify(nomePerfume.trim())}. Retorne somente JSON com: "notas_topo", "notas_coracao", "notas_fundo", "familia_olfativa", "ocasiao", "descricao_ia", "inspirado_em" (nome exato ou null) e "tipo". Classifique prioritariamente marcas como Lattafa, Afnan, Maison Alhambra e Armaf como "Árabe"; marcas designer ou nicho tradicionais como "Importado".`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Falha na comunicação com o Gemini.');
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('O Gemini não retornou conteúdo.');
    return json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado no enriquecimento.' }, 500);
  }
});
