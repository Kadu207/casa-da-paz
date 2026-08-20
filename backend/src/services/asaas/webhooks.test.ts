import { afterEach, describe, expect, it } from 'vitest';
import { mapAsaasPaymentStatus, mapBillingType, validateAsaasWebhookToken } from './webhooks.js';

describe('asaas webhook mappers', () => {
  const prevToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const prevEnv = process.env.CASADAPAZ_ENV;
  const prevNode = process.env.NODE_ENV;

  afterEach(() => {
    if (prevToken === undefined) delete process.env.ASAAS_WEBHOOK_TOKEN;
    else process.env.ASAAS_WEBHOOK_TOKEN = prevToken;
    if (prevEnv === undefined) delete process.env.CASADAPAZ_ENV;
    else process.env.CASADAPAZ_ENV = prevEnv;
    if (prevNode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNode;
  });

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

  it('validateAsaasWebhookToken rejeita ausente e aceita match', () => {
    delete process.env.CASADAPAZ_ENV;
    delete process.env.NODE_ENV;
    process.env.ASAAS_WEBHOOK_TOKEN = 'token-teste-forte';
    expect(validateAsaasWebhookToken(undefined)).toBe(false);
    expect(validateAsaasWebhookToken('errado')).toBe(false);
    expect(validateAsaasWebhookToken('token-teste-forte')).toBe(true);
  });

  it('validateAsaasWebhookToken em produção rejeita default de dev (token vazio)', () => {
    process.env.CASADAPAZ_ENV = 'production';
    process.env.ASAAS_WEBHOOK_TOKEN = 'asaas-dev-webhook-token';
    expect(validateAsaasWebhookToken('asaas-dev-webhook-token')).toBe(false);
  });
});
