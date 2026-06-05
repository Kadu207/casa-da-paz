import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();

const agendamentoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Limite de agendamentos atingido. Tente mais tarde.' },
});

router.get('/eventos', async (_req, res) => {
  const eventos = await prisma.evento.findMany({
    where: { status: 'ABERTO', dataEvento: { gte: new Date() } },
    select: {
      id: true,
      nomeEvento: true,
      dataEvento: true,
      capacidadeMax: true,
      _count: { select: { inscricoes: true } },
    },
    orderBy: { dataEvento: 'asc' },
  });
  res.json(eventos);
});

router.post('/agendamentos', agendamentoLimiter, async (req, res) => {
  const body = z
    .object({
      nome: z.string().min(2).max(150),
      telefone: z.string().min(8).max(20),
      dataPreferida: z.string().optional(),
      observacao: z.string().max(500).optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const agendamento = await prisma.agendamentoPublico.create({
    data: {
      nome: body.data.nome,
      telefone: body.data.telefone,
      dataPreferida: body.data.dataPreferida ? new Date(body.data.dataPreferida) : null,
      observacao: body.data.observacao,
    },
  });
  res.status(201).json({ id: agendamento.id, status: agendamento.status });
});

export default router;
