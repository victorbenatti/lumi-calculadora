import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CartContext,
  formatBRL,
  getProductSalePrice,
  type AddToCartResult,
  type CartItem,
  type Product,
} from './cart';

const WHATSAPP_NUMBER = '5519997884533';
const CART_STORAGE_KEY = 'lumi-cart-items';

const isCartItem = (item: unknown): item is CartItem => {
  if (!item || typeof item !== 'object') return false;

  const candidate = item as Partial<CartItem>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.nome === 'string' &&
    (typeof candidate.imagem_url === 'string' || candidate.imagem_url === null) &&
    typeof candidate.estoque === 'number' &&
    typeof candidate.price === 'number' &&
    typeof candidate.quantity === 'number' &&
    candidate.estoque > 0 &&
    candidate.price >= 0 &&
    candidate.quantity > 0
  );
};

const loadStoredItems = (): CartItem[] => {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return [];

    const parsedCart: unknown = JSON.parse(storedCart);
    if (!Array.isArray(parsedCart)) return [];

    return parsedCart
      .filter(isCartItem)
      .map((item) => ({
        ...item,
        quantity: Math.min(item.quantity, item.estoque),
      }));
  } catch (error) {
    console.error('Erro ao carregar carrinho:', error);
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadStoredItems);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  }, [items]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [items]
  );

  const addItem = (product: Product): AddToCartResult => {
    if (product.estoque <= 0) {
      return { added: false, reason: 'out-of-stock' };
    }

    const price = getProductSalePrice(product);
    let result: AddToCartResult = { added: true };

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.estoque) {
          result = { added: false, reason: 'stock-limit' };
          return currentItems;
        }

        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, estoque: product.estoque, price, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          id: product.id,
          nome: product.nome,
          imagem_url: product.imagem_url,
          estoque: product.estoque,
          price,
          quantity: 1,
        },
      ];
    });

    if (result.added) {
      setIsCartOpen(true);
    }

    return result;
  };

  const decreaseItem = (productId: string) => {
    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.id !== productId) return item;
        if (item.quantity <= 1) return [];
        return { ...item, quantity: item.quantity - 1 };
      })
    );
  };

  const increaseItem = (productId: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== productId || item.quantity >= item.estoque) return item;
        return { ...item, quantity: item.quantity + 1 };
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => setItems([]);

  const getItemQuantity = (productId: string) => {
    return items.find((item) => item.id === productId)?.quantity ?? 0;
  };

  const checkoutWhatsApp = () => {
    if (items.length === 0) return;

    const lines = items.map((item) => {
      const quantityText = `${item.quantity}x ${item.nome}`;
      const priceText = item.quantity > 1
        ? `${formatBRL(item.price)} cada`
        : formatBRL(item.price);

      return `${quantityText} - ${priceText}`;
    });

    const text = encodeURIComponent(
      `Olá! Quero os itens:\n${lines.join('\n')}\nTotal: ${formatBRL(totalPrice)}\n\nValores sujeitos à confirmação de disponibilidade.`
    );

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const value = {
    items,
    totalItems,
    totalPrice,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    addItem,
    increaseItem,
    decreaseItem,
    removeItem,
    clearCart,
    getItemQuantity,
    checkoutWhatsApp,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
