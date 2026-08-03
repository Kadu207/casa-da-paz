import { asaasFetch } from './client.js';

export type AsaasBillingTypeApi = 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';

export interface CreatePaymentInput {
  customer: string;
  billingType: AsaasBillingTypeApi;
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  postalService?: boolean;
}

export interface AsaasPayment {
  id: string;
  status: string;
  billingType: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  customer: string;
  externalReference?: string;
  subscription?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export async function createAsaasPayment(input: CreatePaymentInput): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getAsaasPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}

export async function getAsaasPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

export async function deleteAsaasPayment(paymentId: string): Promise<void> {
  await asaasFetch(`/payments/${paymentId}`, { method: 'DELETE' });
}
