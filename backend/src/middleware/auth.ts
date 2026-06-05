import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/auth.js';
import { canAccess } from '../policies/rbac.js';
import type { SetorAcesso } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET) as JwtPayload;
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
    if (!canAccess(req.user.setorAcesso as SetorAcesso, resource, action)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    next();
  };
}
