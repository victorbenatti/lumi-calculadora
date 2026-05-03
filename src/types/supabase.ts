export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          nome: string | null
          whatsapp: string | null
          email: string
          cep: string | null
          logradouro: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string | null
          estado: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          nome?: string | null
          whatsapp?: string | null
          email: string
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          nome?: string | null
          whatsapp?: string | null
          email?: string
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      viagens: {
        Row: {
          id: string
          created_at: string
          data: string
          custo_logistica: number
          cotacao_dolar: number
          status: 'ativa' | 'finalizada'
        }
        Insert: {
          id?: string
          created_at?: string
          data?: string
          custo_logistica?: number
          cotacao_dolar: number
          status?: 'ativa' | 'finalizada'
        }
        Update: {
          id?: string
          created_at?: string
          data?: string
          custo_logistica?: number
          cotacao_dolar?: number
          status?: 'ativa' | 'finalizada'
        }
        Relationships: []
      }
      produtos: {
        Row: {
          id: string
          created_at: string
          viagem_id: string
          nome: string
          preco_usd: number
          custo_final_brl: number
          estoque: number
          categoria: string | null
          imagem_url: string | null
          preco_venda_brl: number | null
          preco_promocao_brl: number | null
          promocao_ativa: boolean
          notas_topo: string | null
          notas_coracao: string | null
          notas_fundo: string | null
          familia_olfativa: string | null
          ocasiao: string | null
          descricao_ia: string | null
          volume: string | null
          inspirado_em: string | null
          mais_vendido: boolean | null
          tipo: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          viagem_id?: string
          nome: string
          preco_usd: number
          custo_final_brl: number
          estoque?: number
          categoria?: string | null
          imagem_url?: string | null
          preco_venda_brl?: number | null
          preco_promocao_brl?: number | null
          promocao_ativa?: boolean
          notas_topo?: string | null
          notas_coracao?: string | null
          notas_fundo?: string | null
          familia_olfativa?: string | null
          ocasiao?: string | null
          descricao_ia?: string | null
          volume?: string | null
          inspirado_em?: string | null
          mais_vendido?: boolean | null
          tipo?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          viagem_id?: string
          nome?: string
          preco_usd?: number
          custo_final_brl?: number
          estoque?: number
          categoria?: string | null
          imagem_url?: string | null
          preco_venda_brl?: number | null
          preco_promocao_brl?: number | null
          promocao_ativa?: boolean
          notas_topo?: string | null
          notas_coracao?: string | null
          notas_fundo?: string | null
          familia_olfativa?: string | null
          ocasiao?: string | null
          descricao_ia?: string | null
          volume?: string | null
          inspirado_em?: string | null
          mais_vendido?: boolean | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          }
        ]
      }
      vendas: {
        Row: {
          id: string
          created_at: string
          produto_id: string
          cliente: string
          preco_venda: number
          status_pagamento: 'pago' | 'pendente' | 'cancelada'
          data_venda: string
          custo_unitario_snapshot: number | null
          reposicao_snapshot: number | null
          lucro_bruto_snapshot: number | null
          reserva_caixa_snapshot: number | null
          lucro_distribuivel_snapshot: number | null
          lucro_voce_snapshot: number | null
          lucro_mae_snapshot: number | null
          financeiro_estimado: boolean
          financeiro_configuracao_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          produto_id?: string
          cliente: string
          preco_venda: number
          status_pagamento?: 'pago' | 'pendente' | 'cancelada'
          data_venda?: string
          custo_unitario_snapshot?: number | null
          reposicao_snapshot?: number | null
          lucro_bruto_snapshot?: number | null
          reserva_caixa_snapshot?: number | null
          lucro_distribuivel_snapshot?: number | null
          lucro_voce_snapshot?: number | null
          lucro_mae_snapshot?: number | null
          financeiro_estimado?: boolean
          financeiro_configuracao_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          produto_id?: string
          cliente?: string
          preco_venda?: number
          status_pagamento?: 'pago' | 'pendente' | 'cancelada'
          data_venda?: string
          custo_unitario_snapshot?: number | null
          reposicao_snapshot?: number | null
          lucro_bruto_snapshot?: number | null
          reserva_caixa_snapshot?: number | null
          lucro_distribuivel_snapshot?: number | null
          lucro_voce_snapshot?: number | null
          lucro_mae_snapshot?: number | null
          financeiro_estimado?: boolean
          financeiro_configuracao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          }
        ]
      }
      financeiro_configuracoes: {
        Row: {
          id: string
          created_at: string
          nome: string
          reposicao_percentual: number
          caixa_percentual: number
          split_voce_percentual: number
          split_mae_percentual: number
          ativo: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          nome?: string
          reposicao_percentual?: number
          caixa_percentual?: number
          split_voce_percentual?: number
          split_mae_percentual?: number
          ativo?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          reposicao_percentual?: number
          caixa_percentual?: number
          split_voce_percentual?: number
          split_mae_percentual?: number
          ativo?: boolean
        }
        Relationships: []
      }
      financeiro_retiradas: {
        Row: {
          id: string
          created_at: string
          pessoa: 'voce' | 'mae'
          valor: number
          data_retirada: string
          observacao: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          pessoa: 'voce' | 'mae'
          valor: number
          data_retirada?: string
          observacao?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          pessoa?: 'voce' | 'mae'
          valor?: number
          data_retirada?: string
          observacao?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
