import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { detectarDuplicata, normalizarTelefone } from '../lib/deduplicacao.js';

const router = Router();

const pessoaSchema = z.object({
  nomeCompleto: z.string().min(2).max(150),
  telefone: z.string().max(20).optional(),
  maiorDeIdade: z.boolean().default(true),
  tipoPerfil: z.enum(['CONSULENTE', 'MEDIUM', 'DIRETORIA', 'FUNCIONARIO']),
});

async function findTelefoneDuplicado(telefone: string, excludeId?: number) {
  const candidatos = await prisma.pessoa.findMany({
    where: {
      telefone: { not: null },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return candidatos.find((p) => p.telefone && detectarDuplicata({ nomeCompleto: '', telefone }, p) === 'telefone') ?? null;
}

async function findDuplicatasSugeridas(
  params: { nome?: string; telefone?: string; excludeId?: number }
) {
  const { nome, telefone, excludeId } = params;
  const pessoas = await prisma.pessoa.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    orderBy: { nomeCompleto: 'asc' },
  });

  const candidato = {
    nomeCompleto: nome ?? '',
    telefone: telefone ?? null,
  };

  return pessoas
    .map((p) => {
      const motivo = detectarDuplicata(candidato, p);
      return motivo ? { ...p, motivo } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

router.get('/', authenticate, authorize('pessoas', 'read'), async (req, res) => {
  const q = req.query.q as string | undefined;
  const telefone = req.query.telefone as string | undefined;
  const where: Prisma.PessoaWhereInput = {};

  if (q) {
    where.OR = [
      { nomeCompleto: { contains: q, mode: 'insensitive' } },
      { telefone: { contains: q } },
    ];
  } else if (telefone) {
    const digits = normalizarTelefone(telefone);
    if (digits.length >= 4) {
      where.telefone = { contains: digits.slice(-4) };
    }
  }

  const pessoas = await prisma.pessoa.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { nomeCompleto: 'asc' },
  });

  if (telefone && !q) {
    const filtradas = pessoas.filter(
      (p) => p.telefone && detectarDuplicata({ nomeCompleto: '', telefone }, p) === 'telefone'
    );
    res.json(filtradas.length ? filtradas : pessoas);
    return;
  }

  res.json(pessoas);
});

router.get('/sugerir-duplicatas', authenticate, authorize('pessoas', 'read'), async (req, res) => {
  const nome = req.query.nome as string | undefined;
  const telefone = req.query.telefone as string | undefined;
  const excludeId = req.query.excludeId ? Number(req.query.excludeId) : undefined;

  if (!nome?.trim() && !telefone?.trim()) {
    res.status(400).json({ error: 'Informe nome ou telefone para verificar duplicatas' });
    return;
  }

  const duplicatas = await findDuplicatasSugeridas({ nome, telefone, excludeId });
  res.json(duplicatas);
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
    const dup = await findTelefoneDuplicado(parsed.data.telefone);
    if (dup) {
      res.status(409).json({ error: 'Telefone já cadastrado', pessoaId: dup.id, motivo: 'telefone' });
      return;
    }
  }

  const pessoa = await prisma.pessoa.create({ data: parsed.data });
  res.status(201).json(pessoa);
});

router.put('/:id', authenticate, authorize('pessoas', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = pessoaSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const atual = await prisma.pessoa.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Pessoa não encontrada' });
    return;
  }

  if (parsed.data.telefone) {
    const dup = await findTelefoneDuplicado(parsed.data.telefone, id);
    if (dup) {
      res.status(409).json({ error: 'Telefone já cadastrado', pessoaId: dup.id, motivo: 'telefone' });
      return;
    }
  }

  const pessoa = await prisma.pessoa.update({
    where: { id },
    data: parsed.data,
  });
  res.json(pessoa);
});

router.delete('/:id', authenticate, authorize('pessoas', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.pessoa.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(409).json({ error: 'Pessoa vinculada a usuário, transação ou presença' });
  }
});

export default router;
