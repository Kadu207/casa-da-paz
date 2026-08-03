import { asaasFetch } from './client.js';

export interface AsaasCustomerInput {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
}

export async function createAsaasCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function findAsaasCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const digits = cpfCnpj.replace(/\D/g, '');
  const res = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(digits)}&limit=1`
  );
  return res.data?.[0] ?? null;
}

export async function ensureAsaasCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
  const existing = await findAsaasCustomerByCpfCnpj(input.cpfCnpj);
  if (existing) return existing;
  return createAsaasCustomer(input);
}
