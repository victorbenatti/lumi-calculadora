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
          notas_topo: string | null
          notas_coracao: string | null
          notas_fundo: string | null
          familia_olfativa: string | null
          ocasiao: string | null
          descricao_ia: string | null
          volume: string | null
          inspirado_em: string | null
          mais_vendido: boolean | null
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
          notas_topo?: string | null
          notas_coracao?: string | null
          notas_fundo?: string | null
          familia_olfativa?: string | null
          ocasiao?: string | null
          descricao_ia?: string | null
          volume?: string | null
          inspirado_em?: string | null
          mais_vendido?: boolean | null
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
          notas_topo?: string | null
          notas_coracao?: string | null
          notas_fundo?: string | null
          familia_olfativa?: string | null
          ocasiao?: string | null
          descricao_ia?: string | null
          volume?: string | null
          inspirado_em?: string | null
          mais_vendido?: boolean | null
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
          status_pagamento: 'pago' | 'pendente'
          data_venda: string
        }
        Insert: {
          id?: string
          created_at?: string
          produto_id?: string
          cliente: string
          preco_venda: number
          status_pagamento?: 'pago' | 'pendente'
          data_venda?: string
        }
        Update: {
          id?: string
          created_at?: string
          produto_id?: string
          cliente?: string
          preco_venda?: number
          status_pagamento?: 'pago' | 'pendente'
          data_venda?: string
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
