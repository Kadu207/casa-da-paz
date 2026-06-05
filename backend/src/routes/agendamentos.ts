import { Router } from 'express';
import { z } from 'zod';
import type { StatusAgendamento } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { podeConfirmarAgendamento, resolverPessoaId } from '../lib/agendamentos.js';
import { dispararN8n } from '../lib/n8n.js';

const router = Router();

router.get('/', authenticate, authorize('agendamentos', 'read'), async (req, res) => {
  const status = req.query.status as StatusAgendamento | undefined;
  const agendamentos = await prisma.agendamentoPublico.findMany({
    where: status ? { status } : undefined,
    include: {
      pessoa: { select: { id: true, nomeCompleto: true, telefone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(agendamentos);
});

router.get('/:id', authenticate, authorize('agendamentos', 'read'), async (req, res) => {
  const agendamento = await prisma.agendamentoPublico.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      pessoa: { select: { id: true, nomeCompleto: true, telefone: true } },
    },
  });
  if (!agendamento) {
    res.status(404).json({ error: 'Agendamento não encontrado' });
    return;
  }
  res.json(agendamento);
});

router.patch('/:id/confirmar', authenticate, authorize('agendamentos', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      pessoaId: z.number().int().positive().optional(),
      criarPessoa: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const atual = await prisma.agendamentoPublico.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Agendamento não encontrado' });
    return;
  }

  const bloqueio = podeConfirmarAgendamento(atual.status);
  if (bloqueio) {
    res.status(409).json({ error: bloqueio });
    return;
  }

  let pessoaId = atual.pessoaId;
  if (body.data.pessoaId) {
    pessoaId = body.data.pessoaId;
  } else if (body.data.criarPessoa !== false) {
    pessoaId = await resolverPessoaId(prisma, {
      nome: atual.nome,
      telefone: atual.telefone,
      pessoaId: atual.pessoaId,
    });
  }

  const agendamento = await prisma.agendamentoPublico.update({
    where: { id },
    data: { status: 'CONFIRMADO', pessoaId: pessoaId ?? undefined },
    include: {
      pessoa: { select: { id: true, nomeCompleto: true, telefone: true } },
    },
  });

  const n8n = await dispararN8n('agendamento_confirmado', {
    agendamentoId: agendamento.id,
    nome: agendamento.nome,
    telefone: agendamento.telefone,
    pessoaId: agendamento.pessoaId,
  });

  res.json({ ...agendamento, n8n });
});

router.patch('/:id/cancelar', authenticate, authorize('agendamentos', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z.object({ motivo: z.string().max(500).optional() }).safeParse(req.body);

  const atual = await prisma.agendamentoPublico.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Agendamento não encontrado' });
    return;
  }
  if (atual.status === 'CANCELADO') {
    res.status(409).json({ error: 'Agendamento já cancelado' });
    return;
  }

  const observacao = body.success && body.data.motivo
    ? [atual.observacao, `Cancelado: ${body.data.motivo}`].filter(Boolean).join(' | ')
    : atual.observacao;

  const agendamento = await prisma.agendamentoPublico.update({
    where: { id },
    data: { status: 'CANCELADO', observacao },
    include: {
      pessoa: { select: { id: true, nomeCompleto: true, telefone: true } },
    },
  });

  const n8n = await dispararN8n('agendamento_cancelado', {
    agendamentoId: agendamento.id,
    nome: agendamento.nome,
    telefone: agendamento.telefone,
  });

  res.json({ ...agendamento, n8n });
});

export default router;
