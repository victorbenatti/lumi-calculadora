import { Gift } from 'lucide-react';
import type { CampaignConfig } from './types';

export const diaDosPais: CampaignConfig = {
  slug: 'dia-dos-pais',
  ativa: true,
  categorias: ['Masculino', 'Unissex'],
  palette: {
    accent: '#78350f',     // âmbar/tabaco escuro
    accentDeep: '#451a03',
    bgSoft: '#fffbf5',
    bgPage: '#fffdf9',
    border: '#f5e6d3',
    badgeText: '#78350f',
  },
  header: {
    announceBar: 'Especial Dia dos Pais • ofertas com estoque limitado',
    eyebrow: 'Curadoria Lumi',
    title: 'Para o pai que é referência.',
    subtitle:
      'Uma seleção de fragrâncias masculinas em promoção — presença, caráter e assinatura que ficam.',
    validUntil: '10/08',
    discountFallback: 'Ofertas selecionadas',
  },
  banner: {
    desktop: '/banner-diadospais.webp',
    mobile: '/banner-diadospais-MOBILE.webp',
    alt: 'Campanha Dia dos Pais Lumi Imports',
  },
  faq: [
    {
      question: 'Os valores promocionais aparecem no carrinho?',
      answer:
        'Sim. Quando a promoção está ativa no produto, o carrinho usa o valor promocional e envia esse preço no pedido pelo WhatsApp.',
    },
    {
      question: 'As ofertas são somente para perfumes masculinos?',
      answer:
        'A curadoria reúne fragrâncias masculinas e unissex com promoção ativa, estoque disponível e perfil de presente.',
    },
    {
      question: 'O produto fica reservado ao adicionar no carrinho?',
      answer:
        'A reserva é confirmada pelo atendimento no WhatsApp. Como o estoque é limitado, a equipe confirma disponibilidade antes de fechar o pedido.',
    },
    {
      question: 'A Lumi ajuda a escolher o presente?',
      answer:
        'Sim. Você pode chamar no WhatsApp para receber uma indicação conforme estilo, intensidade, ocasião e faixa de valor.',
    },
  ],
  whatsappHelpText:
    'Olá! Quero ajuda para escolher um presente de Dia dos Pais na Lumi Imports.',
  headerButton: { label: 'Dia dos Pais', icon: Gift },
  gaCategory: 'Dia dos Pais',
};
