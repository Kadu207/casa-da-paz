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
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const produto = await prisma.produto.create({ data: body.data });
  res.status(201).json(produto);
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
  const result = await prisma.$transaction(async (tx) => {
    const produto = await tx.produto.findUnique({ where: { id: body.data!.produtoId } });
    if (!produto || produto.estoqueAtual < body.data!.quantidade) {
      throw new Error('Estoque insuficiente');
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
    await tx.produto.update({
      where: { id: produto.id },
      data: { estoqueAtual: produto.estoqueAtual - body.data!.quantidade },
    });
    return { transacao, produtoId: produto.id };
  });
  res.status(201).json(result);
});

export default router;
