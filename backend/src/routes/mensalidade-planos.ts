import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { gerarMensalidadesDoMes } from '../jobs/gerar-mensalidades.js';

const router = Router();

router.get('/', authenticate, authorize('recorrencia', 'read'), async (_req, res) => {
  const planos = await prisma.mensalidadePlano.findMany({
    include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true } } },
    orderBy: { id: 'asc' },
  });
  res.json(planos);
});

router.post('/', authenticate, authorize('recorrencia', 'write'), async (req, res) => {
  const body = z
    .object({
      pessoaId: z.number().int().positive(),
      valor: z.number().positive(),
      diaVencimento: z.number().int().min(1).max(28),
      ativo: z.boolean().default(true),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const plano = await prisma.mensalidadePlano.upsert({
    where: { pessoaId: body.data.pessoaId },
    update: {
      valor: body.data.valor,
      diaVencimento: body.data.diaVencimento,
      ativo: body.data.ativo,
    },
    create: body.data,
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.status(201).json(plano);
});

router.post('/gerar', authenticate, authorize('recorrencia', 'write'), async (_req, res) => {
  const criados = await gerarMensalidadesDoMes();
  res.json({ ok: true, criados });
});

router.patch('/:id', authenticate, authorize('recorrencia', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      valor: z.number().positive().optional(),
      diaVencimento: z.number().int().min(1).max(28).optional(),
      ativo: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const plano = await prisma.mensalidadePlano.update({
    where: { id },
    data: body.data,
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.json(plano);
});

export default router;
