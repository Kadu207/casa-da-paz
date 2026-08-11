import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { dispararN8n, type N8nWorkflow } from '../lib/n8n.js';
import {
  isDevDefaultSecret,
  isProductionRuntime,
  timingSafeEqualString,
} from '../lib/runtime-env.js';

const router = Router();

const asaasWebhookSchema = z.object({
  id: z.string().min(1).optional(),
  event: z.string().min(1),
  payment: z
    .object({
      id: z.string().min(1),
      status: z.string().min(1),
      billingType: z.string().optional(),
      value: z.number().optional(),
      dueDate: z.string().optional(),
      invoiceUrl: z.string().optional(),
      bankSlipUrl: z.string().optional(),
      customer: z.string().optional(),
      externalReference: z.string().optional(),
      subscription: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

function validateSecret(req: Request, secret: string): boolean {
  const header = req.headers['x-webhook-secret'];
  if (typeof header !== 'string' || !secret) return false;
  return timingSafeEqualString(header, secret);
}

router.post('/asaas', async (req, res) => {
  const token =
    (typeof req.headers['asaas-access-token'] === 'string'
      ? req.headers['asaas-access-token']
      : undefined) ??
    (typeof req.headers['x-webhook-secret'] === 'string' ? req.headers['x-webhook-secret'] : undefined);

  const { validateAsaasWebhookToken, processAsaasWebhook } = await import(
    '../services/asaas/webhooks.js'
  );
  if (!validateAsaasWebhookToken(token)) {
    res.status(401).json({ error: 'Token Asaas inválido' });
    return;
  }

  const parsed = asaasWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const result = await processAsaasWebhook({
      id: parsed.data.id,
      event: parsed.data.event,
      payment: parsed.data.payment as never,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro webhook Asaas' });
  }
});

router.post('/pix', async (req, res) => {
  const secret = process.env.PIX_WEBHOOK_SECRET?.trim() ?? '';
  if (isProductionRuntime() && (!secret || isDevDefaultSecret(secret))) {
    res.status(503).json({ error: 'PIX webhook não configurado' });
    return;
  }
  const effective = secret || 'pix-dev-secret';
  if (!validateSecret(req, effective)) {
    res.status(401).json({ error: 'Secret inválido' });
    return;
  }
  const body = z
    .object({
      transacaoId: z.number().int().positive(),
      referenciaExterna: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const atual = await prisma.financeiroTransacao.findUnique({
    where: { id: body.data.transacaoId },
  });
  if (!atual) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }
  if (atual.status === 'CONCLUIDO') {
    res.json({ ok: true, transacaoId: atual.id, status: atual.status, duplicate: true });
    return;
  }
  const t = await prisma.financeiroTransacao.update({
    where: { id: body.data.transacaoId },
    data: { status: 'CONCLUIDO' },
  });
  res.json({ ok: true, transacaoId: t.id, status: t.status });
});

router.post('/n8n/trigger', authenticate, authorize('integracoes', 'write'), async (req, res) => {
  const body = z
    .object({
      workflow: z.enum([
        'lembrete_atraso',
        'recibo_pago',
        'novo_agendamento',
        'agendamento_confirmado',
        'agendamento_cancelado',
        'ingresso_oficina',
      ]),
      payload: z.record(z.unknown()),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const n8n = await dispararN8n(body.data.workflow as N8nWorkflow, body.data.payload);
  res.json({
    ok: true,
    workflow: body.data.workflow,
    n8n,
  });
});

export default router;
