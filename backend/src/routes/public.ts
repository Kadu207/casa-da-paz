import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { dispararN8n } from '../lib/n8n.js';
import { protocoloAgendamento } from '../lib/protocolo.js';
import { registrarAuditoria } from '../lib/auditoria.js';
import { clientIp, turnstileEnabled, turnstileSiteKey, verifyTurnstile } from '../lib/turnstile.js';
import { LGPD_POLICY_VERSION, assertLgpdConsent } from '../lib/lgpd.js';
import { alocarCodigoIngresso } from '../lib/ingresso-codigo.js';
import { podeReservarLote, vagasRestantes } from '../lib/ingressos.js';
import { ReservaPessoaAmbiguoError, resolverPessoaReserva } from '../lib/reserva-pessoa.js';

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

const reservaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: { error: 'Limite de reservas atingido. Tente mais tarde.' },
});

async function lotesPublicos(eventoId: number) {
  const lotes = await prisma.ingressoLote.findMany({
    where: { eventoId, ativo: true },
    orderBy: { id: 'asc' },
    select: { id: true, nome: true, quantidade: true, valor: true },
  });
  const ocupadas = await prisma.inscricao.groupBy({
    by: ['ingressoLoteId'],
    where: { eventoId, canceladaEm: null, ingressoLoteId: { not: null } },
    _count: { _all: true },
  });
  const ocupMap = new Map(ocupadas.map((o) => [o.ingressoLoteId!, o._count._all]));
  return lotes.map((lote) => {
    const ocup = ocupMap.get(lote.id) ?? 0;
    return {
      id: lote.id,
      nome: lote.nome,
      valor: lote.valor,
      quantidade: lote.quantidade,
      vagasRestantes: vagasRestantes(lote.quantidade, ocup),
    };
  });
}

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
      _count: { select: { inscricoes: { where: { canceladaEm: null } } } },
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
      _count: { select: { inscricoes: { where: { canceladaEm: null } } } },
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
  const lotes = await lotesPublicos(id);
  res.json({
    ...evento,
    lotes,
    local: 'Rua Valério Eugênio, 570 — Bairro Areal, Conselheiro Lafaiete, MG',
    resumo:
      evento.tipo === 'OFICINA'
        ? 'Oficina aberta à comunidade na Casa da Paz.'
        : 'Gira aberta à comunidade na Casa da Paz.',
  });
});

router.post('/eventos/:id/reservas', reservaLimiter, async (req, res) => {
  const eventoId = Number(req.params.id);
  if (!Number.isFinite(eventoId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const body = z
    .object({
      ingressoLoteId: z.number().int().positive(),
      nome: z.string().min(2).max(150),
      telefone: z.string().min(8).max(20),
      email: z.string().email().max(150).optional(),
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
    res.status(201).json({ ok: true, codigo: 'HONEYPOT' });
    return;
  }
  if (!(await verifyTurnstile(body.data.turnstileToken, clientIp(req)))) {
    res.status(403).json({ error: 'Verificação de segurança falhou' });
    return;
  }

  const evento = await prisma.evento.findFirst({
    where: { id: eventoId, status: 'ABERTO', dataEvento: { gte: new Date() } },
  });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }

  const lote = await prisma.ingressoLote.findFirst({
    where: { id: body.data.ingressoLoteId, eventoId, ativo: true },
  });
  if (!lote) {
    res.status(404).json({ error: 'Lote não encontrado' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let pessoaId: number;
      try {
        pessoaId = await resolverPessoaReserva(tx, {
          nome: body.data!.nome,
          telefone: body.data!.telefone,
          email: body.data!.email,
        });
      } catch (err) {
        if (err instanceof ReservaPessoaAmbiguoError) throw err;
        throw err;
      }

      const existente = await tx.inscricao.findUnique({
        where: { eventoId_pessoaId: { eventoId, pessoaId } },
      });
      const jaInscritoAtivo = !!existente && !existente.canceladaEm;

      const ocupadas = await tx.inscricao.count({
        where: { ingressoLoteId: lote.id, canceladaEm: null },
      });
      const bloqueio = podeReservarLote({
        eventoStatus: evento.status,
        loteAtivo: lote.ativo,
        quantidade: lote.quantidade,
        ocupadas,
        jaInscritoAtivo,
      });
      if (bloqueio) {
        const error = new Error(bloqueio);
        (error as Error & { status: number }).status = 409;
        throw error;
      }

      const codigo = await alocarCodigoIngresso(tx);
      const vencimento = new Date(evento.dataEvento);

      if (existente?.canceladaEm) {
        return tx.inscricao.update({
          where: { id: existente.id },
          data: {
            ingressoLoteId: lote.id,
            valor: lote.valor,
            vencimento,
            statusPagamento: 'PENDENTE',
            canceladaEm: null,
            codigo,
          },
          include: {
            pessoa: { select: { nomeCompleto: true, telefone: true, email: true } },
            ingressoLote: { select: { nome: true } },
          },
        });
      }

      return tx.inscricao.create({
        data: {
          eventoId,
          pessoaId,
          ingressoLoteId: lote.id,
          valor: lote.valor,
          vencimento,
          statusPagamento: 'PENDENTE',
          codigo,
        },
        include: {
          pessoa: { select: { nomeCompleto: true, telefone: true, email: true } },
          ingressoLote: { select: { nome: true } },
        },
      });
    });

    await registrarAuditoria(req, {
      rota: 'portal.eventos.reserva',
      motivo: 'reserva_ingresso',
      entidadeTipo: 'Inscricao',
      entidadeId: String(result.id),
    });

    await dispararN8n('ingresso_oficina', {
      inscricaoId: result.id,
      eventoId,
      eventoNome: evento.nomeEvento,
      codigo: result.codigo,
      valor: Number(result.valor),
      lote: result.ingressoLote?.nome ?? lote.nome,
      nome: result.pessoa.nomeCompleto,
      telefone: result.pessoa.telefone,
      email: result.pessoa.email,
      statusPagamento: 'PENDENTE',
    });

    res.status(201).json({
      id: result.id,
      codigo: result.codigo,
      statusPagamento: result.statusPagamento,
      valor: result.valor,
      lote: result.ingressoLote?.nome ?? lote.nome,
      eventoNome: evento.nomeEvento,
    });
  } catch (err) {
    if (err instanceof ReservaPessoaAmbiguoError) {
      res.status(409).json({
        error: err.message,
        code: 'TELEFONE_AMBIGUO',
        pessoasIds: err.pessoasIds,
      });
      return;
    }
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({
      error: err instanceof Error ? err.message : 'Erro ao reservar',
    });
  }
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
