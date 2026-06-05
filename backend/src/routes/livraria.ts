import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/produtos', authenticate, authorize('estoque', 'read'), async (_req, res) => {
  const produtos = await prisma.produto.findMany({ orderBy: { nome: 'asc' } });
  res.json(produtos);
});

router.post('/produtos', authenticate, authorize('estoque', 'write'), async (req, res) => {
  const body = z
    .object({
      nome: z.string().min(1),
      tipo: z.enum(['LIVRO', 'ERVA', 'ARTIGO']),
      preco: z.number().positive(),
      estoqueAtual: z.number().int().min(0).default(0),
      publicadoEcommerce: z.boolean().optional(),
      descricaoEcommerce: z.string().max(500).optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const produto = await prisma.produto.create({ data: body.data });
  res.status(201).json(produto);
});

router.put('/produtos/:id', authenticate, authorize('estoque', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      nome: z.string().min(1).optional(),
      tipo: z.enum(['LIVRO', 'ERVA', 'ARTIGO']).optional(),
      preco: z.number().positive().optional(),
      publicadoEcommerce: z.boolean().optional(),
      descricaoEcommerce: z.string().max(500).optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const produto = await prisma.produto.update({ where: { id }, data: body.data });
  res.json(produto);
});

router.post('/entrada', authenticate, authorize('estoque', 'write'), async (req, res) => {
  const body = z
    .object({
      produtoId: z.number().int().positive(),
      quantidade: z.number().int().positive(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const produto = await tx.produto.findUnique({ where: { id: body.data.produtoId } });
    if (!produto) throw new Error('Produto não encontrado');

    await tx.estoqueMovimentacao.create({
      data: {
        produtoId: produto.id,
        tipo: 'ENTRADA',
        quantidade: body.data.quantidade,
      },
    });

    const atualizado = await tx.produto.update({
      where: { id: produto.id },
      data: { estoqueAtual: produto.estoqueAtual + body.data.quantidade },
    });

    return atualizado;
  });

  res.status(201).json(result);
});

router.get('/movimentacoes', authenticate, authorize('estoque', 'read'), async (req, res) => {
  const produtoId = req.query.produtoId ? Number(req.query.produtoId) : undefined;
  const movimentacoes = await prisma.estoqueMovimentacao.findMany({
    where: produtoId ? { produtoId } : undefined,
    include: { produto: { select: { id: true, nome: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(movimentacoes);
});

router.post('/venda', authenticate, authorize('livraria', 'write'), async (req, res) => {
  const body = z
    .object({
      produtoId: z.number().int().positive(),
      quantidade: z.number().int().positive(),
      pessoaId: z.number().int().positive().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({ where: { id: body.data!.produtoId } });
      if (!produto) {
        throw Object.assign(new Error('Produto não encontrado'), { status: 404 });
      }
      if (produto.estoqueAtual < body.data!.quantidade) {
        throw Object.assign(new Error('Estoque insuficiente'), { status: 409 });
      }
      const valor = Number(produto.preco) * body.data!.quantidade;
      const transacao = await tx.financeiroTransacao.create({
        data: {
          pessoaId: body.data!.pessoaId,
          tipo: 'RECEITA',
          categoria: 'LIVRARIA',
          valor,
          dataTransacao: new Date(),
          status: 'CONCLUIDO',
        },
      });
      await tx.estoqueMovimentacao.create({
        data: {
          produtoId: produto.id,
          tipo: 'SAIDA',
          quantidade: body.data!.quantidade,
          transacaoId: transacao.id,
        },
      });
      const produtoAtualizado = await tx.produto.update({
        where: { id: produto.id },
        data: { estoqueAtual: produto.estoqueAtual - body.data!.quantidade },
      });
      return { transacao, produto: produtoAtualizado };
    });
    res.status(201).json(result);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Erro na venda';
    res.status(status).json({ error: message });
  }
});

export default router;
