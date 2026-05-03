export const CUSTOMER_PASSWORD_REQUIREMENTS =
  'Use pelo menos 8 caracteres, 1 numero e 1 caractere especial.';

export const formatBrazilianWhatsApp = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;

  const areaCode = digits.slice(0, 2);

  if (digits.length <= 7) {
    return `(${areaCode}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${areaCode}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${areaCode}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const validateCustomerPassword = (password: string) => {
  if (password.length < 8) {
    return CUSTOMER_PASSWORD_REQUIREMENTS;
  }

  if (!/\d/.test(password)) {
    return CUSTOMER_PASSWORD_REQUIREMENTS;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return CUSTOMER_PASSWORD_REQUIREMENTS;
  }

  return null;
};
