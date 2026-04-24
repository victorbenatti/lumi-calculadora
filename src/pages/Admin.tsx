import { 
  Building2, 
  RefreshCcw,
  DollarSign, 
  Info,
  LayoutDashboard,
  Package,
  Plane,
  ShoppingCart,
  LogOut,
  Store
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { useERP } from "../hooks/useERP";

import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useState } from "react";

// Components
import { DashboardOverview } from "../components/DashboardOverview";
import { Inventory } from "../components/Inventory";
import { TripManagement } from "../components/TripManagement";
import { SalesTracker } from "../components/SalesTracker";

type Tab = 'dashboard' | 'inventory' | 'trips' | 'sales';

export default function Admin() {
  const navigate = useNavigate();
  const { rate, loading: rateLoading, error: rateError, lastUpdated, isManualFallback, refetch: refetchRate, setManualRate } = useExchangeRate();
  const { trips, products, sales, refetch: refetchERP } = useERP();
  
  const [iconError, setIconError] = useState(false);
  const [manualRateInput, setManualRateInput] = useState(rate ? rate.toString() : '');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const formattedRate = rate ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rate) : '---';
  const timeString = lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : '---';

  const handleManualRateChange = (val: string) => {
    setManualRateInput(val);
    setManualRate(val);
  }

  const handleRefetchAll = () => {
    refetchRate();
    refetchERP();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8 relative">
        
        {/* Catalog Button */}
        <div className="absolute top-0 left-0 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => navigate('/catalogo')} className="border-brand-brown/20 text-brand-brown hover:bg-brand-brown/5 bg-white shadow-sm rounded-xl">
            <Store className="h-4 w-4 mr-2" />
            Voltar para o Catálogo
          </Button>
        </div>

        {/* Logout Button */}
        <div className="absolute top-0 right-0 mt-4 sm:mt-0">
          <Button variant="outline" onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm rounded-xl">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Header */}
        <header className="flex flex-col items-center justify-center mb-8 mt-4 text-center">
          {!iconError ? (
            <img 
              src="/logo-lumi-importadora.svg" 
              alt="Logo Lumi" 
              className="h-40 w-auto object-contain drop-shadow-md mb-4" 
              onError={() => setIconError(true)}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-brown text-brand-bg shadow-sm mb-4">
              <Building2 className="h-8 w-8" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-brand-brown">Micro-ERP</h1>
          <p className="text-sm font-medium opacity-80 mt-1">Gestão Completa de Revenda</p>
        </header>

        {/* Cotação e Atualização */}
        <Card className="border-brand-brown/20 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-brand-bg p-3 text-brand-brown border border-brand-brown/10">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-brown/80">Cotação Atual (USD → BRL)</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-bold tracking-tight text-brand-brown">
                    {rateLoading && !rate ? "Calculando..." : formattedRate}
                  </h2>
                  {!rateLoading && (
                    <span className="text-xs font-medium text-brand-brown/70">
                      Atualizado às {timeString}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {rateError && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                  <Info className="h-3 w-3" />
                  API Falhou
                </div>
              )}
              
              <div className="flex w-full items-center gap-2">
                {isManualFallback || rateError ? (
                   <Input 
                   type="text" 
                   inputMode="decimal"
                   className="w-24 h-9 bg-white border-brand-brown/30 text-brand-brown"
                   placeholder="Manual"
                   value={manualRateInput}
                   onChange={(e) => handleManualRateChange(e.target.value)}
                 />
                ) : null}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefetchAll} 
                  disabled={rateLoading}
                  className="bg-brand-bg hover:bg-brand-brown/10 text-brand-brown border-brand-brown/20"
                >
                  <RefreshCcw className={`h-4 w-4 mr-2 ${rateLoading ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação por Abas */}
        <div className="flex overflow-x-auto pb-2 gap-2 snap-x">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('dashboard')}
            className={`snap-start min-w-[120px] ${activeTab === 'dashboard' ? 'bg-brand-brown text-brand-bg' : 'text-brand-brown border-brand-brown/20'}`}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Visão Geral
          </Button>
          <Button 
            variant={activeTab === 'trips' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('trips')}
            className={`snap-start min-w-[120px] ${activeTab === 'trips' ? 'bg-brand-brown text-brand-bg' : 'text-brand-brown border-brand-brown/20'}`}
          >
            <Plane className="h-4 w-4 mr-2" />
            Viagens
          </Button>
          <Button 
            variant={activeTab === 'inventory' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('inventory')}
            className={`snap-start min-w-[120px] ${activeTab === 'inventory' ? 'bg-brand-brown text-brand-bg' : 'text-brand-brown border-brand-brown/20'}`}
          >
            <Package className="h-4 w-4 mr-2" />
            Estoque
          </Button>
          <Button 
            variant={activeTab === 'sales' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('sales')}
            className={`snap-start min-w-[120px] ${activeTab === 'sales' ? 'bg-brand-brown text-brand-bg' : 'text-brand-brown border-brand-brown/20'}`}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas
          </Button>
        </div>

        {/* View da Aba Ativa */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'dashboard' && <DashboardOverview sales={sales} products={products} trips={trips} />}
          {activeTab === 'trips' && <TripManagement trips={trips} refetch={refetchERP} exchangeRate={rate} />}
          {activeTab === 'inventory' && <Inventory trips={trips} products={products} refetch={refetchERP} />}
          {activeTab === 'sales' && <SalesTracker sales={sales} products={products} refetch={refetchERP} />}
        </div>
      </div>
    </div>
  );
}
