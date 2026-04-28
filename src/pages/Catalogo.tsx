import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Package, Search, CreditCard, ShoppingBag, ShieldCheck, Lock, Truck, Sparkles, ChevronDown, Wind, Heart, Droplet, Star, Flame, Filter, DollarSign, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types/supabase';
import { calculateInstallment } from '../utils/finance';
import ReactGA from 'react-ga4';
import GradientText from '../components/GradientText';

type Product = Database['public']['Tables']['produtos']['Row'];

const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Componente individual de Card para gerenciar o estado 'expanded'
function ProductCard({ product, handleInterest }: { product: Product, handleInterest: (name: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const custo = product.custo_final_brl || 0;
  const precoVenda = product.preco_venda_brl || (custo * 1.30);
  const installmentValue = calculateInstallment(precoVenda);
  const isLowStock = product.estoque <= 2;
  
  // Verifica se o produto tem dados de IA para exibir o botão expansível
  const hasAI = !!product.notas_topo || !!product.descricao_ia || !!product.familia_olfativa;

  return (
    <Card className="border border-brand-brown/5 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(61,43,31,0.08)] transition-all duration-500 flex flex-col h-full rounded-[2rem] group overflow-hidden">
      <div 
        className="p-3 cursor-pointer"
        onClick={() => navigate(`/produto/${product.id}`)}
      >
        <div className="aspect-[4/5] w-full bg-[#fcfbf9] rounded-[1.5rem] overflow-hidden relative flex items-center justify-center">
          {isLowStock && (
            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-[10px] font-bold tracking-widest uppercase text-red-800">
                Últimas un.
              </span>
            </div>
          )}
          {product.mais_vendido && (
            <div className="absolute top-4 left-4 z-10 bg-emerald-600/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-white">
                Mais Vendido
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
                className={`w-full h-full object-cover transition-transform duration-1000 ${
                  imageLoaded ? 'opacity-100 scale-100 group-hover:scale-105' : 'opacity-0 scale-95'
                }`}
              />
            </>
          ) : (
            <Package className="h-16 w-16 text-brand-brown/10" />
          )}
        </div>
      </div>
      
      <CardContent className="p-6 pt-3 flex flex-col flex-grow">
        <div 
          className="flex-grow cursor-pointer"
          onClick={() => navigate(`/produto/${product.id}`)}
        >
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-brown/40 font-bold">
              {product.categoria || 'Fragrância'}
            </p>
            {product.volume && (
              <>
                <span className="text-[8px] text-brand-brown/30">•</span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-brand-brown/40 font-bold">
                  {product.volume}
                </p>
              </>
            )}
          </div>
          <h3 className="font-semibold text-lg text-brand-brown leading-snug group-hover:text-amber-900 transition-colors line-clamp-2">
            {product.nome}
          </h3>
        </div>

        {hasAI && (
          <div className="mt-4 mb-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="flex items-center justify-between w-full text-xs text-brand-brown/60 hover:text-brand-brown font-medium py-2.5 border-y border-brand-brown/5 transition-colors focus:outline-none"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Descobrir Fragrância
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {product.familia_olfativa && (
                        <span className="bg-brand-brown/5 text-brand-brown px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                          <Star className="w-3 h-3" /> {product.familia_olfativa}
                        </span>
                      )}
                      {product.ocasiao && (
                        <span className="bg-brand-brown/5 text-brand-brown px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                          {product.ocasiao}
                        </span>
                      )}
                    </div>
                    
                    {product.descricao_ia && (
                      <p className="text-xs text-brand-brown/70 italic leading-relaxed border-l-2 border-brand-brown/10 pl-3">
                        "{product.descricao_ia}"
                      </p>
                    )}
                    
                    {(product.notas_topo || product.notas_coracao || product.notas_fundo) && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-brown/5">
                        <div className="flex flex-col items-center text-center gap-1">
                          <Wind className="w-4 h-4 text-brand-brown/40" />
                          <span className="text-[9px] uppercase tracking-widest text-brand-brown/50 font-bold">Topo</span>
                          <span className="text-xs text-brand-brown leading-tight">{product.notas_topo || '-'}</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                          <Heart className="w-4 h-4 text-brand-brown/40" />
                          <span className="text-[9px] uppercase tracking-widest text-brand-brown/50 font-bold">Coração</span>
                          <span className="text-xs text-brand-brown leading-tight">{product.notas_coracao || '-'}</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                          <Droplet className="w-4 h-4 text-brand-brown/40" />
                          <span className="text-[9px] uppercase tracking-widest text-brand-brown/50 font-bold">Fundo</span>
                          <span className="text-xs text-brand-brown leading-tight">{product.notas_fundo || '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <div className="mt-4 flex flex-col gap-1.5">
          <span className="text-2xl font-bold text-brand-brown tracking-tight">
            {formatBRL(precoVenda)}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-brand-brown/60 font-medium">
            <CreditCard className="w-3.5 h-3.5 opacity-70" />
            <span>em até 12x de {formatBRL(installmentValue)}</span>
          </div>
        </div>
        
        <Button 
          onClick={() => handleInterest(product.nome)}
          className="w-full mt-6 bg-brand-brown hover:bg-[#2A1D15] text-white rounded-2xl py-6 font-medium tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-300"
        >
          <ShoppingBag className="w-4 h-4" />
          Garantir o meu
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Catalogo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    categoria: 'Todos',
    tipo: 'Todos',
    precoFaixa: 'Todos'
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

  const handleInterest = (productName: string) => {
    ReactGA.event({ category: 'Conversão', action: 'Clique WhatsApp', label: productName });
    const text = encodeURIComponent(`Olá! Tenho interesse no perfume: ${productName}. Gostaria de garantir o meu!`);
    window.open(`https://wa.me/5519982796873?text=${text}`, '_blank');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.categoria === 'Todos' || p.categoria === filters.categoria;
    const matchesTipo = filters.tipo === 'Todos' || p.tipo === filters.tipo;
    
    let matchesPrice = true;
    const preco = p.preco_venda_brl || (p.custo_final_brl * 1.30);
    if (filters.precoFaixa === 'Até R$300') matchesPrice = preco <= 300;
    if (filters.precoFaixa === 'R$300 - R$600') matchesPrice = preco > 300 && preco <= 600;
    if (filters.precoFaixa === 'Acima de R$600') matchesPrice = preco > 600;

    return matchesSearch && matchesCategory && matchesTipo && matchesPrice;
  });

  const hasActiveFilters = filters.categoria !== 'Todos' || filters.tipo !== 'Todos' || filters.precoFaixa !== 'Todos';

  const clearFilters = () => setFilters({ ...filters, categoria: 'Todos', tipo: 'Todos', precoFaixa: 'Todos' });

  const setFilterValue = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
      <section className="bg-white border-b border-brand-brown/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf9] to-white pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10 flex flex-col items-center">
          
          <div className="mb-8 w-full flex justify-center">
            <img 
              src="/logo-lumi-importadora.svg" 
              alt="Lumi Imports" 
              className="h-48 sm:h-64 w-auto object-contain drop-shadow-md" 
            />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-light tracking-tight text-brand-brown text-center mb-4 flex flex-col items-center gap-2">
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
          <p className="text-brand-brown/50 text-center max-w-lg mb-12 text-sm md:text-base tracking-wide">
            Descubra fragrâncias importadas originais selecionadas criteriosamente para os gostos mais exigentes.
          </p>

          <div className="w-full max-w-2xl relative group mb-4 flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-brand-brown/30 group-focus-within:text-brand-brown transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Buscar fragrância ou marca..."
                value={filters.search}
                onChange={(e) => setFilterValue('search', e.target.value)}
                className="pl-14 py-8 w-full text-lg rounded-full border-brand-brown/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-visible:ring-1 focus-visible:ring-brand-brown/20 focus-visible:border-brand-brown/30 bg-white transition-all text-brand-brown placeholder:text-brand-brown/30 placeholder:font-light"
              />
            </div>
            
            <Button 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="md:hidden h-16 w-16 px-0 rounded-full bg-white border border-brand-brown/10 text-brand-brown shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-stone-50 flex items-center justify-center relative"
            >
              <Filter className="w-5 h-5" />
              {hasActiveFilters && (
                <span className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col h-full bg-white rounded-[2rem] p-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-brand-brown/5">
                  <div className="aspect-[4/5] bg-stone-100/80 rounded-2xl animate-pulse w-full mb-6"></div>
                  <div className="px-2 flex flex-col gap-3">
                    <div className="h-3 w-1/4 bg-stone-100 animate-pulse rounded-full"></div>
                    <div className="h-5 w-3/4 bg-stone-100 animate-pulse rounded-full"></div>
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="h-8 w-1/2 bg-stone-100 animate-pulse rounded-full"></div>
                      <div className="h-3 w-2/3 bg-stone-100 animate-pulse rounded-full"></div>
                    </div>
                    <div className="h-14 w-full bg-stone-100 animate-pulse rounded-2xl mt-4"></div>
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
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                      <Flame className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-brand-brown tracking-tight">Os Favoritos da Lumi</h2>
                      <p className="text-brand-brown/50 text-sm">As fragrâncias filtradas mais desejadas.</p>
                    </div>
                  </div>
                  <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x snap-mandatory scrollbar-hide">
                    {filteredProducts.filter(p => p.mais_vendido).map(product => (
                      <div key={`fav-${product.id}`} className="min-w-[280px] sm:min-w-[320px] max-w-[320px] snap-center shrink-0">
                        <ProductCard product={product} handleInterest={handleInterest} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Catálogo Completo */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-medium text-brand-brown tracking-tight">
                    Catálogo Completo
                  </h2>
                  <span className="text-sm text-brand-brown/50 font-medium">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {filteredProducts.map((product) => (
                    <ProductCard key={`all-${product.id}`} product={product} handleInterest={handleInterest} />
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-brand-brown/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
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
              <h4 className="text-sm font-bold text-brand-brown uppercase tracking-wider text-center md:text-right">Garantia Lumi</h4>
              <div className="flex flex-col gap-3 items-center md:items-end text-sm text-brand-brown/60 font-light">
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
  );
}
