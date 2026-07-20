import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { Combobox } from './ui/Combobox';
import { Select } from './ui/Select';
import { Pagination } from './Pagination';
import { Pencil, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import {
  calculateSaleFinancials,
  DEFAULT_FINANCIAL_CONFIG,
  getSaleFinancialRow,
  type FinancialConfig,
} from '../utils/finance';
import { formatCurrency, parseMoneyInput } from '../utils/parsing';

type Sale = Database['public']['Tables']['vendas']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];
type SaleStatus = Sale['status_pagamento'];

interface Props {
  sales: Sale[];
  products: Product[];
  financialConfig?: FinancialConfig;
  financialConfigs?: FinancialConfig[];
  refetch: () => void;
}

export function SalesTracker({
  sales,
  products,
  financialConfig = DEFAULT_FINANCIAL_CONFIG,
  financialConfigs = [],
  refetch
}: Props) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState<Exclude<SaleStatus, 'cancelada'>>('pago');
  const [loading, setLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSalePrice, setEditSalePrice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const getFinancialConfigForSale = (sale: Sale) => {
    return financialConfigs.find(config => config.id === sale.financeiro_configuracao_id) || financialConfig;
  };

  const handleAddSale = async () => {
    if (!selectedProduct || !customerName || !salePrice) return alert('Preencha os dados');
    setLoading(true);

    const priceNum = parseMoneyInput(salePrice);
    const qty = parseInt(quantity, 10);

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setLoading(false);
      return alert('Informe um preço de venda válido.');
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      setLoading(false);
      return alert('Informe uma quantidade válida.');
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      setLoading(false);
      return alert('Produto selecionado não encontrado. Atualize a página e tente novamente.');
    }

    try {
      const { data: currentProduct, error: productError } = await supabase
        .from('produtos')
        .select('id, estoque')
        .eq('id', selectedProduct)
        .single();

      if (productError || !currentProduct) {
        throw productError || new Error('Produto não encontrado no estoque.');
      }

      if (currentProduct.estoque < qty) {
        return alert(`Estoque insuficiente para ${product.nome}. Disponível: ${currentProduct.estoque} un.`);
      }

      const newStock = currentProduct.estoque - qty;
      const { data: updatedStock, error: stockError } = await supabase
        .from('produtos')
        .update({ estoque: newStock })
        .eq('id', selectedProduct)
        .gte('estoque', qty)
        .select('id')
        .single();

      if (stockError) throw stockError;
      if (!updatedStock) throw new Error('Não foi possível baixar o estoque. Tente novamente.');

      const financialSnapshot = calculateSaleFinancials(priceNum, product.custo_final_brl, financialConfig);
      const saleRows = Array.from({ length: qty }, () => ({
        produto_id: selectedProduct,
        cliente: customerName,
        preco_venda: priceNum,
        status_pagamento: status,
        data_venda: new Date().toISOString(),
        ...financialSnapshot,
        financeiro_estimado: false
      }));

      const { error: saleError } = await supabase.from('vendas').insert(saleRows);

      if (saleError) {
        await supabase
          .from('produtos')
          .update({ estoque: currentProduct.estoque })
          .eq('id', selectedProduct);
        throw saleError;
      }

      setCustomerName('');
      setSalePrice('');
      setQuantity('1');
      setSelectedProduct('');
      refetch();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erro ao registrar venda');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currStatus: SaleStatus) => {
    if (currStatus === 'cancelada') return alert('Venda cancelada não pode ter o status alterado.');
    const newStatus = currStatus === 'pago' ? 'pendente' : 'pago';
    await supabase.from('vendas').update({ status_pagamento: newStatus }).eq('id', id);
    refetch();
  };

  const handleStartEditSale = (sale: Sale) => {
    if (sale.status_pagamento === 'cancelada') return alert('Venda cancelada não pode ser editada.');
    setEditingSale(sale);
    setEditSalePrice(sale.preco_venda.toFixed(2).replace('.', ','));
  };

  const handleCloseEditSale = () => {
    if (savingEdit) return;
    setEditingSale(null);
    setEditSalePrice('');
  };

  const handleUpdateSalePrice = async () => {
    if (!editingSale) return;

    const nextPrice = parseMoneyInput(editSalePrice);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      return alert('Informe um novo preço de venda válido.');
    }

    setSavingEdit(true);
    try {
      const product = products.find(p => p.id === editingSale.produto_id);
      const unitCost = editingSale.custo_unitario_snapshot ?? product?.custo_final_brl ?? 0;
      const financialSnapshot = calculateSaleFinancials(
        nextPrice,
        unitCost,
        getFinancialConfigForSale(editingSale)
      );

      const { data: updatedSale, error } = await supabase
        .from('vendas')
        .update({
          preco_venda: nextPrice,
          ...financialSnapshot,
          financeiro_estimado: false
        })
        .eq('id', editingSale.id)
        .neq('status_pagamento', 'cancelada')
        .select('id')
        .single();

      if (error) throw error;
      if (!updatedSale) throw new Error('Não foi possível atualizar a venda. Tente novamente.');

      setEditingSale(null);
      setEditSalePrice('');
      refetch();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erro ao editar valor da venda');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelSale = async (sale: Sale) => {
    if (sale.status_pagamento === 'cancelada') return alert('Esta venda já foi cancelada.');
    if (!confirm('Cancelar esta venda e devolver 1 unidade ao estoque?')) return;

    setLoading(true);
    try {
      const { data: currentSale, error: saleFetchError } = await supabase
        .from('vendas')
        .select('id, produto_id, status_pagamento')
        .eq('id', sale.id)
        .single();

      if (saleFetchError || !currentSale) {
        throw saleFetchError || new Error('Venda não encontrada.');
      }

      if (currentSale.status_pagamento === 'cancelada') {
        return alert('Esta venda já foi cancelada.');
      }

      const { data: currentProduct, error: productError } = await supabase
        .from('produtos')
        .select('id, estoque')
        .eq('id', currentSale.produto_id)
        .single();

      if (productError || !currentProduct) {
        throw productError || new Error('Produto da venda não encontrado.');
      }

      const previousStatus = currentSale.status_pagamento;
      const { data: canceledSale, error: cancelError } = await supabase
        .from('vendas')
        .update({ status_pagamento: 'cancelada' })
        .eq('id', currentSale.id)
        .neq('status_pagamento', 'cancelada')
        .select('id')
        .single();

      if (cancelError) throw cancelError;
      if (!canceledSale) throw new Error('Não foi possível cancelar a venda. Tente novamente.');

      const { error: stockError } = await supabase
        .from('produtos')
        .update({ estoque: currentProduct.estoque + 1 })
        .eq('id', currentProduct.id);

      if (stockError) {
        await supabase
          .from('vendas')
          .update({ status_pagamento: previousStatus })
          .eq('id', currentSale.id);
        throw stockError;
      }

      refetch();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erro ao cancelar venda');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: SaleStatus) => {
    if (status === 'pago') return 'Pago';
    if (status === 'pendente') return 'Pendente';
    return 'Cancelada';
  };

  const getStatusClassName = (status: SaleStatus) => {
    if (status === 'pago') return 'bg-emerald-100 text-emerald-800';
    if (status === 'pendente') return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  // Usa snapshots financeiros para preservar o historico da venda.
  const salesWithSplit = useMemo(() => {
    return sales.map(s => {
      const p = products.find(prod => prod.id === s.produto_id);
      return getSaleFinancialRow(s, p, financialConfig);
    });
  }, [sales, products, financialConfig]);

  const [historyStatusFilter, setHistoryStatusFilter] = useState<SaleStatus | 'todos'>('todos');
  const [historySort, setHistorySort] = useState<'recentes' | 'maior-valor' | 'menor-valor'>('recentes');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilterKey, setHistoryFilterKey] = useState('todos|recentes');

  const filteredSortedSales = useMemo(() => {
    const filtered = historyStatusFilter === 'todos'
      ? salesWithSplit
      : salesWithSplit.filter(s => s.status_pagamento === historyStatusFilter);

    return [...filtered].sort((a, b) => {
      if (historySort === 'maior-valor') return b.preco_venda - a.preco_venda;
      if (historySort === 'menor-valor') return a.preco_venda - b.preco_venda;
      return new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime();
    });
  }, [salesWithSplit, historyStatusFilter, historySort]);

  const SALES_PER_PAGE = 15;
  const historyTotalPages = Math.max(1, Math.ceil(filteredSortedSales.length / SALES_PER_PAGE));

  // Reseta a página ao trocar filtro/ordenação (ajuste de estado durante a renderização, sem efeito).
  const currentHistoryFilterKey = `${historyStatusFilter}|${historySort}`;
  if (currentHistoryFilterKey !== historyFilterKey) {
    setHistoryFilterKey(currentHistoryFilterKey);
    if (historyPage !== 1) setHistoryPage(1);
  }

  const currentHistoryPage = Math.min(historyPage, historyTotalPages);

  const paginatedSales = useMemo(() => {
    const start = (currentHistoryPage - 1) * SALES_PER_PAGE;
    return filteredSortedSales.slice(start, start + SALES_PER_PAGE);
  }, [filteredSortedSales, currentHistoryPage]);

  const historyVisiblePageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, Math.min(currentHistoryPage - Math.floor(maxVisiblePages / 2), historyTotalPages - maxVisiblePages + 1));
    const endPage = Math.min(historyTotalPages, startPage + maxVisiblePages - 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentHistoryPage, historyTotalPages]);

  return (
    <div className="space-y-6">
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-brown/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-brand-brown/10 bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-brown/45">Editar venda</p>
                <h3 className="mt-1 text-lg font-bold text-brand-brown">{editingSale.cliente}</h3>
                <p className="text-sm text-brand-brown/60">
                  {products.find(p => p.id === editingSale.produto_id)?.nome || 'Produto removido'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleCloseEditSale}
                disabled={savingEdit}
                className="border-brand-brown/15 text-brand-brown"
                aria-label="Fechar edição"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-brand-brown">Novo valor vendido (BRL)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={editSalePrice}
                onChange={(e) => setEditSalePrice(e.target.value)}
                className="border-brand-brown/20 text-brand-brown"
                autoFocus
              />
              <p className="text-xs leading-5 text-brand-brown/55">
                O financeiro desta venda sera recalculado com o custo salvo no momento do registro.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditSale}
                disabled={savingEdit}
                className="border-brand-brown/15 text-brand-brown"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleUpdateSalePrice}
                disabled={savingEdit}
                className="bg-brand-brown text-brand-bg hover:bg-brand-brown/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingEdit ? 'Salvando...' : 'Salvar ajuste'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-brown">Registrar Venda</CardTitle>
          <CardDescription className="text-brand-brown/70">Cada venda salva custo, caixa de 10% sobre lucro bruto e split do lucro distribuível.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-brand-brown">Produto</Label>
              <Combobox
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.nome} (Qtde: ${p.estoque}) - Custo: ${formatCurrency(p.custo_final_brl)}`,
                  searchText: p.nome,
                }))}
                value={selectedProduct}
                onChange={setSelectedProduct}
                placeholder="Buscar produto por nome..."
                emptyMessage="Nenhum produto encontrado."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Cliente</Label>
              <Input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="border-brand-brown/20 text-brand-brown" />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Preço Unitário Vendido (BRL)</Label>
              <Input type="text" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="border-brand-brown/20 text-brand-brown" />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Quantidade Vendida</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border-brand-brown/20 text-brand-brown" />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-brown">Status</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as Exclude<SaleStatus, 'cancelada'>)}
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddSale} disabled={loading} className="w-full bg-brand-brown hover:bg-brand-brown/90 text-brand-bg transition-colors">
            {loading ? 'Salvando...' : 'Registrar Venda'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-brown">Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['todos', 'pago', 'pendente', 'cancelada'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setHistoryStatusFilter(opt)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    historyStatusFilter === opt
                      ? 'bg-brand-brown text-brand-bg'
                      : 'bg-brand-bg text-brand-brown/70 hover:bg-brand-brown/10'
                  }`}
                >
                  {opt === 'todos' ? 'Todos' : getStatusLabel(opt)}
                </button>
              ))}
            </div>
            <Select
              value={historySort}
              onChange={(e) => setHistorySort(e.target.value as typeof historySort)}
              className="sm:w-44"
            >
              <option value="recentes">Mais recentes</option>
              <option value="maior-valor">Maior valor</option>
              <option value="menor-valor">Menor valor</option>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-brand-brown/70 uppercase border-b border-brand-brown/10">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente / Produto</th>
                  <th className="px-4 py-3">Venda / Custo</th>
                  <th className="px-4 py-3">Lucro / Caixa</th>
                  <th className="px-4 py-3 text-emerald-700 font-bold">Split Você / Mãe</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="text-brand-brown divide-y divide-brand-brown/5">
                {paginatedSales.map(s => (
                  <tr key={s.id} className={s.status_pagamento === 'cancelada' ? 'opacity-60' : ''}>
                    <td className="px-4 py-3">{new Date(s.data_venda).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{s.cliente}</div>
                      <div className="text-xs opacity-70">{s.product_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{formatCurrency(s.preco_venda)}</div>
                      <div className="text-xs opacity-70">C: {formatCurrency(s.custo_unitario_snapshot)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatCurrency(s.lucro_bruto_snapshot)}</div>
                      <div className="text-xs opacity-70">Caixa: {formatCurrency(s.reserva_caixa_snapshot)}</div>
                    </td>
                    <td className="px-4 py-3 text-emerald-700 font-bold bg-emerald-50/50">
                      <div>{formatCurrency(s.lucro_voce_snapshot)} / {formatCurrency(s.lucro_mae_snapshot)}</div>
                      {s.financeiro_estimado && <div className="text-[10px] uppercase tracking-wide text-amber-700">Estimado</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClassName(s.status_pagamento)}`}>
                        {getStatusLabel(s.status_pagamento)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.status_pagamento !== 'cancelada' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleStartEditSale(s)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleToggleStatus(s.id, s.status_pagamento)}>
                            {s.status_pagamento === 'pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCancelSale(s)} className="border-red-200 text-red-600 hover:bg-red-50">
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-brown/40">Sem ações</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSortedSales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-brand-brown/50">
                      {salesWithSplit.length === 0
                        ? 'Nenhuma venda registrada.'
                        : 'Nenhuma venda encontrada para os filtros selecionados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentHistoryPage}
            totalPages={historyTotalPages}
            visiblePageNumbers={historyVisiblePageNumbers}
            onPageChange={setHistoryPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
