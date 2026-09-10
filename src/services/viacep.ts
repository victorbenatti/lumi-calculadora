export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export type ViaCepResult = {
  success: boolean;
  data?: ViaCepAddress;
  error?: string;
};

export const sanitizeCep = (cep: string): string => {
  return cep.replace(/\D/g, '').slice(0, 8);
};

export const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export async function fetchAddressByCep(cepInput: string): Promise<ViaCepResult> {
  const clean = sanitizeCep(cepInput);

  if (clean.length !== 8) {
    return {
      success: false,
      error: 'CEP deve conter 8 dígitos.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: 'Não foi possível consultar o CEP no momento.',
      };
    }

    const data: ViaCepAddress = await response.json();

    if (data.erro) {
      return {
        success: false,
        error: 'CEP não encontrado. Verifique o número informado.',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      success: false,
      error: isAbort
        ? 'Tempo limite excedido ao buscar o CEP. Tente novamente.'
        : 'Falha de conexão ao consultar o CEP.',
    };
  }
}
