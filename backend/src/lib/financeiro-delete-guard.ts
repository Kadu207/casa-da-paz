/** Bloqueia DELETE se transação ligada a inscrição ativa ou movimentação de estoque. */
export function transacaoObservacaoEventoId(observacoes: string | null): number | null {
  const m = observacoes?.match(/Inscrição evento #(\d+)/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

export function bloqueiaDeleteTransacao(input: {
  transacaoId: number;
  observacoes: string | null;
  temInscricaoAtiva: boolean;
  temMovimentacaoEstoque: boolean;
}): string | null {
  if (input.temMovimentacaoEstoque) {
    return 'Transação vinculada a movimentação de estoque';
  }
  if (input.temInscricaoAtiva) {
    return 'Transação vinculada a inscrição ativa';
  }
  return null;
}
