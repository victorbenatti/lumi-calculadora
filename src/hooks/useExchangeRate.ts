import { useState, useEffect, useCallback } from 'react';

interface ExchangeRateData {
  rate: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isManualFallback: boolean;
}

export function useExchangeRate() {
  const [data, setData] = useState<ExchangeRateData>({
    rate: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isManualFallback: false,
  });

  const fetchRate = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
      if (!response.ok) {
        throw new Error('Falha ao buscar cotação');
      }
      
      const json = await response.json();
      const brlRate = parseFloat(json.USDBRL.ask);
      
      setData({
        rate: brlRate,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isManualFallback: false,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      }));
    }
  }, []);

  useEffect(() => {
    fetchRate();
    
    // Atualiza a cada 5 minutos
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  const setManualRate = (rateInput: string) => {
    const rate = parseFloat(rateInput.replace(',', '.')) || 0;
    
    setData((prev) => ({
      ...prev,
      rate: rate > 0 ? rate : null,
      loading: false,
      error: null, // Limpa o erro ao inserir manualmente
      lastUpdated: new Date(),
      isManualFallback: true,
    }));
  };

  return { ...data, refetch: fetchRate, setManualRate };
}
