import type { Prisma, PrismaClient } from '@prisma/client';
import { normalizarTelefone } from './deduplicacao.js';

type DbClient = PrismaClient | Prisma.TransactionClient;

export class ReservaPessoaAmbiguoError extends Error {
  constructor(public readonly pessoasIds: number[]) {
    super('Mais de uma pessoa com este telefone — recepção deve resolver');
    this.name = 'ReservaPessoaAmbiguoError';
  }
}

/**
 * Resolve pessoa para reserva pública: exact match em telefoneDigitos.
 * 0 → cria CONSULENTE; 1 → reutiliza; >1 → ambiguidade.
 */
export async function resolverPessoaReserva(
  prisma: DbClient,
  input: { nome: string; telefone: string; email?: string | null }
): Promise<number> {
  const digits = normalizarTelefone(input.telefone);
  if (!digits || digits.length < 8) {
    throw new Error('Telefone inválido');
  }

  const matches = await prisma.pessoa.findMany({
    where: { telefoneDigitos: digits },
    select: { id: true },
    take: 5,
  });

  if (matches.length > 1) {
    throw new ReservaPessoaAmbiguoError(matches.map((p) => p.id));
  }
  if (matches.length === 1) {
    const id = matches[0]!.id;
    if (input.email) {
      await prisma.pessoa.update({
        where: { id },
        data: { email: input.email },
      });
    }
    return id;
  }

  const pessoa = await prisma.pessoa.create({
    data: {
      nomeCompleto: input.nome.trim(),
      telefone: digits,
      telefoneDigitos: digits,
      email: input.email?.trim() || null,
      tipoPerfil: 'CONSULENTE',
      maiorDeIdade: true,
    },
  });
  return pessoa.id;
}
