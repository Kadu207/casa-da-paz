import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

const SENSITIVE_KEYS = new Set([
  'senha',
  'password',
  'senhaAtual',
  'senhaNova',
  'token',
  'authorization',
  'jwt',
  'secret',
  'apiKey',
  'asaas',
  'webhook',
]);

export type AuditAcao =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'login_fail'
  | 'export'
  | 'upload'
  | 'webhook'
  | 'other';

export type RegistrarAuditoriaInput = {
  rota: string;
  motivo?: string;
  usuarioId?: number;
  login?: string;
  setor?: string;
  metodo?: string;
  recurso?: string;
  acao?: AuditAcao | string;
  entidadeTipo?: string;
  entidadeId?: string | number;
  statusHttp?: number;
  sucesso?: boolean;
  detalhe?: Record<string, unknown> | null;
};

export function sanitizeAuditDetalhe(
  value: unknown,
  depth = 0
): Prisma.InputJsonValue | undefined {
  if (value == null || depth > 4) return undefined;
  if (typeof value !== 'object') {
    return value as Prisma.InputJsonValue;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeAuditDetalhe(item, depth + 1))
      .filter((item) => item !== undefined) as Prisma.InputJsonValue;
  }
  const out: Record<string, Prisma.InputJsonValue> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k) || /senha|password|token|secret|authorization/i.test(k)) {
      out[k] = '[redacted]';
      continue;
    }
    const cleaned = sanitizeAuditDetalhe(v, depth + 1);
    if (cleaned !== undefined) out[k] = cleaned;
  }
  return out;
}

function clientIp(req: Request): string | undefined {
  return (
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
      : undefined) ?? req.socket.remoteAddress ?? undefined
  );
}

/** Persistência fail-soft: nunca derruba a request se o audit falhar. */
export async function registrarAuditoria(
  req: Request,
  data: RegistrarAuditoriaInput
): Promise<void> {
  try {
    const fromUser = req.user;
    await prisma.adminAuditLog.create({
      data: {
        rota: data.rota.slice(0, 120),
        motivo: data.motivo,
        usuarioId: data.usuarioId ?? fromUser?.userId,
        login: (data.login ?? fromUser?.login)?.slice(0, 50),
        setor: (data.setor ?? fromUser?.setorAcesso)?.slice(0, 50),
        metodo: data.metodo?.slice(0, 10) ?? req.method.slice(0, 10),
        recurso: data.recurso?.slice(0, 60),
        acao: data.acao?.slice(0, 40),
        entidadeTipo: data.entidadeTipo?.slice(0, 60),
        entidadeId:
          data.entidadeId != null ? String(data.entidadeId).slice(0, 80) : undefined,
        statusHttp: data.statusHttp,
        sucesso: data.sucesso ?? (data.statusHttp == null ? true : data.statusHttp < 400),
        detalhe: data.detalhe ? sanitizeAuditDetalhe(data.detalhe) : undefined,
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
      },
    });
  } catch (err) {
    console.error('[auditoria] falha ao registrar:', err);
  }
}

/** Mapeia path /api/... → recurso + rota canônica. */
export function inferAuditFromPath(method: string, path: string): {
  recurso: string;
  rota: string;
  acao: AuditAcao;
} {
  const clean = path.split('?')[0]?.replace(/\/+/g, '/') ?? path;
  const parts = clean.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const recurso = parts[0] ?? 'api';
  const acao: AuditAcao =
    method === 'POST'
      ? 'create'
      : method === 'DELETE'
        ? 'delete'
        : method === 'PUT' || method === 'PATCH'
          ? 'update'
          : 'other';
  const rota = `api.${parts.slice(0, 3).join('.') || recurso}.${acao}`;
  return { recurso, rota: rota.slice(0, 120), acao };
}
