import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { CircleDollarSign, TrendingUp, HandCoins } from 'lucide-react';
import type { Database } from '../types/supabase';

type Sale = Database['public']['Tables']['vendas']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];
type Trip = Database['public']['Tables']['viagens']['Row'];

interface Props {
  sales: Sale[];
  products: Product[];
  trips: Trip[];
}

export function DashboardOverview({ sales, products, trips }: Props) {
  const { totalRevenue, netProfit, roi } = useMemo(() => {
    let revenue = 0;
    let totalCostOfSold = 0;

    sales.forEach(sale => {
      if (sale.status_pagamento === 'pago') {
        revenue += sale.preco_venda;
        const product = products.find(p => p.id === sale.produto_id);
        if (product) {
          totalCostOfSold += product.custo_final_brl;
        }
      }
    });

    const net = revenue - totalCostOfSold;
    const returnOnInvest = totalCostOfSold > 0 ? (net / totalCostOfSold) * 100 : 0;

    return {
      totalRevenue: revenue,
      netProfit: net,
      roi: returnOnInvest
    };
  }, [sales, products]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border-brand-brown/10">
        <CardHeader>
          <CardTitle className="text-brand-brown">Visão Financeira</CardTitle>
          <CardDescription className="text-brand-brown/70">Resumo de receitas e lucros (Vendas Pagas).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-brand-bg border border-brand-brown/20 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-brown/80">Receita Total</p>
              <h3 className="text-2xl font-bold text-brand-brown mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <CircleDollarSign className="text-brand-brown/30 h-8 w-8" />
          </div>

          <div className="rounded-xl bg-[#e3eedd] border border-emerald-900/10 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900/80">Lucro Líquido</p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(netProfit)}</h3>
            </div>
            <HandCoins className="text-emerald-900/30 h-8 w-8" />
          </div>

          <div className="rounded-xl bg-white border border-brand-brown/20 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-brown/80">ROI em Tempo Real</p>
              <h3 className="text-2xl font-bold text-brand-brown mt-1">{roi.toFixed(2)}%</h3>
            </div>
            <TrendingUp className="text-brand-brown/30 h-8 w-8" />
          </div>
        </CardContent>
      </Card>
      
      {/* Resumo de Estoque */}
      <Card className="bg-white shadow-sm border-brand-brown/10">
         <CardHeader>
            <CardTitle className="text-brand-brown">Resumo de Produtos</CardTitle>
            <CardDescription className="text-brand-brown/70">Quantidade total de produtos listados.</CardDescription>
         </CardHeader>
         <CardContent>
            <p className="text-brand-brown">Existem {products.length} produtos cadastrados e {trips.length} viagens registradas.</p>
         </CardContent>
      </Card>
    </div>
  );
}
