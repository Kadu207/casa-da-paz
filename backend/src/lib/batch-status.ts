export type TransacaoStatus = 'PENDENTE' | 'CONCLUIDO';

export type BatchStatusRow = {
  id: number;
  status: TransacaoStatus;
  pessoaId: number | null;
};

export type BatchStatusErro = { id: number; motivo: string };

export type BatchStatusPlan = {
  toUpdate: number[];
  ignorados: number;
  erros: BatchStatusErro[];
};

/** Planeja batch idempotente: já no status alvo → ignorado; inexistente → erro. */
export function planBatchStatusUpdate(
  ids: number[],
  targetStatus: TransacaoStatus,
  rowsById: Map<number, BatchStatusRow>,
  canUpdate: (row: BatchStatusRow) => boolean = () => true
): BatchStatusPlan {
  const seen = new Set<number>();
  const toUpdate: number[] = [];
  const erros: BatchStatusErro[] = [];
  let ignorados = 0;

  for (const rawId of ids) {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      erros.push({ id: rawId as number, motivo: 'ID inválido' });
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);

    const row = rowsById.get(id);
    if (!row) {
      erros.push({ id, motivo: 'Transação não encontrada' });
      continue;
    }
    if (!canUpdate(row)) {
      erros.push({ id, motivo: 'Acesso negado' });
      continue;
    }
    if (row.status === targetStatus) {
      ignorados += 1;
      continue;
    }
    toUpdate.push(id);
  }

  return { toUpdate, ignorados, erros };
}
