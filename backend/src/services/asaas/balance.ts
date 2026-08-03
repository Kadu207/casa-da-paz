import { asaasFetch } from './client.js';

export interface AsaasBalance {
  balance: number;
}

export async function getAsaasBalance(): Promise<AsaasBalance> {
  return asaasFetch<AsaasBalance>('/finance/balance');
}
