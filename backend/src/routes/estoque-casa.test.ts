import { describe, expect, it } from 'vitest';
import { canAccess } from '../policies/rbac.js';

describe('RBAC estoque_casa', () => {
  it('SUPERVISOR, ADMIN, DIRETORIA e TESOURARIA têm write', () => {
    expect(canAccess('SUPERVISOR', 'estoque_casa', 'write')).toBe(true);
    expect(canAccess('ADMIN', 'estoque_casa', 'write')).toBe(true);
    expect(canAccess('DIRETORIA', 'estoque_casa', 'write')).toBe(true);
    expect(canAccess('TESOURARIA', 'estoque_casa', 'write')).toBe(true);
  });

  it('MEDIUM sem policy não acessa', () => {
    expect(canAccess('MEDIUM', 'estoque_casa', 'read')).toBe(false);
    expect(canAccess('MEDIUM', 'estoque_casa', 'write')).toBe(false);
  });

  it('MEDIUM com policy write acessa', () => {
    expect(canAccess('MEDIUM', 'estoque_casa', 'write', { estoque_casa: 'write' })).toBe(true);
    expect(canAccess('MEDIUM', 'estoque_casa', 'read', { estoque_casa: 'write' })).toBe(true);
  });

  it('LIVRARIA e MARKETING não acessam estoque_casa', () => {
    expect(canAccess('LIVRARIA', 'estoque_casa', 'read')).toBe(false);
    expect(canAccess('MARKETING', 'estoque_casa', 'read')).toBe(false);
  });

  it('FINANCEIRO não tem estoque_casa por padrão', () => {
    expect(canAccess('FINANCEIRO', 'estoque_casa', 'read')).toBe(false);
  });
});

describe('enrichEstoqueCasaGrants — limpeza não vira write', () => {
  it('documenta contrato: write só via matriz/policy (teste unitário de canAccess)', () => {
    // Responsável limpeza recebe read via enrich (testado em integração);
    // write de catálogo exige grant explícito.
    expect(canAccess('MEDIUM', 'estoque_casa', 'write')).toBe(false);
    expect(canAccess('MEDIUM', 'estoque_casa', 'write', { estoque_casa: 'read' })).toBe(false);
    expect(canAccess('MEDIUM', 'estoque_casa', 'read', { estoque_casa: 'read' })).toBe(true);
  });
});
