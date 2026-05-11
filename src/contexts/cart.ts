import { createContext, useContext } from 'react';
import type { Database } from '../types/supabase';
import { formatCurrency } from '../utils/parsing';

export type Product = Database['public']['Tables']['produtos']['Row'];

export const WHATSAPP_NUMBER = '5519997884533';

export type CartItem = {
  id: string;
  nome: string;
  imagem_url: string | null;
  estoque: number;
  price: number;
  quantity: number;
};

export type AddToCartResult = {
  added: boolean;
  reason?: 'out-of-stock' | 'stock-limit';
};

export type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product) => AddToCartResult;
  increaseItem: (productId: string) => void;
  decreaseItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  checkoutWhatsApp: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export const formatBRL = formatCurrency;

export const getProductRegularPrice = (product: Product) => {
  return product.preco_venda_brl || ((product.custo_final_brl || 0) * 1.30);
};

export const hasActivePromotion = (product: Product) => {
  const regularPrice = getProductRegularPrice(product);

  return Boolean(
    product.promocao_ativa &&
    product.preco_promocao_brl &&
    product.preco_promocao_brl > 0 &&
    product.preco_promocao_brl < regularPrice
  );
};

export const getProductSalePrice = (product: Product) => {
  return hasActivePromotion(product)
    ? (product.preco_promocao_brl as number)
    : getProductRegularPrice(product);
};

export const buildProductOrderWhatsAppUrl = (product: Product) => {
  const text = encodeURIComponent(
    `Olá! Tenho interesse em encomendar o perfume ${product.nome}. Poderiam me informar disponibilidade e prazo?`
  );

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
};

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }

  return context;
}
