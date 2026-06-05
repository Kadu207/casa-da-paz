import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { calcularAdimplencia } from '../lib/adimplencia.js';

const router = Router();

const transacaoSchema = z.object({
  pessoaId: z.number().int().positive().optional(),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  categoria: z.string(),
  valor: z.number().positive(),
  dataTransacao: z.string(),
  vencimento: z.string().optional(),
  status: z.enum(['PENDENTE', 'CONCLUIDO']).default('PENDENTE'),
  observacoes: z.string().optional(),
});

router.get('/', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const isMedium = req.user!.setorAcesso === 'MEDIUM';
  const transacoes = await prisma.financeiroTransacao.findMany({
    where: isMedium ? { pessoaId: req.user!.pessoaId } : undefined,
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
    orderBy: { dataTransacao: 'desc' },
  });
  res.json(
    transacoes.map((t) => ({
      ...t,
      adimplencia: calcularAdimplencia(t.status, t.vencimento),
    }))
  );
});

router.get('/dashboard', authenticate, authorize('dashboard', 'read'), async (_req, res) => {
  const receitas = await prisma.financeiroTransacao.groupBy({
    by: ['categoria'],
    where: { tipo: 'RECEITA', status: 'CONCLUIDO' },
    _sum: { valor: true },
  });
  const despesas = await prisma.financeiroTransacao.groupBy({
    by: ['categoria'],
    where: { tipo: 'DESPESA', status: 'CONCLUIDO' },
    _sum: { valor: true },
  });
  res.json({ receitas, despesas });
});

router.get('/atrasados', authenticate, authorize('financeiro', 'read'), async (_req, res) => {
  const pendentes = await prisma.financeiroTransacao.findMany({
    where: { status: 'PENDENTE', vencimento: { not: null } },
    include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true } } },
  });
  res.json(
    pendentes
      .map((t) => ({ ...t, adimplencia: calcularAdimplencia(t.status, t.vencimento) }))
      .filter((t) => t.adimplencia === 'ATRASADO')
  );
});

router.post('/', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const parsed = transacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const t = await prisma.financeiroTransacao.create({
    data: {
      ...parsed.data,
      dataTransacao: new Date(parsed.data.dataTransacao),
      vencimento: parsed.data.vencimento ? new Date(parsed.data.vencimento) : null,
    },
  });
  res.status(201).json({ ...t, adimplencia: calcularAdimplencia(t.status, t.vencimento) });
});

router.patch('/:id/status', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const status = z.enum(['PENDENTE', 'CONCLUIDO']).parse(req.body.status);
  const t = await prisma.financeiroTransacao.update({
    where: { id: Number(req.params.id) },
    data: { status },
  });
  res.json({ ...t, adimplencia: calcularAdimplencia(t.status, t.vencimento) });
});

export default router;
