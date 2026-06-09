import { describe, expect, it } from 'vitest';
import { bloqueiaDeleteTransacao, transacaoObservacaoEventoId } from './financeiro-delete-guard.js';

describe('transacaoObservacaoEventoId', () => {
  it('extrai evento da observação', () => {
    expect(transacaoObservacaoEventoId('Inscrição evento #12')).toBe(12);
    expect(transacaoObservacaoEventoId('outro')).toBeNull();
  });
});

describe('bloqueiaDeleteTransacao', () => {
  it('bloqueia estoque e inscrição', () => {
    expect(
      bloqueiaDeleteTransacao({
        transacaoId: 1,
        observacoes: null,
        temInscricaoAtiva: false,
        temMovimentacaoEstoque: true,
      })
    ).toContain('estoque');
    expect(
      bloqueiaDeleteTransacao({
        transacaoId: 1,
        observacoes: 'Inscrição evento #1',
        temInscricaoAtiva: true,
        temMovimentacaoEstoque: false,
      })
    ).toContain('inscrição');
    expect(
      bloqueiaDeleteTransacao({
        transacaoId: 1,
        observacoes: null,
        temInscricaoAtiva: false,
        temMovimentacaoEstoque: false,
      })
    ).toBeNull();
  });
});
