import type { CanalAlerta, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { dispararN8n } from './n8n.js';

export type TipoEventoDelegacao = 'CRIADA' | 'VENCIMENTO' | 'ATRASADA' | 'CONCLUIDA';

export const tarefaInclude = {
  funcao: { select: { id: true, nome: true, slug: true } },
  pessoa: { select: { id: true, nomeCompleto: true, telefone: true, email: true } },
  concluidaPor: { select: { id: true, login: true } },
} satisfies Prisma.TarefaDelegacaoInclude;

export function slugifyFuncao(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function inicioDoDia(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function amanhaUtc(d = new Date()): Date {
  const base = inicioDoDia(d);
  base.setUTCDate(base.getUTCDate() + 1);
  return base;
}

export async function notificarTarefaDelegacao(
  tarefaId: number,
  tipoEvento: TipoEventoDelegacao
): Promise<{ enviados: number; alertas: number }> {
  const tarefa = await prisma.tarefaDelegacao.findUnique({
    where: { id: tarefaId },
    include: {
      funcao: { include: { responsaveis: { include: { pessoa: true } } } },
      pessoa: true,
    },
  });
  if (!tarefa) return { enviados: 0, alertas: 0 };

  const destinatarios = new Map<
    number,
    { pessoaId: number; nome: string; telefone: string | null; email: string | null }
  >();

  if (tarefa.pessoa) {
    destinatarios.set(tarefa.pessoa.id, {
      pessoaId: tarefa.pessoa.id,
      nome: tarefa.pessoa.nomeCompleto,
      telefone: tarefa.pessoa.telefone,
      email: tarefa.pessoa.email,
    });
  }
  for (const r of tarefa.funcao.responsaveis) {
    if (!destinatarios.has(r.pessoa.id)) {
      destinatarios.set(r.pessoa.id, {
        pessoaId: r.pessoa.id,
        nome: r.pessoa.nomeCompleto,
        telefone: r.pessoa.telefone,
        email: r.pessoa.email,
      });
    }
  }

  let enviados = 0;
  let alertas = 0;
  const mensagemBase = `[Delegações][#${tarefa.id}] ${tarefa.funcao.nome}: ${tarefa.titulo} (${tipoEvento})`;

  for (const dest of destinatarios.values()) {
    const canais: CanalAlerta[] = [];
    if (dest.telefone) canais.push('WHATSAPP');
    if (dest.email) canais.push('EMAIL');
    if (canais.length === 0) canais.push('SISTEMA');

    for (const canal of canais) {
      const alerta = await prisma.alerta.create({
        data: {
          tipo: `DELEGACAO_${tipoEvento}`,
          mensagem: mensagemBase,
          pessoaId: dest.pessoaId,
          canal,
          disparado: false,
        },
      });
      alertas += 1;
      if (canal === 'SISTEMA') continue;

      const n8n = await dispararN8n('tarefa_delegacao', {
        tarefaId: tarefa.id,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        funcao: tarefa.funcao.nome,
        pessoaNome: dest.nome,
        telefone: dest.telefone,
        email: dest.email,
        vencimento: tarefa.vencimento?.toISOString().slice(0, 10) ?? null,
        tipoEvento,
        canal,
        alertaId: alerta.id,
      });
      if (n8n.enviado) {
        await prisma.alerta.update({ where: { id: alerta.id }, data: { disparado: true } });
        enviados += 1;
      }
    }
  }

  return { enviados, alertas };
}

/** D-1 (vencimento amanhã) e atrasadas sem alerta do mesmo tipo nas últimas 48h. */
export async function syncAlertasDelegacao(): Promise<{
  vencimento: number;
  atrasadas: number;
}> {
  const hoje = inicioDoDia();
  const amanha = amanhaUtc();
  const ha48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const aVencer = await prisma.tarefaDelegacao.findMany({
    where: { status: 'PENDENTE', vencimento: amanha },
    select: { id: true },
  });

  let vencimento = 0;
  for (const t of aVencer) {
    const ja = await prisma.alerta.findFirst({
      where: {
        tipo: 'DELEGACAO_VENCIMENTO',
        mensagem: { contains: `[#${t.id}]` },
        createdAt: { gte: ha48h },
      },
    });
    if (ja) continue;
    const result = await notificarTarefaDelegacao(t.id, 'VENCIMENTO');
    if (result.alertas > 0) vencimento += 1;
  }

  const atrasadasRows = await prisma.tarefaDelegacao.findMany({
    where: { status: 'PENDENTE', vencimento: { lt: hoje, not: null } },
    select: { id: true },
  });

  let atrasadas = 0;
  for (const t of atrasadasRows) {
    const ja = await prisma.alerta.findFirst({
      where: {
        tipo: 'DELEGACAO_ATRASADA',
        mensagem: { contains: `[#${t.id}]` },
        createdAt: { gte: ha48h },
      },
    });
    if (ja) continue;
    const result = await notificarTarefaDelegacao(t.id, 'ATRASADA');
    if (result.alertas > 0) atrasadas += 1;
  }

  return { vencimento, atrasadas };
}
