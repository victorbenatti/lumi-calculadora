import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, BadgePercent, Package, CreditCard, ShoppingBag, Sparkles, ChevronDown, ChevronLeft, ChevronRight, Star, Flame, Filter, DollarSign, Globe, X, Gem, Gift, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types/supabase';
import { calculateInstallment } from '../utils/finance';
import ReactGA from 'react-ga4';
import { formatBRL, getProductRegularPrice, getProductSalePrice, hasActivePromotion, useCart } from '../contexts/cart';
import { Header } from '../components/Header';
import { FaqSection, type FaqItem } from '../components/FaqSection';

type Product = Database['public']['Tables']['produtos']['Row'];
type SortOption = 'Mais Vendidos' | 'Menor Preço' | 'Maior Preço';
type CatalogFilters = {
  search: string;
  categoria: string;
  tipo: string;
  precoFaixa: string;
  ordenacao: SortOption;
};

const PRODUCTS_PER_PAGE = 28;
const POCKET_COLLECTION_FILTER = 'Brand Collection 30ml';

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
    id: 'dia-das-maes',
    desktopImage: 'banner-diadasmaes.webp',
    mobileImage: 'banner-diadasmaes-MOBILE.webp',
    alt: 'Promoção de Dia das Mães da LUMI Imports com perfumes com 30% off',
    href: '/dia-das-maes',
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

// Componente individual de Card para gerenciar o estado 'expanded'
function ProductCard({ product, handleAddToCart }: { product: Product, handleAddToCart: (product: Product) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const { getItemQuantity } = useCart();

  const precoVenda = getProductSalePrice(product);
  const regularPrice = getProductRegularPrice(product);
  const isPromotion = hasActivePromotion(product);
  const installmentValue = calculateInstallment(precoVenda);
  const isLowStock = product.estoque <= 2;
  const cartQuantity = getItemQuantity(product.id);
  const reachedStockLimit = cartQuantity >= product.estoque;
  
  // Verifica se o produto tem dados de IA para exibir o botão expansível
  const hasAI = !!product.notas_topo || !!product.descricao_ia || !!product.familia_olfativa;

  return (
    <Card className="border border-brand-brown/5 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgb(61,43,31,0.08)] transition-all duration-500 flex flex-col h-full rounded-2xl group overflow-hidden">
      <div 
        className="p-1.5 cursor-pointer"
        onClick={() => navigate(`/produto/${product.id}`)}
      >
        <div className="aspect-[3/4] w-full bg-[#fcfbf9] rounded-xl overflow-hidden relative flex items-center justify-center">
          {isLowStock && (
            <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
              <span className="text-[8px] font-bold tracking-widest uppercase text-red-800">
                Últimas un.
              </span>
            </div>
          )}
          {product.mais_vendido && (
            <div className="absolute top-2 left-2 z-10 bg-emerald-600/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-white" />
              <span className="text-[8px] font-bold tracking-wider uppercase text-white">
                Top
              </span>
            </div>
          )}

          {product.imagem_url ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 bg-stone-100 animate-pulse" />}
              <img 
                src={product.imagem_url} 
                alt={product.nome} 
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                onLoad={() => setImageLoaded(true)}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  imageLoaded ? 'opacity-100 scale-100 group-hover:scale-105' : 'opacity-0 scale-95'
                }`}
              />
            </>
          ) : (
            <Package className="h-10 w-10 text-brand-brown/10" />
          )}
        </div>
      </div>
      
      <CardContent className="px-3 pb-3 pt-2 flex flex-col flex-grow">
        <div 
          className="flex-grow cursor-pointer"
          onClick={() => navigate(`/produto/${product.id}`)}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-[9px] uppercase tracking-[0.15em] text-brand-brown/40 font-bold">
              {product.categoria || 'Fragrância'}
            </p>
            {product.volume && (
              <>
                <span className="text-[7px] text-brand-brown/25">•</span>
                <p className="text-[9px] uppercase tracking-[0.15em] text-brand-brown/40 font-bold">
                  {product.volume}
                </p>
              </>
            )}
          </div>
          <h3 className="font-semibold text-sm text-brand-brown leading-snug group-hover:text-amber-900 transition-colors line-clamp-2">
            {product.nome}
          </h3>
        </div>

        {hasAI && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="flex items-center gap-1 mt-2 text-[10px] text-brand-brown/40 hover:text-brand-brown/70 font-medium transition-colors focus:outline-none"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isExpanded ? 'Ocultar' : 'Detalhes'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}

        <AnimatePresence>
          {isExpanded && hasAI && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-1 space-y-2 border-t border-brand-brown/5 mt-2">
                <div className="flex flex-wrap gap-1">
                  {product.familia_olfativa && (
                    <span className="bg-brand-brown/5 text-brand-brown px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> {product.familia_olfativa}
                    </span>
                  )}
                  {product.ocasiao && (
                    <span className="bg-brand-brown/5 text-brand-brown px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase">
                      {product.ocasiao}
                    </span>
                  )}
                </div>
                
                {product.descricao_ia && (
                  <p className="text-[10px] text-brand-brown/60 italic leading-relaxed border-l-2 border-brand-brown/10 pl-2 line-clamp-3">
                    "{product.descricao_ia}"
                  </p>
                )}
                
                {(product.notas_topo || product.notas_coracao || product.notas_fundo) && (
                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-brand-brown/5">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[8px] uppercase tracking-widest text-brand-brown/40 font-bold">Topo</span>
                      <span className="text-[10px] text-brand-brown leading-tight">{product.notas_topo || '-'}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[8px] uppercase tracking-widest text-brand-brown/40 font-bold">Coração</span>
                      <span className="text-[10px] text-brand-brown leading-tight">{product.notas_coracao || '-'}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[8px] uppercase tracking-widest text-brand-brown/40 font-bold">Fundo</span>
                      <span className="text-[10px] text-brand-brown leading-tight">{product.notas_fundo || '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-2 flex flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {isPromotion && (
              <span className="text-[11px] font-semibold text-brand-brown/35 line-through decoration-rose-700/60">
                {formatBRL(regularPrice)}
              </span>
            )}
            <span className={`text-lg font-bold ${isPromotion ? 'text-rose-800' : 'text-brand-brown'}`}>
              {formatBRL(precoVenda)}
            </span>
          </div>
          {isPromotion && (
            <span className="w-max rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-rose-800">
              Promo
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] text-brand-brown/50 font-medium">
            <CreditCard className="w-3 h-3 opacity-60" />
            <span>12x de {formatBRL(installmentValue)}</span>
          </div>
        </div>
        
        <Button 
          onClick={() => handleAddToCart(product)}
          disabled={product.estoque <= 0 || reachedStockLimit}
          className="w-full mt-3 bg-brand-brown hover:bg-[#2A1D15] text-white rounded-xl py-2.5 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-300 disabled:bg-stone-200 disabled:text-stone-500 disabled:shadow-none"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {reachedStockLimit ? 'No carrinho' : 'Adicionar ao Carrinho'}
        </Button>
      </CardContent>
    </Card>
  );
}

function PocketPerfumesSection({
  products,
  handleAddToCart,
  onViewCollection,
}: {
  products: Product[];
  handleAddToCart: (product: Product) => void;
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
            handleAddToCart={handleAddToCart}
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
    answer: 'O catálogo exibe apenas itens com estoque positivo. Ainda assim, a reserva acontece somente após confirmação no atendimento, porque algumas unidades podem sair rapidamente.',
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

  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .gt('estoque', 0)
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

  const handleAddToCart = (product: Product) => {
    const result = addItem(product);

    if (result.added) {
      ReactGA.event({ category: 'Carrinho', action: 'Adicionar Produto', label: product.nome });
    }
  };

  const pocketCollectionProducts = useMemo(() => {
    return products
      .filter(isPocketCollectionProduct)
      .sort((a, b) => getProductSalePrice(a) - getProductSalePrice(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const searchTerm = normalizeCatalogValue(filters.search);
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
      const priceA = getProductSalePrice(a);
      const priceB = getProductSalePrice(b);

      if (filters.ordenacao === 'Menor Preço') return priceA - priceB;
      if (filters.ordenacao === 'Maior Preço') return priceB - priceA;

      const bestSellerScore = Number(Boolean(b.mais_vendido)) - Number(Boolean(a.mais_vendido));
      if (bestSellerScore !== 0) return bestSellerScore;

      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [filters, products]);

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

  const hasActiveFilters = filters.categoria !== 'Todos' || filters.tipo !== 'Todos' || filters.precoFaixa !== 'Todos';

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

  const tipoFilterOptions = ['Todos', 'Importado', 'Árabe', POCKET_COLLECTION_FILTER];

  const filterContent = (
    <div className="space-y-8">
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="w-full border-brand-brown/20 text-brand-brown/70 hover:bg-stone-50 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-xl h-10"
        >
          <X className="w-3 h-3" /> Limpar Filtros
        </Button>
      )}

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Flame className="w-3.5 h-3.5" /> Ordenar
        </h3>
        <select
          value={filters.ordenacao}
          onChange={(event) => setFilterValue('ordenacao', event.target.value as SortOption)}
          className="h-11 w-full rounded-xl border border-brand-brown/10 bg-white px-3 text-sm font-semibold text-brand-brown shadow-sm outline-none transition-colors focus:border-brand-brown/30 focus:ring-2 focus:ring-brand-brown/10"
        >
          {(['Mais Vendidos', 'Menor Preço', 'Maior Preço'] as SortOption[]).map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="h-px bg-brand-brown/5 w-full"></div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" /> Categoria
        </h3>
        <div className="flex flex-col gap-3">
          {['Todos', 'Masculino', 'Feminino', 'Unissex'].map(cat => (
            <button key={cat} onClick={() => setFilterValue('categoria', cat)} className="flex items-center gap-3 cursor-pointer group text-left">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.categoria === cat ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.categoria === cat && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-sm ${filters.categoria === cat ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-brand-brown/5 w-full"></div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" /> Origem e Linha
        </h3>
        <div className="flex flex-col gap-3">
          {tipoFilterOptions.map(tipo => (
            <button key={tipo} onClick={() => setFilterValue('tipo', tipo)} className="flex items-center gap-3 cursor-pointer group text-left">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.tipo === tipo ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.tipo === tipo && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-sm ${filters.tipo === tipo ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{tipo}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-brand-brown/5 w-full"></div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-brown/50 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" /> Faixa de Preço
        </h3>
        <div className="flex flex-col gap-3">
          {['Todos', 'Até R$300', 'R$300 - R$600', 'Acima de R$600'].map(faixa => (
            <button key={faixa} onClick={() => setFilterValue('precoFaixa', faixa)} className="flex items-center gap-3 cursor-pointer group text-left">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.precoFaixa === faixa ? 'border-brand-brown bg-brand-brown' : 'border-brand-brown/30 group-hover:border-brand-brown/60'}`}>
                {filters.precoFaixa === faixa && <div className="w-1.5 h-1.5 bg-brand-bg rounded-full" />}
              </div>
              <span className={`text-sm ${filters.precoFaixa === faixa ? 'font-semibold text-brand-brown' : 'text-brand-brown/70 group-hover:text-brand-brown'}`}>{faixa}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

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

        <section className="bg-brand-bg px-4 pt-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/dia-das-maes')}
            className="group mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-2xl border border-rose-100 bg-white px-4 py-4 text-left shadow-[0_10px_30px_rgba(135,65,85,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_16px_38px_rgba(135,65,85,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-800/25 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            aria-label="Ver promoção de Dia das Mães da Lumi Imports"
          >
            <div className="flex items-start gap-3 sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-800 ring-1 ring-rose-100">
                <BadgePercent className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-800/70">
                  Especial Dia das Mães
                </p>
                <h2 className="mt-1 text-base font-bold leading-snug text-brand-brown sm:text-lg">
                  Perfumes selecionados com até 30% OFF
                </h2>
                <p className="mt-1 text-xs leading-5 text-brand-brown/55 sm:text-sm">
                  Encontre presentes elegantes com curadoria Lumi e finalize pelo WhatsApp.
                </p>
              </div>
            </div>

            <span className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-800 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors group-hover:bg-rose-900 sm:w-auto sm:shrink-0">
              Ver ofertas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </section>

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 lg:gap-12">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 lg:w-64 shrink-0">
          <div className="sticky top-8 bg-white p-6 rounded-[2rem] border border-brand-brown/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)]">
            <h2 className="text-lg font-semibold text-brand-brown flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-brand-brown/50" /> Filtros
            </h2>
            {filterContent}
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
                  {filterContent}
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
                handleAddToCart={handleAddToCart}
                onViewCollection={showPocketCollection}
              />

              {/* Seção Mais Vendidos - Apenas se Favoritos estiverem nos resultados filtrados */}
              {filteredProducts.filter(p => p.mais_vendido).length > 0 && (
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
                    {filteredProducts.filter(p => p.mais_vendido).map(product => (
                      <div key={`fav-${product.id}`} className="min-w-[160px] sm:min-w-[220px] max-w-[220px] snap-center shrink-0">
                        <ProductCard product={product} handleAddToCart={handleAddToCart} />
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
                    <ProductCard key={`all-${product.id}`} product={product} handleAddToCart={handleAddToCart} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-brand-brown/5 bg-white px-4 py-4 shadow-[0_4px_20px_rgba(61,43,31,0.03)] sm:flex-row"
                    aria-label="Paginação do catálogo"
                  >
                    <p className="text-xs font-medium text-brand-brown/50">
                      Página {currentPage} de {totalPages}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9 rounded-full border-brand-brown/15 px-3 text-brand-brown hover:bg-stone-50 disabled:opacity-40"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {visiblePageNumbers.map((pageNumber) => (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => goToPage(pageNumber)}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors ${
                              currentPage === pageNumber
                                ? 'bg-brand-brown text-white shadow-sm'
                                : 'text-brand-brown/60 hover:bg-stone-50 hover:text-brand-brown'
                            }`}
                            aria-current={currentPage === pageNumber ? 'page' : undefined}
                          >
                            {pageNumber}
                          </button>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9 rounded-full border-brand-brown/15 px-3 text-brand-brown hover:bg-stone-50 disabled:opacity-40"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </nav>
                )}
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
