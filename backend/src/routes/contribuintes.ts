import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const tipoSchema = z.enum(['PATROCINIO', 'PADRINHO']);

router.get('/', authenticate, authorize('contribuintes', 'read'), async (req, res) => {
  const tipo = typeof req.query.tipo === 'string' ? tipoSchema.safeParse(req.query.tipo) : null;
  const list = await prisma.contribuinte.findMany({
    where: tipo?.success ? { tipo: tipo.data } : undefined,
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
  });
  res.json(list);
});

router.post('/', authenticate, authorize('contribuintes', 'write'), async (req, res) => {
  const body = z
    .object({
      tipo: tipoSchema,
      nome: z.string().min(2).max(150),
      valor: z.number().positive(),
      telefone: z.string().max(20).optional(),
      observacao: z.string().max(500).optional(),
      ativo: z.boolean().default(true),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const row = await prisma.contribuinte.create({ data: body.data });
  res.status(201).json(row);
});

router.patch('/:id', authenticate, authorize('contribuintes', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  const body = z
    .object({
      tipo: tipoSchema.optional(),
      nome: z.string().min(2).max(150).optional(),
      valor: z.number().positive().optional(),
      telefone: z.string().max(20).nullable().optional(),
      observacao: z.string().max(500).nullable().optional(),
      ativo: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const row = await prisma.contribuinte.update({ where: { id }, data: body.data });
  res.json(row);
});

router.delete('/:id', authenticate, authorize('contribuintes', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  await prisma.contribuinte.update({ where: { id }, data: { ativo: false } });
  res.json({ ok: true });
});

export default router;
