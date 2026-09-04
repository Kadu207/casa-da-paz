import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { midiaAoVivoWhere, parseVideoUrl, slugifyMidia, youtubeThumbnailUrl } from '../lib/video-url.js';

const router = Router();

const tipoSchema = z.enum(['FOTO', 'VIDEO']);
const visibilidadeSchema = z.enum(['PUBLICO', 'INTERNO']);
const statusSchema = z.enum(['RASCUNHO', 'PUBLICADO']);

const urlOrNull = z
  .string()
  .url()
  .max(500)
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));

const midiaBaseSchema = z.object({
  tipo: tipoSchema,
  titulo: z.string().min(2).max(150),
  descricao: z.string().max(2000).optional().nullable().or(z.literal('').transform(() => null)),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: apenas minúsculas, números e hífen')
    .optional(),
  imagemUrl: urlOrNull,
  videoUrl: urlOrNull,
  visibilidade: visibilidadeSchema.default('PUBLICO'),
  status: statusSchema.default('RASCUNHO'),
  publicadoEm: z
    .union([
      z.string().datetime({ offset: true }),
      z.string().datetime(),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  ordem: z.number().int().min(0).default(0),
});

function normalizePayload(data: z.infer<typeof midiaBaseSchema>) {
  const slug = data.slug || slugifyMidia(data.titulo);
  if (!slug) {
    return { error: 'Slug inválido' as const };
  }

  if (data.tipo === 'FOTO') {
    if (!data.imagemUrl) {
      return { error: 'imagemUrl obrigatória para FOTO' as const };
    }
    return {
      data: {
        tipo: data.tipo,
        titulo: data.titulo,
        descricao: data.descricao ?? null,
        slug,
        imagemUrl: data.imagemUrl,
        videoUrl: null as string | null,
        visibilidade: data.visibilidade,
        status: data.status,
        publicadoEm: data.publicadoEm ? new Date(data.publicadoEm) : null,
        ordem: data.ordem,
      },
    };
  }

  if (!data.videoUrl) {
    return { error: 'videoUrl obrigatória para VIDEO' as const };
  }
  const parsed = parseVideoUrl(data.videoUrl);
  if (!parsed) {
    return { error: 'videoUrl deve ser um link YouTube (preferencial) ou Vimeo' as const };
  }

  const imagemUrl =
    data.imagemUrl ??
    (parsed.provider === 'YOUTUBE' ? youtubeThumbnailUrl(parsed.id) : null);

  return {
    data: {
      tipo: data.tipo,
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      slug,
      imagemUrl,
      videoUrl: parsed.canonicalUrl,
      visibilidade: data.visibilidade,
      status: data.status,
      publicadoEm: data.publicadoEm ? new Date(data.publicadoEm) : null,
      ordem: data.ordem,
    },
  };
}

const listSelect = {
  id: true,
  tipo: true,
  titulo: true,
  descricao: true,
  slug: true,
  imagemUrl: true,
  videoUrl: true,
  visibilidade: true,
  status: true,
  publicadoEm: true,
  ordem: true,
  updatedAt: true,
} satisfies Prisma.MidiaPublicacaoSelect;

function enrichVideo<T extends { videoUrl: string | null; tipo: string }>(item: T) {
  if (item.tipo !== 'VIDEO' || !item.videoUrl) return item;
  const parsed = parseVideoUrl(item.videoUrl);
  return {
    ...item,
    embedUrl: parsed?.embedUrl ?? null,
    videoProvider: parsed?.provider ?? null,
  };
}

/** Público — só PUBLICO + ao vivo */
export const publicGaleriaRouter = Router();

publicGaleriaRouter.get('/', async (req, res) => {
  const tipo = typeof req.query.tipo === 'string' ? tipoSchema.safeParse(req.query.tipo) : null;
  const where: Prisma.MidiaPublicacaoWhereInput = {
    ...midiaAoVivoWhere(),
    visibilidade: 'PUBLICO',
    ...(tipo?.success ? { tipo: tipo.data } : {}),
  };
  const list = await prisma.midiaPublicacao.findMany({
    where,
    orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
    select: listSelect,
  });
  res.json(list.map(enrichVideo));
});

publicGaleriaRouter.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  const item = await prisma.midiaPublicacao.findFirst({
    where: {
      slug,
      ...midiaAoVivoWhere(),
      visibilidade: 'PUBLICO',
    },
  });
  if (!item) {
    res.status(404).json({ error: 'Mídia não encontrada' });
    return;
  }
  res.json(enrichVideo(item));
});

/** ERP autenticado — PUBLICO + INTERNO ao vivo */
export const erpGaleriaRouter = Router();

erpGaleriaRouter.get('/', authenticate, async (req, res) => {
  const tipo = typeof req.query.tipo === 'string' ? tipoSchema.safeParse(req.query.tipo) : null;
  const where: Prisma.MidiaPublicacaoWhereInput = {
    ...midiaAoVivoWhere(),
    ...(tipo?.success ? { tipo: tipo.data } : {}),
  };
  const list = await prisma.midiaPublicacao.findMany({
    where,
    orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
    select: listSelect,
  });
  res.json(list.map(enrichVideo));
});

erpGaleriaRouter.get('/:slug', authenticate, async (req, res) => {
  const slug = String(req.params.slug);
  const item = await prisma.midiaPublicacao.findFirst({
    where: {
      slug,
      ...midiaAoVivoWhere(),
    },
  });
  if (!item) {
    res.status(404).json({ error: 'Mídia não encontrada' });
    return;
  }
  res.json(enrichVideo(item));
});

/** Marketing — CRUD completo (inclui rascunhos / agendados) */
router.get('/', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const list = await prisma.midiaPublicacao.findMany({
    orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
  });
  res.json(list.map(enrichVideo));
});

router.post('/', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const parsed = midiaBaseSchema.safeParse({
    ...req.body,
    slug: req.body.slug || slugifyMidia(String(req.body.titulo ?? '')),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const normalized = normalizePayload(parsed.data);
  if ('error' in normalized && normalized.error) {
    res.status(400).json({ error: normalized.error });
    return;
  }
  try {
    const created = await prisma.midiaPublicacao.create({
      data: {
        ...normalized.data!,
        createdById: req.user!.userId,
      },
    });
    res.status(201).json(enrichVideo(created));
  } catch {
    res.status(409).json({ error: 'Slug já existe' });
  }
});

router.patch('/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  const existing = await prisma.midiaPublicacao.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Mídia não encontrada' });
    return;
  }
  const body = midiaBaseSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const merged = {
    tipo: body.data.tipo ?? existing.tipo,
    titulo: body.data.titulo ?? existing.titulo,
    descricao:
      body.data.descricao !== undefined ? body.data.descricao : existing.descricao,
    slug: body.data.slug ?? existing.slug,
    imagemUrl:
      body.data.imagemUrl !== undefined ? body.data.imagemUrl : existing.imagemUrl,
    videoUrl: body.data.videoUrl !== undefined ? body.data.videoUrl : existing.videoUrl,
    visibilidade: body.data.visibilidade ?? existing.visibilidade,
    status: body.data.status ?? existing.status,
    publicadoEm:
      body.data.publicadoEm !== undefined
        ? body.data.publicadoEm
        : existing.publicadoEm
          ? existing.publicadoEm.toISOString()
          : null,
    ordem: body.data.ordem ?? existing.ordem,
  };
  const normalized = normalizePayload(merged);
  if ('error' in normalized && normalized.error) {
    res.status(400).json({ error: normalized.error });
    return;
  }
  try {
    const updated = await prisma.midiaPublicacao.update({
      where: { id },
      data: normalized.data!,
    });
    res.json(enrichVideo(updated));
  } catch {
    res.status(409).json({ error: 'Slug em conflito' });
  }
});

router.delete('/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  try {
    await prisma.midiaPublicacao.update({
      where: { id },
      data: { status: 'RASCUNHO' },
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Mídia não encontrada' });
  }
});

export default router;
