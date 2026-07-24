# Campanhas Sazonais + Dia dos Pais — Design

**Data:** 2026-07-24
**Autor:** Victor Benatti (via Claude)
**Status:** Aprovado para planejamento

## Contexto

A Lumi já rodou uma campanha de Dia das Mães, com uma página própria
(`src/pages/DiaDasMaes.tsx`, ~523 linhas) e a funcionalidade de promoção no
cadastro de produto (`promocao_ativa` + `preco_promocao_brl`). Em
`5b5cdd4` ("Remove promo de dia das maes do site") os **pontos de entrada**
foram removidos (rota virou redirect, botão do Header, slide do carrossel e
CTA do catálogo apagados), mas a página em si permaneceu no repositório e a
infra de promoção segue 100% funcional e agnóstica de categoria.

Agora queremos uma campanha de **Dia dos Pais** com foco em perfumes
masculinos. Como esta é a segunda campanha sazonal e haverá outras (Natal,
Black Friday, Dia dos Namorados), a decisão é construir uma **base
reutilizável dirigida por config** em vez de duplicar a página.

## Objetivo

Transformar a página de campanha em um sistema parametrizado onde **criar uma
nova campanha = escrever um arquivo de config**. Entregar o Dia dos Pais como
primeira campanha nova sobre essa base, e migrar o Dia das Mães existente para
o mesmo sistema (visualmente idêntico ao atual).

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Categorias do Dia dos Pais | `Masculino` + `Unissex` (config aceita lista) |
| Banners | Config aponta para `/banner-diadospais(.webp / -MOBILE.webp)`; seção degrada sem quebrar se os arquivos não existirem. Victor sobe depois. |
| Selo de desconto | Calculado do estoque real (`bestDiscount`), com fallback textual do config enquanto carrega / sem produtos |
| Cores | Tokens CSS por campanha (variáveis injetadas no root) |
| Migração Dia das Mães | 1:1 visual, apenas extração |

## Abordagem técnica: cor via tokens CSS

Tailwind v4 (JIT) **não** compila classes montadas em runtime
(`bg-${cor}-800` não funciona). A solução:

- O JSX genérico usa **strings literais** com CSS custom properties:
  `className="bg-[var(--c-accent)] border-[var(--c-border)]"`.
  O JIT enxerga a string e compila.
- A página injeta os valores da paleta como `style` inline no `<div>` raiz:
  ```tsx
  <div style={{
    '--c-accent': palette.accent,
    '--c-accentDeep': palette.accentDeep,
    '--c-bgSoft': palette.bgSoft,
    '--c-bgPage': palette.bgPage,
    '--c-border': palette.border,
    '--c-badgeText': palette.badgeText,
  } as CSSProperties}>
  ```

## Estrutura de arquivos

```
src/campaigns/
  types.ts          → CampaignConfig (contrato)
  diaDosPais.ts     → campanha nova
  diaDasMaes.ts     → campanha atual migrada
  index.ts          → registry + helpers (getCampaign, getActiveCampaigns)
src/pages/
  Campanha.tsx      → página genérica (substitui DiaDasMaes.tsx, que é deletado)
src/components/Campaign/
  CampaignProductCard.tsx  → extraído de MothersDayProductCard, sem cor fixa
```

## Contrato `CampaignConfig`

```ts
import type { FaqItem } from '../components/FaqSection';
import type { LucideIcon } from 'lucide-react';

export type CampaignPalette = {
  accent: string;      // botões, preços, ícones de destaque
  accentDeep: string;  // hover / ênfase
  bgSoft: string;      // fundo de seções suaves
  bgPage: string;      // fundo da página
  border: string;      // bordas de cards/seções
  badgeText: string;   // texto sobre badges claras
};

export type CampaignConfig = {
  slug: string;              // 'dia-dos-pais' → rota /dia-dos-pais
  ativa: boolean;            // liga/desliga rota, botão Header, slide, CTA
  categorias: string[];      // ['Masculino', 'Unissex']
  palette: CampaignPalette;
  header: {
    announceBar: string;
    eyebrow: string;         // "Curadoria Lumi"
    title: string;
    subtitle: string;
    validUntil: string;      // "10/08"
    discountFallback: string;// selo enquanto carrega / sem produtos ("Ofertas selecionadas")
  };
  banner?: { desktop: string; mobile: string; alt: string };
  faq: FaqItem[];
  whatsappHelpText: string;  // texto pré-preenchido do "Ajuda para escolher"
  headerButton: { label: string; icon: LucideIcon };
  gaCategory: string;        // rótulo de evento ReactGA ("Dia dos Pais")
};
```

## Registry e integração

`index.ts`:
```ts
export const campaigns: Record<string, CampaignConfig> = {
  [diaDasMaes.slug]: diaDasMaes,
  [diaDosPais.slug]: diaDosPais,
};
export const getCampaign = (slug: string) => campaigns[slug];
export const getActiveCampaigns = () => Object.values(campaigns).filter(c => c.ativa);
```

Os três pontos de entrada passam a derivar do registry:

- **App.tsx** — para cada campanha em `campaigns`: se `ativa`, rota
  `/{slug}` renderiza `<Campanha slug={slug} />`; se inativa, redireciona para
  `/catalogo`. Mantém `/dia-das-maes` funcionando como redirect quando desligada.
- **Header.tsx** — renderiza um botão por campanha ativa
  (`getActiveCampaigns()`), usando `headerButton.label` e `.icon`.
- **Catalogo.tsx** — slide do carrossel (`heroSlides`) e o CTA-banner voltam,
  gerados a partir das campanhas ativas.

**Ganho:** encerrar campanha = um `ativa: false`, sem tocar múltiplos arquivos
(o que causou a regressão do "Quero Encomendar" em `5b5cdd4`).

## Comportamento da página `Campanha.tsx`

Idêntico ao `DiaDasMaes.tsx` atual, com estas diferenças:

- Recebe `slug` por prop, resolve `config = getCampaign(slug)`.
- Query Supabase: `.in('categoria', config.categorias)` no lugar de
  `.eq('categoria', 'Feminino')`.
- Selo grande exibe `bestDiscount` calculado; enquanto `loading` ou
  `products.length === 0`, exibe `config.header.discountFallback`.
- Todos os textos vêm do config; todas as cores via `var(--c-*)`.
- Banner: renderiza a `<section>` do banner só se `config.banner` existir.
- `ReactGA.event` usa `config.gaCategory`.
- Realtime subscription: filtra client-side por `config.categorias` +
  `hasActivePromotion` (mantém o padrão atual de refetch em qualquer change).

## Config do Dia dos Pais (conteúdo proposto)

```ts
{
  slug: 'dia-dos-pais',
  ativa: true,
  categorias: ['Masculino', 'Unissex'],
  palette: {  // âmbar / tabaco
    accent: '#78350f', accentDeep: '#451a03',
    bgSoft: '#fffbf5', bgPage: '#fffdf9',
    border: '#f5e6d3', badgeText: '#78350f',
  },
  header: {
    announceBar: 'Especial Dia dos Pais • ofertas com estoque limitado',
    eyebrow: 'Curadoria Lumi',
    title: 'Para o pai que é referência.',
    subtitle: 'Uma seleção de fragrâncias masculinas em promoção — presença, caráter e assinatura que ficam.',
    validUntil: '10/08',
    discountFallback: 'Ofertas selecionadas',
  },
  banner: {
    desktop: '/banner-diadospais.webp',
    mobile: '/banner-diadospais-MOBILE.webp',
    alt: 'Campanha Dia dos Pais Lumi Imports',
  },
  faq: [ /* 4 perguntas adaptadas: masculinas / Dia dos Pais */ ],
  whatsappHelpText: 'Olá! Quero ajuda para escolher um presente de Dia dos Pais na Lumi Imports.',
  headerButton: { label: 'Dia dos Pais', icon: /* lucide, ex: Gift ou User */ },
  gaCategory: 'Dia dos Pais',
}
```

## Fora de escopo

- Cadastro de produto (infra de promoção já serve; basta marcar promoção nos
  perfumes masculinos).
- Correção do botão "Quero Encomendar" ausente em `ProdutoDetalhe.tsx`
  (regressão de `5b5cdd4`) — sinalizada à parte.
- Redesenho visual do Dia das Mães (migração é 1:1).

## Verificação

Projeto não tem framework de teste (sem vitest/jest). Verificação:
1. `tsc` typecheck limpo.
2. Dev server + browser: `/dia-dos-pais` (paleta âmbar, produtos Masculino+Unissex
   com promoção, selo com desconto real, FAQ), `/dia-das-maes` (rose intacto),
   botões no Header, slide+CTA no catálogo.
3. Toggle `ativa: false` numa campanha → rota redireciona, botão/slide/CTA somem.
