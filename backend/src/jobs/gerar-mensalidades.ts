import { prisma } from '../lib/prisma.js';

export async function gerarMensalidadesDoMes(ref: Date = new Date()): Promise<number> {
  const ano = ref.getFullYear();
  const mes = ref.getMonth(); // 0-11
  const inicioMes = new Date(Date.UTC(ano, mes, 1));
  const fimMes = new Date(Date.UTC(ano, mes + 1, 0));

  const planos = await prisma.mensalidadePlano.findMany({ where: { ativo: true } });
  let criados = 0;

  for (const plano of planos) {
    const dia = Math.min(Math.max(plano.diaVencimento, 1), 28);
    const vencimento = new Date(Date.UTC(ano, mes, dia));

    const existente = await prisma.financeiroTransacao.findFirst({
      where: {
        pessoaId: plano.pessoaId,
        categoria: 'MENSALIDADE',
        tipo: 'RECEITA',
        vencimento: { gte: inicioMes, lte: fimMes },
      },
    });
    if (existente) continue;

    await prisma.financeiroTransacao.create({
      data: {
        pessoaId: plano.pessoaId,
        tipo: 'RECEITA',
        categoria: 'MENSALIDADE',
        valor: plano.valor,
        dataTransacao: inicioMes,
        vencimento,
        status: 'PENDENTE',
        origem: 'RECORRENCIA',
        observacoes: `Mensalidade gerada automaticamente (${ano}-${String(mes + 1).padStart(2, '0')})`,
      },
    });

    await prisma.mensalidadePlano.update({
      where: { id: plano.id },
      data: { proximaGeracao: new Date(Date.UTC(ano, mes + 1, dia)) },
    });
    criados += 1;
  }

  return criados;
}
