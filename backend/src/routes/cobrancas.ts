import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { reqIsOwnScope } from '../lib/own-scope.js';
import {
  createAssinaturaMedium,
  createCobrancaAvulsa,
  getAsaasConfig,
} from '../services/asaas/index.js';
import { cancelAsaasSubscription } from '../services/asaas/subscriptions.js';

const router = Router();

const billingEnum = z.enum(['BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED']);

router.get('/config', authenticate, authorize('cobrancas', 'read'), async (_req, res) => {
  const cfg = getAsaasConfig();
  res.json({
    env: cfg.env,
    configured: cfg.configured,
    baseUrl: cfg.baseUrl,
  });
});

router.get('/', authenticate, authorize('cobrancas', 'read'), async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const pessoaId = req.query.pessoaId ? Number(req.query.pessoaId) : undefined;
  const isOwn = reqIsOwnScope(req, 'cobrancas');

  const cobrancas = await prisma.asaasCobranca.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(isOwn
        ? { transacao: { pessoaId: req.user!.pessoaId } }
        : pessoaId
          ? { transacao: { pessoaId } }
          : {}),
    },
    include: {
      transacao: { select: { id: true, pessoaId: true, categoria: true, status: true } },
      pedido: { select: { id: true, protocolo: true } },
      inscricao: { select: { id: true, eventoId: true } },
      assinatura: { select: { id: true, pessoaId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(cobrancas);
});

router.post('/', authenticate, authorize('cobrancas', 'write'), async (req, res) => {
  const body = z
    .object({
      pessoaId: z.number().int().positive().optional(),
      customerName: z.string().min(2),
      cpfCnpj: z.string().min(11),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      value: z.number().positive(),
      billingType: billingEnum.default('PIX'),
      categoria: z.string().default('MENSALIDADE'),
      dueDate: z.string().optional(),
      description: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  try {
    const result = await createCobrancaAvulsa(body.data);
    res.status(201).json(result);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: err instanceof Error ? err.message : 'Erro Asaas' });
  }
});

router.post(
  '/mensalidade/:pessoaId',
  authenticate,
  authorize('cobrancas', 'write'),
  async (req, res) => {
    const pessoaId = Number(req.params.pessoaId);
    const body = z
      .object({
        value: z.number().positive(),
        billingType: billingEnum.default('PIX'),
        cpfCnpj: z.string().min(11),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dueDate: z.string().optional(),
        recurring: z.boolean().default(false),
        description: z.string().optional(),
      })
      .safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const pessoa = await prisma.pessoa.findUnique({ where: { id: pessoaId } });
    if (!pessoa) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    try {
      if (body.data.recurring) {
        const result = await createAssinaturaMedium({
          pessoaId,
          customerName: pessoa.nomeCompleto,
          cpfCnpj: body.data.cpfCnpj,
          email: body.data.email,
          phone: body.data.phone ?? pessoa.telefone ?? undefined,
          value: body.data.value,
          billingType: body.data.billingType,
          nextDueDate: body.data.dueDate,
        });
        res.status(201).json(result);
        return;
      }

      const result = await createCobrancaAvulsa({
        pessoaId,
        customerName: pessoa.nomeCompleto,
        cpfCnpj: body.data.cpfCnpj,
        email: body.data.email,
        phone: body.data.phone ?? pessoa.telefone ?? undefined,
        value: body.data.value,
        billingType: body.data.billingType,
        categoria: 'MENSALIDADE',
        dueDate: body.data.dueDate,
        description: body.data.description ?? `Mensalidade ${pessoa.nomeCompleto}`,
      });
      res.status(201).json(result);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      res.status(status).json({ error: err instanceof Error ? err.message : 'Erro Asaas' });
    }
  }
);

router.get('/assinaturas', authenticate, authorize('cobrancas', 'read'), async (req, res) => {
  const isOwn = reqIsOwnScope(req, 'cobrancas');
  const assinaturas = await prisma.asaasAssinatura.findMany({
    where: isOwn ? { pessoaId: req.user!.pessoaId } : undefined,
    include: {
      pessoa: { select: { id: true, nomeCompleto: true, telefone: true } },
      cobrancas: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assinaturas);
});

router.post(
  '/assinaturas',
  authenticate,
  authorize('cobrancas', 'write'),
  async (req, res) => {
    const body = z
      .object({
        pessoaId: z.number().int().positive(),
        value: z.number().positive(),
        billingType: billingEnum.default('PIX'),
        cpfCnpj: z.string().min(11),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        nextDueDate: z.string().optional(),
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
    try {
      const result = await createAssinaturaMedium({
        pessoaId: body.data.pessoaId,
        customerName: pessoa.nomeCompleto,
        cpfCnpj: body.data.cpfCnpj,
        email: body.data.email,
        phone: body.data.phone ?? pessoa.telefone ?? undefined,
        value: body.data.value,
        billingType: body.data.billingType,
        nextDueDate: body.data.nextDueDate,
      });
      res.status(201).json(result);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      res.status(status).json({ error: err instanceof Error ? err.message : 'Erro Asaas' });
    }
  }
);

router.delete(
  '/assinaturas/:id',
  authenticate,
  authorize('cobrancas', 'write'),
  async (req, res) => {
    const id = Number(req.params.id);
    const assinatura = await prisma.asaasAssinatura.findUnique({ where: { id } });
    if (!assinatura) {
      res.status(404).json({ error: 'Assinatura não encontrada' });
      return;
    }
    try {
      if (getAsaasConfig().configured) {
        await cancelAsaasSubscription(assinatura.asaasSubscriptionId);
      }
      await prisma.asaasAssinatura.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao cancelar' });
    }
  }
);

export default router;
