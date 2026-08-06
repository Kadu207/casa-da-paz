import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { podeInscrever } from '../lib/inscricoes.js';
import { calcularAdimplencia } from '../lib/adimplencia.js';

const router = Router();

const inscricaoInclude = {
  pessoa: { select: { id: true, nomeCompleto: true, telefone: true } },
} as const;

router.get('/', authenticate, authorize('eventos', 'read'), async (req, res) => {
  const status = req.query.status as 'ABERTO' | 'ENCERRADO' | undefined;
  const eventos = await prisma.evento.findMany({
    where: status ? { status } : undefined,
    include: {
      _count: { select: { presencas: true, inscricoes: true } },
      presencas: {
        include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true, maiorDeIdade: true } } },
        orderBy: { horarioChegada: 'desc' },
      },
      inscricoes: {
        include: inscricaoInclude,
        orderBy: { id: 'desc' },
      },
    },
    orderBy: { dataEvento: 'desc' },
  });
  res.json(
    eventos.map((e) => ({
      ...e,
      inscricoes: e.inscricoes.map((i) => ({
        ...i,
        adimplencia: calcularAdimplencia(i.statusPagamento, i.vencimento),
      })),
    }))
  );
});

router.get('/:id', authenticate, authorize('eventos', 'read'), async (req, res) => {
  const evento = await prisma.evento.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      _count: { select: { presencas: true, inscricoes: true } },
      presencas: {
        include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true, maiorDeIdade: true } } },
        orderBy: { horarioChegada: 'desc' },
      },
      inscricoes: {
        include: inscricaoInclude,
        orderBy: { id: 'desc' },
      },
    },
  });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  res.json({
    ...evento,
    inscricoes: evento.inscricoes.map((i) => ({
      ...i,
      adimplencia: calcularAdimplencia(i.statusPagamento, i.vencimento),
    })),
  });
});

router.post('/', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const body = z
    .object({
      nomeEvento: z.string().min(2),
      dataEvento: z.string(),
      tipo: z.enum(['GIRA', 'OFICINA']).default('GIRA'),
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
      tipo: body.data.tipo,
      capacidadeMax: body.data.capacidadeMax,
      status: 'ABERTO',
    },
  });
  res.status(201).json(evento);
});

router.get('/:id/inscricoes', authenticate, authorize('eventos', 'read'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const inscricoes = await prisma.inscricao.findMany({
    where: { eventoId },
    include: inscricaoInclude,
    orderBy: { id: 'desc' },
  });
  res.json(
    inscricoes.map((i) => ({
      ...i,
      adimplencia: calcularAdimplencia(i.statusPagamento, i.vencimento),
    }))
  );
});

router.post('/:id/inscricoes', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const body = z
    .object({
      pessoaId: z.number().int().positive(),
      valor: z.number().positive(),
      vencimento: z.string(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { _count: { select: { inscricoes: true } } },
  });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }

  const jaInscrito = await prisma.inscricao.findUnique({
    where: { eventoId_pessoaId: { eventoId, pessoaId: body.data.pessoaId } },
  });

  const bloqueio = podeInscrever({
    eventoStatus: evento.status,
    capacidadeMax: evento.capacidadeMax,
    inscricoesAtivas: evento._count.inscricoes,
    jaInscrito: !!jaInscrito,
  });
  if (bloqueio) {
    res.status(409).json({ error: bloqueio });
    return;
  }

  const inscricao = await prisma.inscricao.create({
    data: {
      eventoId,
      pessoaId: body.data.pessoaId,
      valor: body.data.valor,
      vencimento: new Date(body.data.vencimento),
      statusPagamento: 'PENDENTE',
    },
    include: inscricaoInclude,
  });

  await prisma.financeiroTransacao.create({
    data: {
      pessoaId: body.data.pessoaId,
      tipo: 'RECEITA',
      categoria: 'OFICINAS',
      valor: body.data.valor,
      dataTransacao: new Date(),
      vencimento: new Date(body.data.vencimento),
      status: 'PENDENTE',
      observacoes: `Inscrição evento #${eventoId}`,
    },
  });

  res.status(201).json({
    ...inscricao,
    adimplencia: calcularAdimplencia(inscricao.statusPagamento, inscricao.vencimento),
  });
});

router.patch(
  '/:id/inscricoes/:inscricaoId/pagamento',
  authenticate,
  authorize('eventos', 'write'),
  async (req, res) => {
    const eventoId = Number(req.params.id);
    const inscricaoId = Number(req.params.inscricaoId);
    const status = z.enum(['PENDENTE', 'CONCLUIDO']).parse(req.body.status);

    const inscricao = await prisma.inscricao.findFirst({
      where: { id: inscricaoId, eventoId },
    });
    if (!inscricao) {
      res.status(404).json({ error: 'Inscrição não encontrada' });
      return;
    }

    const atualizada = await prisma.$transaction(async (tx) => {
      const upd = await tx.inscricao.update({
        where: { id: inscricaoId },
        data: { statusPagamento: status },
        include: inscricaoInclude,
      });

      if (status === 'CONCLUIDO') {
        await tx.financeiroTransacao.updateMany({
          where: {
            pessoaId: inscricao.pessoaId,
            categoria: 'OFICINAS',
            status: 'PENDENTE',
            observacoes: { contains: `Inscrição evento #${eventoId}` },
          },
          data: { status: 'CONCLUIDO' },
        });
      }

      return upd;
    });

    res.json({
      ...atualizada,
      adimplencia: calcularAdimplencia(atualizada.statusPagamento, atualizada.vencimento),
    });
  }
);

router.post(
  '/:id/inscricoes/:inscricaoId/cobrar',
  authenticate,
  authorize('cobrancas', 'write'),
  async (req, res) => {
    const eventoId = Number(req.params.id);
    const inscricaoId = Number(req.params.inscricaoId);
    const body = z
      .object({
        billingType: z.enum(['BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED']).default('PIX'),
        cpfCnpj: z.string().min(11),
        email: z.string().email().optional(),
        dueDate: z.string().optional(),
      })
      .safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const inscricao = await prisma.inscricao.findFirst({
      where: { id: inscricaoId, eventoId },
      include: { pessoa: true, evento: true },
    });
    if (!inscricao) {
      res.status(404).json({ error: 'Inscrição não encontrada' });
      return;
    }

    try {
      const { createCobrancaAvulsa } = await import('../services/asaas/index.js');
      const result = await createCobrancaAvulsa({
        pessoaId: inscricao.pessoaId,
        customerName: inscricao.pessoa.nomeCompleto,
        cpfCnpj: body.data.cpfCnpj,
        email: body.data.email,
        phone: inscricao.pessoa.telefone ?? undefined,
        value: Number(inscricao.valor),
        billingType: body.data.billingType,
        categoria: 'EVENTOS',
        dueDate: body.data.dueDate,
        description: `Inscrição ${inscricao.evento.nomeEvento}`,
        inscricaoId: inscricao.id,
      });
      res.status(201).json(result);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      res.status(status).json({ error: err instanceof Error ? err.message : 'Erro Asaas' });
    }
  }
);

router.post('/:id/checkin', authenticate, authorize('checkin', 'write'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const body = z
    .object({
      pessoaId: z.number().int().positive(),
      tipoPresenca: z.enum(['MEDIUM', 'CONSULENTE']),
      nomeResponsavel: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { _count: { select: { presencas: true } } },
  });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  if (evento.status !== 'ABERTO') {
    res.status(409).json({ error: 'Evento encerrado' });
    return;
  }
  if (evento.capacidadeMax && evento._count.presencas >= evento.capacidadeMax) {
    res.status(409).json({ error: 'Capacidade máxima atingida' });
    return;
  }

  const pessoa = await prisma.pessoa.findUnique({ where: { id: body.data.pessoaId } });
  if (!pessoa) {
    res.status(404).json({ error: 'Pessoa não encontrada' });
    return;
  }
  if (!pessoa.maiorDeIdade && !body.data.nomeResponsavel?.trim()) {
    res.status(400).json({ error: 'nome_responsavel obrigatório para menor de idade' });
    return;
  }

  const jaPresente = await prisma.presenca.findFirst({
    where: { eventoId, pessoaId: body.data.pessoaId },
  });
  if (jaPresente) {
    res.status(409).json({ error: 'Pessoa já fez check-in neste evento', presencaId: jaPresente.id });
    return;
  }

  const presenca = await prisma.presenca.create({
    data: {
      eventoId,
      pessoaId: body.data.pessoaId,
      tipoPresenca: body.data.tipoPresenca,
      nomeResponsavel: body.data.nomeResponsavel?.trim() || null,
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true } } },
  });
  res.status(201).json(presenca);
});

router.patch('/:id/encerrar', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const evento = await prisma.evento.update({
    where: { id: Number(req.params.id) },
    data: { status: 'ENCERRADO' },
    include: { _count: { select: { presencas: true } } },
  });
  res.json(evento);
});

export default router;
