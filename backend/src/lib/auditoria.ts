import type { Request } from 'express';
import { prisma } from './prisma.js';

export async function registrarAuditoria(
  req: Request,
  data: { rota: string; motivo?: string; usuarioId?: number; setor?: string }
): Promise<void> {
  const ip =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
      : undefined) ?? req.socket.remoteAddress;
  await prisma.adminAuditLog.create({
    data: {
      rota: data.rota,
      motivo: data.motivo,
      usuarioId: data.usuarioId,
      setor: data.setor,
      ip: ip ?? undefined,
      userAgent: req.headers['user-agent'],
    },
  });
}
