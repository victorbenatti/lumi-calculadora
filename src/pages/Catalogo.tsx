import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Package, CreditCard, ShoppingBag, ShieldCheck, Lock, Truck, Sparkles, ChevronDown, ChevronLeft, ChevronRight, Star, Flame, Filter, DollarSign, Globe, X, Instagram, Phone, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types/supabase';
import { calculateInstallment } from '../utils/finance';
import ReactGA from 'react-ga4';
import GradientText from '../components/GradientText';
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

  const handleAddToCart = (product: Product) => {
    const result = addItem(product);

    if (result.added) {
      ReactGA.event({ category: 'Carrinho', action: 'Adicionar Produto', label: product.nome });
    }
  };

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.categoria === 'Todos' || p.categoria === filters.categoria;
      const matchesTipo = filters.tipo === 'Todos' || p.tipo === filters.tipo;
      
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
          <Globe className="w-3.5 h-3.5" /> Origem
        </h3>
        <div className="flex flex-col gap-3">
          {['Todos', 'Importado', 'Árabe'].map(tipo => (
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

        <section className="bg-white border-b border-brand-brown/5 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf9] to-white pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-5 relative z-10 flex flex-col items-center">
            
            <div className="mb-1 w-full flex justify-center">
              <img 
                src="/logo-lumi-importadora.svg" 
                alt="Lumi Imports" 
                className="h-40 sm:h-44 w-auto object-contain drop-shadow-sm" 
              />
            </div>
            
            <h1 className="text-2xl md:text-4xl font-light tracking-tight text-brand-brown text-center mb-0 flex flex-col items-center gap-0">
              A sua nova
              <GradientText
                colors={['#3D2B1F', '#a68a74', '#3D2B1F']}
                animationSpeed={6}
                showBorder={false}
                className="font-extrabold pb-2 tracking-tight"
              >
                assinatura olfativa.
              </GradientText>
            </h1>
            <p className="text-brand-brown/50 text-center max-w-lg text-xs md:text-sm tracking-wide">
              Descubra fragrâncias importadas originais selecionadas criteriosamente.
            </p>
            <Button
              type="button"
              onClick={() => navigate('/dia-das-maes')}
              className="mt-5 h-11 rounded-full border border-rose-200 bg-rose-50 px-5 text-xs font-bold uppercase tracking-[0.18em] text-rose-900 shadow-sm hover:bg-rose-100"
            >
              <Heart className="h-4 w-4 text-rose-700" />
              Especial Dia das Mães
            </Button>
          </div>
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
              <section ref={catalogSectionRef} className="scroll-mt-32">
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

        <footer className="bg-white border-t border-brand-brown/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div className="space-y-4 flex flex-col items-center md:items-start">
              <img src="/logo-lumi-importadora.svg" alt="Lumi Imports" className="h-22 w-auto opacity-90 drop-shadow-sm" />
              <p className="text-sm text-brand-brown/50 font-light max-w-xs">
                A sua boutique de alta perfumaria. Seleção exclusiva das melhores fragrâncias internacionais.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-brand-brown uppercase tracking-wider">Atendimento</h4>
              <ul className="space-y-2 text-sm text-brand-brown/60 font-light">
                <li>Segunda a Sábado</li>
                <li>09:00 às 18:00</li>
                <li>Envio para todo o Brasil</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-brand-brown uppercase tracking-wider">Contato</h4>
              <ul className="space-y-3 text-sm text-brand-brown/60 font-light">
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <Phone className="w-4 h-4 text-brand-brown/40" />
                  <span>(19) 98279-6873</span>
                </li>
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <Instagram className="w-4 h-4 text-brand-brown/40" />
                  <a href="https://instagram.com/lumi.importadora" target="_blank" rel="noopener noreferrer" className="hover:text-brand-brown transition-colors">
                    @lumi.importadora
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-brand-brown uppercase tracking-wider text-center md:text-left">Garantia Lumi</h4>
              <div className="flex flex-col gap-3 items-center md:items-start text-sm text-brand-brown/60 font-light">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600/70" />
                  <span>Produtos 100% Originais</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-brown/50" />
                  <span>Compra 100% Segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-brown/50" />
                  <span>Entrega Rastreada</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-brand-brown/5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-brand-brown/40 font-light">
              &copy; {new Date().getFullYear()} Lumi Imports Store. Todos os direitos reservados.
            </p>
            <p className="text-xs text-brand-brown/40 font-light flex items-center gap-1">
              Ambiente Seguro <Lock className="w-3 h-3" />
            </p>
          </div>
        </div>
        </footer>
      </div>
    </div>
  );
}
