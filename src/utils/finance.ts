/**
 * Taxas progressivas simuladas de maquininha de cartão.
 * ATENÇÃO: Ajuste estes multiplicadores conforme o contrato real da sua adquirente
 * (ex: PagSeguro, Stone, Mercado Pago).
 * 
 * Exemplo: 1.042 significa 4.2% de taxa total sobre o valor da venda.
 */
export const CREDIT_CARD_RATES: Record<number, number> = {
  1: 1.0420,  // 4.2%
  2: 1.0609,  // 6.09%
  3: 1.0701,  // 7.01%
  4: 1.0791,  // 7.91%
  5: 1.0880,  // 8.80%
  6: 1.0967,  // 9.67%
  7: 1.1259,  // 12.59%
  8: 1.1342,  // 13.42%
  9: 1.1425,  // 14.25%
  10: 1.1506, // 15.06%
  11: 1.1587, // 15.87%
  12: 1.1653, // 16.53%
};

/**
 * Calcula o valor da parcela aplicando a taxa de juros correspondente.
 * 
 * @param cashPrice Preço à vista original.
 * @param installments Número de parcelas desejadas (padrão: 12).
 * @returns O valor de CADA parcela já com os juros embutidos.
 */
export function calculateInstallment(cashPrice: number, installments: number = 12): number {
  const rateMultiplier = CREDIT_CARD_RATES[installments] || 1.20; // fallback para 12x
  const totalWithInterest = cashPrice * rateMultiplier;
  return totalWithInterest / installments;
}
