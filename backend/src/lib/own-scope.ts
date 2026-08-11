import type { Request, Response } from 'express';
import type { Resource } from '../policies/rbac.js';
import { isOwnScope } from '../policies/rbac.js';

/** True se o usuário autenticado tem grant efetivo `own` no recurso. */
export function reqIsOwnScope(req: Request, resource: Resource): boolean {
  const user = req.user;
  if (!user) return false;
  return isOwnScope(user.setorAcesso, resource, user.policies ?? null);
}

/**
 * Bloqueia agregados org-wide para quem só tem `own`.
 * Retorna true se a resposta já foi enviada (403).
 */
export function denyOwnOrgWide(req: Request, res: Response, resource: Resource): boolean {
  if (!reqIsOwnScope(req, resource)) return false;
  res.status(403).json({ error: 'Acesso negado' });
  return true;
}

/** Where Prisma `{ pessoaId }` quando escopo é `own`; senão undefined. */
export function ownPessoaWhere(
  req: Request,
  resource: Resource
): { pessoaId: number } | undefined {
  if (!reqIsOwnScope(req, resource)) return undefined;
  return { pessoaId: req.user!.pessoaId };
}

/** True se pode ver/alterar o registro da pessoa (staff) ou se é o próprio dono (`own`). */
export function canAccessPessoaId(req: Request, resource: Resource, pessoaId: number | null): boolean {
  if (!reqIsOwnScope(req, resource)) return true;
  if (pessoaId == null) return false;
  return pessoaId === req.user!.pessoaId;
}
