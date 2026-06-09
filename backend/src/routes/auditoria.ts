import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { enriquecerLogAuditoria, type AuditLocale } from '../lib/audit-i18n.js';
import { gerarPdfAuditoria } from '../lib/audit-pdf.js';
import { registrarAuditoria } from '../lib/auditoria.js';
import {
  auditoriaExportFilename,
  buildAuditoriaCsv,
  buildAuditoriaWhere,
} from '../lib/auditoria-export.js';

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

const EXPORT_LIMIT = 5000;

async function loadExportLogs(
  filters: z.infer<typeof querySchema>
): Promise<{ locale: AuditLocale; logs: Awaited<ReturnType<typeof prisma.adminAuditLog.findMany>> }> {
  const locale = (filters.locale ?? 'pt-BR') as AuditLocale;
  const where = buildAuditoriaWhere(filters);
  const logs = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { [filters.sort]: filters.order },
    take: EXPORT_LIMIT,
  });
  return { locale, logs };
}

router.get('/', authenticate, authorize('logs', 'read'), async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { page, limit, sort, order } = parsed.data;
  const locale = (parsed.data.locale ?? 'pt-BR') as AuditLocale;
  const where = buildAuditoriaWhere(parsed.data);
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

  const { locale, logs } = await loadExportLogs({ ...parsed.data, page: 1, limit: 25 });

  await registrarAuditoria(req, {
    rota: 'admin.auditoria.export.csv',
    motivo: 'export_filtros',
    usuarioId: req.user!.userId,
    setor: req.user!.setorAcesso,
  });

  const filename = auditoriaExportFilename('csv', parsed.data.de, parsed.data.ate);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buildAuditoriaCsv(logs, locale));
});

router.get('/export.pdf', authenticate, authorize('logs', 'read'), async (req, res) => {
  const parsed = querySchema.omit({ page: true, limit: true }).safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { locale, logs } = await loadExportLogs({ ...parsed.data, page: 1, limit: 25 });

  await registrarAuditoria(req, {
    rota: 'admin.auditoria.export.pdf',
    motivo: 'export_filtros',
    usuarioId: req.user!.userId,
    setor: req.user!.setorAcesso,
  });

  const pdf = await gerarPdfAuditoria(logs, locale);
  const filename = auditoriaExportFilename('pdf', parsed.data.de, parsed.data.ate);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
});

export default router;
