import { GoogleGenerativeAI } from '@google/generative-ai';


export interface PerfumeAIAttributes {
  notas_topo: string;
  notas_coracao: string;
  notas_fundo: string;
  familia_olfativa: string;
  ocasiao: string;
  descricao_ia: string;
  inspirado_em: string | null;
}

export async function enrichPerfumeData(nomePerfume: string): Promise<PerfumeAIAttributes> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave VITE_GEMINI_API_KEY não encontrada no .env. Reinicie o servidor se acabou de adicionar.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Exigindo resposta oficial em JSON (recurso nativo do Gemini 1.5)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const prompt = `Atue como um expert em perfumaria internacional e analise a fragrância '${nomePerfume}'. Retorne estritamente um objeto JSON com as seguintes chaves exatas (e nada além disso): "notas_topo", "notas_coracao", "notas_fundo", "familia_olfativa", "ocasiao" (curta, ex: Encontros noturnos) e "descricao_ia" (parágrafo comercial sedutor focado em vendas). Além disso, retorne uma chave "inspirado_em". Se o perfume for árabe ou um contratipo conhecido, diga o nome exato do perfume de nicho ou designer no qual ele foi inspirado (Ex: 'Creed Aventus', 'Velvet Iris da Pana Dora'). Se o perfume for uma criação original e não for inspirado em outro, retorne null nesta chave. Não use markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsedData: Partial<PerfumeAIAttributes>;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error("Erro no Parse do JSON retornado pela IA:", responseText);
      throw new Error("A IA não retornou um formato JSON válido.");
    }

    return {
      notas_topo: parsedData.notas_topo || 'Não informado',
      notas_coracao: parsedData.notas_coracao || 'Não informado',
      notas_fundo: parsedData.notas_fundo || 'Não informado',
      familia_olfativa: parsedData.familia_olfativa || 'Não informado',
      ocasiao: parsedData.ocasiao || 'Não informado',
      descricao_ia: parsedData.descricao_ia || 'Descrição indisponível no momento.',
      inspirado_em: parsedData.inspirado_em || null,
    };
  } catch (error: any) {
    console.error('Erro ao processar dados da IA:', error);
    const msg = error?.message || 'Falha de comunicação com o Google Gemini.';
    throw new Error(`Erro na IA: ${msg}`);
  }
}
