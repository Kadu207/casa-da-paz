import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { podeInscrever } from '../lib/inscricoes.js';
import { calcularAdimplencia } from '../lib/adimplencia.js';
import { alocarCodigoIngresso } from '../lib/ingresso-codigo.js';
import {
  normalizarCodigoIngresso,
  podeCancelarInscricao,
  podeCheckinPorCodigo,
  podeReservarLote,
  somaLotesAtivosExcedeCapacidade,
  vagasRestantes,
} from '../lib/ingressos.js';
import { dispararN8n } from '../lib/n8n.js';

const router = Router();

const inscricaoInclude = {
  pessoa: { select: { id: true, nomeCompleto: true, telefone: true, email: true } },
  ingressoLote: { select: { id: true, nome: true, valor: true, quantidade: true, ativo: true } },
} as const;

const inscricoesAtivasCount = { where: { canceladaEm: null } } as const;

async function mapLotesComVagas(eventoId: number) {
  const lotes = await prisma.ingressoLote.findMany({
    where: { eventoId },
    orderBy: { id: 'asc' },
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
      ...lote,
      ocupadas: ocup,
      vagasRestantes: vagasRestantes(lote.quantidade, ocup),
    };
  });
}

router.get('/', authenticate, authorize('eventos', 'read'), async (req, res) => {
  const status = req.query.status as 'ABERTO' | 'ENCERRADO' | undefined;
  const eventos = await prisma.evento.findMany({
    where: status ? { status } : undefined,
    include: {
      _count: { select: { presencas: true, inscricoes: inscricoesAtivasCount } },
      presencas: {
        include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true, maiorDeIdade: true } } },
        orderBy: { horarioChegada: 'desc' },
      },
      inscricoes: {
        include: inscricaoInclude,
        orderBy: { id: 'desc' },
      },
      ingressoLotes: { orderBy: { id: 'asc' } },
    },
    orderBy: { dataEvento: 'desc' },
  });
  const lotesPorEvento = await Promise.all(eventos.map((e) => mapLotesComVagas(e.id)));
  res.json(
    eventos.map((e, idx) => ({
      ...e,
      ingressoLotes: lotesPorEvento[idx],
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
      _count: { select: { presencas: true, inscricoes: inscricoesAtivasCount } },
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
  const ingressoLotes = await mapLotesComVagas(evento.id);
  res.json({
    ...evento,
    ingressoLotes,
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

router.put('/:id', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      nomeEvento: z.string().min(2).optional(),
      dataEvento: z.string().optional(),
      tipo: z.enum(['GIRA', 'OFICINA']).optional(),
      capacidadeMax: z.number().int().positive().nullable().optional(),
      status: z.enum(['ABERTO', 'ENCERRADO']).optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const existing = await prisma.evento.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  const data: Record<string, unknown> = {};
  if (body.data.nomeEvento !== undefined) data.nomeEvento = body.data.nomeEvento;
  if (body.data.dataEvento !== undefined) data.dataEvento = new Date(body.data.dataEvento);
  if (body.data.tipo !== undefined) data.tipo = body.data.tipo;
  if (body.data.capacidadeMax !== undefined) data.capacidadeMax = body.data.capacidadeMax;
  if (body.data.status !== undefined) data.status = body.data.status;
  const evento = await prisma.evento.update({ where: { id }, data });
  res.json(evento);
});

router.delete('/:id', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.evento.findUnique({
    where: { id },
    include: { _count: { select: { inscricoes: true } } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  if (existing._count.inscricoes > 0) {
    res.status(409).json({
      error: 'Evento possui inscrição(ões). Encerre o evento em vez de excluir.',
    });
    return;
  }
  await prisma.evento.delete({ where: { id } });
  res.status(204).send();
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
      valor: z.number().positive().optional(),
      vencimento: z.string(),
      ingressoLoteId: z.number().int().positive().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: { _count: { select: { inscricoes: inscricoesAtivasCount } } },
  });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }

  let valor = body.data.valor;
  let ingressoLoteId = body.data.ingressoLoteId ?? null;

  if (ingressoLoteId != null) {
    const lote = await prisma.ingressoLote.findFirst({
      where: { id: ingressoLoteId, eventoId },
    });
    if (!lote) {
      res.status(404).json({ error: 'Lote não encontrado' });
      return;
    }
    const ocupadas = await prisma.inscricao.count({
      where: { ingressoLoteId, canceladaEm: null },
    });
    const bloqueioLote = podeReservarLote({
      eventoStatus: evento.status,
      loteAtivo: lote.ativo,
      quantidade: lote.quantidade,
      ocupadas,
      jaInscritoAtivo: false,
    });
    if (bloqueioLote && bloqueioLote !== 'Pessoa já inscrita neste evento') {
      res.status(409).json({ error: bloqueioLote });
      return;
    }
    valor = valor ?? Number(lote.valor);
  }

  if (valor == null || valor <= 0) {
    res.status(400).json({ error: 'Valor obrigatório' });
    return;
  }

  const existente = await prisma.inscricao.findUnique({
    where: { eventoId_pessoaId: { eventoId, pessoaId: body.data.pessoaId } },
  });
  const jaInscritoAtivo = !!existente && !existente.canceladaEm;

  const bloqueio = podeInscrever({
    eventoStatus: evento.status,
    capacidadeMax: evento.capacidadeMax,
    inscricoesAtivas: evento._count.inscricoes,
    jaInscrito: jaInscritoAtivo,
  });
  if (bloqueio) {
    res.status(409).json({ error: bloqueio });
    return;
  }

  const inscricao = await prisma.$transaction(async (tx) => {
    const codigo =
      ingressoLoteId != null
        ? await alocarCodigoIngresso(tx)
        : existente?.codigo ?? null;

    if (existente?.canceladaEm) {
      return tx.inscricao.update({
        where: { id: existente.id },
        data: {
          valor,
          vencimento: new Date(body.data.vencimento),
          statusPagamento: 'PENDENTE',
          canceladaEm: null,
          ingressoLoteId,
          codigo,
        },
        include: inscricaoInclude,
      });
    }

    return tx.inscricao.create({
      data: {
        eventoId,
        pessoaId: body.data.pessoaId,
        valor,
        vencimento: new Date(body.data.vencimento),
        statusPagamento: 'PENDENTE',
        ingressoLoteId,
        codigo,
      },
      include: inscricaoInclude,
    });
  });

  await prisma.financeiroTransacao.create({
    data: {
      pessoaId: body.data.pessoaId,
      tipo: 'RECEITA',
      categoria: 'OFICINAS',
      valor,
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
      include: { pessoa: true, evento: true, ingressoLote: true },
    });
    if (!inscricao) {
      res.status(404).json({ error: 'Inscrição não encontrada' });
      return;
    }
    if (inscricao.canceladaEm) {
      res.status(409).json({ error: 'Inscrição cancelada' });
      return;
    }

    const atualizada = await prisma.$transaction(async (tx) => {
      const upd = await tx.inscricao.update({
        where: { id: inscricaoId },
        data: { statusPagamento: status },
        include: inscricaoInclude,
      });

      if (status === 'CONCLUIDO') {
        const updated = await tx.financeiroTransacao.updateMany({
          where: {
            pessoaId: inscricao.pessoaId,
            categoria: 'OFICINAS',
            status: 'PENDENTE',
            observacoes: { contains: `Inscrição evento #${eventoId}` },
          },
          data: { status: 'CONCLUIDO' },
        });
        if (updated.count === 0) {
          await tx.financeiroTransacao.create({
            data: {
              pessoaId: inscricao.pessoaId,
              tipo: 'RECEITA',
              categoria: 'OFICINAS',
              valor: inscricao.valor,
              dataTransacao: new Date(),
              vencimento: inscricao.vencimento ?? new Date(),
              status: 'CONCLUIDO',
              observacoes: `Inscrição evento #${eventoId}`,
            },
          });
        }
      }

      return upd;
    });

    if (status === 'CONCLUIDO') {
      await dispararN8n('ingresso_oficina', {
        inscricaoId: atualizada.id,
        eventoId,
        eventoNome: inscricao.evento.nomeEvento,
        codigo: atualizada.codigo,
        valor: Number(atualizada.valor),
        lote: inscricao.ingressoLote?.nome ?? null,
        nome: inscricao.pessoa.nomeCompleto,
        telefone: inscricao.pessoa.telefone,
        email: inscricao.pessoa.email,
        statusPagamento: 'CONCLUIDO',
      });
    }

    res.json({
      ...atualizada,
      adimplencia: calcularAdimplencia(atualizada.statusPagamento, atualizada.vencimento),
    });
  }
);

router.post(
  '/:id/inscricoes/:inscricaoId/cancelar',
  authenticate,
  authorize('eventos', 'write'),
  async (req, res) => {
    const eventoId = Number(req.params.id);
    const inscricaoId = Number(req.params.inscricaoId);
    const inscricao = await prisma.inscricao.findFirst({
      where: { id: inscricaoId, eventoId },
    });
    if (!inscricao) {
      res.status(404).json({ error: 'Inscrição não encontrada' });
      return;
    }
    const bloqueio = podeCancelarInscricao({
      canceladaEm: inscricao.canceladaEm,
      statusPagamento: inscricao.statusPagamento,
    });
    if (bloqueio) {
      res.status(409).json({ error: bloqueio });
      return;
    }

    const atualizada = await prisma.$transaction(async (tx) => {
      const upd = await tx.inscricao.update({
        where: { id: inscricaoId },
        data: { canceladaEm: new Date() },
        include: inscricaoInclude,
      });
      await tx.financeiroTransacao.updateMany({
        where: {
          pessoaId: inscricao.pessoaId,
          categoria: 'OFICINAS',
          status: 'PENDENTE',
          observacoes: { contains: `Inscrição evento #${eventoId}` },
        },
        data: { status: 'PENDENTE', observacoes: `Inscrição evento #${eventoId} (cancelada)` },
      });
      return upd;
    });

    res.json({
      ...atualizada,
      adimplencia: calcularAdimplencia(atualizada.statusPagamento, atualizada.vencimento),
    });
  }
);

router.get('/:id/lotes', authenticate, authorize('eventos', 'read'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  res.json(await mapLotesComVagas(eventoId));
});

router.post('/:id/lotes', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const body = z
    .object({
      nome: z.string().min(2).max(100),
      quantidade: z.number().int().positive(),
      valor: z.number().nonnegative(),
      ativo: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }

  const lotes = await prisma.ingressoLote.findMany({ where: { eventoId } });
  if (
    somaLotesAtivosExcedeCapacidade(evento.capacidadeMax, lotes, {
      quantidade: body.data.quantidade,
      ativo: body.data.ativo ?? true,
    })
  ) {
    res.status(409).json({ error: 'Soma dos lotes ativos excede a capacidade do evento' });
    return;
  }

  const lote = await prisma.ingressoLote.create({
    data: {
      eventoId,
      nome: body.data.nome,
      quantidade: body.data.quantidade,
      valor: body.data.valor,
      ativo: body.data.ativo ?? true,
    },
  });
  res.status(201).json({ ...lote, ocupadas: 0, vagasRestantes: lote.quantidade });
});

router.put('/:id/lotes/:loteId', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const loteId = Number(req.params.loteId);
  const body = z
    .object({
      nome: z.string().min(2).max(100).optional(),
      quantidade: z.number().int().positive().optional(),
      valor: z.number().nonnegative().optional(),
      ativo: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }
  const lote = await prisma.ingressoLote.findFirst({ where: { id: loteId, eventoId } });
  if (!lote) {
    res.status(404).json({ error: 'Lote não encontrado' });
    return;
  }

  const lotes = await prisma.ingressoLote.findMany({ where: { eventoId } });
  const next = {
    id: loteId,
    quantidade: body.data.quantidade ?? lote.quantidade,
    ativo: body.data.ativo ?? lote.ativo,
  };
  if (somaLotesAtivosExcedeCapacidade(evento.capacidadeMax, lotes, next)) {
    res.status(409).json({ error: 'Soma dos lotes ativos excede a capacidade do evento' });
    return;
  }

  if (body.data.quantidade != null) {
    const ocupadas = await prisma.inscricao.count({
      where: { ingressoLoteId: loteId, canceladaEm: null },
    });
    if (body.data.quantidade < ocupadas) {
      res.status(409).json({ error: `Quantidade menor que ocupadas (${ocupadas})` });
      return;
    }
  }

  const atualizado = await prisma.ingressoLote.update({
    where: { id: loteId },
    data: {
      ...(body.data.nome !== undefined ? { nome: body.data.nome } : {}),
      ...(body.data.quantidade !== undefined ? { quantidade: body.data.quantidade } : {}),
      ...(body.data.valor !== undefined ? { valor: body.data.valor } : {}),
      ...(body.data.ativo !== undefined ? { ativo: body.data.ativo } : {}),
    },
  });
  const ocupadas = await prisma.inscricao.count({
    where: { ingressoLoteId: loteId, canceladaEm: null },
  });
  res.json({
    ...atualizado,
    ocupadas,
    vagasRestantes: vagasRestantes(atualizado.quantidade, ocupadas),
  });
});

router.delete('/:id/lotes/:loteId', authenticate, authorize('eventos', 'write'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const loteId = Number(req.params.loteId);
  const lote = await prisma.ingressoLote.findFirst({ where: { id: loteId, eventoId } });
  if (!lote) {
    res.status(404).json({ error: 'Lote não encontrado' });
    return;
  }
  const ocupadas = await prisma.inscricao.count({
    where: { ingressoLoteId: loteId, canceladaEm: null },
  });
  if (ocupadas > 0) {
    res.status(409).json({ error: 'Lote possui reservas ativas — desative em vez de excluir' });
    return;
  }
  await prisma.ingressoLote.delete({ where: { id: loteId } });
  res.status(204).send();
});

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

router.post('/:id/checkin-codigo', authenticate, authorize('checkin', 'write'), async (req, res) => {
  const eventoId = Number(req.params.id);
  const body = z
    .object({
      codigo: z.string().min(4).max(32),
      tipoPresenca: z.enum(['MEDIUM', 'CONSULENTE']).optional(),
      nomeResponsavel: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const codigo = normalizarCodigoIngresso(body.data.codigo);
  if (!codigo) {
    res.status(400).json({ error: 'Código inválido' });
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
  if (evento.capacidadeMax && evento._count.presencas >= evento.capacidadeMax) {
    res.status(409).json({ error: 'Capacidade máxima atingida' });
    return;
  }

  const inscricao = await prisma.inscricao.findUnique({
    where: { codigo },
    include: {
      pessoa: { select: { id: true, nomeCompleto: true, telefone: true, maiorDeIdade: true } },
      ingressoLote: { select: { id: true, nome: true } },
    },
  });
  if (!inscricao) {
    res.status(404).json({ error: 'Código não encontrado' });
    return;
  }

  const jaPresente = await prisma.presenca.findFirst({
    where: { eventoId, pessoaId: inscricao.pessoaId },
  });
  const bloqueio = podeCheckinPorCodigo({
    eventoStatus: evento.status,
    eventoIdEsperado: eventoId,
    inscricaoEventoId: inscricao.eventoId,
    canceladaEm: inscricao.canceladaEm,
    jaPresente: !!jaPresente,
  });
  if (bloqueio) {
    res.status(409).json({ error: bloqueio, statusPagamento: inscricao.statusPagamento });
    return;
  }

  if (!inscricao.pessoa.maiorDeIdade && !body.data.nomeResponsavel?.trim()) {
    res.status(400).json({ error: 'nome_responsavel obrigatório para menor de idade' });
    return;
  }

  const tipoPresenca = body.data.tipoPresenca ?? 'CONSULENTE';
  const presenca = await prisma.presenca.create({
    data: {
      eventoId,
      pessoaId: inscricao.pessoaId,
      tipoPresenca,
      nomeResponsavel: body.data.nomeResponsavel?.trim() || null,
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true } } },
  });

  res.status(201).json({
    ...presenca,
    inscricao: {
      id: inscricao.id,
      codigo: inscricao.codigo,
      statusPagamento: inscricao.statusPagamento,
      lote: inscricao.ingressoLote?.nome ?? null,
    },
  });
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
