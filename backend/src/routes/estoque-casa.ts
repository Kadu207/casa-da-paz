import { Router, type Request } from 'express';
import { z } from 'zod';
import type { SetorAcesso } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import {
  canAccessEstoqueCasaGrant,
  ensureAlertaEstoqueMinimo,
  isResponsavelGrupoLimpeza,
} from '../lib/estoque-casa.js';

const router = Router();

const categorias = ['RITUAL', 'BEBIDA', 'TABACO', 'VELA', 'LIMPEZA', 'DESCARTAVEL', 'OUTROS'] as const;
const unidades = ['UN', 'CX', 'PCT', 'L', 'ML', 'KG', 'G'] as const;

const itemSchema = z.object({
  nome: z.string().min(1).max(150),
  categoria: z.enum(categorias),
  unidade: z.enum(unidades).default('UN'),
  estoqueAtual: z.number().int().min(0).default(0),
  estoqueMinimo: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
  observacao: z.string().max(500).optional().nullable(),
});

const itemPatchSchema = itemSchema.partial();

const movSchema = z.object({
  itemId: z.number().int().positive(),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE']),
  quantidade: z.number().int().positive(),
  motivo: z.string().max(300).optional(),
  /** Só para AJUSTE: define o saldo absoluto desejado */
  saldoDestino: z.number().int().min(0).optional(),
});

const grupoSchema = z.object({
  nome: z.string().min(1).max(120),
  ativo: z.boolean().default(true),
  responsavelUsuarioId: z.number().int().positive(),
});

const checklistCreateSchema = z.object({
  grupoId: z.number().int().positive(),
  competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observacao: z.string().max(500).optional().nullable(),
});

const checklistItemSchema = z.object({
  itemId: z.number().int().positive(),
  quantidadeBaixa: z.number().int().min(0),
  conferido: z.boolean().default(false),
});

const checklistPatchSchema = z.object({
  observacao: z.string().max(500).optional().nullable(),
  itens: z.array(checklistItemSchema).optional(),
});

function serializeItem<T extends { estoqueAtual: number; estoqueMinimo: number }>(item: T) {
  return {
    ...item,
    abaixoDoMinimo: item.estoqueAtual <= item.estoqueMinimo,
  };
}

/** Limpeza bypass: never | read (qualquer grupo) | checklist (grupoId obrigatório para write). */
type LimpezaBypass = 'never' | 'read' | 'checklist';

async function assertEstoqueCasaAccess(
  req: Request,
  action: 'read' | 'write',
  options?: { grupoId?: number; limpezaBypass?: LimpezaBypass }
): Promise<boolean> {
  const user = req.user!;
  const setor = user.setorAcesso as SetorAcesso;
  if (canAccessEstoqueCasaGrant(setor, action, user.policies)) return true;

  const mode = options?.limpezaBypass ?? 'never';
  if (mode === 'never') return false;

  if (mode === 'read') {
    if (action !== 'read') return false;
    return isResponsavelGrupoLimpeza(user.userId);
  }

  // checklist: read/write só no próprio grupo (grupoId obrigatório em write)
  if (action === 'write' && options?.grupoId === undefined) return false;
  return isResponsavelGrupoLimpeza(user.userId, options?.grupoId);
}

async function requireEstoqueCasa(
  req: Request,
  res: import('express').Response,
  action: 'read' | 'write',
  limpezaBypass: LimpezaBypass = 'never'
) {
  if (!(await assertEstoqueCasaAccess(req, action, { limpezaBypass }))) {
    res.status(403).json({ error: 'Acesso negado' });
    return false;
  }
  return true;
}

router.get('/itens', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'read', 'read'))) return;
  const abaixoMinimo = req.query.abaixoMinimo === '1' || req.query.abaixoMinimo === 'true';
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : undefined;
  const ativoParam = req.query.ativo;
  const where: {
    ativo?: boolean;
    categoria?: (typeof categorias)[number];
  } = {};
  if (ativoParam === '0' || ativoParam === 'false') where.ativo = false;
  else if (ativoParam !== 'all') where.ativo = true;
  if (categoria && (categorias as readonly string[]).includes(categoria)) {
    where.categoria = categoria as (typeof categorias)[number];
  }
  const itens = await prisma.itemEstoqueCasa.findMany({
    where,
    orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
  });
  const mapped = itens.map(serializeItem);
  res.json(abaixoMinimo ? mapped.filter((i) => i.abaixoDoMinimo) : mapped);
});

router.post('/itens', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'write', 'never'))) return;
  const body = itemSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  try {
    const item = await prisma.itemEstoqueCasa.create({ data: body.data });
    res.status(201).json(serializeItem(item));
  } catch {
    res.status(409).json({ error: 'Já existe item com este nome na categoria' });
  }
});

router.put('/itens/:id', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'write', 'never'))) return;
  const id = Number(req.params.id);
  const body = itemPatchSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  try {
    const item = await prisma.itemEstoqueCasa.update({ where: { id }, data: body.data });
    res.json(serializeItem(item));
  } catch {
    res.status(404).json({ error: 'Item não encontrado' });
  }
});

router.post('/movimentacoes', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'write', 'never'))) return;
  const body = movSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const { itemId, tipo, quantidade, motivo, saldoDestino } = body.data;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.itemEstoqueCasa.findUnique({ where: { id: itemId } });
      if (!item || !item.ativo) {
        throw Object.assign(new Error('Item não encontrado ou inativo'), { status: 404 });
      }
      let novoSaldo = item.estoqueAtual;
      if (tipo === 'ENTRADA') {
        novoSaldo = item.estoqueAtual + quantidade;
      } else if (tipo === 'SAIDA') {
        if (item.estoqueAtual < quantidade) {
          throw Object.assign(new Error('Estoque insuficiente'), { status: 409 });
        }
        novoSaldo = item.estoqueAtual - quantidade;
      } else {
        if (saldoDestino === undefined) {
          throw Object.assign(new Error('AJUSTE exige saldoDestino'), { status: 400 });
        }
        novoSaldo = saldoDestino;
      }
      const updated = await tx.itemEstoqueCasa.update({
        where: { id: itemId },
        data: { estoqueAtual: novoSaldo },
      });
      const mov = await tx.movimentacaoEstoqueCasa.create({
        data: {
          itemId,
          tipo,
          quantidade: tipo === 'AJUSTE' ? Math.abs(novoSaldo - item.estoqueAtual) || quantidade : quantidade,
          saldoApos: novoSaldo,
          motivo: motivo ?? null,
          usuarioId: req.user!.userId,
        },
      });
      return { item: updated, movimentacao: mov };
    });
    await ensureAlertaEstoqueMinimo(
      result.item.nome,
      result.item.estoqueAtual,
      result.item.estoqueMinimo
    );
    res.status(201).json({
      item: serializeItem(result.item),
      movimentacao: result.movimentacao,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status ?? 500).json({ error: e.message || 'Erro na movimentação' });
  }
});

router.get('/movimentacoes', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'read', 'read'))) return;
  const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;
  const take = Math.min(Number(req.query.limit) || 100, 500);
  const movimentacoes = await prisma.movimentacaoEstoqueCasa.findMany({
    where: itemId && !Number.isNaN(itemId) ? { itemId } : undefined,
    include: {
      item: { select: { id: true, nome: true, categoria: true, unidade: true } },
      usuario: { select: { id: true, login: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });
  res.json(movimentacoes);
});

router.get('/grupos-limpeza', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'read', 'read'))) return;
  const setor = req.user!.setorAcesso as SetorAcesso;
  const hasWrite = canAccessEstoqueCasaGrant(setor, 'write', req.user!.policies);
  const where = hasWrite
    ? undefined
    : { responsavelUsuarioId: req.user!.userId, ativo: true };
  const grupos = await prisma.grupoLimpeza.findMany({
    where,
    include: {
      responsavel: {
        select: { id: true, login: true, pessoa: { select: { nomeCompleto: true } } },
      },
    },
    orderBy: { nome: 'asc' },
  });
  res.json(grupos);
});

router.post('/grupos-limpeza', authenticate, async (req, res) => {
  // Só quem tem grant de matriz/policy (não só responsável) cria grupos
  const setor = req.user!.setorAcesso as SetorAcesso;
  if (!canAccessEstoqueCasaGrant(setor, 'write', req.user!.policies)) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const body = grupoSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const resp = await prisma.usuario.findUnique({ where: { id: body.data.responsavelUsuarioId } });
  if (!resp || !resp.ativo) {
    res.status(400).json({ error: 'Responsável inválido ou inativo' });
    return;
  }
  const grupo = await prisma.grupoLimpeza.create({
    data: body.data,
    include: {
      responsavel: {
        select: { id: true, login: true, pessoa: { select: { nomeCompleto: true } } },
      },
    },
  });
  res.status(201).json(grupo);
});

router.put('/grupos-limpeza/:id', authenticate, async (req, res) => {
  const setor = req.user!.setorAcesso as SetorAcesso;
  if (!canAccessEstoqueCasaGrant(setor, 'write', req.user!.policies)) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const id = Number(req.params.id);
  const body = grupoSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  if (body.data.responsavelUsuarioId) {
    const resp = await prisma.usuario.findUnique({ where: { id: body.data.responsavelUsuarioId } });
    if (!resp || !resp.ativo) {
      res.status(400).json({ error: 'Responsável inválido ou inativo' });
      return;
    }
  }
  try {
    const grupo = await prisma.grupoLimpeza.update({
      where: { id },
      data: body.data,
      include: {
        responsavel: {
          select: { id: true, login: true, pessoa: { select: { nomeCompleto: true } } },
        },
      },
    });
    res.json(grupo);
  } catch {
    res.status(404).json({ error: 'Grupo não encontrado' });
  }
});

router.get('/checklists', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'read', 'read'))) return;
  const setor = req.user!.setorAcesso as SetorAcesso;
  const hasWrite = canAccessEstoqueCasaGrant(setor, 'write', req.user!.policies);
  const grupoId = req.query.grupoId ? Number(req.query.grupoId) : undefined;
  const gruposPermitidos = hasWrite
    ? undefined
    : (
        await prisma.grupoLimpeza.findMany({
          where: { responsavelUsuarioId: req.user!.userId, ativo: true },
          select: { id: true },
        })
      ).map((g) => g.id);

  const checklists = await prisma.checklistLimpeza.findMany({
    where: {
      ...(grupoId && !Number.isNaN(grupoId) ? { grupoId } : {}),
      ...(gruposPermitidos ? { grupoId: { in: gruposPermitidos } } : {}),
    },
    include: {
      grupo: { select: { id: true, nome: true } },
      itens: { include: { item: { select: { id: true, nome: true, unidade: true, estoqueAtual: true } } } },
      criadoPor: { select: { id: true, login: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(checklists);
});

router.post('/checklists', authenticate, async (req, res) => {
  const body = checklistCreateSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  if (!(await assertEstoqueCasaAccess(req, 'write', { grupoId: body.data.grupoId, limpezaBypass: 'checklist' }))) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const grupo = await prisma.grupoLimpeza.findUnique({ where: { id: body.data.grupoId } });
  if (!grupo || !grupo.ativo) {
    res.status(404).json({ error: 'Grupo não encontrado' });
    return;
  }
  const checklist = await prisma.checklistLimpeza.create({
    data: {
      grupoId: body.data.grupoId,
      competencia: new Date(body.data.competencia + 'T12:00:00.000Z'),
      observacao: body.data.observacao ?? null,
      criadoPorUsuarioId: req.user!.userId,
      status: 'RASCUNHO',
    },
    include: {
      grupo: { select: { id: true, nome: true } },
      itens: true,
    },
  });
  res.status(201).json(checklist);
});

router.patch('/checklists/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const body = checklistPatchSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const existing = await prisma.checklistLimpeza.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Checklist não encontrado' });
    return;
  }
  if (existing.status === 'CONCLUIDO') {
    res.status(409).json({ error: 'Checklist já concluído' });
    return;
  }
  if (!(await assertEstoqueCasaAccess(req, 'write', { grupoId: existing.grupoId, limpezaBypass: 'checklist' }))) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }
  const updated = await prisma.$transaction(async (tx) => {
    if (body.data.observacao !== undefined) {
      await tx.checklistLimpeza.update({
        where: { id },
        data: { observacao: body.data.observacao },
      });
    }
    if (body.data.itens) {
      for (const linha of body.data.itens) {
        await tx.checklistLimpezaItem.upsert({
          where: { checklistId_itemId: { checklistId: id, itemId: linha.itemId } },
          create: {
            checklistId: id,
            itemId: linha.itemId,
            quantidadeBaixa: linha.quantidadeBaixa,
            conferido: linha.conferido,
          },
          update: {
            quantidadeBaixa: linha.quantidadeBaixa,
            conferido: linha.conferido,
          },
        });
      }
    }
    return tx.checklistLimpeza.findUnique({
      where: { id },
      include: {
        grupo: { select: { id: true, nome: true } },
        itens: { include: { item: { select: { id: true, nome: true, unidade: true, estoqueAtual: true } } } },
      },
    });
  });
  res.json(updated);
});

router.post('/checklists/:id/concluir', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.checklistLimpeza.findUnique({
    where: { id },
    include: { itens: { include: { item: true } } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Checklist não encontrado' });
    return;
  }
  if (existing.status === 'CONCLUIDO') {
    res.status(409).json({ error: 'Checklist já concluído' });
    return;
  }
  if (!(await assertEstoqueCasaAccess(req, 'write', { grupoId: existing.grupoId, limpezaBypass: 'checklist' }))) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      for (const linha of existing.itens) {
        if (linha.quantidadeBaixa <= 0) continue;
        const item = await tx.itemEstoqueCasa.findUnique({ where: { id: linha.itemId } });
        if (!item) {
          throw Object.assign(new Error(`Item ${linha.itemId} não encontrado`), { status: 404 });
        }
        if (item.estoqueAtual < linha.quantidadeBaixa) {
          throw Object.assign(
            new Error(`Estoque insuficiente: ${item.nome}`),
            { status: 409 }
          );
        }
        const novoSaldo = item.estoqueAtual - linha.quantidadeBaixa;
        await tx.itemEstoqueCasa.update({
          where: { id: item.id },
          data: { estoqueAtual: novoSaldo },
        });
        await tx.movimentacaoEstoqueCasa.create({
          data: {
            itemId: item.id,
            tipo: 'SAIDA',
            quantidade: linha.quantidadeBaixa,
            saldoApos: novoSaldo,
            motivo: `Checklist limpeza #${id}`,
            usuarioId: req.user!.userId,
            checklistId: id,
          },
        });
      }
      return tx.checklistLimpeza.update({
        where: { id },
        data: { status: 'CONCLUIDO', concluidoEm: new Date() },
        include: {
          grupo: { select: { id: true, nome: true } },
          itens: { include: { item: true } },
        },
      });
    });

    for (const linha of result.itens) {
      await ensureAlertaEstoqueMinimo(
        linha.item.nome,
        linha.item.estoqueAtual,
        linha.item.estoqueMinimo
      );
    }

    res.json(result);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status ?? 500).json({ error: e.message || 'Erro ao concluir checklist' });
  }
});

router.get('/relatorio', authenticate, async (req, res) => {
  if (!(await requireEstoqueCasa(req, res, 'read', 'never'))) return;
  const de = typeof req.query.de === 'string' ? new Date(req.query.de) : new Date(Date.now() - 30 * 86400000);
  const ate = typeof req.query.ate === 'string' ? new Date(req.query.ate) : new Date();

  const [criticos, saidas] = await Promise.all([
    prisma.itemEstoqueCasa.findMany({
      where: { ativo: true },
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    }),
    prisma.movimentacaoEstoqueCasa.findMany({
      where: {
        tipo: 'SAIDA',
        createdAt: { gte: de, lte: ate },
      },
      include: { item: { select: { id: true, nome: true, categoria: true } } },
    }),
  ]);

  const consumoPorCategoria: Record<string, number> = {};
  const consumoPorItem: Record<number, { itemId: number; nome: string; categoria: string; quantidade: number }> = {};
  for (const s of saidas) {
    consumoPorCategoria[s.item.categoria] = (consumoPorCategoria[s.item.categoria] ?? 0) + s.quantidade;
    const prev = consumoPorItem[s.itemId];
    if (prev) prev.quantidade += s.quantidade;
    else {
      consumoPorItem[s.itemId] = {
        itemId: s.itemId,
        nome: s.item.nome,
        categoria: s.item.categoria,
        quantidade: s.quantidade,
      };
    }
  }

  res.json({
    periodo: { de, ate },
    criticos: criticos.filter((i) => i.estoqueAtual <= i.estoqueMinimo).map(serializeItem),
    consumoPorCategoria,
    consumoPorItem: Object.values(consumoPorItem).sort((a, b) => b.quantidade - a.quantidade),
    totalSaidas: saidas.reduce((acc, s) => acc + s.quantidade, 0),
  });
});

export default router;
