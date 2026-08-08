import { describe, expect, it } from 'vitest';
import { inferAuditFromPath, sanitizeAuditDetalhe } from './auditoria.js';

describe('auditoria helpers', () => {
  it('redige campos sensíveis', () => {
    const cleaned = sanitizeAuditDetalhe({
      login: 'admin',
      senha: 'secret',
      nested: { token: 'abc', id: 1 },
    }) as Record<string, unknown>;
    expect(cleaned.login).toBe('admin');
    expect(cleaned.senha).toBe('[redacted]');
    expect((cleaned.nested as Record<string, unknown>).token).toBe('[redacted]');
    expect((cleaned.nested as Record<string, unknown>).id).toBe(1);
  });

  it('infere recurso e ação do path', () => {
    expect(inferAuditFromPath('POST', '/api/pessoas')).toMatchObject({
      recurso: 'pessoas',
      acao: 'create',
    });
    expect(inferAuditFromPath('DELETE', '/api/financeiro/123')).toMatchObject({
      recurso: 'financeiro',
      acao: 'delete',
    });
  });
});
