import { useState, useId, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useCart } from '../contexts/cart';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { formatCurrency } from '../utils/parsing';
import {
  fetchAddressByCep,
  formatCep,
  formatPhone,
  sanitizeCep,
} from '../services/viacep';
import {
  buildOrderWhatsAppUrl,
  type OrderDataForWhatsApp,
  type OrderItemForWhatsApp,
} from '../utils/orderWhatsApp';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

type OrderRow = Database['public']['Tables']['pedidos']['Row'];

const PIX_DISCOUNT_PERCENT = 0.05; // 5% de desconto à vista via Pix

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();

  const nameId = useId();
  const phoneId = useId();
  const cepId = useId();
  const streetId = useId();
  const numberId = useId();
  const compId = useId();
  const neighborhoodId = useId();
  const cityId = useId();
  const stateId = useId();
  const notesId = useId();

  // Form states
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'envio' | 'retirada'>('envio');

  // Address states
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  // Payment state
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'cartao'>('pix');
  const [observacoes, setObservacoes] = useState('');

  // Loading & validation states
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success state
  const [placedOrder, setPlacedOrder] = useState<OrderRow | null>(null);
  const [savedItems, setSavedItems] = useState<OrderItemForWhatsApp[]>([]);

  // Subtotal & Descontos
  const subtotal = totalPrice;
  const desconto = formaPagamento === 'pix' ? Math.round(subtotal * PIX_DISCOUNT_PERCENT * 100) / 100 : 0;
  const total = Math.max(0, subtotal - desconto);

  // Snapshot dos itens para caso a sacola seja limpa no sucesso
  useEffect(() => {
    if (items.length > 0) {
      setSavedItems(
        items.map((i) => ({
          nome: i.nome,
          quantity: i.quantity,
          price: i.price,
        }))
      );
    }
  }, [items]);

  // Auto-busca do CEP ao preencher 8 dígitos
  const handleCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setCep(formatted);
    setCepError(null);

    const clean = sanitizeCep(formatted);
    if (clean.length === 8) {
      setCepLoading(true);
      const res = await fetchAddressByCep(clean);
      setCepLoading(false);

      if (res.success && res.data) {
        setLogradouro(res.data.logradouro || '');
        setBairro(res.data.bairro || '');
        setCidade(res.data.localidade || '');
        setEstado(res.data.uf || '');

        // Focar no número se a rua foi encontrada
        const numInput = document.getElementById(numberId);
        if (numInput) {
          numInput.focus();
        }
      } else {
        setCepError(res.error || 'CEP não localizado.');
      }
    }
  };

  const handlePhoneChange = (val: string) => {
    setWhatsapp(formatPhone(val));
  };

  const handleManualCepSearch = async () => {
    const clean = sanitizeCep(cep);
    if (clean.length !== 8) {
      setCepError('Digite um CEP válido com 8 dígitos.');
      return;
    }
    setCepLoading(true);
    setCepError(null);
    const res = await fetchAddressByCep(clean);
    setCepLoading(false);

    if (res.success && res.data) {
      setLogradouro(res.data.logradouro || '');
      setBairro(res.data.bairro || '');
      setCidade(res.data.localidade || '');
      setEstado(res.data.uf || '');
    } else {
      setCepError(res.error || 'CEP não localizado.');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!nome.trim() || nome.trim().length < 2) {
      setSubmitError('Por favor, informe seu nome completo.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }

    if (tipoEntrega === 'envio') {
      const cleanCep = sanitizeCep(cep);
      if (cleanCep.length !== 8) {
        setSubmitError('Informe um CEP válido para entrega.');
        return;
      }
      if (!logradouro.trim()) {
        setSubmitError('Informe a rua / logradouro de entrega.');
        return;
      }
      if (!numero.trim()) {
        setSubmitError('Informe o número do endereço (ou S/N).');
        return;
      }
      if (!bairro.trim() || !cidade.trim() || !estado.trim()) {
        setSubmitError('Complete as informações de bairro, cidade e estado.');
        return;
      }
    }

    if (items.length === 0) {
      setSubmitError('Sua sacola está vazia.');
      return;
    }

    setSubmitting(true);

    try {
      const fallbackCode = `#LUMI-${Math.floor(1000 + Math.random() * 9000)}`;

      // Salvar pedido no Supabase
      const { data: orderData, error: orderErr } = await supabase
        .from('pedidos')
        .insert({
          codigo: fallbackCode, // Se a trigger do Supabase estiver instalada, sobrescreverá com a sequence
          cliente_nome: nome.trim(),
          cliente_whatsapp: whatsapp.trim(),
          tipo_entrega: tipoEntrega,
          cep: tipoEntrega === 'envio' ? cep.trim() : null,
          logradouro: tipoEntrega === 'envio' ? logradouro.trim() : null,
          numero: tipoEntrega === 'envio' ? numero.trim() : null,
          complemento: tipoEntrega === 'envio' ? (complemento.trim() || null) : null,
          bairro: tipoEntrega === 'envio' ? bairro.trim() : null,
          cidade: tipoEntrega === 'envio' ? cidade.trim() : null,
          estado: tipoEntrega === 'envio' ? estado.trim() : null,
          forma_pagamento: formaPagamento,
          subtotal,
          desconto,
          total,
          status: 'aguardando_confirmacao',
          observacoes: observacoes.trim() || null,
          origem: 'checkout_express',
        })
        .select()
        .single();

      let finalOrder: OrderRow;

      if (orderErr || !orderData) {
        console.warn('Aviso: Não foi possível persistir no Supabase (pode ser necessária migração):', orderErr);
        // Fallback gracioso: cria um objeto de pedido simulado para nunca travar o cliente
        finalOrder = {
          id: crypto.randomUUID(),
          codigo: fallbackCode,
          created_at: new Date().toISOString(),
          cliente_nome: nome.trim(),
          cliente_whatsapp: whatsapp.trim(),
          tipo_entrega: tipoEntrega,
          cep: tipoEntrega === 'envio' ? cep.trim() : null,
          logradouro: tipoEntrega === 'envio' ? logradouro.trim() : null,
          numero: tipoEntrega === 'envio' ? numero.trim() : null,
          complemento: tipoEntrega === 'envio' ? (complemento.trim() || null) : null,
          bairro: tipoEntrega === 'envio' ? bairro.trim() : null,
          cidade: tipoEntrega === 'envio' ? cidade.trim() : null,
          estado: tipoEntrega === 'envio' ? estado.trim() : null,
          forma_pagamento: formaPagamento,
          subtotal,
          desconto,
          total,
          status: 'aguardando_confirmacao',
          observacoes: observacoes.trim() || null,
          origem: 'checkout_express',
        };
      } else {
        finalOrder = orderData;

        // Salvar os itens vinculados ao pedido
        const itemsToInsert = items.map((item) => ({
          pedido_id: orderData.id,
          produto_id: item.id,
          nome_produto: item.nome,
          quantidade: item.quantity,
          preco_unitario: item.price,
          preco_total: item.price * item.quantity,
          imagem_url: item.imagem_url,
        }));

        const { error: itemsErr } = await supabase.from('itens_pedido').insert(itemsToInsert);
        if (itemsErr) {
          console.warn('Aviso ao salvar itens_pedido no Supabase:', itemsErr);
        }
      }

      // Snapshot dos itens para mensagem e tela de sucesso
      const itemsSnapshot: OrderItemForWhatsApp[] = items.map((i) => ({
        nome: i.nome,
        quantity: i.quantity,
        price: i.price,
      }));
      setSavedItems(itemsSnapshot);
      setPlacedOrder(finalOrder);

      // Limpar a sacola de compras
      clearCart();

      // Montar a URL e abrir o WhatsApp
      const orderPayload: OrderDataForWhatsApp = {
        codigo: finalOrder.codigo,
        cliente_nome: finalOrder.cliente_nome,
        cliente_whatsapp: finalOrder.cliente_whatsapp,
        tipo_entrega: finalOrder.tipo_entrega,
        cep: finalOrder.cep,
        logradouro: finalOrder.logradouro,
        numero: finalOrder.numero,
        complemento: finalOrder.complemento,
        bairro: finalOrder.bairro,
        cidade: finalOrder.cidade,
        estado: finalOrder.estado,
        forma_pagamento: finalOrder.forma_pagamento,
        subtotal: Number(finalOrder.subtotal),
        desconto: Number(finalOrder.desconto),
        total: Number(finalOrder.total),
        observacoes: finalOrder.observacoes,
      };

      const waUrl = buildOrderWhatsAppUrl(orderPayload, itemsSnapshot);
      window.open(waUrl, '_blank');
    } catch (err: unknown) {
      console.error('Erro ao finalizar pedido:', err);
      setSubmitError('Ocorreu um erro ao processar seu pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Se o pedido já foi confirmado, exibe a tela de Sucesso
  if (placedOrder) {
    const orderPayload: OrderDataForWhatsApp = {
      codigo: placedOrder.codigo,
      cliente_nome: placedOrder.cliente_nome,
      cliente_whatsapp: placedOrder.cliente_whatsapp,
      tipo_entrega: placedOrder.tipo_entrega,
      cep: placedOrder.cep,
      logradouro: placedOrder.logradouro,
      numero: placedOrder.numero,
      complemento: placedOrder.complemento,
      bairro: placedOrder.bairro,
      cidade: placedOrder.cidade,
      estado: placedOrder.estado,
      forma_pagamento: placedOrder.forma_pagamento,
      subtotal: Number(placedOrder.subtotal),
      desconto: Number(placedOrder.desconto),
      total: Number(placedOrder.total),
      observacoes: placedOrder.observacoes,
    };
    const waUrl = buildOrderWhatsAppUrl(orderPayload, savedItems);

    return (
      <main className="min-h-screen bg-brand-bg px-4 py-8 md:py-16">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-brand-brown/10 bg-white p-6 shadow-overlay md:p-10 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-card">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-brand-brown/40">
              Pedido Registrado com Sucesso
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-brand-brown md:text-4xl">
              {placedOrder.codigo}
            </h1>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Status: Aguardando Confirmação via WhatsApp
            </div>

            <p className="mt-5 text-sm font-light leading-relaxed text-brand-brown/70 max-w-md mx-auto">
              Seu pedido foi registrado em nossa base. O WhatsApp da Lumi Imports deve abrir automaticamente para enviarmos os detalhes do seu atendimento.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-8 text-sm font-bold text-white shadow-lift transition-all hover:bg-[#1EBE5D] hover:-translate-y-0.5"
              >
                <MessageCircle className="h-5 w-5" />
                Abrir Mensagem no WhatsApp
                <ExternalLink className="h-4 w-4 opacity-75" />
              </a>

              <Button
                variant="outline"
                onClick={() => navigate('/catalogo')}
                className="h-13 rounded-2xl border-brand-brown/20 px-6 text-sm font-semibold text-brand-brown hover:bg-brand-surface"
              >
                Voltar ao Catálogo
              </Button>
            </div>

            {/* Resumo do Pedido Realizado */}
            <div className="mt-10 rounded-2xl border border-brand-brown/10 bg-brand-surface p-5 text-left text-sm">
              <h3 className="font-heading text-base font-semibold text-brand-brown border-b border-brand-brown/10 pb-2 mb-3">
                Resumo da Sua Seleção
              </h3>

              <div className="space-y-2 mb-4">
                {savedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-brand-brown/80">
                    <span>
                      {item.quantity}x {item.nome}
                    </span>
                    <span className="font-medium text-brand-brown">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-brown/10 pt-3 space-y-1.5 text-xs text-brand-brown/70">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(Number(placedOrder.subtotal))}</span>
                </div>
                {Number(placedOrder.desconto) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Desconto Pix (5%):</span>
                    <span>-{formatCurrency(Number(placedOrder.desconto))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Forma de Entrega:</span>
                  <span className="font-medium">
                    {placedOrder.tipo_entrega === 'envio' ? 'Envio para todo o Brasil' : 'Retirada em mãos'}
                  </span>
                </div>
                {placedOrder.tipo_entrega === 'envio' && placedOrder.logradouro && (
                  <div className="flex justify-between text-[11px] text-brand-brown/60">
                    <span>Endereço:</span>
                    <span className="text-right max-w-[240px]">
                      {placedOrder.logradouro}, {placedOrder.numero} — {placedOrder.cidade}/{placedOrder.estado}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-brand-brown border-t border-brand-brown/10 pt-2 mt-2">
                  <span>Total do Pedido:</span>
                  <span className="text-base text-brand-brown">{formatCurrency(Number(placedOrder.total))}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Se a sacola estiver vazia e nenhum pedido foi feito
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-16 flex items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-sand/50 text-brand-brown/30">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h1 className="mt-6 font-heading text-2xl font-semibold text-brand-brown">
            Sua sacola está vazia
          </h1>
          <p className="mt-2 text-sm font-light text-brand-brown/60">
            Adicione ao menos uma fragrância exclusiva para prosseguir com o checkout express.
          </p>
          <Button
            onClick={() => navigate('/catalogo')}
            className="mt-6 h-12 rounded-full bg-brand-brown px-8 font-semibold text-white shadow-lift hover:bg-brand-deep"
          >
            Explorar Catálogo
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho de Navegação */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-brown/60 transition-colors hover:text-brand-brown"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Catálogo
          </Link>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-brown/40">
              LUMI IMPORTS
            </p>
            <p className="font-heading text-lg font-semibold text-brand-brown">
              Checkout Express
            </p>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
            <p>{submitError}</p>
            <button
              onClick={() => setSubmitError(null)}
              className="text-xs font-bold underline ml-4 hover:text-red-950"
            >
              Fechar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Coluna Esquerda: Dados de Entrega e Pagamento (7 colunas) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Bloco 1: Dados do Cliente */}
            <div className="rounded-3xl border border-brand-brown/10 bg-white p-6 shadow-card md:p-8">
              <div className="flex items-center gap-3 border-b border-brand-brown/10 pb-4 mb-6">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-brown text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-brand-brown">
                    Seus Dados de Contato
                  </h2>
                  <p className="text-xs text-brand-brown/50">
                    Para identificação e envio dos detalhes no WhatsApp.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={nameId}>Nome Completo *</Label>
                  <Input
                    id={nameId}
                    type="text"
                    required
                    placeholder="Ex: Ana Carolina Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={phoneId}>WhatsApp / Telefone com DDD *</Label>
                  <Input
                    id={phoneId}
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={whatsapp}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                  <p className="text-[11px] text-brand-brown/40">
                    Usaremos para confirmar a separação e enviar o rastreio.
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco 2: Forma de Entrega */}
            <div className="rounded-3xl border border-brand-brown/10 bg-white p-6 shadow-card md:p-8">
              <div className="flex items-center gap-3 border-b border-brand-brown/10 pb-4 mb-6">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-brown text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-brand-brown">
                    Forma de Entrega
                  </h2>
                  <p className="text-xs text-brand-brown/50">
                    Selecione como deseja receber suas fragrâncias.
                  </p>
                </div>
              </div>

              {/* Opções de Entrega */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
                <button
                  type="button"
                  onClick={() => setTipoEntrega('envio')}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                    tipoEntrega === 'envio'
                      ? 'border-brand-brown bg-brand-surface ring-2 ring-brand-brown/15 shadow-sm'
                      : 'border-brand-brown/15 bg-white hover:border-brand-brown/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Truck className={`h-5 w-5 ${tipoEntrega === 'envio' ? 'text-brand-brown' : 'text-brand-brown/50'}`} />
                    <span className="text-sm font-bold text-brand-brown">Envio todo o Brasil</span>
                  </div>
                  <p className="mt-1.5 text-xs text-brand-brown/60">
                    Correios ou Transportadora com frete a combinar no WhatsApp.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoEntrega('retirada')}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                    tipoEntrega === 'retirada'
                      ? 'border-brand-brown bg-brand-surface ring-2 ring-brand-brown/15 shadow-sm'
                      : 'border-brand-brown/15 bg-white hover:border-brand-brown/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className={`h-5 w-5 ${tipoEntrega === 'retirada' ? 'text-brand-brown' : 'text-brand-brown/50'}`} />
                    <span className="text-sm font-bold text-brand-brown">Retirada em Mãos</span>
                  </div>
                  <p className="mt-1.5 text-xs text-brand-brown/60">
                    Sem taxa de envio. Ponto de entrega e horário a combinar.
                  </p>
                </button>
              </div>

              {/* Formulário de Endereço quando 'envio' */}
              <AnimatePresence mode="wait">
                {tipoEntrega === 'envio' ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div className="sm:col-span-5 space-y-1.5">
                        <Label htmlFor={cepId}>CEP de Entrega *</Label>
                        <div className="relative">
                          <Input
                            id={cepId}
                            type="text"
                            placeholder="00000-000"
                            value={cep}
                            onChange={(e) => handleCepChange(e.target.value)}
                            className="pr-10"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {cepLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-brand-brown" />
                            ) : (
                              <button
                                type="button"
                                onClick={handleManualCepSearch}
                                className="text-xs font-semibold text-brand-brown/50 hover:text-brand-brown"
                                title="Buscar CEP"
                              >
                                Buscar
                              </button>
                            )}
                          </div>
                        </div>
                        {cepError && (
                          <p className="text-xs text-red-600 font-medium mt-1">{cepError}</p>
                        )}
                      </div>

                      <div className="sm:col-span-7 flex items-end">
                        <span className="text-[11px] text-brand-brown/50 pb-2">
                          💡 Digite o CEP para preenchimento automático da rua e bairro.
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div className="sm:col-span-9 space-y-1.5">
                        <Label htmlFor={streetId}>Rua / Logradouro *</Label>
                        <Input
                          id={streetId}
                          type="text"
                          placeholder="Nome da rua ou avenida"
                          value={logradouro}
                          onChange={(e) => setLogradouro(e.target.value)}
                          required
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1.5">
                        <Label htmlFor={numberId}>Número *</Label>
                        <Input
                          id={numberId}
                          type="text"
                          placeholder="Ex: 120"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div className="sm:col-span-6 space-y-1.5">
                        <Label htmlFor={compId}>Complemento (opcional)</Label>
                        <Input
                          id={compId}
                          type="text"
                          placeholder="Apto, Bloco, Casa 2"
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-6 space-y-1.5">
                        <Label htmlFor={neighborhoodId}>Bairro *</Label>
                        <Input
                          id={neighborhoodId}
                          type="text"
                          placeholder="Bairro"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div className="sm:col-span-8 space-y-1.5">
                        <Label htmlFor={cityId}>Cidade *</Label>
                        <Input
                          id={cityId}
                          type="text"
                          placeholder="Cidade"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          required
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1.5">
                        <Label htmlFor={stateId}>Estado (UF) *</Label>
                        <Input
                          id={stateId}
                          type="text"
                          placeholder="SP"
                          maxLength={2}
                          value={estado}
                          onChange={(e) => setEstado(e.target.value.toUpperCase())}
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-brand-brown/10 bg-brand-surface p-4 text-xs text-brand-brown/70 space-y-1"
                  >
                    <p className="font-semibold text-brand-brown">
                      📍 Retirada em mãos combinada diretamente no WhatsApp:
                    </p>
                    <p>
                      Assim que o pedido for recebido, nossa equipe alinha o melhor ponto e horário de retirada em mãos (Campinas e região) com você.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bloco 3: Forma de Pagamento */}
            <div className="rounded-3xl border border-brand-brown/10 bg-white p-6 shadow-card md:p-8">
              <div className="flex items-center gap-3 border-b border-brand-brown/10 pb-4 mb-6">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-brown text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-brand-brown">
                    Forma de Pagamento Pretendida
                  </h2>
                  <p className="text-xs text-brand-brown/50">
                    O pagamento é concluído com segurança no atendimento.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFormaPagamento('pix')}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                    formaPagamento === 'pix'
                      ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-sm'
                      : 'border-brand-brown/15 bg-white hover:border-brand-brown/30'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-emerald-700" />
                      <span className="text-sm font-bold text-brand-brown">Pix</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      5% OFF
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-brand-brown/60">
                    Aprovação imediata com desconto aplicado automaticamente. Chave enviada no WhatsApp.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormaPagamento('cartao')}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                    formaPagamento === 'cartao'
                      ? 'border-brand-brown bg-brand-surface ring-2 ring-brand-brown/15 shadow-sm'
                      : 'border-brand-brown/15 bg-white hover:border-brand-brown/30'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-brand-brown" />
                      <span className="text-sm font-bold text-brand-brown">Cartão de Crédito</span>
                    </div>
                    <span className="rounded-full bg-brand-sand px-2 py-0.5 text-[10px] font-semibold text-brand-brown/70">
                      Até 12x
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-brand-brown/60">
                    Link de pagamento seguro enviado na conversa para parcelamento em até 12x.
                  </p>
                </button>
              </div>

              {/* Observações */}
              <div className="mt-6 space-y-1.5">
                <Label htmlFor={notesId}>Observações ou Preferências (opcional)</Label>
                <Input
                  id={notesId}
                  type="text"
                  placeholder="Ex: Embalagem para presente, melhor horário para contato..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Coluna Direita: Resumo do Pedido (5 colunas) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-3xl border border-brand-brown/10 bg-white p-6 shadow-overlay md:p-8">
              <div className="flex items-center justify-between border-b border-brand-brown/10 pb-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-brown/40">
                    Resumo do Pedido
                  </p>
                  <h3 className="font-heading text-xl font-semibold text-brand-brown">
                    Sua Sacola ({items.reduce((s, i) => s + i.quantity, 0)} itens)
                  </h3>
                </div>
                <Link
                  to="/catalogo"
                  className="text-xs font-semibold text-brand-brown/60 underline hover:text-brand-brown"
                >
                  Editar
                </Link>
              </div>

              {/* Lista dos Itens */}
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1 divide-y divide-brand-brown/5">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-surface border border-brand-brown/5">
                      {item.imagem_url ? (
                        <img
                          src={item.imagem_url}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-brand-brown/20" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-xs font-semibold text-brand-brown">
                        {item.nome}
                      </h4>
                      <p className="text-[11px] text-brand-brown/50">
                        {item.quantity}x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold text-brand-brown">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Valores Discriminados */}
              <div className="mt-6 border-t border-brand-brown/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-brand-brown/70">
                  <span>Subtotal dos produtos</span>
                  <span className="font-medium text-brand-brown">{formatCurrency(subtotal)}</span>
                </div>

                {formaPagamento === 'pix' && desconto > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1 font-medium">
                      <Sparkles className="h-3.5 w-3.5" />
                      Desconto Pix (5%)
                    </span>
                    <span className="font-bold">-{formatCurrency(desconto)}</span>
                  </div>
                )}

                <div className="flex justify-between text-brand-brown/70">
                  <span>Entrega</span>
                  <span className="font-medium text-brand-brown">
                    {tipoEntrega === 'envio' ? 'A calcular no atendimento' : 'Retirada gratuita'}
                  </span>
                </div>

                <div className="border-t border-brand-brown/10 pt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-brown/50">
                      Total a Pagar
                    </span>
                    {formaPagamento === 'pix' && (
                      <p className="text-[11px] font-medium text-emerald-700">Com 5% OFF à vista</p>
                    )}
                    {formaPagamento === 'cartao' && (
                      <p className="text-[11px] text-brand-brown/50">
                        Em até 12x de {formatCurrency(total / 12)}
                      </p>
                    )}
                  </div>
                  <span className="font-heading text-2xl font-bold text-brand-brown">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Botão de Finalização */}
              <Button
                type="submit"
                disabled={submitting || items.length === 0}
                className="mt-6 h-14 w-full rounded-2xl bg-brand-brown text-base font-bold text-white shadow-lift transition-all hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-xl disabled:translate-y-0 disabled:bg-brand-sand disabled:text-brand-brown/40"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Registrando Pedido...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Confirmar Pedido & Abrir WhatsApp
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              {/* Selos de Confiança */}
              <div className="mt-6 border-t border-brand-brown/10 pt-4 space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-brand-brown/60">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                  <span>Perfumes 100% originais e importados lacrados.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-brand-brown/60">
                  <HelpCircle className="h-4 w-4 shrink-0 text-amber-700" />
                  <span>Atendimento consultivo e humanizado no WhatsApp.</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
