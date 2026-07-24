# Campanhas Sazonais + Dia dos Pais — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a página de campanha sazonal em um sistema dirigido por config (criar campanha = escrever um arquivo), entregar o Dia dos Pais como primeira campanha nova e migrar o Dia das Mães existente para a mesma base.

**Architecture:** Um `CampaignConfig` por campanha em `src/campaigns/`, consumido por uma página genérica `Campanha.tsx`. Cores por CSS custom properties (`var(--c-*)`) injetadas inline no root — Tailwind v4 JIT compila as classes literais `bg-[var(--c-accent)]`. Um registry central alimenta rota (App.tsx), botão (Header.tsx) e slide/CTA (Catalogo.tsx); encerrar campanha = `ativa: false`.

**Tech Stack:** React 19 + TypeScript, Vite, Tailwind CSS v4 (`@theme` em `src/index.css`), react-router-dom, framer-motion, lucide-react, Supabase, react-ga4.

**Nota sobre verificação:** O projeto não tem framework de teste (sem vitest/jest). O "gate" de cada task é: `npx tsc -p tsconfig.app.json --noEmit` limpo + verificação no browser via dev server. Rode o typecheck após cada task que toca `.ts/.tsx`.

**Spec:** `docs/superpowers/specs/2026-07-24-campanhas-sazonais-dia-dos-pais-design.md`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/campaigns/types.ts` (criar) | Tipos `CampaignPalette` e `CampaignConfig` |
| `src/campaigns/diaDasMaes.ts` (criar) | Config da campanha atual (rose, Feminino) |
| `src/campaigns/diaDosPais.ts` (criar) | Config da campanha nova (âmbar, Masculino+Unissex) |
| `src/campaigns/index.ts` (criar) | Registry + `getCampaign`, `getActiveCampaigns` |
| `src/components/Campaign/CampaignProductCard.tsx` (criar) | Card de produto sem cor fixa (extraído de `MothersDayProductCard`) |
| `src/pages/Campanha.tsx` (criar) | Página genérica dirigida por config |
| `src/pages/DiaDasMaes.tsx` (deletar) | Substituída por `Campanha.tsx` + config |
| `src/App.tsx` (modificar) | Rotas geradas do registry |
| `src/components/Header.tsx` (modificar) | Botão por campanha ativa |
| `src/pages/Catalogo.tsx` (modificar) | Slide + CTA gerados do registry |

Ordem: primeiro a base isolada (Tasks 1–5), depois religar os pontos de entrada (Tasks 6–8), depois limpeza (Task 9).

---

### Task 1: Contrato `CampaignConfig`

**Files:**
- Create: `src/campaigns/types.ts`

- [ ] **Step 1: Escrever os tipos**

```ts
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
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros novos (o arquivo ainda não é importado, mas deve compilar sozinho).

- [ ] **Step 3: Commit**

```bash
git add src/campaigns/types.ts
git commit -m "feat(campanhas): define contrato CampaignConfig"
```

---

### Task 2: Config do Dia das Mães (migração 1:1)

**Files:**
- Create: `src/campaigns/diaDasMaes.ts`

Transcreve os textos/cores hoje hard-coded em `src/pages/DiaDasMaes.tsx`. As cores rose viram valores hex explícitos (equivalentes às classes Tailwind usadas hoje): `rose-800 ≈ #9f1239`, `rose-950 ≈ #4c0519`, `#fff7f8` (bgSoft, já literal no arquivo), `#fff9fa` (bgPage, já literal), `rose-100 ≈ #ffe4e6` (border), `rose-900 ≈ #881337` (badgeText).

- [ ] **Step 1: Escrever o config**

```ts
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
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/campaigns/diaDasMaes.ts
git commit -m "feat(campanhas): migra Dia das Maes para config"
```

---

### Task 3: Config do Dia dos Pais

**Files:**
- Create: `src/campaigns/diaDosPais.ts`

- [ ] **Step 1: Escrever o config**

```ts
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
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/campaigns/diaDosPais.ts
git commit -m "feat(campanhas): adiciona config Dia dos Pais"
```

---

### Task 4: Registry de campanhas

**Files:**
- Create: `src/campaigns/index.ts`

- [ ] **Step 1: Escrever o registry**

```ts
import type { CampaignConfig } from './types';
import { diaDasMaes } from './diaDasMaes';
import { diaDosPais } from './diaDosPais';

export type { CampaignConfig, CampaignPalette } from './types';

// Ordem do array define a ordem de exibição no Header e no carrossel.
const allCampaigns: CampaignConfig[] = [diaDasMaes, diaDosPais];

export const campaigns: Record<string, CampaignConfig> = Object.fromEntries(
  allCampaigns.map((c) => [c.slug, c])
);

export const getCampaign = (slug: string): CampaignConfig | undefined =>
  campaigns[slug];

export const getActiveCampaigns = (): CampaignConfig[] =>
  allCampaigns.filter((c) => c.ativa);

export const getAllCampaigns = (): CampaignConfig[] => allCampaigns;
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/campaigns/index.ts
git commit -m "feat(campanhas): adiciona registry de campanhas"
```

---

### Task 5: Card de produto genérico + página genérica

**Files:**
- Create: `src/components/Campaign/CampaignProductCard.tsx`
- Create: `src/pages/Campanha.tsx`

Este é o maior task. Base: `src/pages/DiaDasMaes.tsx` (linhas 1–523). A regra de transformação é mecânica: **toda classe de cor rose vira `var(--c-*)`**:

| Antes (rose hard-coded) | Depois (token) |
|---|---|
| `bg-rose-800` | `bg-[var(--c-accent)]` |
| `hover:bg-rose-950` / `hover:bg-rose-900` | `hover:bg-[var(--c-accentDeep)]` |
| `text-rose-800` | `text-[var(--c-accent)]` |
| `text-rose-900` / `text-rose-900/xx` | `text-[var(--c-badgeText)]` (ajuste opacidade via `/xx` quando havia) |
| `border-rose-100` / `border-rose-200` | `border-[var(--c-border)]` |
| `bg-[#fff7f8]` (bgSoft literal) | `bg-[var(--c-bgSoft)]` |
| `bg-[#fff9fa]` (bgPage literal) | `bg-[var(--c-bgPage)]` |
| `bg-rose-50` / `bg-rose-100` (fundos suaves) | `bg-[var(--c-bgSoft)]` |

> Opacidade: onde havia `text-rose-900/50`, use `text-[var(--c-badgeText)]/50` — o Tailwind v4 aceita modificador de opacidade sobre `var()`. Onde a opacidade não é essencial ao visual, `text-brand-brown/xx` (marrom neutro) pode ser mantido como está — ele já é neutro entre campanhas. **Só troque as cores rose; deixe `brand-brown`, `emerald`, `amber`, `red`, `stone` intactos** (são neutros/semânticos, não temáticos).

- [ ] **Step 1: Criar `CampaignProductCard.tsx`**

Extraído de `MothersDayProductCard` (DiaDasMaes.tsx:70–187). Cabeçalho e assinatura:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Heart, Package, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Database } from '../../types/supabase';
import { calculateInstallment } from '../../utils/finance';
import {
  formatBRL,
  getProductRegularPrice,
  getProductSalePrice,
  useCart,
} from '../../contexts/cart';
import { getProductPath } from '../../utils/productRoutes';

type Product = Database['public']['Tables']['produtos']['Row'];

const discountPercentage = (product: Product) => {
  const regularPrice = getProductRegularPrice(product);
  const salePrice = getProductSalePrice(product);
  if (regularPrice <= 0 || salePrice >= regularPrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

export { discountPercentage };

export function CampaignProductCard({
  product,
  badgeLabel,
  onAddToCart,
}: {
  product: Product;
  badgeLabel: string;
  onAddToCart: (product: Product) => void;
}) {
  // ...corpo idêntico ao MothersDayProductCard, com as trocas de cor da tabela acima.
  // O badge "Mães" (linha 99) usa {badgeLabel} no lugar do texto fixo.
  // O ícone Heart do badge pode permanecer (é neutro dentro do badge escuro).
}
```

Copie o corpo do JSX de `DiaDasMaes.tsx:89–186` aplicando a tabela de trocas. O `<span>` do badge (linha 97–100) passa a exibir `{badgeLabel}` em vez de `"Mães"`.

- [ ] **Step 2: Criar `Campanha.tsx`**

Base: `DiaDasMaes.tsx:189–523`. Diferenças:

```tsx
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgePercent, Calendar, Gift, MessageCircle,
  ShieldCheck, Sparkles, Star, Truck,
} from 'lucide-react';
import ReactGA from 'react-ga4';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Header } from '../components/Header';
import { FaqSection } from '../components/FaqSection';
import type { Database } from '../types/supabase';
import { WHATSAPP_NUMBER, hasActivePromotion, useCart } from '../contexts/cart';
import { getCampaign } from '../campaigns';
import { CampaignProductCard, discountPercentage } from '../components/Campaign/CampaignProductCard';

type Product = Database['public']['Tables']['produtos']['Row'];

export default function Campanha({ slug }: { slug: string }) {
  const config = getCampaign(slug);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard: slug inválido ou campanha inexistente -> catálogo.
  useEffect(() => {
    if (!config) navigate('/catalogo', { replace: true });
  }, [config, navigate]);

  useEffect(() => {
    if (!config) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .gt('estoque', 0)
          .in('categoria', config.categorias)
          .eq('promocao_ativa', true)
          .not('preco_promocao_brl', 'is', null)
          .order('mais_vendido', { ascending: false, nullsFirst: false })
          .order('nome', { ascending: true });
        if (error) throw error;
        setProducts((data ?? []).filter(hasActivePromotion));
      } catch (err) {
        console.error(`Erro ao buscar ofertas de ${config.gaCategory}:`, err);
        setProducts([]);
      } finally {
        setTimeout(() => setLoading(false), 450);
      }
    };
    fetchProducts();
    const channel = supabase
      .channel(`campaign-${config.slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' },
        () => fetchProducts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [config]);

  const bestDiscount = useMemo(
    () => products.reduce((best, p) => Math.max(best, discountPercentage(p)), 0),
    [products]
  );

  if (!config) return null;

  const paletteStyle = {
    '--c-accent': config.palette.accent,
    '--c-accentDeep': config.palette.accentDeep,
    '--c-bgSoft': config.palette.bgSoft,
    '--c-bgPage': config.palette.bgPage,
    '--c-border': config.palette.border,
    '--c-badgeText': config.palette.badgeText,
  } as CSSProperties;

  const whatsappHelpUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(config.whatsappHelpText)}`;

  const handleAddToCart = (product: Product) => {
    const result = addItem(product);
    if (result.added) {
      ReactGA.event({ category: config.gaCategory, action: 'Adicionar Produto', label: product.nome });
    }
  };
  const openGiftHelp = () => window.open(whatsappHelpUrl, '_blank');
  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // JSX: corpo de DiaDasMaes.tsx:260-521 com:
  //  - <div> raiz recebe style={paletteStyle} e className bg-[var(--c-bgPage)] ...
  //  - todos os textos fixos vêm de config.header.*
  //  - a <section> do banner só renderiza se config.banner existir (envolver em {config.banner && (...)})
  //    e usar config.banner.desktop/mobile/alt
  //  - o selo grande "Até 30% off" (linhas 363-365) vira:
  //      {loading || products.length === 0 ? config.header.discountFallback : `Até ${bestDiscount}% off`}
  //  - "Válida até 10/05" usa config.header.validUntil
  //  - a lista mapeia <CampaignProductCard ... badgeLabel={config.headerButton.label} />
  //  - <FaqSection items={config.faq} title={...} /> com título derivado (ex.: `Presentes de ${config.gaCategory}`)
  //  - trocar todas as cores rose por var(--c-*) conforme a tabela do Step do card
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros. (A página ainda não está roteada; será ligada na Task 6.)

- [ ] **Step 4: Commit**

```bash
git add src/components/Campaign/CampaignProductCard.tsx src/pages/Campanha.tsx
git commit -m "feat(campanhas): pagina generica dirigida por config"
```

---

### Task 6: Rotas geradas do registry (App.tsx)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Importar registry e componente**

Adicione após a linha 7 (imports) e no bloco de lazy imports:

```tsx
import { getAllCampaigns } from './campaigns';
// ...
const Campanha = lazy(() => import('./pages/Campanha'));
```

- [ ] **Step 2: Substituir a rota fixa `/dia-das-maes`**

Remova a linha 56 (`<Route path="/dia-das-maes" element={<Navigate to="/catalogo" replace />} />`) e, no lugar, gere rotas do registry dentro do `<Routes>`:

```tsx
{getAllCampaigns().map((c) =>
  c.ativa ? (
    <Route key={c.slug} path={`/${c.slug}`} element={<Campanha slug={c.slug} />} />
  ) : (
    <Route key={c.slug} path={`/${c.slug}`} element={<Navigate to="/catalogo" replace />} />
  )
)}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificar no browser**

Inicie o dev server (via preview_start com o nome do dev server, ou `npm run dev`) e confira:
- `/dia-dos-pais` → página com paleta âmbar, produtos Masculino+Unissex em promoção.
- `/dia-das-maes` → redireciona para `/catalogo` (campanha inativa).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(campanhas): gera rotas de campanha a partir do registry"
```

---

### Task 7: Botão no Header por campanha ativa

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Importar o registry**

Adicione ao topo:

```tsx
import { getActiveCampaigns } from '../campaigns';
```

- [ ] **Step 2: Renderizar um botão por campanha ativa**

Dentro do `<div className="ml-auto flex items-center gap-2">` (Header.tsx:274), **antes** do botão WhatsApp, insira:

```tsx
{getActiveCampaigns().map((c) => {
  const Icon = c.headerButton.icon;
  return (
    <Button
      key={c.slug}
      type="button"
      onClick={() => navigate(`/${c.slug}`)}
      variant="outline"
      className="hidden h-10 rounded-full border-[var(--c-border)] bg-[var(--c-bgSoft)] px-3 text-[var(--c-accent)] hover:brightness-95 md:flex"
      style={{
        '--c-border': c.palette.border,
        '--c-bgSoft': c.palette.bgSoft,
        '--c-accent': c.palette.accent,
      } as CSSProperties}
      aria-label={`Especial ${c.headerButton.label}`}
      title={`Especial ${c.headerButton.label}`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-bold">{c.headerButton.label}</span>
    </Button>
  );
})}
```

Adicione `import { type CSSProperties } from 'react';` (ou inclua no import existente de `react`).

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificar no browser**

No `/catalogo`, o Header (desktop) mostra o botão "Dia dos Pais" (âmbar) e **não** mostra "Dia das Mães" (inativa). Clicar leva a `/dia-dos-pais`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat(campanhas): botao de campanha ativa no Header"
```

---

### Task 8: Slide do carrossel + CTA no Catálogo

**Files:**
- Modify: `src/pages/Catalogo.tsx`

- [ ] **Step 1: Importar registry e ícone**

No import de lucide (linha 4–14) garanta `BadgePercent`; adicione:

```tsx
import { getActiveCampaigns } from '../campaigns';
```

- [ ] **Step 2: Injetar slides de campanha no `heroSlides`**

Substitua a constante `heroSlides` (linhas 64–81) para intercalar as campanhas ativas que tenham banner. Mantém o primeiro slide fixo, insere campanhas, mantém brand-collection:

```tsx
const campaignSlides: HeroSlide[] = getActiveCampaigns()
  .filter((c) => c.banner)
  .map((c) => ({
    id: c.slug,
    desktopImage: c.banner!.desktop.replace(/^\//, ''),
    mobileImage: c.banner!.mobile.replace(/^\//, ''),
    alt: c.banner!.alt,
    href: `/${c.slug}`,
    clickable: true,
  }));

const heroSlides: HeroSlide[] = [
  {
    id: 'perfumes-arabes',
    desktopImage: 'banner-geral.webp',
    mobileImage: 'banner-geral-MOBILE.webp',
    alt: 'Banner LUMI Imports com perfumes árabes e importados selecionados',
    href: '#catalogo',
    clickable: true,
  },
  ...campaignSlides,
  {
    id: 'brand-collection',
    desktopImage: 'banner-brand-collection.webp',
    mobileImage: 'banner-brand-collection-MOBILE.webp',
    alt: 'Perfumes Brand Collection - 30ml',
    href: '#catalogo',
    clickable: true,
  },
];
```

> Nota: `heroSlides` é referenciado no efeito de auto-rotação (linha 275) e no render (438/467). Como `getActiveCampaigns()` é determinístico por render e o módulo é avaliado uma vez, manter `heroSlides` como const de módulo preserva o comportamento atual.

- [ ] **Step 3: Reintroduzir o CTA-banner de campanha**

Dentro do componente `Catalogo`, logo após a seção do hero (onde ficava o CTA removido em `5b5cdd4`, antes do `<main>` — ver Catalogo.tsx por volta da linha 475), renderize um CTA por campanha ativa:

```tsx
{getActiveCampaigns().map((c) => (
  <section key={c.slug} className="bg-brand-bg px-4 pt-4 sm:px-6 lg:px-8">
    <button
      type="button"
      onClick={() => navigate(`/${c.slug}`)}
      className="group mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-2xl border border-[var(--c-border)] bg-white px-4 py-4 text-left shadow-[0_10px_30px_rgba(60,43,31,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(60,43,31,0.12)] focus:outline-none sm:flex-row sm:items-center sm:justify-between sm:px-5"
      style={{
        '--c-border': c.palette.border,
        '--c-bgSoft': c.palette.bgSoft,
        '--c-accent': c.palette.accent,
        '--c-accentDeep': c.palette.accentDeep,
      } as CSSProperties}
      aria-label={`Ver promoção de ${c.headerButton.label} da Lumi Imports`}
    >
      <div className="flex items-start gap-3 sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--c-bgSoft)] text-[var(--c-accent)] ring-1 ring-[var(--c-border)]">
          <BadgePercent className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--c-accent)]">
            Especial {c.headerButton.label}
          </p>
          <h2 className="mt-1 text-base font-bold leading-snug text-brand-brown sm:text-lg">
            Perfumes selecionados com ofertas especiais
          </h2>
          <p className="mt-1 text-xs leading-5 text-brand-brown/55 sm:text-sm">
            Encontre presentes elegantes com curadoria Lumi e finalize pelo WhatsApp.
          </p>
        </div>
      </div>
      <span className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--c-accent)] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors group-hover:bg-[var(--c-accentDeep)] sm:w-auto sm:shrink-0">
        Ver ofertas
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  </section>
))}
```

`CSSProperties` precisa estar importado de `react` neste arquivo — adicione `type CSSProperties` ao import existente.

- [ ] **Step 4: Verificar typecheck**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificar no browser**

No `/catalogo`: carrossel inclui o slide do Dia dos Pais (se `banner-diadospais.webp` existir; se não, a imagem quebra graciosamente — aceitável até Victor subir o arquivo). O CTA-banner âmbar aparece e leva a `/dia-dos-pais`. Nenhum elemento do Dia das Mães aparece.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Catalogo.tsx
git commit -m "feat(campanhas): slide e CTA de campanha no catalogo"
```

---

### Task 9: Remover a página antiga

**Files:**
- Delete: `src/pages/DiaDasMaes.tsx`

- [ ] **Step 1: Confirmar que nada mais importa `DiaDasMaes`**

Run: `git grep -n "DiaDasMaes"`
Expected: apenas referências históricas em `docs/` e no config; **nenhum** import em `src/`. Se aparecer import em `src/`, corrija antes de deletar.

- [ ] **Step 2: Deletar o arquivo**

Run: `git rm src/pages/DiaDasMaes.tsx`

- [ ] **Step 3: Verificar typecheck e build**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(campanhas): remove pagina DiaDasMaes substituida pelo sistema de campanhas"
```

---

### Task 10: Verificação final integrada

**Files:** nenhum (apenas verificação)

- [ ] **Step 1: Typecheck completo**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros.

- [ ] **Step 3: Roteiro de verificação no browser (dev server)**

Confirme cada item:
- [ ] `/dia-dos-pais`: paleta âmbar em todo lugar; produtos são só Masculino/Unissex com promoção ativa; selo mostra `Até X% off` real (ou "Ofertas selecionadas" enquanto carrega/sem produtos); FAQ com textos masculinos; contador de ofertas e "maior off" corretos.
- [ ] `/dia-das-maes`: redireciona para `/catalogo`.
- [ ] Header (desktop): botão "Dia dos Pais" âmbar; sem botão "Dia das Mães".
- [ ] `/catalogo`: CTA-banner âmbar leva a `/dia-dos-pais`; slide no carrossel (se banner existir).
- [ ] Adicionar produto do Dia dos Pais ao carrinho usa o preço promocional (conferir no CartDrawer).

- [ ] **Step 4: Teste do toggle `ativa` (não commitar)**

Temporariamente edite `src/campaigns/diaDosPais.ts` para `ativa: false`, recarregue e confirme: `/dia-dos-pais` redireciona, botão do Header some, CTA/slide do catálogo somem. Depois reverta para `ativa: true`.

Run (reverter): `git checkout src/campaigns/diaDosPais.ts`

---

## Notas de execução

- **Banners:** `banner-diadospais.webp` e `banner-diadospais-MOBILE.webp` ainda não existem em `public/`. A página e o carrossel degradam sem quebrar (imagem ausente). Victor sobe os arquivos depois — nenhuma mudança de código será necessária, pois os caminhos já estão no config.
- **Fora de escopo (não fazer aqui):** cadastro de produto (infra de promoção já serve — basta marcar promoção nos perfumes masculinos no /admin); correção do botão "Quero Encomendar" ausente em `ProdutoDetalhe.tsx` (regressão separada de `5b5cdd4`).
- **`brand-brown`, `emerald`, `amber`, `red`, `stone`, `white`** permanecem como estão nos componentes — são neutros/semânticos, não temáticos por campanha. Só as classes `rose-*` (e os literais `#fff7f8`/`#fff9fa`) migram para `var(--c-*)`.
