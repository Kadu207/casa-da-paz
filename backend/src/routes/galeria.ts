import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { midiaAoVivoWhere, parseVideoUrl, slugifyMidia, youtubeThumbnailUrl } from '../lib/video-url.js';

const router = Router();

const tipoSchema = z.enum(['FOTO', 'VIDEO']);
/** PRIVADO = só ERP; INTERNO aceito como alias legado */
const visibilidadeSchema = z
  .enum(['PUBLICO', 'PRIVADO', 'INTERNO'])
  .transform((v) => (v === 'INTERNO' ? 'PRIVADO' : v));
const statusSchema = z.enum(['RASCUNHO', 'PUBLICADO']);

const urlOrNull = z
  .string()
  .url()
  .max(500)
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));

const albumIdSchema = z
  .number()
  .int()
  .positive()
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
  albumId: albumIdSchema,
  ordem: z.number().int().min(0).default(0),
});

const albumSchema = z.object({
  nome: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  descricao: z.string().max(500).optional().nullable().or(z.literal('').transform(() => null)),
  ano: z.number().int().min(1900).max(2100).optional().nullable(),
  ordem: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});

type MidiaNormalized = {
  tipo: 'FOTO' | 'VIDEO';
  titulo: string;
  descricao: string | null;
  slug: string;
  imagemUrl: string | null;
  videoUrl: string | null;
  visibilidade: 'PUBLICO' | 'PRIVADO';
  status: 'RASCUNHO' | 'PUBLICADO';
  publicadoEm: Date | null;
  albumId: number | null;
  ordem: number;
};

function normalizePayload(
  data: z.infer<typeof midiaBaseSchema>
): { data: MidiaNormalized } | { error: string } {
  const slug = data.slug || slugifyMidia(data.titulo);
  if (!slug) {
    return { error: 'Slug inválido' };
  }

  const albumId = data.albumId ?? null;
  const base = {
    titulo: data.titulo,
    descricao: data.descricao ?? null,
    slug,
    visibilidade: data.visibilidade,
    status: data.status,
    publicadoEm: data.publicadoEm ? new Date(data.publicadoEm) : null,
    albumId,
    ordem: data.ordem,
  };

  if (data.tipo === 'FOTO') {
    if (!data.imagemUrl) {
      return { error: 'imagemUrl obrigatória para FOTO' };
    }
    return {
      data: {
        ...base,
        tipo: 'FOTO',
        imagemUrl: data.imagemUrl,
        videoUrl: null,
      },
    };
  }

  if (!data.videoUrl) {
    return { error: 'videoUrl obrigatória para VIDEO' };
  }
  const parsed = parseVideoUrl(data.videoUrl);
  if (!parsed) {
    return { error: 'videoUrl deve ser um link YouTube (preferencial) ou Vimeo' };
  }

  return {
    data: {
      ...base,
      tipo: 'VIDEO',
      imagemUrl:
        data.imagemUrl ??
        (parsed.provider === 'YOUTUBE' ? youtubeThumbnailUrl(parsed.id) : null),
      videoUrl: parsed.canonicalUrl,
    },
  };
}

const albumSelect = {
  id: true,
  nome: true,
  slug: true,
  descricao: true,
  ano: true,
  ordem: true,
} satisfies Prisma.MidiaAlbumSelect;

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
  albumId: true,
  ordem: true,
  updatedAt: true,
  album: { select: albumSelect },
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

function albumFilterFromQuery(req: { query: Record<string, unknown> }): Prisma.MidiaPublicacaoWhereInput {
  const albumIdRaw = req.query.albumId;
  const albumSlug = typeof req.query.album === 'string' ? req.query.album : null;
  if (typeof albumIdRaw === 'string' && /^\d+$/.test(albumIdRaw)) {
    return { albumId: Number(albumIdRaw) };
  }
  if (albumSlug) {
    return { album: { slug: albumSlug, ativo: true } };
  }
  return {};
}

/** Público — só PUBLICO + ao vivo */
export const publicGaleriaRouter = Router();

publicGaleriaRouter.get('/albuns', async (_req, res) => {
  const list = await prisma.midiaAlbum.findMany({
    where: {
      ativo: true,
      midias: { some: { ...midiaAoVivoWhere(), visibilidade: 'PUBLICO' } },
    },
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    select: albumSelect,
  });
  res.json(list);
});

publicGaleriaRouter.get('/', async (req, res) => {
  const tipo = typeof req.query.tipo === 'string' ? tipoSchema.safeParse(req.query.tipo) : null;
  const where: Prisma.MidiaPublicacaoWhereInput = {
    ...midiaAoVivoWhere(),
    visibilidade: 'PUBLICO',
    ...(tipo?.success ? { tipo: tipo.data } : {}),
    ...albumFilterFromQuery(req),
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
  if (slug === 'albuns') {
    res.status(404).json({ error: 'Não encontrado' });
    return;
  }
  const item = await prisma.midiaPublicacao.findFirst({
    where: {
      slug,
      ...midiaAoVivoWhere(),
      visibilidade: 'PUBLICO',
    },
    select: listSelect,
  });
  if (!item) {
    res.status(404).json({ error: 'Mídia não encontrada' });
    return;
  }
  res.json(enrichVideo(item));
});

/** ERP autenticado — PUBLICO + PRIVADO ao vivo */
export const erpGaleriaRouter = Router();

erpGaleriaRouter.get('/albuns', authenticate, async (_req, res) => {
  const list = await prisma.midiaAlbum.findMany({
    where: {
      ativo: true,
      midias: { some: midiaAoVivoWhere() },
    },
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    select: albumSelect,
  });
  res.json(list);
});

erpGaleriaRouter.get('/', authenticate, async (req, res) => {
  const tipo = typeof req.query.tipo === 'string' ? tipoSchema.safeParse(req.query.tipo) : null;
  const where: Prisma.MidiaPublicacaoWhereInput = {
    ...midiaAoVivoWhere(),
    ...(tipo?.success ? { tipo: tipo.data } : {}),
    ...albumFilterFromQuery(req),
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
    select: listSelect,
  });
  if (!item) {
    res.status(404).json({ error: 'Mídia não encontrada' });
    return;
  }
  res.json(enrichVideo(item));
});

/** Marketing — CRUD mídia + álbuns */
router.get('/albuns', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const list = await prisma.midiaAlbum.findMany({
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
  });
  res.json(list);
});

router.post('/albuns', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const parsed = albumSchema.safeParse({
    ...req.body,
    slug: req.body.slug || slugifyMidia(String(req.body.nome ?? '')),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const created = await prisma.midiaAlbum.create({
      data: {
        nome: parsed.data.nome,
        slug: parsed.data.slug!,
        descricao: parsed.data.descricao ?? null,
        ano: parsed.data.ano ?? null,
        ordem: parsed.data.ordem,
        ativo: parsed.data.ativo,
      },
    });
    res.status(201).json(created);
  } catch {
    res.status(409).json({ error: 'Slug de álbum já existe' });
  }
});

router.patch('/albuns/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  const body = albumSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  try {
    const updated = await prisma.midiaAlbum.update({
      where: { id },
      data: {
        ...body.data,
        descricao: body.data.descricao === undefined ? undefined : body.data.descricao,
      },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Álbum não encontrado ou slug em conflito' });
  }
});

router.get('/', authenticate, authorize('marketing', 'read'), async (req, res) => {
  const list = await prisma.midiaPublicacao.findMany({
    where: albumFilterFromQuery(req),
    orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
    select: listSelect,
  });
  res.json(list.map(enrichVideo));
});

router.post('/', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const parsed = midiaBaseSchema.safeParse({
    ...req.body,
    slug: req.body.slug || slugifyMidia(String(req.body.titulo ?? '')),
    albumId:
      req.body.albumId === '' || req.body.albumId === undefined
        ? null
        : Number(req.body.albumId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const normalized = normalizePayload(parsed.data);
  if ('error' in normalized) {
    res.status(400).json({ error: normalized.error });
    return;
  }
  if (normalized.data.albumId) {
    const album = await prisma.midiaAlbum.findFirst({
      where: { id: normalized.data.albumId, ativo: true },
    });
    if (!album) {
      res.status(400).json({ error: 'Álbum inválido ou inativo' });
      return;
    }
  }
  try {
    const created = await prisma.midiaPublicacao.create({
      data: {
        ...normalized.data,
        createdById: req.user!.userId,
      },
      select: listSelect,
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
  const body = midiaBaseSchema.partial().safeParse({
    ...req.body,
    albumId:
      req.body.albumId === undefined
        ? undefined
        : req.body.albumId === '' || req.body.albumId === null
          ? null
          : Number(req.body.albumId),
  });
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const merged = {
    tipo: body.data.tipo ?? existing.tipo,
    titulo: body.data.titulo ?? existing.titulo,
    descricao: body.data.descricao !== undefined ? body.data.descricao : existing.descricao,
    slug: body.data.slug ?? existing.slug,
    imagemUrl: body.data.imagemUrl !== undefined ? body.data.imagemUrl : existing.imagemUrl,
    videoUrl: body.data.videoUrl !== undefined ? body.data.videoUrl : existing.videoUrl,
    visibilidade: body.data.visibilidade ?? existing.visibilidade,
    status: body.data.status ?? existing.status,
    publicadoEm:
      body.data.publicadoEm !== undefined
        ? body.data.publicadoEm
        : existing.publicadoEm
          ? existing.publicadoEm.toISOString()
          : null,
    albumId: body.data.albumId !== undefined ? body.data.albumId : existing.albumId,
    ordem: body.data.ordem ?? existing.ordem,
  };
  const normalized = normalizePayload(merged);
  if ('error' in normalized) {
    res.status(400).json({ error: normalized.error });
    return;
  }
  try {
    const updated = await prisma.midiaPublicacao.update({
      where: { id },
      data: normalized.data,
      select: listSelect,
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
