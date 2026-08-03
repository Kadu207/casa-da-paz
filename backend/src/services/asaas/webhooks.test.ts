import { describe, it, expect } from 'vitest';
import { mapAsaasPaymentStatus, mapBillingType } from './webhooks.js';

describe('asaas webhook mappers', () => {
  it('maps payment statuses', () => {
    expect(mapAsaasPaymentStatus('RECEIVED')).toBe('RECEIVED');
    expect(mapAsaasPaymentStatus('CONFIRMED')).toBe('CONFIRMED');
    expect(mapAsaasPaymentStatus('OVERDUE')).toBe('OVERDUE');
    expect(mapAsaasPaymentStatus('unknown')).toBe('PENDING');
  });

  it('maps billing types', () => {
    expect(mapBillingType('PIX')).toBe('PIX');
    expect(mapBillingType('BOLETO')).toBe('BOLETO');
    expect(mapBillingType('CREDIT_CARD')).toBe('CREDIT_CARD');
    expect(mapBillingType('OTHER')).toBe('UNDEFINED');
  });
});
