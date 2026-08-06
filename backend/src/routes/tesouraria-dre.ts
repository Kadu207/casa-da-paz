import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { montarDre } from '../lib/dre.js';

const router = Router();

router.get('/centros-custo', authenticate, authorize('dre', 'read'), async (_req, res) => {
  res.json(await prisma.centroCusto.findMany({ orderBy: { codigo: 'asc' } }));
});

router.post('/centros-custo', authenticate, authorize('dre', 'write'), async (req, res) => {
  const body = z
    .object({ codigo: z.string().min(1).max(30), nome: z.string().min(2).max(100) })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const c = await prisma.centroCusto.create({ data: body.data });
  res.status(201).json(c);
});

router.get('/orcamentos', authenticate, authorize('dre', 'read'), async (req, res) => {
  const ano = Number(req.query.ano);
  const mes = Number(req.query.mes);
  if (!ano || !mes) {
    res.status(400).json({ error: 'ano e mes obrigatórios' });
    return;
  }
  const linhas = await prisma.orcamentoLinha.findMany({
    where: { ano, mes },
    include: { centroCusto: true },
    orderBy: [{ tipo: 'asc' }, { categoria: 'asc' }],
  });
  res.json(linhas);
});

router.post('/orcamentos', authenticate, authorize('dre', 'write'), async (req, res) => {
  const body = z
    .object({
      ano: z.number().int(),
      mes: z.number().int().min(1).max(12),
      tipo: z.enum(['RECEITA', 'DESPESA']),
      categoria: z.string().min(2),
      centroCustoId: z.number().int().positive().nullable().optional(),
      valorPlanejado: z.number().nonnegative(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const existing = await prisma.orcamentoLinha.findFirst({
    where: {
      ano: body.data.ano,
      mes: body.data.mes,
      tipo: body.data.tipo,
      categoria: body.data.categoria,
      centroCustoId: body.data.centroCustoId ?? null,
    },
  });

  const linha = existing
    ? await prisma.orcamentoLinha.update({
        where: { id: existing.id },
        data: { valorPlanejado: body.data.valorPlanejado },
      })
    : await prisma.orcamentoLinha.create({
        data: {
          ano: body.data.ano,
          mes: body.data.mes,
          tipo: body.data.tipo,
          categoria: body.data.categoria,
          centroCustoId: body.data.centroCustoId ?? null,
          valorPlanejado: body.data.valorPlanejado,
        },
      });

  res.status(201).json(linha);
});

router.get('/dre', authenticate, authorize('dre', 'read'), async (req, res) => {
  const ano = Number(req.query.ano);
  const mes = Number(req.query.mes);
  if (!ano || !mes) {
    res.status(400).json({ error: 'ano e mes obrigatórios' });
    return;
  }
  const de = new Date(Date.UTC(ano, mes - 1, 1));
  const ate = new Date(Date.UTC(ano, mes, 0));

  const [orcamentos, transacoes] = await Promise.all([
    prisma.orcamentoLinha.findMany({
      where: { ano, mes },
      include: { centroCusto: true },
    }),
    prisma.financeiroTransacao.findMany({
      where: { status: 'CONCLUIDO', dataTransacao: { gte: de, lte: ate } },
      include: { centroCusto: true },
    }),
  ]);

  const realizadoMap = new Map<string, { categoria: string; centroCustoId: number | null; tipo: 'RECEITA' | 'DESPESA'; valor: number; centroNome: string | null }>();
  for (const t of transacoes) {
    const k = `${t.tipo}|${t.categoria}|${t.centroCustoId ?? 0}`;
    const cur = realizadoMap.get(k) ?? {
      categoria: t.categoria,
      centroCustoId: t.centroCustoId,
      tipo: t.tipo,
      valor: 0,
      centroNome: t.centroCusto?.nome ?? null,
    };
    cur.valor += Number(t.valor);
    realizadoMap.set(k, cur);
  }

  const dre = montarDre({
    orcado: orcamentos.map((o) => ({
      categoria: o.categoria,
      centroCustoId: o.centroCustoId,
      tipo: o.tipo,
      valor: Number(o.valorPlanejado),
      centroNome: o.centroCusto?.nome ?? null,
    })),
    realizado: [...realizadoMap.values()],
  });

  res.json({ periodo: { ano, mes }, ...dre });
});

export default router;
