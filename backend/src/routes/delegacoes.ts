import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  amanhaUtc,
  inicioDoDia,
  notificarTarefaDelegacao,
  slugifyFuncao,
  syncAlertasDelegacao,
  tarefaInclude,
} from '../lib/delegacoes.js';

const router = Router();

const funcaoSchema = z.object({
  nome: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).optional(),
  descricao: z.string().max(500).optional().nullable(),
  ordem: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});

const responsaveisSchema = z.object({
  pessoas: z
    .array(
      z.object({
        pessoaId: z.number().int().positive(),
        papel: z.string().max(80).optional().nullable(),
      })
    )
    .max(50),
});

const tarefaSchema = z.object({
  funcaoId: z.number().int().positive(),
  pessoaId: z.number().int().positive().optional().nullable(),
  titulo: z.string().min(2).max(200),
  descricao: z.string().max(2000).optional().nullable(),
  vencimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  status: z.enum(['PENDENTE', 'CONCLUIDA', 'CANCELADA']).optional(),
});

const tarefaPatchSchema = tarefaSchema.partial().omit({ funcaoId: true }).extend({
  funcaoId: z.number().int().positive().optional(),
});

function parseDateOnly(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function withAtrasada<T extends { status: string; vencimento: Date | null }>(row: T) {
  const hoje = inicioDoDia();
  const atrasada =
    row.status === 'PENDENTE' && row.vencimento != null && row.vencimento < hoje;
  return { ...row, atrasada };
}

router.get('/resumo', authenticate, authorize('delegacoes', 'read'), async (_req, res) => {
  const hoje = inicioDoDia();
  const [pendentes, atrasadas] = await Promise.all([
    prisma.tarefaDelegacao.count({ where: { status: 'PENDENTE' } }),
    prisma.tarefaDelegacao.count({
      where: { status: 'PENDENTE', vencimento: { lt: hoje, not: null } },
    }),
  ]);
  res.json({ pendentes, atrasadas });
});

router.get('/funcoes', authenticate, authorize('delegacoes', 'read'), async (_req, res) => {
  const funcoes = await prisma.funcaoCasa.findMany({
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    include: {
      responsaveis: {
        include: {
          pessoa: { select: { id: true, nomeCompleto: true, telefone: true, email: true } },
        },
      },
      _count: { select: { tarefas: { where: { status: 'PENDENTE' } } } },
    },
  });
  res.json(
    funcoes.map(({ _count, ...f }) => ({
      ...f,
      pendentes: _count.tarefas,
    }))
  );
});

router.post('/funcoes', authenticate, authorize('delegacoes', 'write'), async (req, res) => {
  const parsed = funcaoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const slug = parsed.data.slug?.trim() || slugifyFuncao(parsed.data.nome);
  try {
    const criada = await prisma.funcaoCasa.create({
      data: {
        nome: parsed.data.nome.trim(),
        slug,
        descricao: parsed.data.descricao ?? null,
        ordem: parsed.data.ordem,
        ativo: parsed.data.ativo,
      },
    });
    res.status(201).json(criada);
  } catch {
    res.status(409).json({ error: 'Slug já existe' });
  }
});

router.patch('/funcoes/:id', authenticate, authorize('delegacoes', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = funcaoSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const atual = await prisma.funcaoCasa.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Função não encontrada' });
    return;
  }
  try {
    const data: Prisma.FuncaoCasaUpdateInput = {};
    if (parsed.data.nome !== undefined) data.nome = parsed.data.nome.trim();
    if (parsed.data.slug !== undefined) data.slug = parsed.data.slug.trim();
    if (parsed.data.descricao !== undefined) data.descricao = parsed.data.descricao;
    if (parsed.data.ordem !== undefined) data.ordem = parsed.data.ordem;
    if (parsed.data.ativo !== undefined) data.ativo = parsed.data.ativo;
    const updated = await prisma.funcaoCasa.update({ where: { id }, data });
    res.json(updated);
  } catch {
    res.status(409).json({ error: 'Slug já existe' });
  }
});

router.put(
  '/funcoes/:id/responsaveis',
  authenticate,
  authorize('delegacoes', 'write'),
  async (req, res) => {
    const id = Number(req.params.id);
    const parsed = responsaveisSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const funcao = await prisma.funcaoCasa.findUnique({ where: { id } });
    if (!funcao) {
      res.status(404).json({ error: 'Função não encontrada' });
      return;
    }
    const pessoaIds = parsed.data.pessoas.map((p) => p.pessoaId);
    if (pessoaIds.length > 0) {
      const count = await prisma.pessoa.count({ where: { id: { in: pessoaIds } } });
      if (count !== pessoaIds.length) {
        res.status(400).json({ error: 'Uma ou mais pessoas não existem' });
        return;
      }
    }
    await prisma.$transaction(async (tx) => {
      await tx.funcaoResponsavel.deleteMany({ where: { funcaoId: id } });
      if (parsed.data.pessoas.length > 0) {
        await tx.funcaoResponsavel.createMany({
          data: parsed.data.pessoas.map((p) => ({
            funcaoId: id,
            pessoaId: p.pessoaId,
            papel: p.papel ?? null,
          })),
        });
      }
    });
    const atualizada = await prisma.funcaoCasa.findUniqueOrThrow({
      where: { id },
      include: {
        responsaveis: {
          include: {
            pessoa: { select: { id: true, nomeCompleto: true, telefone: true, email: true } },
          },
        },
      },
    });
    res.json(atualizada);
  }
);

router.get('/tarefas', authenticate, authorize('delegacoes', 'read'), async (req, res) => {
  const funcaoId = req.query.funcaoId ? Number(req.query.funcaoId) : undefined;
  const pessoaId = req.query.pessoaId ? Number(req.query.pessoaId) : undefined;
  const status = req.query.status as string | undefined;
  const vencidas = req.query.vencidas === 'true' || req.query.vencidas === '1';

  const where: Prisma.TarefaDelegacaoWhereInput = {};
  if (funcaoId && !Number.isNaN(funcaoId)) where.funcaoId = funcaoId;
  if (pessoaId && !Number.isNaN(pessoaId)) where.pessoaId = pessoaId;
  if (status && ['PENDENTE', 'CONCLUIDA', 'CANCELADA'].includes(status)) {
    where.status = status as 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';
  }
  if (vencidas) {
    where.status = 'PENDENTE';
    where.vencimento = { lt: inicioDoDia(), not: null };
  }

  const tarefas = await prisma.tarefaDelegacao.findMany({
    where,
    include: tarefaInclude,
    orderBy: [{ status: 'asc' }, { vencimento: 'asc' }, { id: 'desc' }],
  });
  res.json(tarefas.map(withAtrasada));
});

router.post('/tarefas', authenticate, authorize('delegacoes', 'write'), async (req, res) => {
  const parsed = tarefaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const funcao = await prisma.funcaoCasa.findUnique({ where: { id: parsed.data.funcaoId } });
  if (!funcao) {
    res.status(404).json({ error: 'Função não encontrada' });
    return;
  }
  if (parsed.data.pessoaId) {
    const pessoa = await prisma.pessoa.findUnique({ where: { id: parsed.data.pessoaId } });
    if (!pessoa) {
      res.status(400).json({ error: 'Pessoa assignee não encontrada' });
      return;
    }
  }

  const status = parsed.data.status ?? 'PENDENTE';
  const criada = await prisma.tarefaDelegacao.create({
    data: {
      funcaoId: parsed.data.funcaoId,
      pessoaId: parsed.data.pessoaId ?? null,
      titulo: parsed.data.titulo.trim(),
      descricao: parsed.data.descricao ?? null,
      vencimento: parseDateOnly(parsed.data.vencimento) ?? null,
      status,
      concluidaEm: status === 'CONCLUIDA' ? new Date() : null,
      concluidaPorUsuarioId: status === 'CONCLUIDA' ? req.user!.userId : null,
    },
    include: tarefaInclude,
  });

  if (status === 'PENDENTE') {
    void notificarTarefaDelegacao(criada.id, 'CRIADA').catch(() => undefined);
  }

  res.status(201).json(withAtrasada(criada));
});

router.patch('/tarefas/:id', authenticate, authorize('delegacoes', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = tarefaPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const atual = await prisma.tarefaDelegacao.findUnique({ where: { id } });
  if (!atual) {
    res.status(404).json({ error: 'Tarefa não encontrada' });
    return;
  }
  if (parsed.data.funcaoId) {
    const f = await prisma.funcaoCasa.findUnique({ where: { id: parsed.data.funcaoId } });
    if (!f) {
      res.status(404).json({ error: 'Função não encontrada' });
      return;
    }
  }
  if (parsed.data.pessoaId) {
    const p = await prisma.pessoa.findUnique({ where: { id: parsed.data.pessoaId } });
    if (!p) {
      res.status(400).json({ error: 'Pessoa assignee não encontrada' });
      return;
    }
  }

  const data: Prisma.TarefaDelegacaoUpdateInput = {};
  if (parsed.data.funcaoId !== undefined) data.funcao = { connect: { id: parsed.data.funcaoId } };
  if (parsed.data.pessoaId !== undefined) {
    data.pessoa = parsed.data.pessoaId
      ? { connect: { id: parsed.data.pessoaId } }
      : { disconnect: true };
  }
  if (parsed.data.titulo !== undefined) data.titulo = parsed.data.titulo.trim();
  if (parsed.data.descricao !== undefined) data.descricao = parsed.data.descricao;
  if (parsed.data.vencimento !== undefined) {
    data.vencimento = parseDateOnly(parsed.data.vencimento);
  }
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
    if (parsed.data.status === 'CONCLUIDA') {
      data.concluidaEm = new Date();
      data.concluidaPor = { connect: { id: req.user!.userId } };
    } else if (parsed.data.status === 'PENDENTE') {
      data.concluidaEm = null;
      data.concluidaPor = { disconnect: true };
    }
  }

  const updated = await prisma.tarefaDelegacao.update({
    where: { id },
    data,
    include: tarefaInclude,
  });
  res.json(withAtrasada(updated));
});

router.post(
  '/tarefas/:id/toggle',
  authenticate,
  authorize('delegacoes', 'read'),
  async (req, res) => {
    const id = Number(req.params.id);
    const atual = await prisma.tarefaDelegacao.findUnique({ where: { id } });
    if (!atual) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }
    if (atual.status === 'CANCELADA') {
      res.status(400).json({ error: 'Tarefa cancelada não pode ser alternada' });
      return;
    }

    const paraConcluir = atual.status === 'PENDENTE';
    const updated = await prisma.tarefaDelegacao.update({
      where: { id },
      data: paraConcluir
        ? {
            status: 'CONCLUIDA',
            concluidaEm: new Date(),
            concluidaPorUsuarioId: req.user!.userId,
          }
        : {
            status: 'PENDENTE',
            concluidaEm: null,
            concluidaPorUsuarioId: null,
          },
      include: tarefaInclude,
    });

    if (paraConcluir) {
      void notificarTarefaDelegacao(updated.id, 'CONCLUIDA').catch(() => undefined);
    }

    res.json(withAtrasada(updated));
  }
);

router.post(
  '/tarefas/:id/notificar',
  authenticate,
  authorize('delegacoes', 'write'),
  async (req, res) => {
    const id = Number(req.params.id);
    const atual = await prisma.tarefaDelegacao.findUnique({ where: { id } });
    if (!atual) {
      res.status(404).json({ error: 'Tarefa não encontrada' });
      return;
    }
    const tipo =
      atual.status === 'CONCLUIDA'
        ? 'CONCLUIDA'
        : atual.vencimento && atual.vencimento < inicioDoDia()
          ? 'ATRASADA'
          : atual.vencimento && atual.vencimento.getTime() === amanhaUtc().getTime()
            ? 'VENCIMENTO'
            : 'CRIADA';
    const result = await notificarTarefaDelegacao(id, tipo);
    res.json(result);
  }
);

router.post(
  '/sync-alertas',
  authenticate,
  authorize('delegacoes', 'write'),
  async (_req, res) => {
    const result = await syncAlertasDelegacao();
    res.json(result);
  }
);

export default router;
