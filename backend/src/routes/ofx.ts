import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { datasProximas, parseOfx } from '../lib/ofx-parser.js';
import { isAllowedOfxUpload } from '../lib/upload-filters.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, isAllowedOfxUpload(file.mimetype, file.originalname));
  },
});

router.post(
  '/import',
  authenticate,
  authorize('conciliacao_bancaria', 'write'),
  upload.single('file'),
  async (req, res) => {
    const parsed = z
      .object({
        contaId: z.coerce.number().int().positive(),
      })
      .safeParse(req.body);
    if (!parsed.success || !req.file) {
      res.status(400).json({ error: 'contaId e arquivo OFX obrigatórios' });
      return;
    }
    const { contaId } = parsed.data;
    const conta = await prisma.contaFinanceira.findUnique({ where: { id: contaId } });
    if (!conta) {
      res.status(404).json({ error: 'Conta não encontrada' });
      return;
    }

    const content = req.file.buffer.toString('utf-8');
    const txns = parseOfx(content);
    if (txns.length === 0) {
      res.status(400).json({ error: 'Nenhuma transação OFX encontrada' });
      return;
    }

    const imp = await prisma.ofxImport.create({
      data: {
        contaId,
        filename: req.file.originalname || 'extrato.ofx',
        qtd: 0,
      },
    });

    let imported = 0;
    for (const t of txns) {
      try {
        await prisma.ofxMovimento.create({
          data: {
            importId: imp.id,
            fitId: t.fitId,
            data: t.data,
            valor: t.valor,
            tipo: t.tipo,
            memo: t.memo,
          },
        });
        imported += 1;
      } catch {
        // fitId duplicado — ignora
      }
    }

    await prisma.ofxImport.update({ where: { id: imp.id }, data: { qtd: imported } });
    res.status(201).json({ importId: imp.id, imported, totalParsed: txns.length });
  }
);

router.get('/movimentos', authenticate, authorize('conciliacao_bancaria', 'read'), async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const list = await prisma.ofxMovimento.findMany({
    where: status ? { status: status as never } : undefined,
    include: { import: { select: { id: true, filename: true, contaId: true } } },
    orderBy: { data: 'desc' },
    take: 200,
  });
  res.json(list);
});

router.post(
  '/movimentos/:id/conciliar',
  authenticate,
  authorize('conciliacao_bancaria', 'write'),
  async (req, res) => {
    const id = Number(req.params.id);
    const body = z.object({ transacaoId: z.number().int().positive().optional() }).safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const mov = await prisma.ofxMovimento.findUnique({ where: { id }, include: { import: true } });
    if (!mov || mov.status !== 'PENDENTE') {
      res.status(404).json({ error: 'Movimento não encontrado ou já processado' });
      return;
    }

    let transacaoId = body.data.transacaoId;
    if (!transacaoId) {
      const de = new Date(mov.data);
      de.setUTCDate(de.getUTCDate() - 2);
      const ate = new Date(mov.data);
      ate.setUTCDate(ate.getUTCDate() + 2);
      const candidatos = await prisma.financeiroTransacao.findMany({
        where: {
          tipo: mov.tipo,
          status: 'CONCLUIDO',
          valor: mov.valor,
          dataTransacao: { gte: de, lte: ate },
          ofxMovimento: null,
        },
        take: 5,
      });
      const match = candidatos.find((c) => datasProximas(c.dataTransacao, mov.data, 2));
      if (!match) {
        // cria lançamento a partir do OFX
        const criada = await prisma.financeiroTransacao.create({
          data: {
            tipo: mov.tipo,
            categoria: mov.tipo === 'RECEITA' ? 'DOACAO' : 'CUSTOS_OPERACIONAIS',
            valor: mov.valor,
            dataTransacao: mov.data,
            status: 'CONCLUIDO',
            origem: 'OFX',
            contaId: mov.import.contaId,
            observacoes: mov.memo ?? `OFX ${mov.fitId}`,
          },
        });
        transacaoId = criada.id;
      } else {
        transacaoId = match.id;
      }
    }

    const updated = await prisma.ofxMovimento.update({
      where: { id },
      data: { status: 'CONCILIADO', transacaoId },
    });
    res.json(updated);
  }
);

router.post(
  '/movimentos/:id/ignorar',
  authenticate,
  authorize('conciliacao_bancaria', 'write'),
  async (req, res) => {
    const id = Number(req.params.id);
    const updated = await prisma.ofxMovimento.update({
      where: { id },
      data: { status: 'IGNORADO' },
    });
    res.json(updated);
  }
);

export default router;
