import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgePercent,
  Calendar,
  CreditCard,
  Gift,
  Heart,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import ReactGA from 'react-ga4';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Header } from '../components/Header';
import { FaqSection, type FaqItem } from '../components/FaqSection';
import type { Database } from '../types/supabase';
import { calculateInstallment } from '../utils/finance';
import {
  formatBRL,
  getProductRegularPrice,
  getProductSalePrice,
  hasActivePromotion,
  useCart,
} from '../contexts/cart';

type Product = Database['public']['Tables']['produtos']['Row'];

const WHATSAPP_GIFT_HELP_URL =
  'https://wa.me/5519997884533?text=Ol%C3%A1!%20Quero%20ajuda%20para%20escolher%20um%20presente%20de%20Dia%20das%20M%C3%A3es%20na%20Lumi%20Imports.';

const mothersDayFaqItems: FaqItem[] = [
  {
    question: 'Os valores promocionais aparecem no carrinho?',
    answer: 'Sim. Quando a promoção está ativa no produto, o carrinho usa o valor promocional e envia esse preço no pedido pelo WhatsApp.',
  },
  {
    question: 'As ofertas são somente para perfumes femininos?',
    answer: 'Esta curadoria foi pensada para fragrâncias femininas com promoção ativa, estoque disponível e perfil de presente.',
  },
  {
    question: 'O produto fica reservado ao adicionar no carrinho?',
    answer: 'A reserva é confirmada pelo atendimento no WhatsApp. Como o estoque é limitado, a equipe confirma disponibilidade antes de fechar o pedido.',
  },
  {
    question: 'A Lumi ajuda a escolher o presente?',
    answer: 'Sim. Você pode chamar no WhatsApp para receber uma indicação conforme estilo, intensidade, ocasião e faixa de valor.',
  },
];

const discountPercentage = (product: Product) => {
  const regularPrice = getProductRegularPrice(product);
  const salePrice = getProductSalePrice(product);

  if (regularPrice <= 0 || salePrice >= regularPrice) return 0;

  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

function MothersDayProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
}) {
  const navigate = useNavigate();
  const { getItemQuantity } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);

  const regularPrice = getProductRegularPrice(product);
  const salePrice = getProductSalePrice(product);
  const installmentValue = calculateInstallment(salePrice);
  const discount = discountPercentage(product);
  const cartQuantity = getItemQuantity(product.id);
  const reachedStockLimit = cartQuantity >= product.estoque;
  const isLowStock = product.estoque <= 2;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-rose-100 bg-white shadow-[0_8px_28px_rgba(135,65,85,0.08)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(135,65,85,0.14)]">
      <div
        className="cursor-pointer p-1.5"
        onClick={() => navigate(`/produto/${product.id}`)}
      >
        <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl bg-[#fff7f8]">
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
            <span className="flex w-max items-center gap-1 rounded-full bg-rose-800 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
              <Heart className="h-2.5 w-2.5" />
              Mães
            </span>
            {discount > 0 && (
              <span className="w-max rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-rose-800 shadow-sm">
                {discount}% off
              </span>
            )}
          </div>

          {isLowStock && (
            <span className="absolute right-2 top-2 z-10 rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-red-800 shadow-sm">
              Últimas un.
            </span>
          )}

          {product.imagem_url ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-rose-100/60" />}
              <img
                src={product.imagem_url}
                alt={product.nome}
                onLoad={() => setImageLoaded(true)}
                className={`h-full w-full object-cover transition-transform duration-700 ${
                  imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <Package className="h-10 w-10 text-rose-900/15" />
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(`/produto/${product.id}`)}
          className="flex flex-1 flex-col text-left"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-rose-900/50">
              {product.familia_olfativa || product.categoria || 'Fragrância'}
            </p>
            {product.volume && (
              <>
                <span className="text-[7px] text-rose-900/25">•</span>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-rose-900/50">
                  {product.volume}
                </p>
              </>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-brand-brown transition-colors group-hover:text-rose-900">
            {product.nome}
          </h3>
          {product.ocasiao && (
            <p className="mt-1 line-clamp-1 text-[10px] font-medium text-brand-brown/50">
              {product.ocasiao}
            </p>
          )}
        </button>

        <div className="mt-3 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[11px] font-semibold text-brand-brown/35 line-through decoration-rose-700/70">
              {formatBRL(regularPrice)}
            </span>
            <span className="text-xl font-extrabold text-rose-800">
              {formatBRL(salePrice)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-brand-brown/50">
            <CreditCard className="h-3 w-3 opacity-60" />
            <span>12x de {formatBRL(installmentValue)}</span>
          </div>
        </div>

        <Button
          onClick={() => onAddToCart(product)}
          disabled={product.estoque <= 0 || reachedStockLimit}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-800 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-rose-950 hover:shadow-md disabled:bg-stone-200 disabled:text-stone-500"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {reachedStockLimit ? 'No carrinho' : 'Adicionar'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DiaDasMaes() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMothersDayProducts = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .gt('estoque', 0)
          .eq('categoria', 'Feminino')
          .eq('promocao_ativa', true)
          .not('preco_promocao_brl', 'is', null)
          .order('mais_vendido', { ascending: false, nullsFirst: false })
          .order('nome', { ascending: true });

        if (error) throw error;
        setProducts((data ?? []).filter(hasActivePromotion));
      } catch (error) {
        console.error('Erro ao buscar ofertas de Dia das Mães:', error);
        setProducts([]);
      } finally {
        setTimeout(() => setLoading(false), 450);
      }
    };

    fetchMothersDayProducts();

    const channel = supabase
      .channel('mothers-day-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos' },
        () => fetchMothersDayProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const bestDiscount = useMemo(
    () => products.reduce((best, product) => Math.max(best, discountPercentage(product)), 0),
    [products]
  );

  const handleAddToCart = (product: Product) => {
    const result = addItem(product);

    if (result.added) {
      ReactGA.event({ category: 'Dia das Mães', action: 'Adicionar Produto', label: product.nome });
    }
  };

  const openGiftHelp = () => {
    window.open(WHATSAPP_GIFT_HELP_URL, '_blank');
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-[#fff9fa] font-sans text-brand-brown selection:bg-rose-800 selection:text-white">
      <Header />

      <div className="flex min-h-screen flex-col pt-[121px] md:pt-[72px]">
        <div className="border-b border-rose-200/70 bg-rose-900 text-white">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
              Especial Dia das Mães • ofertas com estoque limitado
            </p>
          </div>
        </div>

        <section className="border-b border-rose-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <picture>
              <source media="(min-width: 768px)" srcSet="/banner-diadasmaes.webp" />
              <img
                src="/banner-diadasmaes-MOBILE.webp"
                alt="Campanha Dia das Mães Lumi Imports"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full rounded-[1.75rem] border border-rose-100 object-cover shadow-[0_18px_50px_-35px_rgba(135,65,85,0.45)]"
              />
            </picture>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-rose-200/70 bg-[#fff7f8]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff7f8_0%,#ffffff_48%,#f8e2e7_100%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" />

          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                className="mb-7 flex w-max items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-900/60 transition-colors hover:text-rose-950"
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
                <div className="flex w-max items-center gap-2 rounded-full border border-rose-200 bg-white/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-900 shadow-sm">
                  <Gift className="h-3.5 w-3.5 text-rose-700" />
                  Curadoria Lumi
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.02] text-brand-brown sm:text-5xl md:text-6xl">
                    Presentes que ficam na memória.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-brand-brown/60 sm:text-base">
                    Uma seleção rose de fragrâncias femininas em promoção para celebrar presença, carinho e sofisticação.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => scrollToSection('presentes')}
                    className="h-12 w-full rounded-full bg-rose-800 px-6 text-sm font-bold text-white shadow-[0_16px_32px_rgba(159,70,95,0.22)] hover:bg-rose-950 sm:w-auto"
                  >
                    <Heart className="h-4 w-4" />
                    Ver presentes
                  </Button>
                  <Button
                    type="button"
                    onClick={openGiftHelp}
                    variant="outline"
                    className="h-12 rounded-full border-rose-200 bg-white/80 px-6 text-sm font-bold text-rose-900 hover:bg-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Ajuda para escolher
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center">
              <div className="w-full rounded-[2rem] border border-rose-200/80 bg-white/75 p-5 shadow-[0_24px_70px_rgba(135,65,85,0.12)] backdrop-blur-sm sm:p-6">
                <div className="rounded-[1.5rem] border border-rose-100 bg-[#fff9fa] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-800 text-white shadow-[0_12px_28px_rgba(159,70,95,0.22)]">
                      <BadgePercent className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-900">
                      Tempo limitado
                    </span>
                  </div>

                  <div className="mt-7 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-900/50">
                      Campanha Dia das Mães
                    </p>
                    <div className="space-y-1">
                      <p className="text-5xl font-extrabold leading-none tracking-tight text-rose-800 sm:text-6xl">
                        Até 30% off
                      </p>
                      <p className="text-sm font-medium leading-6 text-brand-brown/60">
                        Em produtos selecionados da curadoria feminina Lumi.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-3">
                      <Calendar className="h-5 w-5 text-rose-800" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-brown/40">
                          Válida até
                        </p>
                        <p className="text-sm font-bold text-brand-brown">10/05</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-3">
                      <Sparkles className="h-5 w-5 text-rose-800" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-brown/40">
                          Seleção
                        </p>
                        <p className="text-sm font-bold text-brand-brown">Estoque limitado</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 border-t border-rose-100 pt-4 text-xs font-medium leading-5 text-brand-brown/55">
                    Os valores promocionais aparecem nos cards, no detalhe do produto e no carrinho ao finalizar pelo WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-rose-100 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-[#fff9fa] px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-brown/60">
                Originais selecionados
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-[#fff9fa] px-4 py-3">
              <Truck className="h-5 w-5 text-rose-800" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-brown/60">
                Envio rastreado
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-[#fff9fa] px-4 py-3">
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
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-800">
                    <BadgePercent className="h-4 w-4" />
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-900/50">
                    Preços especiais
                  </p>
                </div>
                <h2 className="text-2xl font-bold text-brand-brown sm:text-3xl">
                  Seleção Dia das Mães
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-brown/50">
                  Fragrâncias femininas com preço promocional destacado para escolher sem pressa e finalizar pelo WhatsApp.
                </p>
              </div>

              <div className="flex w-full gap-3 sm:w-auto">
                <div className="flex-1 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-center sm:min-w-32">
                  <p className="text-xl font-extrabold text-rose-800">{products.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-brown/40">
                    ofertas
                  </p>
                </div>
                <div className="flex-1 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-center sm:min-w-32">
                  <p className="text-xl font-extrabold text-rose-800">{bestDiscount}%</p>
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
                    className="flex h-full flex-col rounded-2xl border border-rose-100 bg-white p-1.5 shadow-sm"
                  >
                    <div className="mb-2 aspect-[3/4] w-full animate-pulse rounded-xl bg-rose-100/70" />
                    <div className="space-y-2 px-2 pb-3">
                      <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-rose-100" />
                      <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-rose-100" />
                      <div className="h-5 w-1/2 animate-pulse rounded-full bg-rose-100" />
                      <div className="h-8 w-full animate-pulse rounded-xl bg-rose-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
                {products.map((product) => (
                  <MothersDayProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-rose-100 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
                  <Gift className="h-8 w-8 text-rose-800/45" />
                </div>
                <h3 className="text-2xl font-light text-brand-brown">Ofertas em preparação</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-brown/50">
                  Assim que os produtos femininos estiverem com promoção ativa, eles aparecem automaticamente nesta página.
                </p>
                <Button
                  type="button"
                  onClick={() => navigate('/catalogo')}
                  variant="outline"
                  className="mt-7 rounded-full border-rose-200 px-6 text-rose-900 hover:bg-rose-50"
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
                title="Presentes de Dia das Mães"
                description="Detalhes para comprar com tranquilidade e confirmar tudo pelo atendimento Lumi."
                items={mothersDayFaqItems}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
