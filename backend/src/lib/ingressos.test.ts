import { describe, expect, it } from 'vitest';
import {
  gerarCodigoIngresso,
  loteEsgotado,
  normalizarCodigoIngresso,
  podeCancelarInscricao,
  podeCheckinPorCodigo,
  podeReservarLote,
  somaLotesAtivosExcedeCapacidade,
  vagasRestantes,
} from './ingressos.js';

describe('ingressos', () => {
  it('gera código com tamanho e alfabeto seguros', () => {
    const c = gerarCodigoIngresso(8);
    expect(c).toHaveLength(8);
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]+$/);
  });

  it('normaliza código', () => {
    expect(normalizarCodigoIngresso(' ab-12cd ')).toBe('AB12CD');
  });

  it('calcula vagas restantes', () => {
    expect(vagasRestantes(10, 3)).toBe(7);
    expect(vagasRestantes(5, 5)).toBe(0);
    expect(loteEsgotado(5, 5)).toBe(true);
  });

  it('bloqueia soma de lotes acima da capacidade', () => {
    expect(
      somaLotesAtivosExcedeCapacidade(20, [
        { quantidade: 10, ativo: true },
        { quantidade: 10, ativo: true },
      ])
    ).toBe(false);
    expect(
      somaLotesAtivosExcedeCapacidade(20, [
        { quantidade: 15, ativo: true },
        { quantidade: 10, ativo: true },
      ])
    ).toBe(true);
    expect(
      somaLotesAtivosExcedeCapacidade(20, [{ quantidade: 15, ativo: true }], {
        quantidade: 6,
        ativo: true,
      })
    ).toBe(true);
  });

  it('valida reserva', () => {
    expect(
      podeReservarLote({
        eventoStatus: 'ABERTO',
        loteAtivo: true,
        quantidade: 10,
        ocupadas: 2,
        jaInscritoAtivo: false,
      })
    ).toBeNull();
    expect(
      podeReservarLote({
        eventoStatus: 'ENCERRADO',
        loteAtivo: true,
        quantidade: 10,
        ocupadas: 0,
        jaInscritoAtivo: false,
      })
    ).toBe('Evento encerrado');
    expect(
      podeReservarLote({
        eventoStatus: 'ABERTO',
        loteAtivo: true,
        quantidade: 2,
        ocupadas: 2,
        jaInscritoAtivo: false,
      })
    ).toBe('Lote esgotado');
  });

  it('valida cancelamento e check-in por código', () => {
    expect(podeCancelarInscricao({ canceladaEm: null, statusPagamento: 'PENDENTE' })).toBeNull();
    expect(podeCancelarInscricao({ canceladaEm: null, statusPagamento: 'CONCLUIDO' })).toBe(
      'Só é possível cancelar inscrição pendente'
    );
    expect(
      podeCheckinPorCodigo({
        eventoStatus: 'ABERTO',
        eventoIdEsperado: 1,
        inscricaoEventoId: 1,
        canceladaEm: null,
        jaPresente: false,
      })
    ).toBeNull();
    expect(
      podeCheckinPorCodigo({
        eventoStatus: 'ABERTO',
        eventoIdEsperado: 1,
        inscricaoEventoId: 2,
        canceladaEm: null,
        jaPresente: false,
      })
    ).toBe('Código pertence a outro evento');
  });
});
