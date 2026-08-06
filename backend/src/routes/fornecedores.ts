import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('contas_pagar', 'read'), async (_req, res) => {
  const list = await prisma.fornecedor.findMany({ orderBy: { nome: 'asc' } });
  res.json(list);
});

router.post('/', authenticate, authorize('contas_pagar', 'write'), async (req, res) => {
  const body = z
    .object({
      nome: z.string().min(2).max(150),
      documento: z.string().max(18).optional(),
      telefone: z.string().max(20).optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const f = await prisma.fornecedor.create({ data: body.data });
  res.status(201).json(f);
});

router.patch('/:id', authenticate, authorize('contas_pagar', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      nome: z.string().min(2).max(150).optional(),
      documento: z.string().max(18).nullable().optional(),
      telefone: z.string().max(20).nullable().optional(),
      ativo: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const f = await prisma.fornecedor.update({ where: { id }, data: body.data });
  res.json(f);
});

export default router;
