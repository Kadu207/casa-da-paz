import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('eventos', 'read'), async (_req, res) => {
  const eventos = await prisma.evento.findMany({
    include: { _count: { select: { presencas: true, inscricoes: true } } },
    orderBy: { dataEvento: 'desc' },
  });
  res.json(eventos);
});

router.post('/', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const body = z
    .object({
      nomeEvento: z.string().min(2),
      dataEvento: z.string(),
      capacidadeMax: z.number().int().positive().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const evento = await prisma.evento.create({
    data: {
      nomeEvento: body.data.nomeEvento,
      dataEvento: new Date(body.data.dataEvento),
      capacidadeMax: body.data.capacidadeMax,
    },
  });
  res.status(201).json(evento);
});

router.post('/:id/checkin', authenticate, authorize('checkin', 'write'), async (req, res) => {
  const body = z
    .object({
      pessoaId: z.number().int().positive(),
      tipoPresenca: z.enum(['MEDIUM', 'CONSULENTE']),
      nomeResponsavel: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const pessoa = await prisma.pessoa.findUnique({ where: { id: body.data.pessoaId } });
  if (!pessoa) {
    res.status(404).json({ error: 'Pessoa não encontrada' });
    return;
  }
  if (!pessoa.maiorDeIdade && !body.data.nomeResponsavel) {
    res.status(400).json({ error: 'nome_responsavel obrigatório para menor de idade' });
    return;
  }
  const presenca = await prisma.presenca.create({
    data: {
      eventoId: Number(req.params.id),
      pessoaId: body.data.pessoaId,
      tipoPresenca: body.data.tipoPresenca,
      nomeResponsavel: body.data.nomeResponsavel,
    },
  });
  res.status(201).json(presenca);
});

router.patch('/:id/encerrar', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const evento = await prisma.evento.update({
    where: { id: Number(req.params.id) },
    data: { status: 'ENCERRADO' },
    include: { _count: { select: { presencas: true } } },
  });
  res.json(evento);
});

export default router;
