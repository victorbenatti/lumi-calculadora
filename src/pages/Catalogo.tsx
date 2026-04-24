import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Package, Search, CreditCard, ShoppingBag, ShieldCheck, Lock, Truck, Sparkles, ChevronDown, Wind, Heart, Droplet, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types/supabase';
import { calculateInstallment } from '../utils/finance';
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
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
    const text = encodeURIComponent(`Olá! Tenho interesse no perfume: ${productName}. Gostaria de garantir o meu!`);
    window.open(`https://wa.me/5599999999999?text=${text}`, '_blank');
  };

  const filteredProducts = products.filter(p => {
    const matchesFilter = filter === 'Todos' || p.categoria === filter;
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-brown selection:text-brand-bg flex flex-col">
      <section className="bg-white border-b border-brand-brown/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fdfbf9] to-white pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10 flex flex-col items-center">
          
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

          <div className="w-full max-w-2xl relative group mb-8">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-brand-brown/30 group-focus-within:text-brand-brown transition-colors" />
            </div>
            <Input
              type="text"
              placeholder="Buscar fragrância ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 py-8 w-full text-lg rounded-full border-brand-brown/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-visible:ring-1 focus-visible:ring-brand-brown/20 focus-visible:border-brand-brown/30 bg-white transition-all text-brand-brown placeholder:text-brand-brown/30 placeholder:font-light"
            />
          </div>

          <div className="w-full overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:justify-center gap-3">
            {['Todos', 'Masculino', 'Feminino', 'Unissex'].map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`whitespace-nowrap rounded-full px-7 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  filter === category 
                    ? 'bg-brand-brown text-white shadow-md' 
                    : 'bg-stone-50 text-brand-brown/60 hover:bg-stone-100 hover:text-brand-brown'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {[...Array(8)].map((_, i) => (
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-brand-brown/20" />
            </div>
            <h3 className="text-2xl font-light text-brand-brown mb-2">Nenhuma fragrância encontrada</h3>
            <p className="text-brand-brown/50 max-w-md font-light">Não localizamos nenhum produto com esses termos no momento.</p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchTerm(''); setFilter('Todos'); }}
              className="mt-8 rounded-full px-8 border-brand-brown/20 text-brand-brown hover:bg-stone-50"
            >
              Ver todo o catálogo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} handleInterest={handleInterest} />
            ))}
          </div>
        )}
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
