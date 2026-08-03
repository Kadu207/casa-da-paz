import { asaasFetch } from './client.js';
import type { AsaasBillingTypeApi } from './payments.js';

export interface CreateSubscriptionInput {
  customer: string;
  billingType: AsaasBillingTypeApi;
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

export interface AsaasSubscription {
  id: string;
  status: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  customer: string;
}

export async function createAsaasSubscription(
  input: CreateSubscriptionInput
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' });
}

export async function getAsaasSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
}
