import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import type { FaqItem } from '../components/FaqSection';

export type CampaignPalette = {
  accent: string;      // botões, preços, ícones de destaque
  accentDeep: string;  // hover / ênfase
  bgSoft: string;      // fundo de seções suaves
  bgPage: string;      // fundo da página
  border: string;      // bordas de cards/seções
  badgeText: string;   // texto sobre badges claras
};

export type CampaignConfig = {
  slug: string;              // 'dia-dos-pais' -> rota /dia-dos-pais
  ativa: boolean;            // liga/desliga rota, botão Header, slide, CTA
  categorias: string[];      // ['Masculino', 'Unissex']
  palette: CampaignPalette;
  header: {
    announceBar: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    validUntil: string;
    discountFallback: string;// selo enquanto carrega / sem produtos
  };
  banner?: { desktop: string; mobile: string; alt: string };
  faq: FaqItem[];
  whatsappHelpText: string;  // texto pré-preenchido do "Ajuda para escolher"
  headerButton: { label: string; icon: ComponentType<LucideProps> };
  gaCategory: string;        // rótulo de evento ReactGA
};
