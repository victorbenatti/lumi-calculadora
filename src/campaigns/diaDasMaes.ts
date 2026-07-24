import { Heart } from 'lucide-react';
import type { CampaignConfig } from './types';

export const diaDasMaes: CampaignConfig = {
  slug: 'dia-das-maes',
  ativa: false, // campanha encerrada; permanece como redirect
  categorias: ['Feminino'],
  palette: {
    accent: '#9f1239',
    accentDeep: '#4c0519',
    bgSoft: '#fff7f8',
    bgPage: '#fff9fa',
    border: '#ffe4e6',
    badgeText: '#881337',
  },
  header: {
    announceBar: 'Especial Dia das Mães • ofertas com estoque limitado',
    eyebrow: 'Curadoria Lumi',
    title: 'Presentes que ficam na memória.',
    subtitle:
      'Uma seleção rose de fragrâncias femininas em promoção para celebrar presença, carinho e sofisticação.',
    validUntil: '10/05',
    discountFallback: 'Ofertas selecionadas',
  },
  banner: {
    desktop: '/banner-diadasmaes.webp',
    mobile: '/banner-diadasmaes-MOBILE.webp',
    alt: 'Campanha Dia das Mães Lumi Imports',
  },
  faq: [
    {
      question: 'Os valores promocionais aparecem no carrinho?',
      answer:
        'Sim. Quando a promoção está ativa no produto, o carrinho usa o valor promocional e envia esse preço no pedido pelo WhatsApp.',
    },
    {
      question: 'As ofertas são somente para perfumes femininos?',
      answer:
        'Esta curadoria foi pensada para fragrâncias femininas com promoção ativa, estoque disponível e perfil de presente.',
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
    'Olá! Quero ajuda para escolher um presente de Dia das Mães na Lumi Imports.',
  headerButton: { label: 'Dia das Mães', icon: Heart },
  gaCategory: 'Dia das Mães',
};
