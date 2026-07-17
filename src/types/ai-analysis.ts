export type AIAnalysisPeriod = 'current-month' | 'last-30-days' | 'last-90-days' | 'all';
export type AIInsightSeverity = 'critica' | 'atencao' | 'oportunidade';
export type AIRecommendationArea = 'produtos' | 'estoque' | 'vendas' | 'financeiro';

export interface AIInsight {
  severidade: AIInsightSeverity;
  titulo: string;
  descricao: string;
  evidencia: string;
}

export interface AIRecommendation {
  prioridade: number;
  area: AIRecommendationArea;
  acao: string;
  motivo: string;
  impacto_esperado: string;
}

export interface AIProductAction {
  produto: string;
  acao: string;
  justificativa: string;
}

export interface AIAnalysisReport {
  resumo_executivo: string;
  confianca: 'baixa' | 'media' | 'alta';
  limitacoes: string[];
  insights: AIInsight[];
  recomendacoes: AIRecommendation[];
  produtos_em_foco: AIProductAction[];
}

export interface AIAnalysisRecordCounts {
  produtos: number;
  vendas: number;
  viagens: number;
  retiradas: number;
}

