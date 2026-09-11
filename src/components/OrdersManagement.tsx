import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { formatCurrency } from '../utils/parsing';
import {
  calculateSaleFinancials,
  DEFAULT_FINANCIAL_CONFIG,
  type FinancialConfig,
} from '../utils/finance';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';

type Order = Database['public']['Tables']['pedidos']['Row'];
type OrderItem = Database['public']['Tables']['itens_pedido']['Row'];
type OrderStatus = Order['status'];
type Product = Database['public']['Tables']['produtos']['Row'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  aguardando_confirmacao: 'Aguardando Confirmação',
  pago: 'Pago',
  enviado: 'Enviado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  aguardando_confirmacao: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  pago: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  enviado: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  cancelado: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
};

interface Props {
  products?: Product[];
  financialConfig?: FinancialConfig;
  onSuccessSync?: () => void;
}

export function OrdersManagement({
  products = [],
  financialConfig = DEFAULT_FINANCIAL_CONFIG,
  onSuccessSync,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modal de Detalhes
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Tabela de pedidos ainda não existe ou sem permissão:', error);
        setOrders([]);
      } else if (data) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        alert('Erro ao atualizar o status do pedido: ' + error.message);
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Falha de conexão ao atualizar status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDetails = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('itens_pedido')
        .select('*')
        .eq('pedido_id', order.id);

      if (error) {
        console.error('Erro ao buscar itens:', error);
        setSelectedItems([]);
      } else {
        setSelectedItems(data || []);
      }
    } catch (err) {
      console.error(err);
      setSelectedItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // Integração Pedido ➔ ERP com 1 Clique (Baixa de Estoque + Vendas Financeiras)
  const handleLaunchToERP = async (order: Order, preloadedItems?: OrderItem[]) => {
    let items = preloadedItems;

    if (!items || items.length === 0) {
      setSyncingId(order.id);
      const { data: fetchedItems, error: itemsErr } = await supabase
        .from('itens_pedido')
        .select('*')
        .eq('pedido_id', order.id);

      if (itemsErr || !fetchedItems || fetchedItems.length === 0) {
        setSyncingId(null);
        alert('Não foi possível carregar os itens deste pedido para lançamento no ERP.');
        return;
      }
      items = fetchedItems;
    }

    const totalQty = items.reduce((s, i) => s + i.quantidade, 0);
    const confirmMessage =
      `Deseja aprovar e lançar o pedido ${order.codigo} no ERP?\n\n` +
      `Cliente: ${order.cliente_nome}\n` +
      `Total: ${formatCurrency(Number(order.total))}\n` +
      `Quantidade de Itens: ${totalQty} un.\n\n` +
      `Esta ação irá:\n` +
      `1. Abater automaticamente o estoque dos produtos no catálogo\n` +
      `2. Gerar o registro de vendas com cálculo de reposição e lucro no financeiro\n` +
      `3. Marcar o pedido como Pago e Lançado no ERP.`;

    if (!window.confirm(confirmMessage)) {
      setSyncingId(null);
      return;
    }

    setSyncingId(order.id);

    try {
      const salesRowsToInsert: Array<Database['public']['Tables']['vendas']['Insert']> = [];
      const discountRatio =
        Number(order.desconto || 0) > 0 && Number(order.subtotal || 0) > 0
          ? Number(order.desconto) / Number(order.subtotal)
          : 0;

      for (const item of items) {
        if (!item.produto_id) continue;

        // Buscar dados mais recentes do produto no banco
        const { data: prodData, error: prodErr } = await supabase
          .from('produtos')
          .select('id, nome, estoque, custo_final_brl')
          .eq('id', item.produto_id)
          .single();

        if (prodErr || !prodData) {
          throw new Error(`Produto "${item.nome_produto}" não foi localizado no catálogo.`);
        }

        const qty = item.quantidade;
        if (prodData.estoque < qty) {
          const continueWithNegative = window.confirm(
            `Atenção: Estoque de "${prodData.nome}" está em ${prodData.estoque} un., menor que os ${qty} un. do pedido.\n\nDeseja continuar mesmo assim (o estoque ficará zerado)?`
          );
          if (!continueWithNegative) {
            throw new Error('Operação cancelada pelo usuário devido ao estoque insuficiente.');
          }
        }

        const newStock = Math.max(0, prodData.estoque - qty);

        // Atualizar estoque no catálogo
        const { error: updateStockErr } = await supabase
          .from('produtos')
          .update({ estoque: newStock })
          .eq('id', item.produto_id);

        if (updateStockErr) {
          throw new Error(`Falha ao baixar estoque de "${prodData.nome}": ${updateStockErr.message}`);
        }

        // Preço líquido unitário (considerando proporção de desconto Pix, se aplicável)
        const unitBasePrice = Number(item.preco_unitario);
        const effectiveUnitPrice = Math.round(unitBasePrice * (1 - discountRatio) * 100) / 100;
        const financialSnapshot = calculateSaleFinancials(
          effectiveUnitPrice,
          prodData.custo_final_brl || 0,
          financialConfig
        );

        for (let i = 0; i < qty; i++) {
          salesRowsToInsert.push({
            produto_id: item.produto_id,
            cliente: `${order.cliente_nome} (${order.codigo})`,
            preco_venda: effectiveUnitPrice,
            status_pagamento: 'pago',
            data_venda: new Date().toISOString(),
            ...financialSnapshot,
            financeiro_estimado: false,
          });
        }
      }

      // Gravar vendas no banco
      if (salesRowsToInsert.length > 0) {
        const { error: salesErr } = await supabase.from('vendas').insert(salesRowsToInsert);
        if (salesErr) {
          throw new Error(`Falha ao registrar vendas no financeiro: ${salesErr.message}`);
        }
      }

      // Marcar pedido como Pago e Lançado no ERP
      const { error: updateOrderErr } = await supabase
        .from('pedidos')
        .update({
          status: 'pago',
          lancado_erp: true,
        })
        .eq('id', order.id);

      if (updateOrderErr) {
        console.warn('Aviso ao atualizar flags do pedido:', updateOrderErr);
      }

      // Atualizar estado local
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: 'pago', lancado_erp: true } : o
        )
      );

      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'pago', lancado_erp: true } : null));
      }

      // Disparar sincronização do ERP para atualizar Dashboard, Estoque e Vendas imediatamente
      onSuccessSync?.();

      alert(`✅ Pedido ${order.codigo} lançado com sucesso no ERP!\n\n${totalQty} unidade(s) abatida(s) do estoque e lançadas no financeiro.`);
    } catch (err: unknown) {
      console.error('Erro ao lançar pedido no ERP:', err);
      const msg = err instanceof Error ? err.message : 'Falha inesperada ao sincronizar.';
      alert('Não foi possível lançar no ERP: ' + msg);
    } finally {
      setSyncingId(null);
    }
  };

  // Filtragem de Pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'todos' || order.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.codigo.toLowerCase().includes(q) ||
        order.cliente_nome.toLowerCase().includes(q) ||
        order.cliente_whatsapp.includes(q) ||
        (order.cidade && order.cidade.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Estatísticas rápidas
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const aguardando = orders.filter((o) => o.status === 'aguardando_confirmacao').length;
    const pagos = orders.filter((o) => o.status === 'pago').length;
    const totalFaturado = orders
      .filter((o) => o.status === 'pago' || o.status === 'enviado')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return { totalCount, aguardando, pagos, totalFaturado };
  }, [orders]);

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="border border-brand-brown/10 bg-white shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-brown/40">
              Total de Pedidos
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-brand-brown sm:text-3xl">
              {stats.totalCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 bg-amber-50/50 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800/60">
              Aguardando Confirmação
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-amber-900 sm:text-3xl">
              {stats.aguardando}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 bg-emerald-50/50 shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800/60">
              Pedidos Pagos
            </p>
            <p className="mt-1 font-heading text-2xl font-bold text-emerald-900 sm:text-3xl">
              {stats.pagos}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-brand-brown/10 bg-white shadow-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-brown/40">
              Faturado (Pagos/Enviados)
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-brand-brown sm:text-2xl">
              {formatCurrency(stats.totalFaturado)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-brown/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/40" />
          <Input
            type="text"
            placeholder="Buscar por código, cliente ou WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-brand-brown/10 bg-brand-surface p-1">
            {(['todos', 'aguardando_confirmacao', 'pago', 'enviado', 'cancelado'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white font-bold text-brand-brown shadow-sm'
                    : 'text-brand-brown/50 hover:text-brand-brown'
                }`}
              >
                {st === 'todos' ? 'Todos' : STATUS_LABELS[st]}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="h-8 border-brand-brown/15 text-xs text-brand-brown"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabela / Lista de Pedidos */}
      <div className="overflow-hidden rounded-2xl border border-brand-brown/10 bg-white shadow-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-brown/40" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-brand-brown/20" />
            <p className="mt-3 font-heading text-lg font-medium text-brand-brown">
              Nenhum pedido encontrado
            </p>
            <p className="mt-1 text-xs text-brand-brown/50">
              {orders.length === 0
                ? 'Novos pedidos feitos pelo checkout express aparecerão aqui.'
                : 'Nenhum pedido atende aos filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-brown/10 bg-brand-surface text-brand-brown/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Data/Hora</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Entrega</th>
                  <th className="px-4 py-3 font-semibold">Pagamento</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">ERP / Estoque</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5">
                {filteredOrders.map((order) => {
                  const style = STATUS_COLORS[order.status];
                  const rawPhone = cleanPhone(order.cliente_whatsapp);
                  const formattedDate = new Date(order.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isSyncing = syncingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-brand-surface/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-brand-brown">
                        {order.codigo}
                      </td>

                      <td className="px-4 py-3 text-brand-brown/60 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-brown">{order.cliente_nome}</p>
                        <a
                          href={`https://wa.me/55${rawPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline"
                        >
                          <MessageCircle className="h-3 w-3" />
                          {order.cliente_whatsapp}
                        </a>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {order.tipo_entrega === 'envio' ? (
                            <>
                              <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[140px]" title={`${order.cidade}/${order.estado}`}>
                                {order.cidade ? `${order.cidade}/${order.estado}` : 'Envio Brasil'}
                              </span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                              <span>Retirada em mãos</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="capitalize">
                          {order.forma_pagamento === 'pix' ? 'Pix (5% OFF)' : 'Cartão 12x'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-brand-brown">
                        {formatCurrency(Number(order.total))}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id || isSyncing}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold outline-none transition-colors cursor-pointer ${style.bg} ${style.text} ${style.border}`}
                        >
                          <option value="aguardando_confirmacao">Aguardando</option>
                          <option value="pago">Pago</option>
                          <option value="enviado">Enviado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>

                      {/* Botão de Lançar no ERP ou Badge de Concluído */}
                      <td className="px-4 py-3">
                        {order.lancado_erp ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCheck className="h-3 w-3" />
                            No ERP
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isSyncing}
                            onClick={() => handleLaunchToERP(order)}
                            className="h-7 rounded-lg bg-brand-brown px-2.5 text-[11px] font-bold text-white shadow-sm hover:bg-brand-deep flex items-center gap-1"
                            title="Aprovar, baixar estoque e registrar vendas"
                          >
                            {isSyncing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            Lançar ERP
                          </Button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(order)}
                            className="h-7 text-xs text-brand-brown hover:bg-brand-sand/50"
                          >
                            Ver Itens
                          </Button>
                          <a
                            href={`https://wa.me/55${rawPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-brand-brown/60 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-brown/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-brand-brown/10 bg-white p-6 shadow-overlay max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-brown/10 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/40">
                  Detalhes do Pedido
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="font-heading text-xl font-bold text-brand-brown">
                    {selectedOrder.codigo}
                  </h3>
                  {selectedOrder.lancado_erp && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <CheckCheck className="h-3 w-3" />
                      Lançado no ERP
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-1.5 text-brand-brown/40 hover:bg-brand-surface hover:text-brand-brown"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Informações do Cliente & Entrega */}
            <div className="mt-4 space-y-3 rounded-2xl border border-brand-brown/10 bg-brand-surface p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-brown/60">Cliente:</span>
                <span className="font-bold text-brand-brown">{selectedOrder.cliente_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-brown/60">WhatsApp:</span>
                <a
                  href={`https://wa.me/55${cleanPhone(selectedOrder.cliente_whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  {selectedOrder.cliente_whatsapp}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-brown/60">Tipo de Entrega:</span>
                <span className="font-bold text-brand-brown capitalize">
                  {selectedOrder.tipo_entrega === 'envio' ? 'Envio para todo o Brasil' : 'Retirada em mãos'}
                </span>
              </div>
              {selectedOrder.tipo_entrega === 'envio' && selectedOrder.logradouro && (
                <div className="border-t border-brand-brown/10 pt-2 space-y-1">
                  <span className="text-brand-brown/60">Endereço de Entrega:</span>
                  <p className="font-medium text-brand-brown">
                    {selectedOrder.logradouro}, {selectedOrder.numero}
                    {selectedOrder.complemento ? ` (${selectedOrder.complemento})` : ''}
                  </p>
                  <p className="text-brand-brown/60">
                    {selectedOrder.bairro} — {selectedOrder.cidade}/{selectedOrder.estado}
                  </p>
                  <p className="text-brand-brown/60">CEP: {selectedOrder.cep}</p>
                </div>
              )}
              {selectedOrder.observacoes && (
                <div className="border-t border-brand-brown/10 pt-2">
                  <span className="text-brand-brown/60">Observações:</span>
                  <p className="italic text-brand-brown/80">{selectedOrder.observacoes}</p>
                </div>
              )}
            </div>

            {/* Lista de Itens */}
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 mb-2">
                Itens Selecionados
              </p>
              {loadingItems ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-brown/40" />
                </div>
              ) : selectedItems.length === 0 ? (
                <p className="text-xs text-brand-brown/50 italic">Itens não detalhados.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-brand-brown/5 text-xs">
                  {selectedItems.map((item) => {
                    const catalogProduct = products.find((p) => p.id === item.produto_id);
                    return (
                      <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-10 w-8 shrink-0 overflow-hidden rounded bg-brand-surface border border-brand-brown/10 flex items-center justify-center">
                            {item.imagem_url ? (
                              <img src={item.imagem_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-brand-brown/20" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-brand-brown">{item.nome_produto}</p>
                            <p className="text-[10px] text-brand-brown/50">
                              {item.quantidade}x {formatCurrency(Number(item.preco_unitario))}
                              {catalogProduct && (
                                <span className="ml-1 text-brand-brown/40">
                                  (Estoque atual: {catalogProduct.estoque} un.)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-brand-brown">
                          {formatCurrency(Number(item.preco_total))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totais & Status */}
            <div className="mt-5 border-t border-brand-brown/10 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-brand-brown/70">
                <span>Subtotal:</span>
                <span>{formatCurrency(Number(selectedOrder.subtotal))}</span>
              </div>
              {Number(selectedOrder.desconto) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Desconto Pix (5%):</span>
                  <span>-{formatCurrency(Number(selectedOrder.desconto))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-brand-brown pt-1 border-t border-brand-brown/10">
                <span>Total:</span>
                <span>{formatCurrency(Number(selectedOrder.total))}</span>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-brand-brown/10 pt-4">
              {selectedOrder.lancado_erp ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lançado no ERP e Estoque baixado</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  disabled={syncingId === selectedOrder.id}
                  onClick={() => handleLaunchToERP(selectedOrder, selectedItems)}
                  className="rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 flex items-center gap-1.5"
                >
                  {syncingId === selectedOrder.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                  Aprovar & Lançar no ERP
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border-brand-brown/20 px-5 text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
