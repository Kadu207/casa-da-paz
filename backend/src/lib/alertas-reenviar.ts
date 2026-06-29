import type { Alerta } from '@prisma/client';
import { dispararN8n } from './n8n.js';

export interface PessoaContato {
  telefone: string | null;
}

export async function reenviarAlerta(
  alerta: Alerta,
  pessoa: PessoaContato | null
): Promise<{ enviado: boolean; motivo?: string }> {
  return dispararN8n('lembrete_atraso', {
    alertaId: alerta.id,
    pessoaId: alerta.pessoaId,
    telefone: pessoa?.telefone ?? null,
    mensagem: alerta.mensagem,
    tipo: alerta.tipo,
  });
}
