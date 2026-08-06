import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { dispararN8n } from '../lib/n8n.js';
import { protocoloAgendamento } from '../lib/protocolo.js';
import { registrarAuditoria } from '../lib/auditoria.js';
import { clientIp, turnstileEnabled, turnstileSiteKey, verifyTurnstile } from '../lib/turnstile.js';
import { LGPD_POLICY_VERSION, assertLgpdConsent } from '../lib/lgpd.js';

const router = Router();

const agendamentoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Limite de agendamentos atingido. Tente mais tarde.' },
});

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Limite de inscrições atingido. Tente mais tarde.' },
});

router.get('/portal-config', (_req, res) => {
  res.json({
    turnstileSiteKey: turnstileSiteKey(),
    turnstileEnabled: turnstileEnabled(),
  });
});

router.get('/eventos', async (req, res) => {
  const tipoRaw = typeof req.query.tipo === 'string' ? req.query.tipo : undefined;
  const tipo =
    tipoRaw === 'GIRA' || tipoRaw === 'OFICINA' ? tipoRaw : undefined;
  const eventos = await prisma.evento.findMany({
    where: {
      status: 'ABERTO',
      dataEvento: { gte: new Date() },
      ...(tipo ? { tipo } : {}),
    },
    select: {
      id: true,
      nomeEvento: true,
      dataEvento: true,
      tipo: true,
      capacidadeMax: true,
      visualizacoes: true,
      _count: { select: { inscricoes: true } },
    },
    orderBy: { dataEvento: 'asc' },
  });
  res.json(eventos);
});

router.get('/eventos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  const evento = await prisma.evento.findFirst({
    where: { id, status: 'ABERTO', dataEvento: { gte: new Date() } },
    select: {
      id: true,
      nomeEvento: true,
      dataEvento: true,
      tipo: true,
      capacidadeMax: true,
      visualizacoes: true,
      _count: { select: { inscricoes: true } },
    },
  });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  await prisma.evento.update({
    where: { id },
    data: { visualizacoes: { increment: 1 } },
  });
  res.json({
    ...evento,
    local: 'Rua Valério Eugênio, 570 — Bairro Areal, Conselheiro Lafaiete, MG',
    resumo:
      evento.tipo === 'OFICINA'
        ? 'Oficina aberta à comunidade na Casa da Paz.'
        : 'Gira aberta à comunidade na Casa da Paz.',
  });
});

router.post('/eventos/:id/view', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  const updated = await prisma.evento.updateMany({
    where: { id, status: 'ABERTO' },
    data: { visualizacoes: { increment: 1 } },
  });
  if (updated.count === 0) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  res.json({ ok: true });
});

router.get('/acompanhar/:protocolo', async (req, res) => {
  const protocolo = req.params.protocolo.trim().toUpperCase();
  const ag = await prisma.agendamentoPublico.findUnique({
    where: { protocolo },
    select: {
      protocolo: true,
      nome: true,
      status: true,
      dataPreferida: true,
      createdAt: true,
    },
  });
  if (!ag) {
    res.status(404).json({ error: 'Protocolo não encontrado' });
    return;
  }
  res.json(ag);
});

router.post('/newsletter', newsletterLimiter, async (req, res) => {
  const body = z
    .object({
      email: z.string().email().max(150),
      nome: z.string().max(150).optional(),
      locale: z.enum(['pt-BR', 'en']).optional(),
      turnstileToken: z.string().optional(),
      aceiteLgpd: z.literal(true),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const lgpdErr = assertLgpdConsent(body.data.aceiteLgpd);
  if (lgpdErr) {
    res.status(400).json({ error: lgpdErr });
    return;
  }
  if (!(await verifyTurnstile(body.data.turnstileToken, clientIp(req)))) {
    res.status(403).json({ error: 'Verificação de segurança falhou' });
    return;
  }
  await prisma.newsletterInscrito.upsert({
    where: { email: body.data.email.toLowerCase() },
    create: {
      email: body.data.email.toLowerCase(),
      nome: body.data.nome,
      locale: body.data.locale ?? 'pt-BR',
      aceiteLgpdEm: new Date(),
      aceiteLgpdVersao: LGPD_POLICY_VERSION,
    },
    update: {
      nome: body.data.nome,
      ativo: true,
      locale: body.data.locale ?? 'pt-BR',
      aceiteLgpdEm: new Date(),
      aceiteLgpdVersao: LGPD_POLICY_VERSION,
    },
  });
  await registrarAuditoria(req, {
    rota: 'portal.newsletter.subscribe',
    motivo: 'novo_inscrito',
  });
  res.status(201).json({ ok: true });
});

router.post('/agendamentos', agendamentoLimiter, async (req, res) => {
  const body = z
    .object({
      nome: z.string().min(2).max(150),
      telefone: z.string().min(8).max(20),
      dataPreferida: z.string().optional(),
      observacao: z.string().max(500).optional(),
      website: z.string().max(0).optional(),
      turnstileToken: z.string().optional(),
      aceiteLgpd: z.literal(true),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const lgpdErr = assertLgpdConsent(body.data.aceiteLgpd);
  if (lgpdErr) {
    res.status(400).json({ error: lgpdErr });
    return;
  }
  if (body.data.website) {
    const fakeProtocolo = protocoloAgendamento(Math.floor(Math.random() * 99999));
    res.status(201).json({ id: 0, protocolo: fakeProtocolo, status: 'PENDENTE' });
    return;
  }
  if (!(await verifyTurnstile(body.data.turnstileToken, clientIp(req)))) {
    res.status(403).json({ error: 'Verificação de segurança falhou' });
    return;
  }

  const agendamento = await prisma.$transaction(async (tx) => {
    const row = await tx.agendamentoPublico.create({
      data: {
        protocolo: `TMP-${Date.now()}`,
        nome: body.data!.nome,
        telefone: body.data!.telefone,
        dataPreferida: body.data!.dataPreferida ? new Date(body.data!.dataPreferida) : null,
        observacao: body.data!.observacao,
        aceiteLgpdEm: new Date(),
        aceiteLgpdVersao: LGPD_POLICY_VERSION,
      },
    });
    const protocolo = protocoloAgendamento(row.id, row.createdAt);
    return tx.agendamentoPublico.update({
      where: { id: row.id },
      data: { protocolo },
    });
  });

  const n8n = await dispararN8n('novo_agendamento', {
    agendamentoId: agendamento.id,
    protocolo: agendamento.protocolo,
    nome: agendamento.nome,
    telefone: agendamento.telefone,
    dataPreferida: agendamento.dataPreferida,
    observacao: agendamento.observacao,
  });

  res.status(201).json({
    id: agendamento.id,
    protocolo: agendamento.protocolo,
    status: agendamento.status,
    n8n,
  });
});

export default router;
