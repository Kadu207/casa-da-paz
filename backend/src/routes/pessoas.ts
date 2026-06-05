import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

const pessoaSchema = z.object({
  nomeCompleto: z.string().min(2).max(150),
  telefone: z.string().max(20).optional(),
  maiorDeIdade: z.boolean().default(true),
  tipoPerfil: z.enum(['CONSULENTE', 'MEDIUM', 'DIRETORIA', 'FUNCIONARIO']),
});

router.get('/', authenticate, authorize('pessoas', 'read'), async (req, res) => {
  const telefone = req.query.telefone as string | undefined;
  const pessoas = await prisma.pessoa.findMany({
    where: telefone ? { telefone: { contains: telefone } } : undefined,
    orderBy: { nomeCompleto: 'asc' },
  });
  res.json(pessoas);
});

router.get('/:id', authenticate, authorize('pessoas', 'read'), async (req, res) => {
  const pessoa = await prisma.pessoa.findUnique({ where: { id: Number(req.params.id) } });
  if (!pessoa) {
    res.status(404).json({ error: 'Pessoa não encontrada' });
    return;
  }
  res.json(pessoa);
});

router.post('/', authenticate, authorize('pessoas', 'write'), async (req, res) => {
  const parsed = pessoaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (parsed.data.telefone) {
    const dup = await prisma.pessoa.findFirst({
      where: { telefone: parsed.data.telefone },
    });
    if (dup) {
      res.status(409).json({ error: 'Telefone já cadastrado', pessoaId: dup.id });
      return;
    }
  }
  const pessoa = await prisma.pessoa.create({ data: parsed.data });
  res.status(201).json(pessoa);
});

router.put('/:id', authenticate, authorize('pessoas', 'write'), async (req, res) => {
  const parsed = pessoaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const pessoa = await prisma.pessoa.update({
    where: { id: Number(req.params.id) },
    data: parsed.data,
  });
  res.json(pessoa);
});

router.delete('/:id', authenticate, authorize('pessoas', 'write'), async (req, res) => {
  await prisma.pessoa.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

export default router;
