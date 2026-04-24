import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CreditCard, ShoppingBag, Wind, Heart, Droplet, Package, Star, Calendar, Sparkles } from 'lucide-react';
import type { Database } from '../types/supabase';
import { calculateInstallment } from '../utils/finance';
import ReactGA from 'react-ga4';

type Product = Database['public']['Tables']['produtos']['Row'];

const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
      } finally {
        setTimeout(() => setLoading(false), 300); // Suave transição
      }
    };

    fetchProduct();

    // Inscrição em tempo real para este produto específico (ex: estoque)
    const channel = supabase
      .channel(`produto-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'produtos', filter: `id=eq.${id}` },
        (payload) => {
          setProduct(payload.new as Product);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleInterest = () => {
    if (!product) return;
    ReactGA.event({ category: 'Conversão', action: 'Clique WhatsApp', label: product.nome });
    const text = encodeURIComponent(`Olá! Tenho interesse no perfume: ${product.nome}. Gostaria de garantir o meu!`);
    window.open(`https://wa.me/5519982796873?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg font-sans pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 bg-stone-200 animate-pulse rounded-full mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            <div className="aspect-[4/5] bg-stone-200 animate-pulse rounded-[2rem]"></div>
            <div className="space-y-6 pt-8">
              <div className="h-4 w-24 bg-stone-200 animate-pulse rounded-full"></div>
              <div className="h-12 w-3/4 bg-stone-200 animate-pulse rounded-full"></div>
              <div className="h-10 w-1/3 bg-stone-200 animate-pulse rounded-full mt-8"></div>
              <div className="h-16 w-full bg-stone-200 animate-pulse rounded-2xl mt-12"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center font-sans">
        <Package className="w-16 h-16 text-brand-brown/20 mb-4" />
        <h2 className="text-2xl text-brand-brown mb-6 font-light">Produto não encontrado</h2>
        <Button onClick={() => navigate('/catalogo')} variant="outline" className="border-brand-brown/20 text-brand-brown">
          Voltar ao Catálogo
        </Button>
      </div>
    );
  }

  const custo = product.custo_final_brl || 0;
  const precoVenda = product.preco_venda_brl || (custo * 1.30);
  const installmentValue = calculateInstallment(precoVenda, 12);
  const isLowStock = product.estoque > 0 && product.estoque <= 2;
  const outOfStock = product.estoque <= 0;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans selection:bg-brand-brown selection:text-brand-bg">
      {/* Header / Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 pb-4">
        <button 
          onClick={() => navigate('/catalogo')} 
          className="flex items-center gap-2 text-brand-brown/60 hover:text-brand-brown transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm tracking-wide uppercase">Catálogo</span>
        </button>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          {/* LADO ESQUERDO: Imagem do Produto */}
          <div className="md:sticky md:top-8">
            <div className="aspect-[4/5] bg-[#fcfbf9] rounded-[2.5rem] overflow-hidden flex items-center justify-center p-8 shadow-[0_20px_60px_-15px_rgba(61,43,31,0.05)] border border-brand-brown/5 relative group">
              {isLowStock && (
                <div className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                  <span className="text-xs font-bold tracking-widest uppercase text-red-800">
                    Últimas un.
                  </span>
                </div>
              )}
              {outOfStock && (
                <div className="absolute top-6 right-6 z-10 bg-stone-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                  <span className="text-xs font-bold tracking-widest uppercase text-white">
                    Esgotado
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
                    className={`w-full h-full object-contain transition-transform duration-1000 ${
                      imageLoaded ? 'opacity-100 scale-100 group-hover:scale-105' : 'opacity-0 scale-95'
                    }`}
                  />
                </>
              ) : (
                <Package className="h-32 w-32 text-brand-brown/10" />
              )}
            </div>
          </div>

          {/* LADO DIREITO: Informações */}
          <div className="flex flex-col pt-4 md:pt-8">
            
            {/* Header do Produto */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-brown/50 font-bold">
                  {product.categoria || 'Fragrância Importada'}
                </p>
                {product.volume && (
                  <>
                    <span className="text-[10px] text-brand-brown/30">•</span>
                    <p className="text-xs uppercase tracking-[0.3em] text-brand-brown/50 font-bold">
                      {product.volume}
                    </p>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-brown leading-tight tracking-tight mb-4">
                {product.nome}
              </h1>

              {product.inspirado_em && (
                <div className="flex items-center gap-2 mb-6 bg-[#fcfbf9] border border-brand-brown/10 px-4 py-3 rounded-2xl w-max max-w-full shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#8c6b52] shrink-0" />
                  <p className="text-sm italic text-brand-brown/80 font-medium">
                    Referência Olfativa: Inspirado no consagrado <span className="font-bold text-brand-brown">{product.inspirado_em}</span>
                  </p>
                </div>
              )}
              
              {/* Preço e Parcelamento */}
              <div className="flex flex-col gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-brand-brown tracking-tighter">
                  {formatBRL(precoVenda)}
                </span>
                <span className="text-brand-brown/60 flex items-center gap-2 font-medium">
                  <CreditCard className="w-5 h-5 opacity-70" /> 
                  em até 12x de {formatBRL(installmentValue)} no cartão
                </span>
              </div>
            </div>

            {/* Badges de IA (se existirem) */}
            {(product.familia_olfativa || product.ocasiao) && (
              <div className="flex flex-wrap gap-3 mb-10">
                {product.familia_olfativa && (
                  <div className="bg-brand-brown/5 border border-brand-brown/10 text-brand-brown px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                    <Star className="w-4 h-4 opacity-70" /> {product.familia_olfativa}
                  </div>
                )}
                {product.ocasiao && (
                  <div className="bg-brand-brown/5 border border-brand-brown/10 text-brand-brown px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-70" /> {product.ocasiao}
                  </div>
                )}
              </div>
            )}

            {/* CTA Master */}
            <Button 
              onClick={handleInterest}
              disabled={outOfStock}
              className={`w-full py-8 rounded-[1.25rem] text-lg font-bold tracking-wide flex items-center justify-center gap-3 shadow-xl transition-all duration-300 mb-16 ${
                outOfStock 
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed shadow-none hover:bg-stone-200' 
                  : 'bg-brand-brown hover:bg-[#2A1D15] text-white hover:shadow-2xl hover:-translate-y-1'
              }`}
            >
              <ShoppingBag className="w-6 h-6" /> 
              {outOfStock ? 'Indisponível no momento' : 'Comprar agora via WhatsApp'}
            </Button>

            {/* Conteúdo Enriquecido por IA */}
            <div className="space-y-16 border-t border-brand-brown/10 pt-16">
              
              {/* A Experiência */}
              {product.descricao_ia && (
                <section>
                  <h3 className="uppercase tracking-[0.2em] text-xs font-bold text-brand-brown/40 mb-6">A Experiência</h3>
                  <p className="text-brand-brown/80 leading-relaxed text-lg italic border-l-2 border-brand-brown/20 pl-6">
                    "{product.descricao_ia}"
                  </p>
                </section>
              )}

              {/* Pirâmide Olfativa Visual */}
              {(product.notas_topo || product.notas_coracao || product.notas_fundo) && (
                <section>
                  <h3 className="uppercase tracking-[0.2em] text-xs font-bold text-brand-brown/40 mb-8">Pirâmide Olfativa</h3>
                  <div className="flex flex-col gap-8 bg-white border border-brand-brown/5 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    
                    {product.notas_topo && (
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#fcfbf9] border border-brand-brown/5 flex items-center justify-center shrink-0 shadow-sm">
                          <Wind className="w-5 h-5 text-brand-brown/50" />
                        </div>
                        <div className="pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-brown/40 mb-1.5">Notas de Saída</p>
                          <p className="text-brand-brown font-medium leading-snug">{product.notas_topo}</p>
                        </div>
                      </div>
                    )}
                    
                    {product.notas_coracao && (
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#fcfbf9] border border-brand-brown/5 flex items-center justify-center shrink-0 shadow-sm">
                          <Heart className="w-5 h-5 text-brand-brown/50" />
                        </div>
                        <div className="pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-brown/40 mb-1.5">Notas de Coração</p>
                          <p className="text-brand-brown font-medium leading-snug">{product.notas_coracao}</p>
                        </div>
                      </div>
                    )}
                    
                    {product.notas_fundo && (
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#fcfbf9] border border-brand-brown/5 flex items-center justify-center shrink-0 shadow-sm">
                          <Droplet className="w-5 h-5 text-brand-brown/50" />
                        </div>
                        <div className="pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-brown/40 mb-1.5">Notas de Fundo</p>
                          <p className="text-brand-brown font-medium leading-snug">{product.notas_fundo}</p>
                        </div>
                      </div>
                    )}

                  </div>
                </section>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
