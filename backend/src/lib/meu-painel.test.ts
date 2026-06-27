import { describe, expect, it } from 'vitest';
import { canAccess, canManageTargetUser, effectiveGrants } from '../policies/rbac.js';
import { buildMeuPainelFinanceiro } from './meu-painel.js';

describe('buildMeuPainelFinanceiro', () => {
  it('resume transacoes e filtra mensalidades', () => {
    const result = buildMeuPainelFinanceiro([
      {
        id: 1,
        categoria: 'MENSALIDADE',
        valor: 50,
        status: 'CONCLUIDO',
        vencimento: new Date('2026-06-01'),
        dataTransacao: new Date('2026-06-05'),
      },
      {
        id: 2,
        categoria: 'MENSALIDADE',
        valor: 50,
        status: 'PENDENTE',
        vencimento: new Date('2026-05-01'),
        dataTransacao: new Date('2026-05-01'),
      },
      {
        id: 3,
        categoria: 'DOACAO',
        valor: 100,
        status: 'CONCLUIDO',
        vencimento: null,
        dataTransacao: new Date('2026-06-01'),
      },
    ]);

    expect(result.resumo.totalPago).toBe(150);
    expect(result.resumo.totalPendente).toBe(50);
    expect(result.mensalidades).toHaveLength(2);
    expect(result.mensalidades[0].adimplencia).toBe('PAGO');
  });
});

describe('RBAC hierarquia', () => {
  it('SUPERVISOR gerencia usuários operacionais', () => {
    expect(canAccess('SUPERVISOR', 'usuarios', 'write')).toBe(true);
    expect(canManageTargetUser('SUPERVISOR', 'FINANCEIRO')).toBe(true);
    expect(canManageTargetUser('SUPERVISOR', 'ADMIN')).toBe(false);
  });

  it('ADMIN só integrações e logs', () => {
    expect(canAccess('ADMIN', 'integracoes', 'write')).toBe(true);
    expect(canAccess('ADMIN', 'usuarios', 'write')).toBe(false);
    expect(canAccess('ADMIN', 'financeiro', 'read')).toBe(false);
  });

  it('políticas customizadas sobrescrevem padrão', () => {
    expect(canAccess('FINANCEIRO', 'financeiro', 'write')).toBe(true);
    expect(canAccess('FINANCEIRO', 'financeiro', 'write', { financeiro: 'none' })).toBe(false);
    expect(effectiveGrants('RECEPCAO', { financeiro: 'read' }).financeiro).toBe('read');
  });
});
