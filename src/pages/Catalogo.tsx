import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import {
  ArrowRight,
  Filter,
  Flame,
  Gem,
  Gift,
  Package,
  Plane,
  ShoppingBag,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types/supabase';
import ReactGA from 'react-ga4';
import { getProductSalePrice, useCart } from '../contexts/cart';
import { Header } from '../components/Header';
import { FaqSection, type FaqItem } from '../components/FaqSection';
import { ProductCard } from '../components/ProductCard';
import {
  FilterPanel,
  POCKET_COLLECTION_FILTER,
  type CatalogFilters,
} from '../components/FilterPanel';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

type Product = Database['public']['Tables']['produtos']['Row'];

const PRODUCTS_PER_PAGE = 28;
const SEARCH_DEBOUNCE_MS = 250;

const normalizeCatalogValue = (value: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const isPocketCollectionProduct = (product: Product) => {
  const volume = normalizeCatalogValue(product.volume);
  const tipo = normalizeCatalogValue(product.tipo);
  const name = normalizeCatalogValue(product.nome);

  return (
    /\b30\s*ml\b/.test(volume) ||
    tipo.includes('contratipo') ||
    tipo.includes('brand collection') ||
    name.includes('brand collection')
  );
};

type HeroSlide = {
  id: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
  href: string;
  clickable: boolean;
};

const heroSlides: HeroSlide[] = [
  {
    id: 'perfumes-arabes',
    desktopImage: 'banner-geral.webp',
    mobileImage: 'banner-geral-MOBILE.webp',
    alt: 'Banner LUMI Imports com perfumes árabes e importados selecionados',
    href: '#catalogo',
    clickable: true,
  },
  {
    id: 'brand-collection',
    desktopImage: 'banner-brand-collection.webp',
    mobileImage: 'banner-brand-collection-MOBILE.webp',
    alt: 'Perfumes Brand Collection - 30ml',
    href: '#catalogo',
    clickable: true,
  }
];

function PocketPerfumesSection({
  products,
  onAddToCart,
  onViewCollection,
}: {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewCollection: () => void;
}) {
  if (products.length === 0) return null;

  const featuredProducts = products.slice(0, 4);
  const referenceCount = products.filter(product => product.inspirado_em).length;

  return (
    <section className="border-y border-brand-brown/10 bg-white/65 py-6 sm:rounded-2xl sm:border sm:px-5 sm:shadow-[0_10px_35px_rgba(61,43,31,0.04)]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-900 ring-1 ring-amber-100">
              <Gem className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-brown/45">
              Coleção secundária
            </p>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-brand-brown">
            Perfumes de bolso 30ml
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-brand-brown/55 sm:text-sm">
            Contratipos premium em tamanho prático, inspirados em grandes ícones da perfumaria para bolsa, viagem, presente ou teste de fragrância.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onViewCollection}
          className="h-10 w-full rounded-full border-brand-brown/15 bg-white px-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-brown hover:bg-stone-50 sm:w-auto"
        >
          Ver 30ml
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 text-brand-brown/60">
        {[
          { label: 'Bolsa', icon: ShoppingBag },
          { label: 'Viagem', icon: Plane },
          { label: 'Presente', icon: Gift },
        ].map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center justify-center gap-1.5 rounded-full border border-brand-brown/10 bg-[#fcfbf9] px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em]">
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {featuredProducts.map(product => (
          <ProductCard
            key={`pocket-${product.id}`}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {referenceCount > 0 && (
        <p className="mt-4 text-[11px] leading-5 text-brand-brown/45">
          As referências olfativas ajudam a orientar a escolha e não indicam afiliação oficial com marcas citadas.
        </p>
      )}
    </section>
  );
}

const trustMessages = [
  'Produtos 100% Originais',
  'Envio Rastreado para todo o Brasil',
  'Atendimento Personalizado',
];

const catalogFaqItems: FaqItem[] = [
  {
    question: 'Os produtos da Lumi são originais?',
    answer: 'Sim. Trabalhamos com fragrâncias importadas selecionadas e conferidas antes do envio. Se o cliente tiver qualquer dúvida, o atendimento também pode enviar mais detalhes pelo WhatsApp.',
  },
  {
    question: 'Como funciona a compra pelo WhatsApp?',
    answer: 'Você adiciona os perfumes ao carrinho, revisa quantidades e total estimado, e finaliza pelo WhatsApp. A equipe confirma disponibilidade, pagamento e envio antes de fechar o pedido.',
  },
  {
    question: 'A Lumi envia para todo o Brasil?',
    answer: 'Sim. Enviamos com rastreamento para todo o Brasil, e o prazo varia conforme a cidade, modalidade escolhida e confirmação do pagamento.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'O atendimento confirma as opções disponíveis no fechamento do pedido. A operação está evoluindo por etapas para um checkout completo.',
  },
  {
    question: 'Os perfumes árabes são pronta entrega?',
    answer: 'Itens disponíveis aparecem para compra imediata. Quando uma fragrância está esgotada, o catálogo sinaliza isso e permite solicitar uma encomenda pelo WhatsApp para confirmar disponibilidade e prazo.',
  },
];

function TrustTopBar() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((currentIndex) => (currentIndex + 1) % trustMessages.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="h-9 overflow-hidden bg-brand-brown text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={trustMessages[messageIndex]}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="text-[11px] font-bold uppercase tracking-[0.22em] sm:text-xs"
          >
            {trustMessages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const catalogSectionRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [filters, setFilters] = useState<CatalogFilters>({
    search: '',
    categoria: 'Todos',
    tipo: 'Todos',
    precoFaixa: 'Todos',
    ordenacao: 'Mais Vendidos',
  });

  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE_MS);

  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (err) {
      console.error('Erro ao buscar catálogo:', err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  useEffect(() => {
    fetchCatalog();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos' },
        () => fetchCatalog()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentHeroSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  const handleAddToCart = useCallback((product: Product) => {
    const result = addItem(product);

    if (result.added) {
      ReactGA.event({ category: 'Carrinho', action: 'Adicionar Produto', label: product.nome });
    }
  }, [addItem]);

  const pocketCollectionProducts = useMemo(() => {
    return products
      .filter(product => product.estoque > 0 && isPocketCollectionProduct(product))
      .sort((a, b) => getProductSalePrice(a) - getProductSalePrice(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchTerm = normalizeCatalogValue(debouncedSearch);

    const filtered = products.filter(p => {
      const searchableValues = [
        p.nome,
        p.categoria,
        p.tipo,
        p.volume,
        p.inspirado_em,
        p.familia_olfativa,
      ];
      const matchesSearch = searchTerm.length === 0 || searchableValues.some(value =>
        normalizeCatalogValue(value).includes(searchTerm)
      );
      const matchesCategory = filters.categoria === 'Todos' || p.categoria === filters.categoria;
      const matchesTipo = filters.tipo === 'Todos' ||
        (filters.tipo === POCKET_COLLECTION_FILTER ? isPocketCollectionProduct(p) : p.tipo === filters.tipo);

      let matchesPrice = true;
      const preco = getProductSalePrice(p);
      if (filters.precoFaixa === 'Até R$300') matchesPrice = preco <= 300;
      if (filters.precoFaixa === 'R$300 - R$600') matchesPrice = preco > 300 && preco <= 600;
      if (filters.precoFaixa === 'Acima de R$600') matchesPrice = preco > 600;

      return matchesSearch && matchesCategory && matchesTipo && matchesPrice;
    });

    return [...filtered].sort((a, b) => {
      const availableScore = Number(b.estoque > 0) - Number(a.estoque > 0);
      if (availableScore !== 0) return availableScore;

      const priceA = getProductSalePrice(a);
      const priceB = getProductSalePrice(b);

      if (filters.ordenacao === 'Menor Preço') return priceA - priceB;
      if (filters.ordenacao === 'Maior Preço') return priceB - priceA;

      const bestSellerScore = Number(Boolean(b.mais_vendido)) - Number(Boolean(a.mais_vendido));
      if (bestSellerScore !== 0) return bestSellerScore;

      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [debouncedSearch, filters.categoria, filters.tipo, filters.precoFaixa, filters.ordenacao, products]);

  const favoriteProducts = useMemo(() => {
    return filteredProducts.filter(product => product.mais_vendido && product.estoque > 0);
  }, [filteredProducts]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentPageStart = filteredProducts.length === 0
    ? 0
    : ((currentPage - 1) * PRODUCTS_PER_PAGE) + 1;
  const currentPageEnd = Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, filteredProducts]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, Math.min(
      currentPage - Math.floor(maxVisiblePages / 2),
      totalPages - maxVisiblePages + 1
    ));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => setFilters({ ...filters, categoria: 'Todos', tipo: 'Todos', precoFaixa: 'Todos' });

  const setFilterValue = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);

    window.setTimeout(() => {
      catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleHeroClick = (slide: HeroSlide) => {
    if (!slide.clickable) return;

    if (slide.href.startsWith('#')) {
      catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate(slide.href);
  };

  const showPocketCollection = () => {
    setFilters(prev => ({
      ...prev,
      tipo: POCKET_COLLECTION_FILTER,
      ordenacao: 'Menor Preço',
    }));
    setIsMobileFiltersOpen(false);

    window.setTimeout(() => {
      catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-brown selection:text-brand-bg flex flex-col">
      <Header
        searchValue={filters.search}
        onSearchChange={(value) => setFilterValue('search', value)}
        onOpenCategories={() => setIsMobileFiltersOpen(true)}
      />

      <div className="flex flex-1 flex-col pt-[121px] md:pt-[72px]">
        <TrustTopBar />

        <section className="relative border-b border-brand-brown/5 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-brand-brown/10 bg-stone-100 shadow-[0_18px_50px_-35px_rgba(61,43,31,0.45)]">
              <AnimatePresence mode="wait">
                {heroSlides.map((slide, index) => (
                  index === currentHeroSlide && (
                    <motion.button
                      key={slide.id}
                      type="button"
                      onClick={() => handleHeroClick(slide)}
                      initial={{ opacity: 0, scale: 1.015 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.995 }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                      className="block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown/35 focus-visible:ring-offset-2"
                      aria-label={slide.alt}
                    >
                      <picture>
                        <source media="(min-width: 768px)" srcSet={slide.desktopImage} />
                        <img
                          src={slide.mobileImage}
                          alt={slide.alt}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          fetchPriority={index === 0 ? 'high' : 'auto'}
                          className="aspect-[4/5] w-full bg-stone-100 object-cover sm:aspect-[16/7] lg:aspect-[21/8]"
                        />
                      </picture>
                    </motion.button>
                  )
                ))}
              </AnimatePresence>

              <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-2 sm:bottom-4">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentHeroSlide(index)}
                    className={`h-2 rounded-full border border-white/70 shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 ${
                      index === currentHeroSlide
                        ? 'w-7 bg-white'
                        : 'w-2 bg-white/45 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para o banner ${index + 1}`}
                    aria-current={index === currentHeroSlide}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 lg:gap-12">

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 lg:w-64 shrink-0">
          <div className="sticky top-8 bg-white p-6 rounded-[2rem] border border-brand-brown/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)]">
            <h2 className="text-lg font-semibold text-brand-brown flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-brand-brown/50" /> Filtros
            </h2>
            <FilterPanel filters={filters} onChange={setFilterValue} onClear={clearFilters} />
          </div>
        </aside>

        {/* Mobile Filters Drawer */}
        <AnimatePresence>
          {isMobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFiltersOpen(false)}
                className="fixed inset-0 bg-brand-brown/40 backdrop-blur-sm z-50 md:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-white shadow-2xl z-50 md:hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-brand-brown/10 bg-[#fdfbf9]">
                  <h2 className="text-lg font-semibold text-brand-brown flex items-center gap-2">
                    <Filter className="w-5 h-5 text-brand-brown/50" /> Filtros
                  </h2>
                  <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 -mr-2 bg-white rounded-full shadow-sm border border-brand-brown/5 text-brand-brown/50 hover:text-brand-brown">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <FilterPanel filters={filters} onChange={setFilterValue} onClear={clearFilters} />
                </div>
                <div className="p-6 border-t border-brand-brown/10 bg-[#fdfbf9]">
                  <Button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="w-full bg-brand-brown hover:bg-[#2A1D15] text-white py-6 rounded-2xl text-base font-medium shadow-md"
                  >
                    Ver Resultados ({filteredProducts.length})
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col h-full bg-white rounded-2xl p-1.5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-brand-brown/5">
                  <div className="aspect-[3/4] bg-stone-100/80 rounded-xl animate-pulse w-full mb-2"></div>
                  <div className="px-2 pb-2 flex flex-col gap-2">
                    <div className="h-2.5 w-1/3 bg-stone-100 animate-pulse rounded-full"></div>
                    <div className="h-3.5 w-4/5 bg-stone-100 animate-pulse rounded-full"></div>
                    <div className="h-5 w-1/2 bg-stone-100 animate-pulse rounded-full mt-1"></div>
                    <div className="h-8 w-full bg-stone-100 animate-pulse rounded-xl mt-1"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2rem] border border-brand-brown/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)] h-full">
              <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-brand-brown/20" />
              </div>
              <h3 className="text-2xl font-light text-brand-brown mb-2">Nenhuma fragrância encontrada</h3>
              <p className="text-brand-brown/50 max-w-md font-light">Não localizamos nenhum produto com esses filtros. Tente remover alguns critérios.</p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-8 rounded-full px-8 border-brand-brown/20 text-brand-brown hover:bg-stone-50"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              <PocketPerfumesSection
                products={pocketCollectionProducts}
                onAddToCart={handleAddToCart}
                onViewCollection={showPocketCollection}
              />

              {/* Seção Mais Vendidos - Apenas se Favoritos estiverem nos resultados filtrados */}
              {favoriteProducts.length > 0 && (
                <section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <Flame className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-brand-brown tracking-tight">Os Favoritos da Lumi</h2>
                      <p className="text-brand-brown/50 text-xs">As fragrâncias mais desejadas.</p>
                    </div>
                  </div>
                  <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-3 sm:gap-4 snap-x snap-mandatory scrollbar-hide">
                    {favoriteProducts.map(product => (
                      <div key={`fav-${product.id}`} className="min-w-[160px] sm:min-w-[220px] max-w-[220px] snap-center shrink-0">
                        <ProductCard product={product} onAddToCart={handleAddToCart} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Catálogo Completo */}
              <section id="catalogo" ref={catalogSectionRef} className="scroll-mt-32">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-medium text-brand-brown tracking-tight">
                      Catálogo Completo
                    </h2>
                    <span className="text-xs text-brand-brown/50 font-medium">
                      {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
                    </span>
                  </div>
                  {filteredProducts.length > 0 && (
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-brown/40">
                      {currentPageStart}-{currentPageEnd} de {filteredProducts.length}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={`all-${product.id}`} product={product} onAddToCart={handleAddToCart} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  visiblePageNumbers={visiblePageNumbers}
                  onPageChange={goToPage}
                />
              </section>
            </div>
          )}
        </div>
        </main>

        <section className="bg-brand-bg px-4 pb-14 pt-2 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <FaqSection
              eyebrow="Dúvidas frequentes"
              title="Comprar na Lumi"
              description="Respostas rápidas para comprar com mais segurança e fechar seu pedido sem fricção."
              items={catalogFaqItems}
            />
          </div>
        </section>

      </div>
    </div>
  );
}
