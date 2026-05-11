/**
 * Parses a decimal string accepting both `,` and `.` as decimal separators.
 * Returns 0 for empty or non-finite input.
 */
export const parseDecimalInput = (value: string): number => {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Parses a BRL-style money input. Handles thousand separators and currency symbols
 * (e.g. "R$ 1.234,56", "1.234,56", "1234.56", "1234,56").
 */
export const parseMoneyInput = (value: string): number => {
  const cleaned = value.trim().replace(/[^\d,.-]/g, '');
  const normalized = cleaned.includes(',') && cleaned.includes('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.');

  return parseFloat(normalized);
};

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formats a number as Brazilian Real (BRL) currency.
 */
export const formatCurrency = (value: number): string => brlFormatter.format(value);
