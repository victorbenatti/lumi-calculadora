import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Trip = Database['public']['Tables']['viagens']['Row'];
type Product = Database['public']['Tables']['produtos']['Row'];
type Sale = Database['public']['Tables']['vendas']['Row'];

export function useERP() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: newTrips },
        { data: newProducts },
        { data: newSales }
      ] = await Promise.all([
        supabase.from('viagens').select('*').order('data', { ascending: false }),
        supabase.from('produtos').select('*').order('nome', { ascending: true }),
        supabase.from('vendas').select('*').order('data_venda', { ascending: false })
      ]);

      if (newTrips) setTrips(newTrips);
      if (newProducts) setProducts(newProducts);
      if (newSales) setSales(newSales);
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
    loading,
    refetch: fetchData
  };
}
