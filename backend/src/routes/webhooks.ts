import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

function validateSecret(req: { headers: { 'x-webhook-secret'?: string } }, secret: string): boolean {
  return req.headers['x-webhook-secret'] === secret;
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
      workflow: z.enum(['lembrete_atraso', 'recibo_pago', 'novo_agendamento', 'ingresso_oficina']),
      payload: z.record(z.unknown()),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  res.json({
    ok: true,
    message: 'Webhook encaminhado para N8N (configure N8N_URL em produção)',
    workflow: body.data.workflow,
  });
});

export default router;
