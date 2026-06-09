import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { calcularAdimplencia } from '../lib/adimplencia.js';
import {
  parseMetricasPeriodo,
  financeiroWhereNoPeriodo,
} from '../lib/metricas-periodo.js';

const router = Router();

async function rankingEventos() {
  const eventos = await prisma.evento.findMany({
    where: { status: 'ABERTO' },
    select: {
      id: true,
      nomeEvento: true,
      visualizacoes: true,
      capacidadeMax: true,
      _count: { select: { inscricoes: true } },
    },
    orderBy: { visualizacoes: 'desc' },
    take: 10,
  });
  return eventos.map((e) => {
    const inscritos = e._count.inscricoes;
    const taxaInscricao =
      e.capacidadeMax && e.capacidadeMax > 0
        ? Math.round((inscritos / e.capacidadeMax) * 1000) / 10
        : null;
    return {
      id: e.id,
      nomeEvento: e.nomeEvento,
      visualizacoes: e.visualizacoes,
      inscritos,
      capacidadeMax: e.capacidadeMax,
      taxaInscricao,
    };
  });
}

router.get('/eventos', authenticate, authorize('dashboard', 'read'), async (_req, res) => {
  const lista = await rankingEventos();
  const totais = {
    visualizacoes: lista.reduce((s, e) => s + e.visualizacoes, 0),
    inscritos: lista.reduce((s, e) => s + e.inscritos, 0),
    newsletterAtivos: await prisma.newsletterInscrito.count({ where: { ativo: true } }),
  };
  res.json({ eventos: lista, totais });
});

router.get('/resumo', authenticate, authorize('dashboard', 'read'), async (req, res) => {
  const periodoParsed = parseMetricasPeriodo({
    mes: typeof req.query.mes === 'string' ? req.query.mes : undefined,
    ano: typeof req.query.ano === 'string' ? req.query.ano : undefined,
  });
  if (typeof periodoParsed === 'string') {
    res.status(400).json({ error: periodoParsed });
    return;
  }

  const finPeriodoWhere = periodoParsed ? financeiroWhereNoPeriodo(periodoParsed) : {};

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    receitasAgg,
    despesasAgg,
    pendentes,
    pessoas,
    agPendente,
    agConfirmado,
    agCancelado,
    eventosAbertos,
    visualizacoesSum,
    inscricoesCount,
    newsletterAtivos,
    presencasMes,
    receitasPorCat,
    despesasPorCat,
    eventosRanking,
  ] = await Promise.all([
    prisma.financeiroTransacao.aggregate({
      where: { tipo: 'RECEITA', status: 'CONCLUIDO', ...finPeriodoWhere },
      _sum: { valor: true },
    }),
    prisma.financeiroTransacao.aggregate({
      where: { tipo: 'DESPESA', status: 'CONCLUIDO', ...finPeriodoWhere },
      _sum: { valor: true },
    }),
    prisma.financeiroTransacao.findMany({
      where: { status: 'PENDENTE', ...finPeriodoWhere },
      select: { vencimento: true, status: true },
    }),
    prisma.pessoa.count(),
    prisma.agendamentoPublico.count({ where: { status: 'PENDENTE' } }),
    prisma.agendamentoPublico.count({ where: { status: 'CONFIRMADO' } }),
    prisma.agendamentoPublico.count({ where: { status: 'CANCELADO' } }),
    prisma.evento.count({ where: { status: 'ABERTO' } }),
    prisma.evento.aggregate({ _sum: { visualizacoes: true } }),
    prisma.inscricao.count(),
    prisma.newsletterInscrito.count({ where: { ativo: true } }),
    prisma.presenca.count({ where: { horarioChegada: { gte: inicioMes } } }),
    prisma.financeiroTransacao.groupBy({
      by: ['categoria'],
      where: { tipo: 'RECEITA', status: 'CONCLUIDO', ...finPeriodoWhere },
      _sum: { valor: true },
    }),
    prisma.financeiroTransacao.groupBy({
      by: ['categoria'],
      where: { tipo: 'DESPESA', status: 'CONCLUIDO', ...finPeriodoWhere },
      _sum: { valor: true },
    }),
    rankingEventos(),
  ]);

  const receitas = Number(receitasAgg._sum.valor ?? 0);
  const despesas = Number(despesasAgg._sum.valor ?? 0);
  const atrasados = pendentes.filter(
    (t) => calcularAdimplencia(t.status, t.vencimento) === 'ATRASADO'
  ).length;

  res.json({
    financeiro: {
      receitasConcluidas: receitas,
      despesasConcluidas: despesas,
      saldo: receitas - despesas,
      transacoesPendentes: pendentes.length,
      transacoesAtrasadas: atrasados,
    },
    operacional: {
      pessoasCadastradas: pessoas,
      agendamentosPendentes: agPendente,
      agendamentosConfirmados: agConfirmado,
      agendamentosCancelados: agCancelado,
      eventosAbertos,
      visualizacoesEventos: visualizacoesSum._sum.visualizacoes ?? 0,
      inscricoesTotal: inscricoesCount,
      newsletterAtivos,
      presencasNoMes: presencasMes,
    },
    eventosRanking,
    receitasPorCategoria: receitasPorCat.map((r) => ({
      categoria: r.categoria,
      valor: Number(r._sum.valor ?? 0),
    })),
    despesasPorCategoria: despesasPorCat.map((d) => ({
      categoria: d.categoria,
      valor: Number(d._sum.valor ?? 0),
    })),
  });
});

export default router;
