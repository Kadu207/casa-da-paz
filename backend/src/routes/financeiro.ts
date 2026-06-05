import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { calcularAdimplencia, type AdimplenciaStatus } from '../lib/adimplencia.js';
import { validarTransacao } from '../lib/financeiro.js';
import { gerarAlertasAdimplencia } from '../jobs/adimplencia.js';

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

function withAdimplencia<T extends { status: string; vencimento: Date | null }>(t: T) {
  return {
    ...t,
    adimplencia: calcularAdimplencia(t.status as 'PENDENTE' | 'CONCLUIDO', t.vencimento),
  };
}

function mediumScope(req: Request): Prisma.FinanceiroTransacaoWhereInput | undefined {
  if (req.user!.setorAcesso === 'MEDIUM') {
    return { pessoaId: req.user!.pessoaId };
  }
  return undefined;
}

router.get('/', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const adimplenciaFilter = req.query.adimplencia as AdimplenciaStatus | undefined;
  const tipo = req.query.tipo as 'RECEITA' | 'DESPESA' | undefined;

  const transacoes = await prisma.financeiroTransacao.findMany({
    where: {
      ...mediumScope(req),
      ...(tipo ? { tipo } : {}),
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
    orderBy: { dataTransacao: 'desc' },
  });

  let result = transacoes.map(withAdimplencia);
  if (adimplenciaFilter) {
    result = result.filter((t) => t.adimplencia === adimplenciaFilter);
  }

  res.json(result);
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

router.get('/atrasados', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const transacoes = await prisma.financeiroTransacao.findMany({
    where: {
      ...mediumScope(req),
      status: 'PENDENTE',
      vencimento: { not: null },
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true } } },
  });
  res.json(
    transacoes.map(withAdimplencia).filter((t) => t.adimplencia === 'ATRASADO')
  );
});

router.post('/sync-alertas', authenticate, authorize('financeiro', 'write'), async (_req, res) => {
  const criados = await gerarAlertasAdimplencia();
  res.json({ criados });
});

router.post('/', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const parsed = transacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const erro = validarTransacao(parsed.data);
  if (erro) {
    res.status(400).json({ error: erro });
    return;
  }

  const t = await prisma.financeiroTransacao.create({
    data: {
      ...parsed.data,
      dataTransacao: new Date(parsed.data.dataTransacao),
      vencimento: parsed.data.vencimento ? new Date(parsed.data.vencimento) : null,
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.status(201).json(withAdimplencia(t));
});

router.put('/:id', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = transacaoSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const atual = await prisma.financeiroTransacao.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }

  if (req.user!.setorAcesso === 'MEDIUM' && atual.pessoaId !== req.user!.pessoaId) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const merged = {
    tipo: parsed.data.tipo ?? atual.tipo,
    categoria: parsed.data.categoria ?? atual.categoria,
    vencimento:
      parsed.data.vencimento !== undefined
        ? parsed.data.vencimento
        : atual.vencimento?.toISOString().slice(0, 10),
    pessoaId: parsed.data.pessoaId ?? atual.pessoaId ?? undefined,
  };

  const erro = validarTransacao(merged);
  if (erro) {
    res.status(400).json({ error: erro });
    return;
  }

  const t = await prisma.financeiroTransacao.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.dataTransacao ? { dataTransacao: new Date(parsed.data.dataTransacao) } : {}),
      ...(parsed.data.vencimento !== undefined
        ? { vencimento: parsed.data.vencimento ? new Date(parsed.data.vencimento) : null }
        : {}),
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.json(withAdimplencia(t));
});

router.patch('/:id/status', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const status = z.enum(['PENDENTE', 'CONCLUIDO']).parse(req.body.status);

  const atual = await prisma.financeiroTransacao.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }
  if (req.user!.setorAcesso === 'MEDIUM' && atual.pessoaId !== req.user!.pessoaId) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const t = await prisma.financeiroTransacao.update({
    where: { id },
    data: { status },
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.json(withAdimplencia(t));
});

router.delete('/:id', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const atual = await prisma.financeiroTransacao.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }
  if (req.user!.setorAcesso === 'MEDIUM') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  await prisma.financeiroTransacao.delete({ where: { id } });
  res.status(204).send();
});

export default router;
