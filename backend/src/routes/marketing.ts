import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/** Painel marketing: publicar eventos e produtos (sem financeiro). */

router.get('/resumo', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const [eventosAbertos, produtosPublicados, conteudos] = await Promise.all([
    prisma.evento.count({ where: { status: 'ABERTO' } }),
    prisma.produto.count({ where: { publicadoEcommerce: true } }),
    prisma.livrariaConteudo.count({ where: { publicado: true } }),
  ]);
  res.json({ eventosAbertos, produtosPublicados, conteudosPublicados: conteudos });
});

router.get('/eventos', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const eventos = await prisma.evento.findMany({
    orderBy: { dataEvento: 'desc' },
    include: { _count: { select: { inscricoes: true } } },
  });
  res.json(eventos);
});

router.post('/eventos', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const body = z
    .object({
      nomeEvento: z.string().min(2).max(100),
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
      status: 'ABERTO',
    },
  });
  res.status(201).json(evento);
});

router.patch('/eventos/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      nomeEvento: z.string().min(2).max(100).optional(),
      dataEvento: z.string().optional(),
      status: z.enum(['ABERTO', 'ENCERRADO']).optional(),
      capacidadeMax: z.number().int().positive().nullable().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const data: Record<string, unknown> = { ...body.data };
  if (body.data.dataEvento) data.dataEvento = new Date(body.data.dataEvento);
  const evento = await prisma.evento.update({ where: { id }, data });
  res.json(evento);
});

router.get('/produtos', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const produtos = await prisma.produto.findMany({
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
    select: {
      id: true,
      nome: true,
      tipo: true,
      preco: true,
      estoqueAtual: true,
      publicadoEcommerce: true,
      descricaoEcommerce: true,
    },
  });
  res.json(produtos);
});

router.patch('/produtos/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      publicadoEcommerce: z.boolean().optional(),
      descricaoEcommerce: z.string().nullable().optional(),
      nome: z.string().min(2).optional(),
      preco: z.number().positive().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const produto = await prisma.produto.update({ where: { id }, data: body.data });
  res.json(produto);
});

router.get('/conteudos', authenticate, authorize('marketing', 'read'), async (_req, res) => {
  const conteudos = await prisma.livrariaConteudo.findMany({
    orderBy: [{ tipo: 'asc' }, { ordem: 'asc' }],
    include: { produto: { select: { id: true, nome: true } } },
  });
  res.json(conteudos);
});

router.patch('/conteudos/:id', authenticate, authorize('marketing', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      publicado: z.boolean().optional(),
      titulo: z.string().min(2).optional(),
      texto: z.string().optional(),
      ordem: z.number().int().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const conteudo = await prisma.livrariaConteudo.update({ where: { id }, data: body.data });
  res.json(conteudo);
});

export default router;
