import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const categoriaSchema = z.enum(['ERVAS', 'BANHOS', 'DEFUMACAO', 'OUTROS']);

const materialSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: apenas minúsculas, números e hífen'),
  categoria: categoriaSchema,
  titulo: z.string().min(2).max(150),
  resumo: z.string().min(10).max(400),
  corpo: z.string().min(20),
  imagemUrl: z
    .string()
    .url()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  ordem: z.number().int().min(0).default(0),
  publicado: z.boolean().default(false),
});

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Público — só publicados */
export const publicMateriaisEstudoRouter = Router();

publicMateriaisEstudoRouter.get('/', async (req, res) => {
  const cat = typeof req.query.categoria === 'string' ? categoriaSchema.safeParse(req.query.categoria) : null;
  const where: Prisma.MaterialEstudoWhereInput = {
    publicado: true,
    ...(cat?.success ? { categoria: cat.data } : {}),
  };
  const list = await prisma.materialEstudo.findMany({
    where,
    orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
    select: {
      id: true,
      slug: true,
      categoria: true,
      titulo: true,
      resumo: true,
      imagemUrl: true,
      ordem: true,
      updatedAt: true,
    },
  });
  res.json(list);
});

publicMateriaisEstudoRouter.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug);
  const item = await prisma.materialEstudo.findFirst({
    where: { slug, publicado: true },
  });
  if (!item) {
    res.status(404).json({ error: 'Material não encontrado' });
    return;
  }
  res.json(item);
});

/** Marketing — CRUD completo */
router.get('/', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const list = await prisma.materialEstudo.findMany({
    orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }, { titulo: 'asc' }],
  });
  res.json(list);
});

router.post('/', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const parsed = materialSchema.safeParse({
    ...req.body,
    slug: req.body.slug || slugify(String(req.body.titulo ?? '')),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const created = await prisma.materialEstudo.create({ data: parsed.data });
    res.status(201).json(created);
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
  const body = materialSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  try {
    const updated = await prisma.materialEstudo.update({ where: { id }, data: body.data });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Material não encontrado ou slug em conflito' });
  }
});

router.delete('/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  await prisma.materialEstudo.update({ where: { id }, data: { publicado: false } });
  res.json({ ok: true });
});

export default router;
