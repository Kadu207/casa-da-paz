import { prisma } from '../lib/prisma.js';
import { calcularAdimplencia } from '../lib/adimplencia.js';
import { CanalAlerta } from '@prisma/client';

export async function gerarAlertasAdimplencia(): Promise<number> {
  const pendentes = await prisma.financeiroTransacao.findMany({
    where: { status: 'PENDENTE', vencimento: { not: null }, pessoaId: { not: null } },
    include: { pessoa: true },
  });

  let criados = 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (const t of pendentes) {
    const adimplencia = calcularAdimplencia(t.status, t.vencimento, hoje);
    if (adimplencia !== 'ATRASADO' || !t.pessoaId) continue;

    const existente = await prisma.alerta.findFirst({
      where: {
        pessoaId: t.pessoaId,
        tipo: 'MENSALIDADE_ATRASADA',
        disparado: false,
        createdAt: { gte: hoje },
      },
    });
    if (existente) continue;

    await prisma.alerta.create({
      data: {
        tipo: 'MENSALIDADE_ATRASADA',
        mensagem: `${t.pessoa?.nomeCompleto ?? 'Consulente'} — ${t.categoria} vencida`,
        pessoaId: t.pessoaId,
        canal: CanalAlerta.WHATSAPP,
      },
    });
    criados++;
  }

  return criados;
}
