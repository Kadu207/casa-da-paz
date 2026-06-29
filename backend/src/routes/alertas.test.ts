import { describe, expect, it } from 'vitest';
import { canAccess } from '../policies/rbac.js';

describe('RBAC alertas', () => {
  it('DIRETORIA e FINANCEIRO têm write', () => {
    expect(canAccess('DIRETORIA', 'alertas', 'read')).toBe(true);
    expect(canAccess('DIRETORIA', 'alertas', 'write')).toBe(true);
    expect(canAccess('FINANCEIRO', 'alertas', 'write')).toBe(true);
  });

  it('RECEPCAO e SUPORTE têm read-only', () => {
    expect(canAccess('RECEPCAO', 'alertas', 'read')).toBe(true);
    expect(canAccess('RECEPCAO', 'alertas', 'write')).toBe(false);
    expect(canAccess('SUPORTE', 'alertas', 'read')).toBe(true);
    expect(canAccess('SUPORTE', 'alertas', 'write')).toBe(false);
  });

  it('MEDIUM e LIVRARIA não acessam alertas', () => {
    expect(canAccess('MEDIUM', 'alertas', 'read')).toBe(false);
    expect(canAccess('LIVRARIA', 'alertas', 'read')).toBe(false);
  });

  it('SUPERVISOR tem write em alertas', () => {
    expect(canAccess('SUPERVISOR', 'alertas', 'write')).toBe(true);
  });

  it('política customizada pode revogar write do FINANCEIRO', () => {
    expect(canAccess('FINANCEIRO', 'alertas', 'write', { alertas: 'read' })).toBe(false);
    expect(canAccess('FINANCEIRO', 'alertas', 'read', { alertas: 'read' })).toBe(true);
  });
});
