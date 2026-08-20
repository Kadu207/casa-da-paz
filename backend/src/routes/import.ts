import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { isAllowedExcelBuffer, isAllowedExcelUpload } from '../lib/upload-filters.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, isAllowedExcelUpload(file.mimetype, file.originalname));
  },
});
const AI_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8000';

router.post('/excel', authenticate, authorize('import', 'write'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Arquivo .xlsx obrigatório' });
    return;
  }
  if (!isAllowedExcelBuffer(req.file.buffer)) {
    res.status(400).json({ error: 'Arquivo inválido: conteúdo não parece .xlsx (ZIP/OOXML)' });
    return;
  }

  try {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(req.file.buffer)]), req.file.originalname);

    const parseRes = await fetch(`${AI_URL}/parse-excel`, { method: 'POST', body: form });
    if (!parseRes.ok) {
      const err = await parseRes.json().catch(() => ({}));
      res.status(502).json({ error: 'Falha no parse-excel', detail: err });
      return;
    }
    const parsed = (await parseRes.json()) as { total: number; linhas: Array<Record<string, unknown>> };

    const validRes = await fetch(`${AI_URL}/validar-lote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linhas: parsed.linhas }),
    });
    const validacao = (await validRes.json()) as { ok: boolean; erros?: Array<{ linha: number; erro: string }> };
    if (!validacao.ok) {
      res.status(400).json({ error: 'Validação falhou — rollback total', erros: validacao.erros });
      return;
    }

    const inseridos = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const linha of parsed.linhas) {
        const valor = Number(linha.valor ?? linha.valor_receita ?? 0);
        const categoria = String(linha.categoria ?? 'DOACAO').toUpperCase();
        const tipo = String(linha.tipo ?? 'RECEITA').toUpperCase() as 'RECEITA' | 'DESPESA';
        const dataStr = String(linha.data ?? linha.data_transacao ?? new Date().toISOString().slice(0, 10));
        let pessoaId: number | undefined;

        const nome = linha.nome ?? linha.nome_completo;
        const telefone = linha.telefone ? String(linha.telefone) : undefined;
        if (nome && telefone) {
          const existente = await tx.pessoa.findFirst({ where: { telefone } });
          if (existente) {
            pessoaId = existente.id;
          } else {
            const p = await tx.pessoa.create({
              data: {
                nomeCompleto: String(nome),
                telefone,
                tipoPerfil: 'CONSULENTE',
                maiorDeIdade: true,
              },
            });
            pessoaId = p.id;
          }
        }

        await tx.financeiroTransacao.create({
          data: {
            pessoaId,
            tipo,
            categoria,
            valor,
            dataTransacao: new Date(dataStr),
            status: 'PENDENTE',
            vencimento: linha.vencimento ? new Date(String(linha.vencimento)) : null,
          },
        });
        count++;
      }
      return count;
    });

    res.status(201).json({ ok: true, linhas_importadas: inseridos, total_parse: parsed.total });
  } catch (err) {
    res.status(500).json({
      error: 'Importação falhou — nenhum dado persistido',
      detail: err instanceof Error ? err.message : 'Erro desconhecido',
    });
  }
});

export default router;
