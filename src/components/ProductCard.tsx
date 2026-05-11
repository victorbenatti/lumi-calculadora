import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  CreditCard,
  Flame,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import ReactGA from 'react-ga4';
import type { Database } from '../types/supabase';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import {
  buildProductOrderWhatsAppUrl,
  formatBRL,
  getProductRegularPrice,
  getProductSalePrice,
  hasActivePromotion,
  useCart,
} from '../contexts/cart';
import { calculateInstallment } from '../utils/finance';
import { getProductPath } from '../utils/productRoutes';

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCardComponent({ product, onAddToCart }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const { getItemQuantity } = useCart();

  const precoVenda = getProductSalePrice(product);
  const regularPrice = getProductRegularPrice(product);
  const isPromotion = hasActivePromotion(product);
  const installmentValue = calculateInstallment(precoVenda);
  const outOfStock = product.estoque <= 0;
  const isLowStock = product.estoque > 0 && product.estoque <= 2;
  const cartQuantity = getItemQuantity(product.id);
  const reachedStockLimit = !outOfStock && cartQuantity >= product.estoque;

  const hasAI = !!product.notas_topo || !!product.descricao_ia || !!product.familia_olfativa;

  const handleProductAction = () => {
    if (outOfStock) {
      window.open(buildProductOrderWhatsAppUrl(product), '_blank');
      ReactGA.event({ category: 'Encomenda', action: 'Solicitar Produto', label: product.nome });
      return;
    }

    onAddToCart(product);
  };

  return (
    <Card className="border border-brand-brown/5 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgb(61,43,31,0.08)] transition-all duration-500 flex flex-col h-full rounded-2xl group overflow-hidden">
      <div
        className="p-1.5 cursor-pointer"
        onClick={() => navigate(getProductPath(product))}
      >
        <div className="aspect-[3/4] w-full bg-[#fcfbf9] rounded-xl overflow-hidden relative flex items-center justify-center">
          {outOfStock ? (
            <div className="absolute top-2 right-2 z-10 bg-stone-800/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
              <span className="text-[8px] font-bold tracking-widest uppercase text-white">
                Esgotado
              </span>
            </div>
          ) : isLowStock && (
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
          onClick={() => navigate(getProductPath(product))}
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
          onClick={handleProductAction}
          disabled={reachedStockLimit}
          className={`w-full mt-3 rounded-xl py-2.5 text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-300 disabled:bg-stone-200 disabled:text-stone-500 disabled:shadow-none ${
            outOfStock
              ? 'bg-stone-900 hover:bg-stone-800 text-white'
              : 'bg-brand-brown hover:bg-[#2A1D15] text-white'
          }`}
        >
          {outOfStock ? <MessageCircle className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
          {outOfStock ? 'Quero Encomendar' : reachedStockLimit ? 'No carrinho' : 'Adicionar ao Carrinho'}
        </Button>
      </CardContent>
    </Card>
  );
}

export const ProductCard = memo(ProductCardComponent);
