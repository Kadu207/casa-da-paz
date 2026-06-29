import type { Prisma } from '@prisma/client';

export interface AlertasQueryFilters {
  tipo?: string;
  disparado?: boolean;
  de?: string;
  ate?: string;
}

export function buildAlertasWhere(q: AlertasQueryFilters): Prisma.AlertaWhereInput {
  const where: Prisma.AlertaWhereInput = {};
  if (q.tipo) where.tipo = q.tipo;
  if (q.disparado !== undefined) where.disparado = q.disparado;
  if (q.de || q.ate) {
    where.createdAt = {};
    if (q.de) where.createdAt.gte = new Date(`${q.de}T00:00:00`);
    if (q.ate) where.createdAt.lte = new Date(`${q.ate}T23:59:59`);
  }
  return where;
}

export type AlertaSortField = 'createdAt' | 'tipo';

export function buildAlertasOrderBy(
  sort: AlertaSortField,
  order: 'asc' | 'desc'
): Prisma.AlertaOrderByWithRelationInput {
  return { [sort]: order };
}
