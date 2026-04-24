import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Sale = Database['public']['Tables']['vendas']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];

interface Props {
  sales: Sale[];
  products: Product[];
  refetch: () => void;
}

export function SalesTracker({ sales, products, refetch }: Props) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [loading, setLoading] = useState(false);

  const handleAddSale = async () => {
    if (!selectedProduct || !customerName || !salePrice) return alert('Preencha os dados');
    setLoading(true);

    const priceNum = parseFloat(salePrice.replace(',', '.'));

    const { error } = await supabase.from('vendas').insert({
      produto_id: selectedProduct,
      cliente: customerName,
      preco_venda: priceNum,
      status_pagamento: status,
      data_venda: new Date().toISOString()
    });

    setLoading(false);
    if (error) {
      console.error(error);
      alert('Erro ao registrar venda');
    } else {
      setCustomerName('');
      setSalePrice('');
      setSelectedProduct('');
      refetch();
    }
  };

  const handleToggleStatus = async (id: string, currStatus: string) => {
    const newStatus = currStatus === 'pago' ? 'pendente' : 'pago';
    await supabase.from('vendas').update({ status_pagamento: newStatus }).eq('id', id);
    refetch();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Calcula split de lucro
  const salesWithSplit = useMemo(() => {
    return sales.map(s => {
      const p = products.find(prod => prod.id === s.produto_id);
      const cost = p ? p.custo_final_brl : 0;
      const profit = s.preco_venda - cost;
      const partnerSplit = profit / 2;
      return { ...s, product_name: p?.nome || 'Desconhecido', cost, profit, partnerSplit };
    });
  }, [sales, products]);

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border-brand-brown/10">
        <CardHeader>
          <CardTitle className="text-brand-brown">Registrar Venda</CardTitle>
          <CardDescription className="text-brand-brown/70">O lucro é dividido em (Preço de Venda - Custo Real Final) / 2</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-brand-brown">Produto</Label>
              <select 
                value={selectedProduct} 
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown text-brand-brown"
              >
                <option value="">Selecione o produto...</option>
                {products.map(p => {
                  return (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Qtde: {p.estoque}) - Custo: {formatCurrency(p.custo_final_brl)}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Cliente</Label>
              <Input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="border-brand-brown/20 text-brand-brown" />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Preço Vendido (BRL)</Label>
              <Input type="text" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="border-brand-brown/20 text-brand-brown" />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Status</Label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as 'pago' | 'pendente')}
                className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown text-brand-brown"
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAddSale} disabled={loading} className="w-full bg-brand-brown hover:bg-brand-brown/90 text-brand-bg transition-colors">
            {loading ? 'Salvando...' : 'Registrar Venda'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-brand-brown/10">
        <CardHeader>
          <CardTitle className="text-brand-brown">Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-brand-brown/70 uppercase border-b border-brand-brown/10">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente / Produto</th>
                  <th className="px-4 py-3">Venda / Custo</th>
                  <th className="px-4 py-3">Lucro Total</th>
                  <th className="px-4 py-3 text-emerald-700 font-bold">Split Parceiro (50%)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="text-brand-brown divide-y divide-brand-brown/5">
                {salesWithSplit.map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">{new Date(s.data_venda).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{s.cliente}</div>
                      <div className="text-xs opacity-70">{s.product_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{formatCurrency(s.preco_venda)}</div>
                      <div className="text-xs opacity-70">C: {formatCurrency(s.cost)}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(s.profit)}</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold bg-emerald-50/50">{formatCurrency(s.partnerSplit)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status_pagamento === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {s.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus(s.id, s.status_pagamento)}>
                        {s.status_pagamento === 'pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {salesWithSplit.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-brand-brown/50">Nenhuma venda registrada.</td>
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
