import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Trip = Database['public']['Tables']['viagens']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];
type Sale = Database['public']['Tables']['vendas']['Row'];
type FinancialConfig = Database['public']['Tables']['financeiro_configuracoes']['Row'];
type FinancialWithdrawal = Database['public']['Tables']['financeiro_retiradas']['Row'];

export function useERP() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [financialConfigs, setFinancialConfigs] = useState<FinancialConfig[]>([]);
  const [financialWithdrawals, setFinancialWithdrawals] = useState<FinancialWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: newTrips },
        { data: newProducts },
        { data: newSales },
        { data: newFinancialConfigs },
        { data: newFinancialWithdrawals }
      ] = await Promise.all([
        supabase.from('viagens').select('*').order('data', { ascending: false }),
        supabase.from('produtos').select('*').order('nome', { ascending: true }),
        supabase.from('vendas').select('*').order('data_venda', { ascending: false }),
        supabase.from('financeiro_configuracoes').select('*').order('created_at', { ascending: false }),
        supabase.from('financeiro_retiradas').select('*').order('data_retirada', { ascending: false })
      ]);

      if (newTrips) setTrips(newTrips);
      if (newProducts) setProducts(newProducts);
      if (newSales) setSales(newSales);
      if (newFinancialConfigs) setFinancialConfigs(newFinancialConfigs);
      if (newFinancialWithdrawals) setFinancialWithdrawals(newFinancialWithdrawals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trips,
    products,
    sales,
    financialConfigs,
    financialWithdrawals,
    loading,
    refetch: fetchData
  };
}
