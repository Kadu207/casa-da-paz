import { describe, expect, it } from 'vitest';
import { planBatchStatusUpdate, type BatchStatusRow } from './batch-status.js';

function map(rows: BatchStatusRow[]) {
  return new Map(rows.map((r) => [r.id, r]));
}

describe('planBatchStatusUpdate', () => {
  const rows = map([
    { id: 1, status: 'PENDENTE', pessoaId: 10 },
    { id: 2, status: 'CONCLUIDO', pessoaId: 11 },
    { id: 3, status: 'PENDENTE', pessoaId: 12 },
  ]);

  it('marca pendentes como concluídos', () => {
    const plan = planBatchStatusUpdate([1, 3], 'CONCLUIDO', rows);
    expect(plan.toUpdate).toEqual([1, 3]);
    expect(plan.ignorados).toBe(0);
    expect(plan.erros).toEqual([]);
  });

  it('ignora ids já no status alvo (idempotente)', () => {
    const plan = planBatchStatusUpdate([1, 2], 'CONCLUIDO', rows);
    expect(plan.toUpdate).toEqual([1]);
    expect(plan.ignorados).toBe(1);
  });

  it('reporta ids inexistentes', () => {
    const plan = planBatchStatusUpdate([1, 99], 'CONCLUIDO', rows);
    expect(plan.toUpdate).toEqual([1]);
    expect(plan.erros).toEqual([{ id: 99, motivo: 'Transação não encontrada' }]);
  });

  it('deduplica ids repetidos', () => {
    const plan = planBatchStatusUpdate([1, 1, 1], 'CONCLUIDO', rows);
    expect(plan.toUpdate).toEqual([1]);
  });

  it('bloqueia linha fora do escopo MEDIUM', () => {
    const plan = planBatchStatusUpdate(
      [1, 3],
      'CONCLUIDO',
      rows,
      (row) => row.pessoaId === 10
    );
    expect(plan.toUpdate).toEqual([1]);
    expect(plan.erros).toEqual([{ id: 3, motivo: 'Acesso negado' }]);
  });

  it('rejeita id inválido', () => {
    const plan = planBatchStatusUpdate([0, -1], 'CONCLUIDO', rows);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.erros).toHaveLength(2);
  });
});
