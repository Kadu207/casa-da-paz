import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/auth.js';
import { canAccess } from '../policies/rbac.js';
import type { SetorAcesso } from '@prisma/client';
import type { PolicyGrants } from '../policies/rbac.js';
import { prisma } from '../lib/prisma.js';
import { resolveSecret } from '../lib/runtime-env.js';

let cachedJwtSecret: string | null = null;

function jwtSecret(): string {
  if (!cachedJwtSecret) {
    cachedJwtSecret = resolveSecret('JWT_SECRET', 'dev-secret-change-me');
  }
  return cachedJwtSecret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: '8h' });
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, jwtSecret()) as JwtPayload;
    let policies: PolicyGrants | null = null;
    if (payload.setorAcesso !== 'SUPERVISOR' && payload.setorAcesso !== 'ADMIN') {
      const row = await prisma.usuarioPolicy.findUnique({
        where: { usuarioId: payload.userId },
      });
      policies = (row?.grants as PolicyGrants | null) ?? null;
    }
    req.user = { ...payload, policies };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function authorize(resource: Parameters<typeof canAccess>[1], action: 'read' | 'write' = 'read') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    if (!canAccess(req.user.setorAcesso as SetorAcesso, resource, action, req.user.policies)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    next();
  };
}

export function requireSupervisor(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.setorAcesso !== 'SUPERVISOR') {
    res.status(403).json({ error: 'Apenas SUPERVISOR' });
    return;
  }
  next();
}
