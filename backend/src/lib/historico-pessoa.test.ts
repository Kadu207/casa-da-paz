import { describe, expect, it } from 'vitest';
import { buildHistoricoResumo } from './historico-pessoa.js';

describe('buildHistoricoResumo', () => {
  it('separa pago, pendente e atrasados', () => {
    const resumo = buildHistoricoResumo(
      [
        { status: 'CONCLUIDO', vencimento: null, valor: 50 },
        { status: 'PENDENTE', vencimento: new Date(2026, 4, 1), valor: 150 },
        { status: 'PENDENTE', vencimento: new Date(2026, 7, 1), valor: 150 },
      ],
      new Date(2026, 5, 15)
    );
    expect(resumo.totalPago).toBe(50);
    expect(resumo.totalPendente).toBe(300);
    expect(resumo.atrasadosQtd).toBe(1);
  });
});
