import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('contas_pagar', 'read'), async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const list = await prisma.contaPagar.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      fornecedor: true,
      centroCusto: true,
      parcelas: { orderBy: { numero: 'asc' } },
    },
    orderBy: { vencimento: 'asc' },
  });
  res.json(list);
});

router.post('/', authenticate, authorize('contas_pagar', 'write'), async (req, res) => {
  const body = z
    .object({
      fornecedorId: z.number().int().positive().optional(),
      centroCustoId: z.number().int().positive().optional(),
      descricao: z.string().min(2).max(200),
      categoria: z.string().min(2).max(50),
      valorTotal: z.number().positive(),
      vencimento: z.string(),
      observacoes: z.string().optional(),
      parcelas: z
        .array(
          z.object({
            numero: z.number().int().positive(),
            valor: z.number().positive(),
            vencimento: z.string(),
          })
        )
        .optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const parcelas =
    body.data.parcelas && body.data.parcelas.length > 0
      ? body.data.parcelas
      : [{ numero: 1, valor: body.data.valorTotal, vencimento: body.data.vencimento }];

  const conta = await prisma.contaPagar.create({
    data: {
      fornecedorId: body.data.fornecedorId,
      centroCustoId: body.data.centroCustoId,
      descricao: body.data.descricao,
      categoria: body.data.categoria,
      valorTotal: body.data.valorTotal,
      vencimento: new Date(body.data.vencimento),
      observacoes: body.data.observacoes,
      parcelas: {
        create: parcelas.map((p) => ({
          numero: p.numero,
          valor: p.valor,
          vencimento: new Date(p.vencimento),
        })),
      },
    },
    include: { parcelas: true, fornecedor: true },
  });
  res.status(201).json(conta);
});

router.post(
  '/:id/parcelas/:parcelaId/baixar',
  authenticate,
  authorize('contas_pagar', 'write'),
  async (req, res) => {
    const contaId = Number(req.params.id);
    const parcelaId = Number(req.params.parcelaId);
    const body = z
      .object({
        contaId: z.number().int().positive().optional(),
        dataPagamento: z.string().optional(),
      })
      .safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const parcela = await prisma.contaPagarParcela.findFirst({
      where: { id: parcelaId, contaPagarId: contaId },
      include: { contaPagar: true },
    });
    if (!parcela) {
      res.status(404).json({ error: 'Parcela não encontrada' });
      return;
    }
    if (parcela.status === 'PAGO') {
      res.status(409).json({ error: 'Parcela já paga' });
      return;
    }

    const pagoEm = body.data.dataPagamento ? new Date(body.data.dataPagamento) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const transacao = await tx.financeiroTransacao.create({
        data: {
          tipo: 'DESPESA',
          categoria: parcela.contaPagar.categoria,
          valor: parcela.valor,
          dataTransacao: pagoEm,
          vencimento: parcela.vencimento,
          status: 'CONCLUIDO',
          origem: 'CONTA_PAGAR',
          contaId: body.data.contaId,
          centroCustoId: parcela.contaPagar.centroCustoId,
          observacoes: `Baixa parcela ${parcela.numero} — ${parcela.contaPagar.descricao}`,
        },
      });

      await tx.contaPagarParcela.update({
        where: { id: parcela.id },
        data: { status: 'PAGO', pagoEm, transacaoId: transacao.id },
      });

      const restantes = await tx.contaPagarParcela.count({
        where: { contaPagarId: contaId, status: 'PENDENTE' },
      });
      const statusConta = restantes === 0 ? 'PAGO' : 'PARCIAL';
      await tx.contaPagar.update({
        where: { id: contaId },
        data: { status: statusConta },
      });

      return tx.contaPagar.findUnique({
        where: { id: contaId },
        include: { parcelas: true, fornecedor: true },
      });
    });

    res.json(result);
  }
);

router.patch('/:id/cancelar', authenticate, authorize('contas_pagar', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const conta = await prisma.$transaction(async (tx) => {
    await tx.contaPagarParcela.updateMany({
      where: { contaPagarId: id, status: 'PENDENTE' },
      data: { status: 'CANCELADO' },
    });
    return tx.contaPagar.update({
      where: { id },
      data: { status: 'CANCELADO' },
      include: { parcelas: true },
    });
  });
  res.json(conta);
});

export default router;
