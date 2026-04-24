import { useState, useMemo } from "react";

export interface PricingFormState {
  productName: string;
  costUSD: string;
  marginPercentage: string;
  extraCostsBRL: string;
}

export function usePricingForm(exchangeRate: number | null) {
  const [form, setForm] = useState<PricingFormState>({
    productName: "",
    costUSD: "",
    marginPercentage: "30",
    extraCostsBRL: "",
  });

  const results = useMemo(() => {
    const cost = parseFloat(form.costUSD.replace(',', '.')) || 0;
    const margin = parseFloat(form.marginPercentage.replace(',', '.')) || 0;
    const extra = parseFloat(form.extraCostsBRL.replace(',', '.')) || 0;

    if (!exchangeRate || cost <= 0) {
      return { costBRL: 0, suggestedPrice: 0, grossProfit: 0 };
    }

    const costBRL = (cost * exchangeRate) + extra;
    
    // Formula Markup (Multiplicador): Preço Sugerido = Custo Total * (1 + (Margem / 100))
    const marginDecimal = margin / 100;
    const suggestedPrice = costBRL * (1 + marginDecimal);
    
    // Lucro Bruto: Preço Sugerido - Custo Total
    const grossProfit = suggestedPrice - costBRL;

    return {
      costBRL,
      suggestedPrice,
      grossProfit,
    };
  }, [form, exchangeRate]);

  const updateField = <K extends keyof PricingFormState>(
    field: K,
    value: PricingFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return {
    form,
    updateField,
    results,
  };
}
