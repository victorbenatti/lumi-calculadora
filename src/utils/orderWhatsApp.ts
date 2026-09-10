import { WHATSAPP_NUMBER } from '../contexts/cart';
import { formatCurrency } from './parsing';

export interface OrderDataForWhatsApp {
  codigo: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  tipo_entrega: 'envio' | 'retirada';
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  forma_pagamento: 'pix' | 'cartao';
  subtotal: number;
  desconto: number;
  total: number;
  observacoes?: string | null;
}

export interface OrderItemForWhatsApp {
  nome: string;
  quantity: number;
  price: number;
}

export function buildCompleteOrderWhatsAppMessage(
  order: OrderDataForWhatsApp,
  items: OrderItemForWhatsApp[]
): string {
  const itemsText = items
    .map((item) => {
      const unitText = item.quantity > 1 ? ` (${formatCurrency(item.price)} un.)` : '';
      return `• ${item.quantity}x *${item.nome}* — ${formatCurrency(item.price * item.quantity)}${unitText}`;
    })
    .join('\n');

  let entregaText = '';
  if (order.tipo_entrega === 'envio') {
    const complementoStr = order.complemento ? `, ${order.complemento}` : '';
    const logradouroStr = order.logradouro ? `${order.logradouro}, ${order.numero || 'S/N'}${complementoStr}` : 'Endereço a confirmar';
    const localidadeStr = [order.bairro, order.cidade, order.estado].filter(Boolean).join(' — ');
    const cepStr = order.cep ? `\nCEP: ${order.cep}` : '';

    entregaText = [
      '📦 *Forma de Entrega:* Envio para todo o Brasil',
      '📍 *Endereço de Entrega:*',
      logradouroStr,
      localidadeStr,
      cepStr,
    ].filter(Boolean).join('\n');
  } else {
    entregaText = [
      '🤝 *Forma de Entrega:* Retirada em mãos',
      '📍 *Local:* A combinar no atendimento',
    ].join('\n');
  }

  const formaPagamentoText =
    order.forma_pagamento === 'pix'
      ? 'Pix (com 5% de desconto à vista)'
      : 'Cartão de Crédito (em até 12x)';

  const lines = [
    '✨ *NOVO PEDIDO REGISTRADO | LUMI IMPORTS* ✨',
    '━━━━━━━━━━━━━━━━━━━━━━',
    `🔖 *Código do Pedido:* ${order.codigo}`,
    `👤 *Cliente:* ${order.cliente_nome}`,
    `📱 *WhatsApp:* ${order.cliente_whatsapp}`,
    '',
    entregaText,
    '',
    '🛍️ *Fragrâncias Selecionadas:*',
    itemsText,
    '━━━━━━━━━━━━━━━━━━━━━━',
    `💰 *Subtotal:* ${formatCurrency(order.subtotal)}`,
  ];

  if (order.desconto > 0) {
    lines.push(`🏷️ *Desconto Pix (5%):* -${formatCurrency(order.desconto)}`);
  }

  lines.push(`💳 *Forma de Pagamento:* ${formaPagamentoText}`);
  lines.push(`🔥 *Total:* ${formatCurrency(order.total)}`);

  if (order.observacoes && order.observacoes.trim()) {
    lines.push('');
    lines.push(`📝 *Observações:* ${order.observacoes.trim()}`);
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('_Olá! Registrei meu pedido no site da Lumi e gostaria de confirmar a disponibilidade dos itens e fechar o atendimento._ ✨');

  return lines.join('\n');
}

export function buildOrderWhatsAppUrl(
  order: OrderDataForWhatsApp,
  items: OrderItemForWhatsApp[]
): string {
  const message = buildCompleteOrderWhatsAppMessage(order, items);
  const text = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
