import type { PrismaClient } from '@prisma/client';
import { normalizarTelefone, telefonesEquivalentes } from './deduplicacao.js';

export async function resolverPessoaId(
  prisma: PrismaClient,
  input: { nome: string; telefone: string; pessoaId?: number | null }
): Promise<number> {
  if (input.pessoaId) {
    const existe = await prisma.pessoa.findUnique({ where: { id: input.pessoaId } });
    if (!existe) throw new Error('Pessoa não encontrada');
    return input.pessoaId;
  }

  const digits = normalizarTelefone(input.telefone);
  const suffix = digits.length >= 9 ? digits.slice(-9) : digits;
  const candidatos = await prisma.pessoa.findMany({
    where: {
      OR: [{ telefoneDigitos: digits }, { telefoneDigitos: { endsWith: suffix } }],
    },
    take: 40,
  });
  const match = candidatos.find((p) => p.telefone && telefonesEquivalentes(input.telefone, p.telefone));
  if (match) return match.id;

  const pessoa = await prisma.pessoa.create({
    data: {
      nomeCompleto: input.nome.trim(),
      telefone: digits || input.telefone,
      telefoneDigitos: digits || null,
      tipoPerfil: 'CONSULENTE',
      maiorDeIdade: true,
    },
  });
  return pessoa.id;
}

export function podeConfirmarAgendamento(status: string): string | null {
  if (status === 'CONFIRMADO') return 'Agendamento já confirmado';
  if (status === 'CANCELADO') return 'Agendamento cancelado';
  return null;
}
