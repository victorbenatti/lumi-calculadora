import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Filter, Heart, LogOut, Package, Search, ShoppingBag, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../lib/supabase';
import { formatBRL, getProductSalePrice, useCart } from '../contexts/cart';
import { useCustomer } from '../contexts/customer';
import { useDebounce } from '../hooks/useDebounce';
import type { Database } from '../types/supabase';

const WHATSAPP_CONTACT_URL =
  'https://wa.me/5519982796873?text=Ol%C3%A1!%20Quero%20conhecer%20as%20fragr%C3%A2ncias%20da%20Lumi%20Imports.';

type Product = Database['public']['Tables']['produtos']['Row'];

type HeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onOpenCategories?: () => void;
};

function WhatsAppLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M16 3.2A12.7 12.7 0 0 0 5.2 22.6L3.5 28.8l6.4-1.7A12.7 12.7 0 1 0 16 3.2Zm0 2.3a10.4 10.4 0 1 1-5.3 19.4l-.4-.2-3.8 1 1-3.7-.3-.4A10.4 10.4 0 0 1 16 5.5Zm-5.1 5.6c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.2-.2-.5-.4l-1.8-.9c-.3-.1-.5-.2-.7.2l-.8 1c-.1.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.8-.2-.3 0-.4.1-.6l.4-.4c.1-.1.2-.3.3-.5.1-.2.1-.3 0-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4h-.6Z" />
    </svg>
  );
}

export function Header({ searchValue, onSearchChange, onOpenCategories }: HeaderProps) {
  const navigate = useNavigate();
  const [showFilterHint, setShowFilterHint] = useState(true);
  const [internalSearch, setInternalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const { totalItems, openCart } = useCart();
  const { profile, profileLoading, signOut } = useCustomer();

  const hasFilterButton = Boolean(onOpenCategories);
  const currentSearchValue = searchValue ?? internalSearch;
  const debouncedSearch = useDebounce(currentSearchValue.trim(), 180);
  const accountLabel = profile?.nome || profile?.email || 'Cliente Lumi';

  useEffect(() => {
    if (!hasFilterButton) return;

    const timeout = window.setTimeout(() => {
      setShowFilterHint(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [hasFilterButton]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let isActive = true;

    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);

      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .gt('estoque', 0)
          .ilike('nome', `%${debouncedSearch}%`)
          .order('mais_vendido', { ascending: false, nullsFirst: false })
          .order('nome', { ascending: true })
          .limit(6);

        if (error) throw error;
        if (isActive) setSuggestions(data ?? []);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        if (isActive) setSuggestions([]);
      } finally {
        if (isActive) setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();

    return () => {
      isActive = false;
    };
  }, [debouncedSearch]);

  const openWhatsApp = () => {
    window.open(WHATSAPP_CONTACT_URL, '_blank');
  };

  const updateSearchValue = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }

    setInternalSearch(value);
  };

  const openMobileFilters = () => {
    setShowFilterHint(false);
    onOpenCategories?.();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAccountMenuOpen(false);
      navigate('/catalogo');
    } catch (error) {
      console.error('Erro ao sair da conta de cliente:', error);
    }
  };

  const goToProduct = (product: Product) => {
    updateSearchValue('');
    setSearchFocused(false);
    navigate(`/produto/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shouldShowSuggestions =
    searchFocused && currentSearchValue.trim().length >= 2 && (suggestionsLoading || suggestions.length > 0);

  const searchResults = (
    <AnimatePresence>
      {shouldShowSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-brand-brown/10 bg-white shadow-[0_18px_45px_rgba(61,43,31,0.14)]"
        >
          {suggestionsLoading ? (
            <div className="space-y-2 p-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-12 w-10 animate-pulse rounded-xl bg-stone-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-stone-100" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto p-2">
              {suggestions.map((product) => {
                const price = getProductSalePrice(product);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      goToProduct(product);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#fcfbf9]"
                  >
                    <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#fcfbf9]">
                      {product.imagem_url ? (
                        <img src={product.imagem_url} alt={product.nome} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-brand-brown/15" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-brown">
                        {product.nome}
                      </p>
                      <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-brand-brown/40">
                        {product.familia_olfativa || product.categoria || 'Fragrância'}
                      </p>
                    </div>

                    <strong className="shrink-0 text-xs text-brand-brown">
                      {formatBRL(price)}
                    </strong>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const desktopSearchInput = (
    <div className="relative mx-auto hidden w-full max-w-xl md:block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/35" />
      <Input
        type="text"
        placeholder="Buscar fragrância ou marca..."
        value={currentSearchValue}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
        onChange={(event) => updateSearchValue(event.target.value)}
        className="h-11 rounded-full border-brand-brown/10 bg-[#fcfbf9] pl-11 pr-4 text-sm text-brand-brown shadow-inner placeholder:text-brand-brown/35 focus-visible:border-brand-brown/25 focus-visible:ring-1 focus-visible:ring-brand-brown/20"
      />
      {searchResults}
    </div>
  );

  const mobileSearchInput = (
    <div className="relative mx-auto max-w-xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-brown/35" />
      <Input
        type="text"
        placeholder="Buscar fragrância ou marca..."
        value={currentSearchValue}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
        onChange={(event) => updateSearchValue(event.target.value)}
        className="h-10 rounded-full border-brand-brown/10 bg-[#fcfbf9] pl-11 pr-4 text-sm text-brand-brown shadow-inner placeholder:text-brand-brown/35 focus-visible:border-brand-brown/25 focus-visible:ring-1 focus-visible:ring-brand-brown/20"
      />
      {searchResults}
    </div>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-brand-brown/10 bg-white/95 shadow-[0_10px_30px_rgba(61,43,31,0.06)] backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8 md:h-[72px]">
        {hasFilterButton && (
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
        )}

        <AnimatePresence>
          {hasFilterButton && showFilterHint && (
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

        {desktopSearchInput}

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            onClick={() => navigate('/dia-das-maes')}
            variant="outline"
            className="hidden h-10 rounded-full border-rose-200 bg-rose-50 px-3 text-rose-800 hover:bg-rose-100 md:flex"
            aria-label="Especial Dia das Mães"
            title="Especial Dia das Mães"
          >
            <Heart className="h-4 w-4" />
            <span className="text-xs font-bold">Dia das Mães</span>
          </Button>

          <Button
            type="button"
            onClick={openWhatsApp}
            variant="outline"
            className="h-10 rounded-full border-emerald-600/20 bg-emerald-50 px-3 text-emerald-700 hover:bg-emerald-100 md:px-4"
            aria-label="Contato pelo WhatsApp"
            title="WhatsApp"
          >
            <WhatsAppLogoIcon className="h-4 w-4" />
            <span className="hidden text-xs font-bold sm:inline">WhatsApp</span>
          </Button>

          {profile ? (
            <div className="relative">
              <Button
                type="button"
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                variant="outline"
                className="h-10 rounded-full border-brand-brown/15 bg-white px-3 text-brand-brown hover:bg-stone-50 md:px-4"
                aria-label="Abrir perfil de cliente"
                aria-expanded={isAccountMenuOpen}
                title="Perfil"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden max-w-24 truncate text-xs font-bold lg:inline">
                  {accountLabel}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 opacity-50 sm:block" />
              </Button>

              <AnimatePresence>
                {isAccountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-brand-brown/10 bg-white shadow-[0_18px_45px_rgba(61,43,31,0.14)]"
                  >
                    <div className="border-b border-brand-brown/10 bg-[#fcfbf9] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-brand-brown">
                        {accountLabel}
                      </p>
                      <p className="truncate text-xs text-brand-brown/45">
                        Dados salvos para próximas compras
                      </p>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          navigate('/perfil');
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-brown transition-colors hover:bg-stone-50"
                      >
                        <UserRound className="h-4 w-4 text-brand-brown/50" />
                        Meu perfil
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-brown/65 transition-colors hover:bg-red-50 hover:text-red-800"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => navigate('/entrar')}
              variant="outline"
              disabled={profileLoading}
              className="h-10 rounded-full border-brand-brown/15 bg-white px-3 text-brand-brown hover:bg-stone-50 md:px-4"
              aria-label="Entrar como cliente"
              title="Entrar"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden text-xs font-bold sm:inline">Entrar</span>
            </Button>
          )}

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
        {mobileSearchInput}
      </div>
    </header>
  );
}
