import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, MessageCircle, Search, ShoppingBag } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useCart } from '../contexts/cart';

const WHATSAPP_CONTACT_URL =
  'https://wa.me/5519982796873?text=Ol%C3%A1!%20Quero%20conhecer%20as%20fragr%C3%A2ncias%20da%20Lumi%20Imports.';

type HeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenCategories: () => void;
};

export function Header({ searchValue, onSearchChange, onOpenCategories }: HeaderProps) {
  const [showFilterHint, setShowFilterHint] = useState(true);
  const { totalItems, openCart } = useCart();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowFilterHint(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, []);

  const openWhatsApp = () => {
    window.open(WHATSAPP_CONTACT_URL, '_blank');
  };

  const openMobileFilters = () => {
    setShowFilterHint(false);
    onOpenCategories();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-brand-brown/10 bg-white/95 shadow-[0_10px_30px_rgba(61,43,31,0.06)] backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8 md:h-[72px]">
        <Button
          type="button"
          onClick={openMobileFilters}
          variant="outline"
          size="icon-lg"
          className="md:hidden rounded-full border-brand-brown bg-brand-brown text-white shadow-[0_10px_24px_rgba(61,43,31,0.18)] hover:bg-[#2A1D15]"
          aria-label="Abrir filtros"
          title="Filtros"
        >
          <Filter className="h-5 w-5" />
        </Button>

        <AnimatePresence>
          {showFilterHint && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-none absolute left-3 top-[58px] z-10 md:hidden"
            >
              <div className="relative rounded-xl bg-brand-brown px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_28px_rgba(61,43,31,0.22)]">
                Filtre sua busca
                <span className="absolute -top-1 left-6 h-3 w-3 rotate-45 bg-brand-brown" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <a
          href="/catalogo"
          className="absolute left-1/2 flex -translate-x-1/2 items-center md:static md:translate-x-0"
          aria-label="Lumi Imports"
        >
          <img
            src="/logo-lumi-importadora.svg"
            alt="Lumi Imports"
            className="h-22 w-auto object-contain drop-shadow-sm md:h-22"
          />
        </a>

        <div className="relative mx-auto hidden w-full max-w-xl md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/35" />
          <Input
            type="text"
            placeholder="Buscar fragrância ou marca..."
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 rounded-full border-brand-brown/10 bg-[#fcfbf9] pl-11 pr-4 text-sm text-brand-brown shadow-inner placeholder:text-brand-brown/35 focus-visible:border-brand-brown/25 focus-visible:ring-1 focus-visible:ring-brand-brown/20"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            onClick={openWhatsApp}
            variant="outline"
            className="h-10 rounded-full border-emerald-600/20 bg-emerald-50 px-3 text-emerald-700 hover:bg-emerald-100 md:px-4"
            aria-label="Contato pelo WhatsApp"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden text-xs font-bold sm:inline">WhatsApp</span>
          </Button>

          <Button
            type="button"
            onClick={openCart}
            className="relative h-10 rounded-full bg-brand-brown px-3 text-white hover:bg-[#2A1D15] md:px-4"
            aria-label="Abrir carrinho"
            title="Carrinho"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden text-xs font-bold sm:inline">Carrinho</span>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="border-t border-brand-brown/5 px-4 pb-3 md:hidden">
        <div className="relative mx-auto max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/35" />
          <Input
            type="text"
            placeholder="Buscar fragrância ou marca..."
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 rounded-full border-brand-brown/10 bg-[#fcfbf9] pl-11 pr-4 text-sm text-brand-brown shadow-inner placeholder:text-brand-brown/35 focus-visible:border-brand-brown/25 focus-visible:ring-1 focus-visible:ring-brand-brown/20"
          />
        </div>
      </div>
    </header>
  );
}
