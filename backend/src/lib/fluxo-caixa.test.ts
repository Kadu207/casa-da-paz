import { describe, it, expect } from 'vitest';
import {
  resolverPeriodo,
  semanaIso,
  agruparPorSemana,
  agruparPorCategoria,
  calcularTotaisConcluidos,
  calcularTotaisPendentes,
  type TransacaoFluxo,
} from './fluxo-caixa.js';

const tx = (partial: Partial<TransacaoFluxo> & Pick<TransacaoFluxo, 'valor'>): TransacaoFluxo => ({
  tipo: 'RECEITA',
  categoria: 'MENSALIDADE',
  status: 'CONCLUIDO',
  dataTransacao: new Date(2026, 5, 10),
  vencimento: null,
  ...partial,
});

describe('resolverPeriodo', () => {
  it('resolve mes e ano', () => {
    const p = resolverPeriodo({ mes: 6, ano: 2026 });
    expect(typeof p).not.toBe('string');
    if (typeof p === 'string') return;
    expect(p.de.getMonth()).toBe(5);
    expect(p.de.getDate()).toBe(1);
    expect(p.ate.getDate()).toBe(30);
  });

  it('resolve de e ate', () => {
    const p = resolverPeriodo({ de: '2026-06-01', ate: '2026-06-15' });
    expect(typeof p).not.toBe('string');
  });

  it('rejeita de posterior a ate', () => {
    expect(resolverPeriodo({ de: '2026-06-20', ate: '2026-06-01' })).toBe(
      'de não pode ser posterior a ate'
    );
  });

  it('rejeita mes e de juntos', () => {
    expect(resolverPeriodo({ mes: 6, ano: 2026, de: '2026-06-01' })).toBe(
      'Use mes/ano ou de/ate, não ambos'
    );
  });
});

describe('calcularTotaisConcluidos', () => {
  it('soma receitas e despesas concluidas', () => {
    const totais = calcularTotaisConcluidos([
      tx({ tipo: 'RECEITA', valor: 100 }),
      tx({ tipo: 'DESPESA', valor: 40, categoria: 'INSUMOS_TERREIRO' }),
      tx({ tipo: 'RECEITA', valor: 50, status: 'PENDENTE' }),
    ]);
    expect(totais.receitasConcluidas).toBe(100);
    expect(totais.despesasConcluidas).toBe(40);
    expect(totais.saldo).toBe(60);
  });
});

describe('calcularTotaisPendentes', () => {
  it('conta pendentes e atrasados', () => {
    const totais = calcularTotaisPendentes(
      [
        tx({ valor: 80, status: 'PENDENTE', vencimento: new Date('2020-01-01') }),
        tx({ valor: 20, status: 'PENDENTE', vencimento: new Date('2027-01-01') }),
      ],
      new Date('2026-06-08')
    );
    expect(totais.pendentesQtd).toBe(2);
    expect(totais.pendentesValor).toBe(100);
    expect(totais.atrasadosQtd).toBe(1);
    expect(totais.atrasadosValor).toBe(80);
  });
});

describe('agruparPorSemana', () => {
  it('acumula saldo por semana', () => {
    const periodo = resolverPeriodo({ mes: 6, ano: 2026 });
    if (typeof periodo === 'string') throw new Error(periodo);

    const semanas = agruparPorSemana(
      [
        tx({ valor: 100, dataTransacao: new Date(2026, 5, 3) }),
        tx({
          tipo: 'DESPESA',
          valor: 30,
          categoria: 'CUSTOS_OPERACIONAIS',
          dataTransacao: new Date(2026, 5, 3),
        }),
        tx({ valor: 50, dataTransacao: new Date(2026, 5, 12) }),
      ],
      periodo
    );

    expect(semanas.length).toBeGreaterThanOrEqual(2);
    expect(semanas[0].receitas).toBe(100);
    expect(semanas[0].despesas).toBe(30);
    expect(semanas.at(-1)?.saldoAcumulado).toBe(120);
  });
});

describe('agruparPorCategoria', () => {
  it('agrupa por tipo', () => {
    const { receitas, despesas } = agruparPorCategoria([
      tx({ categoria: 'MENSALIDADE', valor: 90 }),
      tx({ categoria: 'DOACAO', valor: 10 }),
      tx({ tipo: 'DESPESA', categoria: 'INSUMOS_TERREIRO', valor: 25 }),
    ]);
    expect(receitas).toHaveLength(2);
    expect(despesas).toHaveLength(1);
    expect(receitas[0].valor).toBe(90);
  });
});

describe('semanaIso', () => {
  it('retorna formato YYYY-Wnn', () => {
    expect(semanaIso(new Date(2026, 5, 8))).toMatch(/^\d{4}-W\d{2}$/);
  });
});
