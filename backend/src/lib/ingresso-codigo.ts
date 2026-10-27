import type { Prisma, PrismaClient } from '@prisma/client';
import { gerarCodigoIngresso } from './ingressos.js';

type DbClient = PrismaClient | Prisma.TransactionClient;

/** Gera código único com retries curtos contra colisão. */
export async function alocarCodigoIngresso(prisma: DbClient, tentativas = 8): Promise<string> {
  for (let i = 0; i < tentativas; i++) {
    const codigo = gerarCodigoIngresso(8);
    const existe = await prisma.inscricao.findUnique({
      where: { codigo },
      select: { id: true },
    });
    if (!existe) return codigo;
  }
  throw new Error('Não foi possível gerar código de ingresso');
}
