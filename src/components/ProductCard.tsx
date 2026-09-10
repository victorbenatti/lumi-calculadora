import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Flame,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
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
  onOpenProduct?: (product: Product) => void;
}

function ProductCardComponent({ product, onAddToCart, onOpenProduct }: ProductCardProps) {
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

  const handleOpenProduct = () => {
    if (onOpenProduct) {
      onOpenProduct(product);
      return;
    }

    navigate(getProductPath(product));
  };

  const handleProductAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (outOfStock) {
      window.open(buildProductOrderWhatsAppUrl(product), '_blank');
      ReactGA.event({ category: 'Encomenda', action: 'Solicitar Produto', label: product.nome });
      return;
    }

    onAddToCart(product);
  };

  return (
    <Card
      onClick={handleOpenProduct}
      className="group cursor-pointer border border-brand-brown/10 bg-white shadow-card hover:shadow-lift hover:-translate-y-1 transition-all duration-300 flex flex-col h-full rounded-2xl overflow-hidden"
    >
      {/* Container de Imagem com Enquadramento Impecável */}
      <div className="p-2 sm:p-2.5">
        <div className="aspect-[3/4] w-full bg-gradient-to-b from-brand-surface to-brand-sand/30 rounded-xl overflow-hidden relative flex items-center justify-center p-3 border border-brand-brown/5">
          {outOfStock ? (
            <div className="absolute top-2.5 right-2.5 z-10 bg-brand-deep/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
              <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-stone-200">
                Esgotado
              </span>
            </div>
          ) : isLowStock ? (
            <div className="absolute top-2.5 right-2.5 z-10 bg-amber-950/80 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
              <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-amber-200">
                Últimas un.
              </span>
            </div>
          ) : null}

          {product.mais_vendido && (
            <div className="absolute top-2.5 left-2.5 z-10 bg-amber-50/95 border border-amber-300/60 backdrop-blur-md px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-amber-700" />
              <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-amber-900">
                Destaque
              </span>
            </div>
          )}

          {product.imagem_url ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 bg-brand-sand/50 animate-pulse" />}
              <img
                src={product.imagem_url}
                alt={product.nome}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                onLoad={() => setImageLoaded(true)}
                className={`max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(61,43,31,0.08)] transition-transform duration-700 ease-out ${
                  imageLoaded ? 'opacity-100 scale-100 group-hover:scale-105' : 'opacity-0 scale-95'
                }`}
              />
            </>
          ) : (
            <Package className="h-10 w-10 text-brand-brown/15" />
          )}
        </div>
      </div>

      {/* Conteúdo do Card */}
      <CardContent className="px-3.5 pb-3.5 pt-1 flex flex-col flex-grow">
        {/* Metadados: Categoria / Família */}
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-brand-brown/45 font-semibold truncate">
            {product.familia_olfativa || product.categoria || 'Fragrância'}
          </p>
          {product.volume && (
            <>
              <span className="text-[8px] text-brand-brown/25">•</span>
              <p className="text-[10px] uppercase tracking-[0.14em] text-brand-brown/45 font-semibold shrink-0">
                {product.volume}
              </p>
            </>
          )}
        </div>

        {/* Nome do Produto com Tipografia Serifada Editorial */}
        <h3 className="font-heading text-base font-semibold text-brand-brown leading-snug group-hover:text-brand-deep transition-colors line-clamp-2 min-h-[2.5rem]">
          {product.nome}
        </h3>

        {/* Referência olfativa discreta */}
        {product.inspirado_em && (
          <p className="text-[11px] text-brand-brown/55 italic line-clamp-1 mt-0.5 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-600/70 shrink-0" />
            <span>Ref: {product.inspirado_em}</span>
          </p>
        )}

        <div className="flex-grow" />

        {/* Preço e Condições */}
        <div className="mt-3 flex flex-col gap-0.5 pt-2.5 border-t border-brand-brown/5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {isPromotion && (
              <span className="text-[11px] font-medium text-brand-brown/40 line-through decoration-rose-700/60">
                {formatBRL(regularPrice)}
              </span>
            )}
            <span className={`text-lg font-bold tracking-tight ${isPromotion ? 'text-rose-900' : 'text-brand-brown'}`}>
              {formatBRL(precoVenda)}
            </span>
            {isPromotion && (
              <span className="rounded-full bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-rose-800">
                Oferta
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-brand-brown/50 font-medium">
            <CreditCard className="w-3 h-3 opacity-60 shrink-0" />
            <span>12x de {formatBRL(installmentValue)}</span>
          </div>
        </div>

        {/* Botão de Ação */}
        <Button
          onClick={handleProductAction}
          disabled={reachedStockLimit}
          className={`w-full mt-3 rounded-xl py-2.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 disabled:bg-brand-sand disabled:text-brand-brown/40 disabled:shadow-none ${
            outOfStock
              ? 'bg-brand-deep hover:bg-brand-brown text-white'
              : 'bg-brand-brown hover:bg-brand-deep text-white shadow-card hover:shadow-lift'
          }`}
        >
          {outOfStock ? <MessageCircle className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
          {outOfStock ? 'Quero Encomendar' : reachedStockLimit ? 'Na Sacola' : 'Adicionar à Sacola'}
        </Button>
      </CardContent>
    </Card>
  );
}

export const ProductCard = memo(ProductCardComponent);
