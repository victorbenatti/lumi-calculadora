import {
  Building2,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plane,
  RefreshCcw,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardOverview } from "../components/DashboardOverview";
import { ExchangeRateCard } from "../components/ExchangeRateCard";
import { FinancialDashboard } from "../components/FinancialDashboard";
import { Inventory } from "../components/Inventory";
import { SalesTracker } from "../components/SalesTracker";
import { TripManagement } from "../components/TripManagement";
import { Button } from "../components/ui/Button";
import { useERP } from "../hooks/useERP";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { supabase } from "../lib/supabase";
import { getActiveFinancialConfig } from "../utils/finance";

type Tab = 'dashboard' | 'inventory' | 'trips' | 'sales' | 'finance';

const tabItems = [
  {
    id: 'dashboard',
    label: 'Visão Geral',
    description: 'Indicadores e saúde do negócio',
    icon: LayoutDashboard,
  },
  {
    id: 'trips',
    label: 'Viagens',
    description: 'Compras, cotação e logística',
    icon: Plane,
  },
  {
    id: 'inventory',
    label: 'Estoque',
    description: 'Produtos, preços e catálogo',
    icon: Package,
  },
  {
    id: 'sales',
    label: 'Vendas',
    description: 'Baixa manual e histórico',
    icon: ShoppingCart,
  },
  {
    id: 'finance',
    label: 'Financeiro',
    description: 'Caixa, reposição e retiradas',
    icon: Landmark,
  },
] satisfies Array<{
  id: Tab;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}>;

export default function Admin() {
  const navigate = useNavigate();
  const { rate, loading: rateLoading, error: rateError, lastUpdated, isManualFallback, refetch: refetchRate, setManualRate } = useExchangeRate();
  const { trips, products, sales, financialConfigs, financialWithdrawals, refetch: refetchERP } = useERP();

  const [iconError, setIconError] = useState(false);
  const [manualRateInput, setManualRateInput] = useState(rate ? rate.toString() : '');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeFinancialConfig = getActiveFinancialConfig(financialConfigs);
  const activeItem = tabItems.find(item => item.id === activeTab) || tabItems[0];
  const ActiveIcon = activeItem.icon;

  const handleManualRateChange = (val: string) => {
    setManualRateInput(val);
    setManualRate(val);
  };

  const handleRefetchAll = () => {
    refetchRate();
    refetchERP();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  const renderNavItems = (compact = false) => (
    <nav className="space-y-1.5">
      {tabItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabChange(item.id)}
            className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
              isActive
                ? 'border-brand-brown bg-brand-brown text-brand-bg shadow-lift'
                : 'border-transparent text-brand-brown/78 hover:border-brand-brown/10 hover:bg-brand-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                isActive ? 'bg-brand-bg/15 text-brand-bg' : 'bg-brand-sand/60 text-brand-brown'
              }`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{item.label}</span>
                {!compact && (
                  <span className={`block truncate text-xs ${isActive ? 'text-brand-bg/72' : 'text-brand-brown/50'}`}>
                    {item.description}
                  </span>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );

  const renderContent = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <ExchangeRateCard
            rate={rate}
            rateLoading={rateLoading}
            rateError={rateError}
            lastUpdated={lastUpdated}
            isManualFallback={isManualFallback}
            manualRateInput={manualRateInput}
            onManualRateChange={handleManualRateChange}
            onRefetch={handleRefetchAll}
          />
          <DashboardOverview sales={sales} products={products} trips={trips} financialConfig={activeFinancialConfig} />
        </div>
      )}
      {activeTab === 'trips' && <TripManagement trips={trips} refetch={refetchERP} exchangeRate={rate} />}
      {activeTab === 'inventory' && <Inventory trips={trips} products={products} refetch={refetchERP} />}
      {activeTab === 'sales' && (
        <SalesTracker
          sales={sales}
          products={products}
          financialConfig={activeFinancialConfig}
          financialConfigs={financialConfigs}
          refetch={refetchERP}
        />
      )}
      {activeTab === 'finance' && (
        <FinancialDashboard
          sales={sales}
          products={products}
          financialConfig={activeFinancialConfig}
          financialWithdrawals={financialWithdrawals}
          refetch={refetchERP}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg/70 text-brand-brown">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-brand-brown/8 bg-white px-4 py-5 lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
          <div className="mb-7 flex items-center gap-3 px-2">
            {!iconError ? (
              <img
                src="/logo-lumi-importadora.svg"
                alt="Logo Lumi"
                className="h-12 w-12 rounded-lg object-contain"
                onError={() => setIconError(true)}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-brown text-brand-bg">
                <Building2 className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-base font-extrabold leading-tight">Lumi ERP</h1>
              <p className="text-xs font-medium text-brand-brown/55">Gestão de revenda</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-brown/45">Módulos</p>
            {renderNavItems()}
          </div>

          <div className="mt-5 space-y-2 border-t border-brand-brown/10 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/catalogo')}
              className="w-full justify-start border-brand-brown/15 bg-white text-brand-brown hover:bg-brand-bg"
            >
              <Store className="h-4 w-4 mr-2" />
              Catálogo
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-brand-brown/10 bg-brand-bg/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileNavOpen(true)}
                className="border-brand-brown/20 bg-white text-brand-brown"
                aria-label="Abrir navegação"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-brown/50">Lumi ERP</p>
                <div className="flex items-center gap-2">
                  <ActiveIcon className="h-4 w-4 shrink-0" />
                  <h1 className="truncate text-base font-extrabold">{activeItem.label}</h1>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {mobileNavOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-brand-brown/30 backdrop-blur-[1px]"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fechar navegação"
              />
              <aside className="relative flex h-full w-[min(86vw,22rem)] flex-col bg-white p-4 shadow-2xl">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-brown text-brand-bg">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">Lumi ERP</p>
                      <p className="text-xs text-brand-brown/55">Painel administrativo</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMobileNavOpen(false)}
                    className="border-brand-brown/15 text-brand-brown"
                    aria-label="Fechar navegação"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {renderNavItems()}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-brand-brown/10 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileNavOpen(false);
                      navigate('/catalogo');
                    }}
                    className="border-brand-brown/15 bg-white text-brand-brown"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Catálogo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </aside>
            </div>
          )}

          <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div className="hidden items-end justify-between gap-6 lg:flex">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-brown/45">Administração</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-brown/8 bg-white text-brand-brown shadow-card">
                    <ActiveIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{activeItem.label}</h2>
                    <p className="text-sm font-medium text-brand-brown/60">{activeItem.description}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleRefetchAll}
                disabled={rateLoading}
                className="border-brand-brown/20 bg-white text-brand-brown hover:bg-brand-bg"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${rateLoading ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            </div>

            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
