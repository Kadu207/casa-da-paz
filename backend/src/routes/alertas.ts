import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  buildAlertasOrderBy,
  buildAlertasWhere,
} from '../lib/alertas-query.js';
import { reenviarAlerta } from '../lib/alertas-reenviar.js';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  tipo: z.string().max(50).optional(),
  disparado: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => {
      if (v === true || v === 'true') return true;
      if (v === false || v === 'false') return false;
      return undefined;
    }),
  de: z.string().optional(),
  ate: z.string().optional(),
  sort: z.enum(['createdAt', 'tipo']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const patchSchema = z.object({
  disparado: z.literal(true),
});

async function loadPessoasMap(pessoaIds: number[]) {
  if (pessoaIds.length === 0) return new Map<number, { nomeCompleto: string; telefone: string | null }>();
  const pessoas = await prisma.pessoa.findMany({
    where: { id: { in: pessoaIds } },
    select: { id: true, nomeCompleto: true, telefone: true },
  });
  return new Map(pessoas.map((p) => [p.id, p]));
}

function serializeAlerta(
  alerta: {
    id: number;
    tipo: string;
    mensagem: string;
    pessoaId: number | null;
    canal: string;
    disparado: boolean;
    createdAt: Date;
  },
  pessoa?: { nomeCompleto: string; telefone: string | null } | null
) {
  return {
    id: alerta.id,
    tipo: alerta.tipo,
    mensagem: alerta.mensagem,
    pessoaId: alerta.pessoaId,
    pessoa: pessoa ?? null,
    canal: alerta.canal,
    disparado: alerta.disparado,
    createdAt: alerta.createdAt,
  };
}

router.get('/', authenticate, authorize('alertas', 'read'), async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { page, limit, sort, order, tipo, disparado, de, ate } = parsed.data;
  const where = buildAlertasWhere({ tipo, disparado, de, ate });
  const skip = (page - 1) * limit;

  const [total, alertas] = await Promise.all([
    prisma.alerta.count({ where }),
    prisma.alerta.findMany({
      where,
      orderBy: buildAlertasOrderBy(sort, order),
      skip,
      take: limit,
    }),
  ]);

  const pessoaIds = alertas.map((a) => a.pessoaId).filter((id): id is number => id != null);
  const pessoasMap = await loadPessoasMap(pessoaIds);

  res.json({
    page,
    limit,
    total,
    items: alertas.map((a) =>
      serializeAlerta(a, a.pessoaId != null ? pessoasMap.get(a.pessoaId) ?? null : null)
    ),
  });
});

router.patch('/:id', authenticate, authorize('alertas', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existente = await prisma.alerta.findUnique({ where: { id } });
  if (!existente) {
    res.status(404).json({ error: 'Alerta não encontrado' });
    return;
  }

  const atualizado = await prisma.alerta.update({
    where: { id },
    data: { disparado: true },
  });

  let pessoa = null;
  if (atualizado.pessoaId != null) {
    pessoa = await prisma.pessoa.findUnique({
      where: { id: atualizado.pessoaId },
      select: { nomeCompleto: true, telefone: true },
    });
  }

  res.json(serializeAlerta(atualizado, pessoa));
});

router.post('/:id/reenviar', authenticate, authorize('alertas', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const alerta = await prisma.alerta.findUnique({ where: { id } });
  if (!alerta) {
    res.status(404).json({ error: 'Alerta não encontrado' });
    return;
  }

  const pessoa =
    alerta.pessoaId != null
      ? await prisma.pessoa.findUnique({
          where: { id: alerta.pessoaId },
          select: { telefone: true },
        })
      : null;

  const n8n = await reenviarAlerta(alerta, pessoa);
  if (n8n.enviado) {
    await prisma.alerta.update({
      where: { id },
      data: { disparado: true },
    });
  }

  res.json(n8n);
});

export default router;
