import { randomBytes } from 'node:crypto';

/** Código curto legível (sem 0/O/1/I) — 8 chars. */
const CODIGO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function gerarCodigoIngresso(tamanho = 8): string {
  const bytes = randomBytes(tamanho);
  let out = '';
  for (let i = 0; i < tamanho; i++) {
    out += CODIGO_ALPHABET[bytes[i]! % CODIGO_ALPHABET.length];
  }
  return out;
}

export function normalizarCodigoIngresso(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function vagasRestantes(quantidade: number, ocupadas: number): number {
  return Math.max(0, quantidade - ocupadas);
}

export function loteEsgotado(quantidade: number, ocupadas: number): boolean {
  return ocupadas >= quantidade;
}

export function somaLotesAtivosExcedeCapacidade(
  capacidadeMax: number | null | undefined,
  lotes: Array<{ id?: number; quantidade: number; ativo: boolean }>,
  override?: { id?: number; quantidade: number; ativo: boolean }
): boolean {
  if (capacidadeMax == null || capacidadeMax <= 0) return false;
  let soma = 0;
  for (const lote of lotes) {
    if (override?.id != null && lote.id === override.id) continue;
    if (lote.ativo) soma += lote.quantidade;
  }
  if (override?.ativo) soma += override.quantidade;
  return soma > capacidadeMax;
}

export function podeReservarLote(input: {
  eventoStatus: 'ABERTO' | 'ENCERRADO';
  loteAtivo: boolean;
  quantidade: number;
  ocupadas: number;
  jaInscritoAtivo: boolean;
}): string | null {
  if (input.eventoStatus !== 'ABERTO') return 'Evento encerrado';
  if (!input.loteAtivo) return 'Lote indisponível';
  if (input.jaInscritoAtivo) return 'Pessoa já inscrita neste evento';
  if (loteEsgotado(input.quantidade, input.ocupadas)) return 'Lote esgotado';
  return null;
}

export function podeCancelarInscricao(input: {
  canceladaEm: Date | null;
  statusPagamento: 'PENDENTE' | 'CONCLUIDO';
}): string | null {
  if (input.canceladaEm) return 'Inscrição já cancelada';
  if (input.statusPagamento !== 'PENDENTE') return 'Só é possível cancelar inscrição pendente';
  return null;
}

export function podeCheckinPorCodigo(input: {
  eventoStatus: 'ABERTO' | 'ENCERRADO';
  eventoIdEsperado: number;
  inscricaoEventoId: number;
  canceladaEm: Date | null;
  jaPresente: boolean;
}): string | null {
  if (input.eventoStatus !== 'ABERTO') return 'Evento encerrado';
  if (input.inscricaoEventoId !== input.eventoIdEsperado) {
    return 'Código pertence a outro evento';
  }
  if (input.canceladaEm) return 'Inscrição cancelada';
  if (input.jaPresente) return 'Pessoa já fez check-in neste evento';
  return null;
}
