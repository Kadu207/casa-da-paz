import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { calcularAdimplencia } from '../lib/adimplencia.js';
import { validarTransacao } from '../lib/financeiro.js';
import {
  resolverPeriodo,
  agruparPorSemana,
  agruparPorCategoria,
  calcularTotaisConcluidos,
  calcularTotaisPendentes,
  type TransacaoFluxo,
} from '../lib/fluxo-caixa.js';
import {
  parseListagemQuery,
  buildListagemWhere,
  parsePaginacao,
  paginateMeta,
} from '../lib/listagem-financeiro.js';
import { planBatchStatusUpdate } from '../lib/batch-status.js';
import {
  buildConciliacaoChecklist,
  buildConciliacaoTotais,
  snapshotFechamento,
} from '../lib/conciliacao.js';
import { buildFinanceiroCsv, type TransacaoExportRow } from '../lib/financeiro-export.js';
import { gerarPdfFinanceiro } from '../lib/financeiro-pdf.js';
import {
  bloqueiaDeleteTransacao,
  transacaoObservacaoEventoId,
} from '../lib/financeiro-delete-guard.js';
import { buildHistoricoResumo } from '../lib/historico-pessoa.js';
import { registrarAuditoria } from '../lib/auditoria.js';
import { gerarAlertasAdimplencia } from '../jobs/adimplencia.js';
import type { Periodo } from '../lib/fluxo-caixa.js';

const router = Router();

const transacaoSchema = z.object({
  pessoaId: z.number().int().positive().optional(),
  contaId: z.number().int().positive().optional(),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  categoria: z.string(),
  valor: z.number().positive(),
  dataTransacao: z.string(),
  vencimento: z.string().optional(),
  status: z.enum(['PENDENTE', 'CONCLUIDO']).default('PENDENTE'),
  observacoes: z.string().optional(),
  origem: z.enum(['MANUAL', 'PDV', 'EVENTO', 'ECOMMERCE', 'ASSINATURA', 'IMPORT']).optional(),
});

function parsePeriodoQuery(query: Record<string, unknown>): Periodo | string {
  const mes = query.mes !== undefined ? Number(query.mes) : undefined;
  const ano = query.ano !== undefined ? Number(query.ano) : undefined;
  const de = typeof query.de === 'string' ? query.de : undefined;
  const ate = typeof query.ate === 'string' ? query.ate : undefined;
  return resolverPeriodo({ mes, ano, de, ate });
}

function periodoLabel(periodo: Periodo, mes?: number, ano?: number): string {
  if (mes && ano) return `${ano}-${String(mes).padStart(2, '0')}`;
  return `${periodo.de.toISOString().slice(0, 10)}_${periodo.ate.toISOString().slice(0, 10)}`;
}

function toExportRow(t: {
  id: number;
  tipo: TransacaoFluxo['tipo'];
  categoria: string;
  valor: { toString(): string };
  dataTransacao: Date;
  vencimento: Date | null;
  status: TransacaoFluxo['status'];
  observacoes: string | null;
  pessoa: { nomeCompleto: string } | null;
}): TransacaoExportRow {
  return {
    id: t.id,
    tipo: t.tipo,
    categoria: t.categoria,
    valor: Number(t.valor),
    dataTransacao: t.dataTransacao,
    vencimento: t.vencimento,
    status: t.status,
    observacoes: t.observacoes,
    pessoaNome: t.pessoa?.nomeCompleto ?? null,
  };
}

async function loadTransacoesConciliacao(scope: Prisma.FinanceiroTransacaoWhereInput, periodo: Periodo) {
  return prisma.financeiroTransacao.findMany({
    where: {
      ...scope,
      OR: [
        { dataTransacao: { gte: periodo.de, lte: periodo.ate } },
        { status: 'PENDENTE' },
      ],
    },
    select: {
      tipo: true,
      categoria: true,
      status: true,
      dataTransacao: true,
      vencimento: true,
      valor: true,
    },
  });
}

function withAdimplencia<T extends { status: string; vencimento: Date | null }>(t: T) {
  return {
    ...t,
    adimplencia: calcularAdimplencia(t.status as 'PENDENTE' | 'CONCLUIDO', t.vencimento),
  };
}

function mediumScope(req: Request): Prisma.FinanceiroTransacaoWhereInput | undefined {
  if (req.user!.setorAcesso === 'MEDIUM') {
    return { pessoaId: req.user!.pessoaId };
  }
  return undefined;
}

router.get('/', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const query = req.query as Record<string, string | undefined>;
  const parsed = parseListagemQuery(query);
  if (typeof parsed === 'string') {
    res.status(400).json({ error: parsed });
    return;
  }

  const whereResult = buildListagemWhere(parsed, mediumScope(req));
  if (typeof whereResult === 'string') {
    res.status(400).json({ error: whereResult });
    return;
  }

  const { paginated, page, limit } = parsePaginacao(query.page, query.limit);
  const include = { pessoa: { select: { id: true, nomeCompleto: true } } };
  const orderBy = { dataTransacao: 'desc' as const };

  if (!paginated) {
    const transacoes = await prisma.financeiroTransacao.findMany({
      where: whereResult,
      include,
      orderBy,
    });
    res.json(transacoes.map(withAdimplencia));
    return;
  }

  const [total, transacoes] = await Promise.all([
    prisma.financeiroTransacao.count({ where: whereResult }),
    prisma.financeiroTransacao.findMany({
      where: whereResult,
      include,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    data: transacoes.map(withAdimplencia),
    meta: paginateMeta(total, page, limit),
  });
});

router.get('/dashboard', authenticate, authorize('dashboard', 'read'), async (_req, res) => {
  const receitas = await prisma.financeiroTransacao.groupBy({
    by: ['categoria'],
    where: { tipo: 'RECEITA', status: 'CONCLUIDO' },
    _sum: { valor: true },
  });
  const despesas = await prisma.financeiroTransacao.groupBy({
    by: ['categoria'],
    where: { tipo: 'DESPESA', status: 'CONCLUIDO' },
    _sum: { valor: true },
  });
  res.json({ receitas, despesas });
});

function toFluxoRow(t: {
  tipo: TransacaoFluxo['tipo'];
  categoria: string;
  valor: { toString(): string };
  status: TransacaoFluxo['status'];
  dataTransacao: Date;
  vencimento: Date | null;
}): TransacaoFluxo {
  return {
    tipo: t.tipo,
    categoria: t.categoria,
    valor: Number(t.valor),
    status: t.status,
    dataTransacao: t.dataTransacao,
    vencimento: t.vencimento,
  };
}

router.get('/fluxo-caixa', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const mes = req.query.mes ? Number(req.query.mes) : undefined;
  const ano = req.query.ano ? Number(req.query.ano) : undefined;
  const de = typeof req.query.de === 'string' ? req.query.de : undefined;
  const ate = typeof req.query.ate === 'string' ? req.query.ate : undefined;

  const periodo = resolverPeriodo({ de, ate, mes, ano });
  if (typeof periodo === 'string') {
    res.status(400).json({ error: periodo });
    return;
  }

  const scope = mediumScope(req);
  const transacoesDb = await prisma.financeiroTransacao.findMany({
    where: {
      ...scope,
      OR: [
        { dataTransacao: { gte: periodo.de, lte: periodo.ate } },
        {
          status: 'PENDENTE',
          vencimento: { gte: periodo.de, lte: periodo.ate },
        },
      ],
    },
    select: {
      tipo: true,
      categoria: true,
      valor: true,
      status: true,
      dataTransacao: true,
      vencimento: true,
    },
  });

  const rows = transacoesDb.map(toFluxoRow);
  const noPeriodo = rows.filter(
    (t) =>
      t.dataTransacao >= periodo.de && t.dataTransacao <= periodo.ate
  );

  const concluidos = calcularTotaisConcluidos(noPeriodo);
  const pendentes = calcularTotaisPendentes(rows);

  res.json({
    periodo: {
      de: periodo.de.toISOString().slice(0, 10),
      ate: periodo.ate.toISOString().slice(0, 10),
    },
    totais: {
      ...concluidos,
      ...pendentes,
    },
    porSemana: agruparPorSemana(noPeriodo, periodo),
    porCategoria: agruparPorCategoria(noPeriodo),
  });
});

router.get('/atrasados', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const transacoes = await prisma.financeiroTransacao.findMany({
    where: {
      ...mediumScope(req),
      status: 'PENDENTE',
      vencimento: { not: null },
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true } } },
  });
  res.json(
    transacoes.map(withAdimplencia).filter((t) => t.adimplencia === 'ATRASADO')
  );
});

router.post('/sync-alertas', authenticate, authorize('financeiro', 'write'), async (_req, res) => {
  const criados = await gerarAlertasAdimplencia();
  res.json({ criados });
});

const batchStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  status: z.enum(['PENDENTE', 'CONCLUIDO']),
});

router.post('/batch/status', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const parsed = batchStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { ids, status } = parsed.data;
  const scope = mediumScope(req);
  const transacoes = await prisma.financeiroTransacao.findMany({
    where: { id: { in: ids }, ...scope },
    select: { id: true, status: true, pessoaId: true },
  });

  const rowsById = new Map(
    transacoes.map((t) => [t.id, { id: t.id, status: t.status, pessoaId: t.pessoaId }])
  );

  const canUpdate = (row: { pessoaId: number | null }) => {
    if (req.user!.setorAcesso !== 'MEDIUM') return true;
    return row.pessoaId === req.user!.pessoaId;
  };

  const plan = planBatchStatusUpdate(ids, status, rowsById, canUpdate);

  if (plan.toUpdate.length > 0) {
    await prisma.financeiroTransacao.updateMany({
      where: { id: { in: plan.toUpdate }, ...scope },
      data: { status },
    });
  }

  res.json({
    atualizados: plan.toUpdate.length,
    ignorados: plan.ignorados,
    erros: plan.erros,
  });
});

router.get('/conciliacao', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const mes = req.query.mes ? Number(req.query.mes) : undefined;
  const ano = req.query.ano ? Number(req.query.ano) : undefined;
  if (!mes || !ano) {
    res.status(400).json({ error: 'Informe mes e ano' });
    return;
  }
  const periodo = resolverPeriodo({ mes, ano });
  if (typeof periodo === 'string') {
    res.status(400).json({ error: periodo });
    return;
  }

  const scope = mediumScope(req);
  const rows = await loadTransacoesConciliacao(scope ?? {}, periodo);
  const mapped = rows.map((t) => ({
    ...t,
    valor: Number(t.valor),
  }));
  const checklist = buildConciliacaoChecklist(mapped, periodo);
  const totais = buildConciliacaoTotais(mapped, periodo);

  const fechamento = await prisma.financeiroFechamentoMensal.findUnique({
    where: { ano_mes: { ano, mes } },
    include: { fechadoPor: { select: { id: true, login: true } } },
  });

  res.json({
    mes,
    ano,
    checklist,
    totais,
    fechamento: fechamento
      ? {
          id: fechamento.id,
          fechadoEm: fechamento.fechadoEm,
          fechadoPor: { id: fechamento.fechadoPor.id, nome: fechamento.fechadoPor.login },
        }
      : null,
  });
});

const fecharConciliacaoSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000),
  observacoes: z.string().max(500).optional(),
});

router.post(
  '/conciliacao/fechar',
  authenticate,
  authorize('financeiro', 'write'),
  async (req, res) => {
    const parsed = fecharConciliacaoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { mes, ano, observacoes } = parsed.data;
    const existente = await prisma.financeiroFechamentoMensal.findUnique({
      where: { ano_mes: { ano, mes } },
    });
    if (existente) {
      res.status(409).json({ error: 'Mês já fechado' });
      return;
    }

    const periodo = resolverPeriodo({ mes, ano });
    if (typeof periodo === 'string') {
      res.status(400).json({ error: periodo });
      return;
    }

    const scope = mediumScope(req);
    const rows = await loadTransacoesConciliacao(scope ?? {}, periodo);
    const mapped = rows.map((t) => ({ ...t, valor: Number(t.valor) }));
    const checklist = buildConciliacaoChecklist(mapped, periodo);
    const totais = buildConciliacaoTotais(mapped, periodo);
    const snap = snapshotFechamento(checklist, totais);

    const fechamento = await prisma.financeiroFechamentoMensal.create({
      data: {
        ano,
        mes,
        ...snap,
        observacoes,
        fechadoPorId: req.user!.userId,
      },
      include: { fechadoPor: { select: { id: true, login: true } } },
    });

    await registrarAuditoria(req, {
      rota: 'financeiro.conciliacao.fechar',
      motivo: `fechamento_${ano}_${mes}`,
    });

    res.status(201).json(fechamento);
  }
);

router.delete(
  '/conciliacao/:ano/:mes',
  authenticate,
  authorize('financeiro', 'write'),
  async (req, res) => {
    if (req.user!.setorAcesso !== 'DIRETORIA' && req.user!.setorAcesso !== 'SUPERVISOR') {
      res.status(403).json({ error: 'Apenas DIRETORIA ou SUPERVISOR pode reabrir mês' });
      return;
    }

    const ano = Number(req.params.ano);
    const mes = Number(req.params.mes);
    if (!Number.isFinite(ano) || !Number.isFinite(mes)) {
      res.status(400).json({ error: 'Ano/mês inválidos' });
      return;
    }

    const deleted = await prisma.financeiroFechamentoMensal.deleteMany({
      where: { ano, mes },
    });
    if (deleted.count === 0) {
      res.status(404).json({ error: 'Fechamento não encontrado' });
      return;
    }

    await registrarAuditoria(req, {
      rota: 'financeiro.conciliacao.reabrir',
      motivo: `reabrir_${ano}_${mes}`,
    });

    res.status(204).send();
  }
);

router.get('/export.csv', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const periodo = parsePeriodoQuery(req.query as Record<string, unknown>);
  if (typeof periodo === 'string') {
    res.status(400).json({ error: periodo });
    return;
  }

  const mes = req.query.mes ? Number(req.query.mes) : undefined;
  const ano = req.query.ano ? Number(req.query.ano) : undefined;
  const scope = mediumScope(req);
  const transacoes = await prisma.financeiroTransacao.findMany({
    where: {
      ...scope,
      dataTransacao: { gte: periodo.de, lte: periodo.ate },
    },
    include: { pessoa: { select: { nomeCompleto: true } } },
    orderBy: { dataTransacao: 'asc' },
  });

  const csv = buildFinanceiroCsv(transacoes.map(toExportRow));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="financeiro-${periodoLabel(periodo, mes, ano)}.csv"`
  );
  res.send(csv);
});

router.get('/export.pdf', authenticate, authorize('financeiro', 'read'), async (req, res) => {
  const periodo = parsePeriodoQuery(req.query as Record<string, unknown>);
  if (typeof periodo === 'string') {
    res.status(400).json({ error: periodo });
    return;
  }

  const mes = req.query.mes ? Number(req.query.mes) : undefined;
  const ano = req.query.ano ? Number(req.query.ano) : undefined;
  const scope = mediumScope(req);
  const transacoes = await prisma.financeiroTransacao.findMany({
    where: {
      ...scope,
      dataTransacao: { gte: periodo.de, lte: periodo.ate },
    },
    include: { pessoa: { select: { nomeCompleto: true } } },
    orderBy: { dataTransacao: 'asc' },
  });

  const pdf = await gerarPdfFinanceiro(
    transacoes.map(toExportRow),
    periodoLabel(periodo, mes, ano)
  );
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="financeiro-${periodoLabel(periodo, mes, ano)}.pdf"`
  );
  res.send(pdf);
});

router.get(
  '/pessoas/:pessoaId/historico',
  authenticate,
  authorize('financeiro', 'read'),
  async (req, res) => {
    const pessoaId = Number(req.params.pessoaId);
    if (!Number.isFinite(pessoaId)) {
      res.status(400).json({ error: 'pessoaId inválido' });
      return;
    }

    if (req.user!.setorAcesso === 'MEDIUM' && req.user!.pessoaId !== pessoaId) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    const pessoa = await prisma.pessoa.findUnique({
      where: { id: pessoaId },
      select: { id: true, nomeCompleto: true },
    });
    if (!pessoa) {
      res.status(404).json({ error: 'Pessoa não encontrada' });
      return;
    }

    const transacoes = await prisma.financeiroTransacao.findMany({
      where: { pessoaId },
      orderBy: { dataTransacao: 'desc' },
    });

    const resumo = buildHistoricoResumo(
      transacoes.map((t) => ({
        status: t.status,
        vencimento: t.vencimento,
        valor: Number(t.valor),
      }))
    );

    res.json({
      pessoa,
      resumo,
      transacoes: transacoes.map(withAdimplencia),
    });
  }
);

router.post('/', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const parsed = transacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const erro = validarTransacao(parsed.data);
  if (erro) {
    res.status(400).json({ error: erro });
    return;
  }

  const t = await prisma.financeiroTransacao.create({
    data: {
      ...parsed.data,
      dataTransacao: new Date(parsed.data.dataTransacao),
      vencimento: parsed.data.vencimento ? new Date(parsed.data.vencimento) : null,
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.status(201).json(withAdimplencia(t));
});

router.put('/:id', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = transacaoSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const atual = await prisma.financeiroTransacao.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }

  if (req.user!.setorAcesso === 'MEDIUM' && atual.pessoaId !== req.user!.pessoaId) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const merged = {
    tipo: parsed.data.tipo ?? atual.tipo,
    categoria: parsed.data.categoria ?? atual.categoria,
    vencimento:
      parsed.data.vencimento !== undefined
        ? parsed.data.vencimento
        : atual.vencimento?.toISOString().slice(0, 10),
    pessoaId: parsed.data.pessoaId ?? atual.pessoaId ?? undefined,
  };

  const erro = validarTransacao(merged);
  if (erro) {
    res.status(400).json({ error: erro });
    return;
  }

  const t = await prisma.financeiroTransacao.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.dataTransacao ? { dataTransacao: new Date(parsed.data.dataTransacao) } : {}),
      ...(parsed.data.vencimento !== undefined
        ? { vencimento: parsed.data.vencimento ? new Date(parsed.data.vencimento) : null }
        : {}),
    },
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.json(withAdimplencia(t));
});

router.patch('/:id/status', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const status = z.enum(['PENDENTE', 'CONCLUIDO']).parse(req.body.status);

  const atual = await prisma.financeiroTransacao.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }
  if (req.user!.setorAcesso === 'MEDIUM' && atual.pessoaId !== req.user!.pessoaId) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const t = await prisma.financeiroTransacao.update({
    where: { id },
    data: { status },
    include: { pessoa: { select: { id: true, nomeCompleto: true } } },
  });
  res.json(withAdimplencia(t));
});

router.delete('/:id', authenticate, authorize('financeiro', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const atual = await prisma.financeiroTransacao.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Transação não encontrada' });
    return;
  }
  if (req.user!.setorAcesso === 'MEDIUM') {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const eventoId = transacaoObservacaoEventoId(atual.observacoes);
  let temInscricaoAtiva = false;
  if (eventoId && atual.pessoaId) {
    const inscricao = await prisma.inscricao.findUnique({
      where: {
        eventoId_pessoaId: { eventoId, pessoaId: atual.pessoaId },
      },
    });
    temInscricaoAtiva = !!inscricao && inscricao.statusPagamento === 'PENDENTE';
  }

  const movCount = await prisma.estoqueMovimentacao.count({
    where: { transacaoId: id },
  });

  const bloqueio = bloqueiaDeleteTransacao({
    transacaoId: id,
    observacoes: atual.observacoes,
    temInscricaoAtiva,
    temMovimentacaoEstoque: movCount > 0,
  });
  if (bloqueio) {
    res.status(409).json({ error: bloqueio });
    return;
  }

  await prisma.financeiroTransacao.delete({ where: { id } });
  res.status(204).send();
});

/** Agenda de pagamentos a fazer (parcelas ContaPagar) — separada de atrasados (receber). */
router.get('/pagamentos-a-fazer', authenticate, authorize('contas_pagar', 'read'), async (req, res) => {
  const ateDias = req.query.ateDias ? Number(req.query.ateDias) : 30;
  const limite = new Date();
  limite.setUTCDate(limite.getUTCDate() + ateDias);

  const parcelas = await prisma.contaPagarParcela.findMany({
    where: {
      status: 'PENDENTE',
      vencimento: { lte: limite },
    },
    include: {
      contaPagar: {
        include: { fornecedor: { select: { id: true, nome: true } } },
      },
    },
    orderBy: { vencimento: 'asc' },
    take: 200,
  });

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  res.json(
    parcelas.map((p) => {
      const venc = new Date(p.vencimento);
      const dias = Math.floor((venc.getTime() - hoje.getTime()) / (24 * 60 * 60 * 1000));
      return {
        parcelaId: p.id,
        contaPagarId: p.contaPagarId,
        numero: p.numero,
        valor: Number(p.valor),
        vencimento: p.vencimento,
        diasParaVencer: dias,
        vencido: dias < 0,
        descricao: p.contaPagar.descricao,
        categoria: p.contaPagar.categoria,
        fornecedor: p.contaPagar.fornecedor,
      };
    })
  );
});

// --- Contas financeiras ---
router.get('/contas', authenticate, authorize('contas', 'read'), async (_req, res) => {
  const contas = await prisma.contaFinanceira.findMany({ orderBy: { id: 'asc' } });
  const withSaldo = await Promise.all(
    contas.map(async (c) => {
      const agg = await prisma.financeiroTransacao.groupBy({
        by: ['tipo', 'status'],
        where: { contaId: c.id, status: 'CONCLUIDO' },
        _sum: { valor: true },
      });
      let movimentado = 0;
      for (const row of agg) {
        const v = Number(row._sum.valor ?? 0);
        movimentado += row.tipo === 'RECEITA' ? v : -v;
      }
      return {
        ...c,
        saldoInicial: Number(c.saldoInicial),
        saldoCalculado: Number(c.saldoInicial) + movimentado,
      };
    })
  );
  res.json(withSaldo);
});

router.post('/contas', authenticate, authorize('contas', 'write'), async (req, res) => {
  const body = z
    .object({
      nome: z.string().min(2).max(100),
      tipo: z.enum(['CAIXA', 'BANCO', 'ASAAS']),
      saldoInicial: z.number().default(0),
      asaasWalletId: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const conta = await prisma.contaFinanceira.create({ data: body.data });
  res.status(201).json(conta);
});

router.patch('/contas/:id', authenticate, authorize('contas', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      nome: z.string().min(2).max(100).optional(),
      ativa: z.boolean().optional(),
      saldoInicial: z.number().optional(),
      asaasWalletId: z.string().nullable().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const conta = await prisma.contaFinanceira.update({ where: { id }, data: body.data });
  res.json(conta);
});

router.post('/contas/sync-asaas', authenticate, authorize('contas', 'write'), async (_req, res) => {
  const { syncAsaasBalanceToConta } = await import('../services/asaas/index.js');
  try {
    const result = await syncAsaasBalanceToConta();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro sync Asaas' });
  }
});

// --- Transparência interna (agregados, sem PII) ---
router.get('/transparencia', authenticate, authorize('transparencia', 'read'), async (req, res) => {
  const periodo = parsePeriodoQuery(req.query as Record<string, unknown>);
  if (typeof periodo === 'string') {
    res.status(400).json({ error: periodo });
    return;
  }

  const transacoes = await prisma.financeiroTransacao.findMany({
    where: {
      dataTransacao: { gte: periodo.de, lte: periodo.ate },
      status: 'CONCLUIDO',
    },
    select: {
      tipo: true,
      categoria: true,
      valor: true,
      contaId: true,
      origem: true,
    },
  });

  const porCategoria: Record<string, { receitas: number; despesas: number }> = {};
  const porConta: Record<number, { receitas: number; despesas: number }> = {};
  const porOrigem: Record<string, number> = {};
  let receitas = 0;
  let despesas = 0;

  for (const t of transacoes) {
    const v = Number(t.valor);
    if (!porCategoria[t.categoria]) porCategoria[t.categoria] = { receitas: 0, despesas: 0 };
    if (t.tipo === 'RECEITA') {
      receitas += v;
      porCategoria[t.categoria].receitas += v;
      if (t.contaId) {
        if (!porConta[t.contaId]) porConta[t.contaId] = { receitas: 0, despesas: 0 };
        porConta[t.contaId].receitas += v;
      }
    } else {
      despesas += v;
      porCategoria[t.categoria].despesas += v;
      if (t.contaId) {
        if (!porConta[t.contaId]) porConta[t.contaId] = { receitas: 0, despesas: 0 };
        porConta[t.contaId].despesas += v;
      }
    }
    porOrigem[t.origem] = (porOrigem[t.origem] ?? 0) + v;
  }

  const contas = await prisma.contaFinanceira.findMany({
    where: { id: { in: Object.keys(porConta).map(Number) } },
    select: { id: true, nome: true, tipo: true },
  });
  const contaMap = new Map(contas.map((c) => [c.id, c]));

  res.json({
    periodo: {
      de: periodo.de.toISOString().slice(0, 10),
      ate: periodo.ate.toISOString().slice(0, 10),
    },
    totais: { receitas, despesas, saldo: receitas - despesas },
    porCategoria: Object.entries(porCategoria).map(([categoria, v]) => ({ categoria, ...v })),
    porConta: Object.entries(porConta).map(([id, v]) => ({
      contaId: Number(id),
      nome: contaMap.get(Number(id))?.nome ?? `Conta #${id}`,
      tipo: contaMap.get(Number(id))?.tipo ?? null,
      ...v,
      saldo: v.receitas - v.despesas,
    })),
    porOrigem: Object.entries(porOrigem).map(([origem, valor]) => ({ origem, valor })),
  });
});

export default router;
