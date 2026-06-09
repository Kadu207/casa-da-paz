import { describe, expect, it } from 'vitest';
import {
  buildConciliacaoChecklist,
  buildConciliacaoTotais,
  snapshotFechamento,
} from './conciliacao.js';

const periodo = {
  de: new Date(2026, 5, 1),
  ate: new Date(2026, 5, 30, 23, 59, 59, 999),
};

describe('buildConciliacaoChecklist', () => {
  it('conta mensalidades pendentes, atrasados e despesas no mês', () => {
    const checklist = buildConciliacaoChecklist(
      [
        {
          tipo: 'RECEITA',
          categoria: 'MENSALIDADE',
          status: 'PENDENTE',
          dataTransacao: new Date(2026, 5, 6),
          vencimento: new Date(2026, 4, 6),
          valor: 150,
        },
        {
          tipo: 'DESPESA',
          categoria: 'INSUMOS_TERREIRO',
          status: 'CONCLUIDO',
          dataTransacao: new Date(2026, 5, 10),
          vencimento: null,
          valor: 200,
        },
      ],
      periodo,
      new Date(2026, 5, 15)
    );
    expect(checklist.mensalidadesPendentes).toBe(0);
    expect(checklist.atrasados).toBe(1);
    expect(checklist.despesasNoMes).toBe(1);
  });
});

describe('buildConciliacaoTotais', () => {
  it('soma receitas e despesas concluídas no período', () => {
    const totais = buildConciliacaoTotais(
      [
        {
          tipo: 'RECEITA',
          categoria: 'DOACAO',
          status: 'CONCLUIDO',
          dataTransacao: new Date(2026, 5, 6),
          vencimento: null,
          valor: 50,
        },
        {
          tipo: 'DESPESA',
          categoria: 'INSUMOS_TERREIRO',
          status: 'CONCLUIDO',
          dataTransacao: new Date(2026, 5, 6),
          vencimento: null,
          valor: 200,
        },
      ],
      periodo
    );
    expect(totais).toEqual({ receitas: 50, despesas: 200, saldo: -150 });
  });
});

describe('snapshotFechamento', () => {
  it('mapeia checklist e totais para persistência', () => {
    const snap = snapshotFechamento(
      { mensalidadesPendentes: 2, atrasados: 1, despesasNoMes: 3 },
      { receitas: 100, despesas: 40, saldo: 60 }
    );
    expect(snap).toEqual({
      receitasTotal: 100,
      despesasTotal: 40,
      saldo: 60,
      pendentesQtd: 2,
      atrasadosQtd: 1,
    });
  });
});
