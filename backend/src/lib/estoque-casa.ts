import type { SetorAcesso } from '@prisma/client';
import { prisma } from './prisma.js';
import { canAccess, effectiveGrants, type PolicyGrants } from '../policies/rbac.js';

export async function isResponsavelGrupoLimpeza(usuarioId: number, grupoId?: number): Promise<boolean> {
  const row = await prisma.grupoLimpeza.findFirst({
    where: {
      responsavelUsuarioId: usuarioId,
      ativo: true,
      ...(grupoId !== undefined ? { id: grupoId } : {}),
    },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Responsável de limpeza ganha apenas `read` (abre UI / checklist).
 * Write de catálogo/movimentações exige policy ou setor privilegiado — não bypass.
 */
export async function enrichEstoqueCasaGrants(
  usuarioId: number,
  setor: SetorAcesso,
  customGrants?: PolicyGrants | null
): Promise<PolicyGrants> {
  const base = effectiveGrants(setor, customGrants);
  if (base.estoque_casa === 'write' || base.estoque_casa === 'read') {
    return base;
  }
  if (await isResponsavelGrupoLimpeza(usuarioId)) {
    return { ...base, estoque_casa: 'read' };
  }
  return base;
}

export function canAccessEstoqueCasaGrant(
  setor: SetorAcesso,
  action: 'read' | 'write',
  policies?: PolicyGrants | null
): boolean {
  return canAccess(setor, 'estoque_casa', action, policies);
}

export async function ensureAlertaEstoqueMinimo(
  nome: string,
  estoqueAtual: number,
  estoqueMinimo: number
): Promise<void> {
  if (estoqueAtual > estoqueMinimo) return;
  const mensagem = `Estoque baixo: ${nome} (${estoqueAtual}/${estoqueMinimo})`;
  const existing = await prisma.alerta.findFirst({
    where: {
      tipo: 'ESTOQUE_CASA_MINIMO',
      mensagem,
      disparado: false,
    },
  });
  if (existing) return;
  await prisma.alerta.create({
    data: {
      tipo: 'ESTOQUE_CASA_MINIMO',
      mensagem,
      canal: 'SISTEMA',
      disparado: false,
    },
  });
}
