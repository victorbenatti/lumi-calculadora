import { supabase } from './supabase';

export interface PerfumeAIAttributes {
  notas_topo: string;
  notas_coracao: string;
  notas_fundo: string;
  familia_olfativa: string;
  ocasiao: string;
  descricao_ia: string;
  inspirado_em: string | null;
  tipo: string;
}

export async function enrichPerfumeData(nomePerfume: string): Promise<PerfumeAIAttributes> {
  try {
    const { data: parsedData, error } = await supabase.functions.invoke<Partial<PerfumeAIAttributes>>('enrich-perfume', {
      body: { nomePerfume },
    });
    if (error) throw error;
    if (!parsedData) throw new Error('A IA não retornou dados para o perfume.');

    return {
      notas_topo: parsedData.notas_topo || 'Não informado',
      notas_coracao: parsedData.notas_coracao || 'Não informado',
      notas_fundo: parsedData.notas_fundo || 'Não informado',
      familia_olfativa: parsedData.familia_olfativa || 'Não informado',
      ocasiao: parsedData.ocasiao || 'Não informado',
      descricao_ia: parsedData.descricao_ia || 'Descrição indisponível no momento.',
      inspirado_em: parsedData.inspirado_em || null,
      tipo: parsedData.tipo || 'Importado',
    };
  } catch (error: unknown) {
    console.error('Erro ao processar dados da IA:', error);
    const msg = error instanceof Error ? error.message : 'Falha de comunicação com o Google Gemini.';
    throw new Error(`Erro na IA: ${msg}`);
  }
}
