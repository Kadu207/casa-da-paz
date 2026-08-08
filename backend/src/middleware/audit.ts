import type { NextFunction, Request, Response } from 'express';
import { inferAuditFromPath, registrarAuditoria } from '../lib/auditoria.js';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Registra mutações /api/* após a resposta (fail-soft). */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING.has(req.method)) {
    next();
    return;
  }

  const path = req.originalUrl || req.url || '';
  if (!path.startsWith('/api/') || path.startsWith('/api/health')) {
    next();
    return;
  }
  // Login tem registro explícito (sucesso/falha com login tentado)
  if (path.startsWith('/api/auth/login')) {
    next();
    return;
  }

  res.on('finish', () => {
    const { recurso, rota, acao } = inferAuditFromPath(req.method, path);
    const entityParam =
      req.params?.id ?? req.params?.slug ?? (req.body as { id?: unknown } | undefined)?.id;

    void registrarAuditoria(req, {
      rota,
      recurso,
      acao,
      metodo: req.method,
      statusHttp: res.statusCode,
      sucesso: res.statusCode < 400,
      entidadeId: entityParam != null ? String(entityParam) : undefined,
      motivo: res.statusCode >= 400 ? `http_${res.statusCode}` : undefined,
    });
  });

  next();
}
