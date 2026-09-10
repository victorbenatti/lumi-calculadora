import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Package, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { useCart, formatBRL } from '../contexts/cart';

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    totalItems,
    totalPrice,
    isCartOpen,
    openCart,
    closeCart,
    increaseItem,
    decreaseItem,
    removeItem,
    clearCart,
  } = useCart();

  const handleGoToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      <Button
        onClick={openCart}
        className="fixed bottom-5 right-5 z-40 h-14 rounded-full bg-brand-brown px-5 text-white shadow-lift hover:bg-brand-deep flex items-center gap-2"
        aria-label="Abrir carrinho"
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-sm font-bold">Sacola</span>
        {totalItems > 0 && (
          <span className="ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-brand-brown">
            {totalItems}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 z-50 bg-brand-brown/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
              aria-label="Sacola de compras"
            >
              <div className="flex items-center justify-between border-b border-brand-brown/10 bg-brand-surface px-5 py-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-brown/40">
                    Seleção Exclusiva
                  </p>
                  <h2 className="font-heading text-xl font-semibold text-brand-brown">
                    Sua Sacola Lumi
                  </h2>
                </div>
                <button
                  onClick={closeCart}
                  className="rounded-full border border-brand-brown/10 bg-white p-2 text-brand-brown/50 shadow-sm transition-colors hover:text-brand-brown"
                  aria-label="Fechar sacola"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-sand/50">
                      <ShoppingBag className="h-8 w-8 text-brand-brown/20" />
                    </div>
                    <h3 className="font-heading text-xl font-light text-brand-brown">
                      Sua sacola está vazia
                    </h3>
                    <p className="mt-2 max-w-xs text-sm font-light leading-relaxed text-brand-brown/50">
                      Escolha suas fragrâncias favoritas e finalize o atendimento direto pelo WhatsApp.
                    </p>
                    <Button
                      onClick={closeCart}
                      variant="outline"
                      className="mt-7 h-11 rounded-full border-brand-brown/20 px-6 text-brand-brown hover:bg-brand-surface"
                    >
                      Explorar fragrâncias
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => {
                      const reachedLimit = item.quantity >= item.estoque;

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-brand-brown/10 bg-brand-surface p-3 shadow-card"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                              {item.imagem_url ? (
                                <img
                                  src={item.imagem_url}
                                  alt={item.nome}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-brand-brown/15" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-brand-brown">
                                    {item.nome}
                                  </h3>
                                  <p className="mt-1 text-xs font-medium text-brand-brown/50">
                                    {formatBRL(item.price)} cada
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="rounded-full p-1.5 text-brand-brown/35 transition-colors hover:bg-white hover:text-red-800"
                                  aria-label={`Remover ${item.nome}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center rounded-full border border-brand-brown/10 bg-white p-1">
                                  <button
                                    onClick={() => decreaseItem(item.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-brand-brown/60 transition-colors hover:bg-brand-surface hover:text-brand-brown"
                                    aria-label={`Diminuir quantidade de ${item.nome}`}
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="flex min-w-8 justify-center text-sm font-bold text-brand-brown">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => increaseItem(item.id)}
                                    disabled={reachedLimit}
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-brand-brown/60 transition-colors hover:bg-brand-surface hover:text-brand-brown disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label={`Aumentar quantidade de ${item.nome}`}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <p className="text-sm font-bold text-brand-brown">
                                  {formatBRL(item.price * item.quantity)}
                                </p>
                              </div>

                              {reachedLimit && (
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-800/70">
                                  Limite de estoque atingido
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-brand-brown/10 bg-white px-5 py-5">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-brown/40">
                      Total estimado
                    </p>
                    <p className="text-sm text-brand-brown/50">
                      Reserva confirmada no atendimento.
                    </p>
                  </div>
                  <strong className="text-2xl text-brand-brown">
                    {formatBRL(totalPrice)}
                  </strong>
                </div>

                <Button
                  onClick={handleGoToCheckout}
                  disabled={items.length === 0}
                  className="h-14 w-full rounded-2xl bg-brand-brown text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-xl disabled:translate-y-0 disabled:bg-brand-sand disabled:text-brand-brown/40 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  <span>Prosseguir para Checkout</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>

                {items.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button
                      onClick={closeCart}
                      variant="outline"
                      className="h-11 rounded-xl border-brand-brown/15 text-brand-brown hover:bg-brand-surface"
                    >
                      Continuar navegando
                    </Button>
                    <Button
                      onClick={clearCart}
                      variant="ghost"
                      className="h-11 rounded-xl text-brand-brown/55 hover:bg-rose-50 hover:text-rose-900"
                    >
                      Limpar sacola
                    </Button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
