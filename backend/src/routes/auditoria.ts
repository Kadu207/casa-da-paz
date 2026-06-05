import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { enriquecerLogAuditoria, type AuditLocale } from '../lib/audit-i18n.js';
import { gerarPdfAuditoria } from '../lib/audit-pdf.js';
import { registrarAuditoria } from '../lib/auditoria.js';

const router = Router();

const querySchema = z.object({
  locale: z.enum(['pt-BR', 'en']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  setor: z.string().max(50).optional(),
  rota: z.string().max(120).optional(),
  de: z.string().optional(),
  ate: z.string().optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(['createdAt', 'rota', 'setor']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

function buildWhere(q: z.infer<typeof querySchema>): Prisma.AdminAuditLogWhereInput {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (q.setor) where.setor = q.setor;
  if (q.rota) where.rota = { contains: q.rota, mode: 'insensitive' };
  if (q.de || q.ate) {
    where.createdAt = {};
    if (q.de) where.createdAt.gte = new Date(q.de + 'T00:00:00');
    if (q.ate) where.createdAt.lte = new Date(q.ate + 'T23:59:59');
  }
  if (q.q) {
    where.OR = [
      { motivo: { contains: q.q, mode: 'insensitive' } },
      { rota: { contains: q.q, mode: 'insensitive' } },
      { ip: { contains: q.q } },
    ];
  }
  return where;
}

router.get('/', authenticate, authorize('logs', 'read'), async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { page, limit, sort, order } = parsed.data;
  const locale = (parsed.data.locale ?? 'pt-BR') as AuditLocale;
  const where = buildWhere(parsed.data);
  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { [sort]: order },
      skip,
      take: limit,
    }),
  ]);

  res.json({
    page,
    limit,
    total,
    items: logs.map((log) => enriquecerLogAuditoria(log, locale)),
  });
});

router.get('/export.csv', authenticate, authorize('logs', 'read'), async (req, res) => {
  const parsed = querySchema.omit({ page: true, limit: true }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const locale = (parsed.data.locale ?? 'pt-BR') as AuditLocale;
  const where = buildWhere({ ...parsed.data, page: 1, limit: 25 });

  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  await registrarAuditoria(req, {
    rota: 'admin.auditoria.export.csv',
    motivo: 'export_filtros',
    usuarioId: req.user!.userId,
    setor: req.user!.setorAcesso,
  });

  const header = 'data,setor,rota,rota_label,motivo,motivo_label,ip\n';
  const rows = logs
    .map((log) => {
      const e = enriquecerLogAuditoria(log, locale);
      const cols = [
        e.createdAt.toISOString(),
        e.setor ?? '',
        e.rota,
        e.rotaLabel,
        (e.motivo ?? '').replace(/"/g, '""'),
        (e.motivoLabel ?? '').replace(/"/g, '""'),
        e.ip ?? '',
      ];
      return cols.map((c) => `"${c}"`).join(',');
    })
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=auditoria-casa-da-paz.csv');
  res.send('\uFEFF' + header + rows);
});

router.get('/export.pdf', authenticate, authorize('logs', 'read'), async (req, res) => {
  const parsed = querySchema.omit({ page: true, limit: true }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const locale = (parsed.data.locale ?? 'pt-BR') as AuditLocale;
  const where = buildWhere({ ...parsed.data, page: 1, limit: 25 });

  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  await registrarAuditoria(req, {
    rota: 'admin.auditoria.export.pdf',
    motivo: 'export_filtros',
    usuarioId: req.user!.userId,
    setor: req.user!.setorAcesso,
  });

  const pdf = await gerarPdfAuditoria(logs, locale);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=auditoria-casa-da-paz.pdf');
  res.send(pdf);
});

export default router;
