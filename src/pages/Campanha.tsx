import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgePercent,
  Calendar,
  Gift,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import ReactGA from 'react-ga4';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Header } from '../components/Header';
import { FaqSection } from '../components/FaqSection';
import {
  CampaignProductCard,
  discountPercentage,
} from '../components/Campaign/CampaignProductCard';
import type { Database } from '../types/supabase';
import { WHATSAPP_NUMBER, hasActivePromotion, useCart } from '../contexts/cart';
import { getCampaign } from '../campaigns';

type Product = Database['public']['Tables']['produtos']['Row'];

export default function Campanha({ slug }: { slug: string }) {
  const config = getCampaign(slug);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config) navigate('/catalogo', { replace: true });
  }, [config, navigate]);

  useEffect(() => {
    if (!config) return;

    const fetchCampaignProducts = async () => {
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
      } catch (error) {
        console.error(`Erro ao buscar ofertas de ${config.gaCategory}:`, error);
        setProducts([]);
      } finally {
        setTimeout(() => setLoading(false), 450);
      }
    };

    fetchCampaignProducts();

    const channel = supabase
      .channel(`campaign-${config.slug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos' },
        () => fetchCampaignProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config]);

  const bestDiscount = useMemo(
    () => products.reduce((best, product) => Math.max(best, discountPercentage(product)), 0),
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

  const whatsappHelpUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    config.whatsappHelpText
  )}`;

  const handleAddToCart = (product: Product) => {
    const result = addItem(product);

    if (result.added) {
      ReactGA.event({ category: config.gaCategory, action: 'Adicionar Produto', label: product.nome });
    }
  };

  const openGiftHelp = () => {
    window.open(whatsappHelpUrl, '_blank');
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div
      style={paletteStyle}
      className="min-h-screen bg-[var(--c-bgPage)] font-sans text-brand-brown selection:bg-[var(--c-accent)] selection:text-white"
    >
      <Header />

      <div className="flex min-h-screen flex-col pt-[121px] md:pt-[72px]">
        <div className="border-b border-[var(--c-border)]/70 bg-[var(--c-accent)] text-white">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
              {config.header.announceBar}
            </p>
          </div>
        </div>

        {config.banner && (
          <section className="border-b border-[var(--c-border)] bg-white">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <picture>
                <source media="(min-width: 768px)" srcSet={config.banner.desktop} />
                <img
                  src={config.banner.mobile}
                  alt={config.banner.alt}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full rounded-[1.75rem] border border-[var(--c-border)] object-cover shadow-[0_18px_50px_-35px_rgba(135,65,85,0.45)]"
                />
              </picture>
            </div>
          </section>
        )}

        <section className="relative overflow-hidden border-b border-[var(--c-border)]/70 bg-[var(--c-bgSoft)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--c-bgSoft)_0%,#ffffff_48%,#f8e2e7_100%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--c-accent)] to-transparent" />

          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                className="mb-7 flex w-max items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--c-badgeText)]/60 transition-colors hover:text-[var(--c-accentDeep)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Catálogo
              </button>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="flex w-max items-center gap-2 rounded-full border border-[var(--c-border)] bg-white/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--c-badgeText)] shadow-sm">
                  <Gift className="h-3.5 w-3.5 text-[var(--c-accent)]" />
                  {config.header.eyebrow}
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.02] text-brand-brown sm:text-5xl md:text-6xl">
                    {config.header.title}
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-brand-brown/60 sm:text-base">
                    {config.header.subtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => scrollToSection('presentes')}
                    className="h-12 w-full rounded-full bg-[var(--c-accent)] px-6 text-sm font-bold text-white shadow-[0_16px_32px_rgba(159,70,95,0.22)] hover:bg-[var(--c-accentDeep)] sm:w-auto"
                  >
                    <Heart className="h-4 w-4" />
                    Ver presentes
                  </Button>
                  <Button
                    type="button"
                    onClick={openGiftHelp}
                    variant="outline"
                    className="h-12 rounded-full border-[var(--c-border)] bg-white/80 px-6 text-sm font-bold text-[var(--c-badgeText)] hover:bg-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Ajuda para escolher
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center">
              <div className="w-full rounded-[2rem] border border-[var(--c-border)]/80 bg-white/75 p-5 shadow-[0_24px_70px_rgba(135,65,85,0.12)] backdrop-blur-sm sm:p-6">
                <div className="rounded-[1.5rem] border border-[var(--c-border)] bg-[var(--c-bgPage)] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--c-accent)] text-white shadow-[0_12px_28px_rgba(159,70,95,0.22)]">
                      <BadgePercent className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-[var(--c-border)] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--c-badgeText)]">
                      Tempo limitado
                    </span>
                  </div>

                  <div className="mt-7 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--c-badgeText)]/50">
                      Campanha {config.gaCategory}
                    </p>
                    <div className="space-y-1">
                      <p className="text-5xl font-extrabold leading-none tracking-tight text-[var(--c-accent)] sm:text-6xl">
                        {loading || products.length === 0
                          ? config.header.discountFallback
                          : `Até ${bestDiscount}% off`}
                      </p>
                      <p className="text-sm font-medium leading-6 text-brand-brown/60">
                        Em produtos selecionados da curadoria feminina Lumi.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-white px-4 py-3">
                      <Calendar className="h-5 w-5 text-[var(--c-accent)]" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-brown/40">
                          Válida até
                        </p>
                        <p className="text-sm font-bold text-brand-brown">{config.header.validUntil}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-white px-4 py-3">
                      <Sparkles className="h-5 w-5 text-[var(--c-accent)]" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-brown/40">
                          Seleção
                        </p>
                        <p className="text-sm font-bold text-brand-brown">Estoque limitado</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 border-t border-[var(--c-border)] pt-4 text-xs font-medium leading-5 text-brand-brown/55">
                    Os valores promocionais aparecem nos cards, no detalhe do produto e no carrinho ao finalizar pelo WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--c-border)] bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bgPage)] px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-brown/60">
                Originais selecionados
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bgPage)] px-4 py-3">
              <Truck className="h-5 w-5 text-[var(--c-accent)]" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-brown/60">
                Envio rastreado
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-bgPage)] px-4 py-3">
              <Star className="h-5 w-5 text-amber-700" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-brown/60">
                Atendimento personalizado
              </span>
            </div>
          </div>
        </section>

        <main className="flex-1">
          <section id="presentes" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--c-bgSoft)] text-[var(--c-accent)]">
                    <BadgePercent className="h-4 w-4" />
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--c-badgeText)]/50">
                    Preços especiais
                  </p>
                </div>
                <h2 className="text-2xl font-bold text-brand-brown sm:text-3xl">
                  Seleção {config.gaCategory}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-brown/50">
                  Fragrâncias femininas com preço promocional destacado para escolher sem pressa e finalizar pelo WhatsApp.
                </p>
              </div>

              <div className="flex w-full gap-3 sm:w-auto">
                <div className="flex-1 rounded-2xl border border-[var(--c-border)] bg-white px-4 py-3 text-center sm:min-w-32">
                  <p className="text-xl font-extrabold text-[var(--c-accent)]">{products.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-brown/40">
                    ofertas
                  </p>
                </div>
                <div className="flex-1 rounded-2xl border border-[var(--c-border)] bg-white px-4 py-3 text-center sm:min-w-32">
                  <p className="text-xl font-extrabold text-[var(--c-accent)]">{bestDiscount}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-brown/40">
                    maior off
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="flex h-full flex-col rounded-2xl border border-[var(--c-border)] bg-white p-1.5 shadow-sm"
                  >
                    <div className="mb-2 aspect-[3/4] w-full animate-pulse rounded-xl bg-[var(--c-bgSoft)]/70" />
                    <div className="space-y-2 px-2 pb-3">
                      <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-[var(--c-bgSoft)]" />
                      <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-[var(--c-bgSoft)]" />
                      <div className="h-5 w-1/2 animate-pulse rounded-full bg-[var(--c-bgSoft)]" />
                      <div className="h-8 w-full animate-pulse rounded-xl bg-[var(--c-bgSoft)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
                {products.map((product) => (
                  <CampaignProductCard
                    key={product.id}
                    product={product}
                    badgeLabel={config.headerButton.label}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-[var(--c-border)] bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--c-bgSoft)]">
                  <Gift className="h-8 w-8 text-[var(--c-accent)]/45" />
                </div>
                <h3 className="text-2xl font-light text-brand-brown">Ofertas em preparação</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-brown/50">
                  Assim que os produtos femininos estiverem com promoção ativa, eles aparecem automaticamente nesta página.
                </p>
                <Button
                  type="button"
                  onClick={() => navigate('/catalogo')}
                  variant="outline"
                  className="mt-7 rounded-full border-[var(--c-border)] px-6 text-[var(--c-badgeText)] hover:bg-[var(--c-bgSoft)]"
                >
                  Ver catálogo completo
                </Button>
              </div>
            )}
          </section>

          <section className="bg-white px-4 pb-14 pt-2 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <FaqSection
                eyebrow="Dúvidas rápidas"
                title={`Presentes de ${config.gaCategory}`}
                description="Detalhes para comprar com tranquilidade e confirmar tudo pelo atendimento Lumi."
                items={config.faq}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
