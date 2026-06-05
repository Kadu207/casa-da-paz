import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { dispararN8n, type N8nWorkflow } from '../lib/n8n.js';

const router = Router();

function validateSecret(req: Request, secret: string): boolean {
  const header = req.headers['x-webhook-secret'];
  return typeof header === 'string' && header === secret;
}

router.post('/pix', async (req, res) => {
  const secret = process.env.PIX_WEBHOOK_SECRET ?? 'pix-dev-secret';
  if (!validateSecret(req, secret)) {
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
  const t = await prisma.financeiroTransacao.update({
    where: { id: body.data.transacaoId },
    data: { status: 'CONCLUIDO' },
  });
  res.json({ ok: true, transacaoId: t.id, status: t.status });
});

router.post('/n8n/trigger', authenticate, authorize('webhooks', 'write'), async (req, res) => {
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
