import { describe, expect, it } from 'vitest';
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
