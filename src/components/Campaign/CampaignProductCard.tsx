import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Heart, Package, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Database } from '../../types/supabase';
import { calculateInstallment } from '../../utils/finance';
import {
  formatBRL,
  getProductRegularPrice,
  getProductSalePrice,
  useCart,
} from '../../contexts/cart';
import { getProductPath } from '../../utils/productRoutes';

type Product = Database['public']['Tables']['produtos']['Row'];

export const discountPercentage = (product: Product) => {
  const regularPrice = getProductRegularPrice(product);
  const salePrice = getProductSalePrice(product);

  if (regularPrice <= 0 || salePrice >= regularPrice) return 0;

  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

export function CampaignProductCard({
  product,
  badgeLabel,
  onAddToCart,
}: {
  product: Product;
  badgeLabel: string;
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
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-[var(--c-border)] bg-white shadow-[0_8px_28px_rgba(135,65,85,0.08)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(135,65,85,0.14)]">
      <div
        className="cursor-pointer p-1.5"
        onClick={() => navigate(getProductPath(product))}
      >
        <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--c-bgSoft)]">
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
            <span className="flex w-max items-center gap-1 rounded-full bg-[var(--c-accent)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
              <Heart className="h-2.5 w-2.5" />
              {badgeLabel}
            </span>
            {discount > 0 && (
              <span className="w-max rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--c-accent)] shadow-sm">
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
              {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[var(--c-bgSoft)]/60" />}
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
            <Package className="h-10 w-10 text-[var(--c-badgeText)]/15" />
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(getProductPath(product))}
          className="flex flex-1 flex-col text-left"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--c-badgeText)]/50">
              {product.familia_olfativa || product.categoria || 'Fragrância'}
            </p>
            {product.volume && (
              <>
                <span className="text-[7px] text-[var(--c-badgeText)]/25">•</span>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--c-badgeText)]/50">
                  {product.volume}
                </p>
              </>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-brand-brown transition-colors group-hover:text-[var(--c-badgeText)]">
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
            <span className="text-[11px] font-semibold text-brand-brown/35 line-through decoration-[var(--c-accent)]/70">
              {formatBRL(regularPrice)}
            </span>
            <span className="text-xl font-extrabold text-[var(--c-accent)]">
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
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--c-accent)] py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-[var(--c-accentDeep)] hover:shadow-md disabled:bg-stone-200 disabled:text-stone-500"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {reachedStockLimit ? 'No carrinho' : 'Adicionar'}
        </Button>
      </CardContent>
    </Card>
  );
}
