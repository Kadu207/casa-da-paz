import { resolveSecret } from './runtime-env.js';
import { isNetworkError, isRetryableHttpStatus, withRetry } from './with-retry.js';

export type N8nWorkflow =
  | 'novo_agendamento'
  | 'agendamento_confirmado'
  | 'agendamento_cancelado'
  | 'lembrete_atraso'
  | 'recibo_pago'
  | 'ingresso_oficina'
  | 'tarefa_delegacao';

const WEBHOOK_PATHS: Record<N8nWorkflow, string> = {
  novo_agendamento: '/webhook/casadapaz-agendamento',
  agendamento_confirmado: '/webhook/casadapaz-agendamento-confirmado',
  agendamento_cancelado: '/webhook/casadapaz-agendamento-cancelado',
  lembrete_atraso: '/webhook/casadapaz-lembrete-atraso',
  recibo_pago: '/webhook/casadapaz-recibo-pago',
  ingresso_oficina: '/webhook/casadapaz-ingresso-oficina',
  tarefa_delegacao: '/webhook/casadapaz-tarefa-delegacao',
};

export async function dispararN8n(
  workflow: N8nWorkflow,
  payload: Record<string, unknown>
): Promise<{ enviado: boolean; motivo?: string }> {
  const baseUrl = process.env.N8N_URL;
  if (!baseUrl) {
    return { enviado: false, motivo: 'N8N_URL não configurado' };
  }

  let secret: string;
  try {
    secret = resolveSecret('N8N_WEBHOOK_SECRET', 'n8n-dev-secret');
  } catch {
    return { enviado: false, motivo: 'N8N_WEBHOOK_SECRET inválido em produção' };
  }

  const path = WEBHOOK_PATHS[workflow];
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const body = JSON.stringify({ workflow, ...payload });

  try {
    const res = await withRetry(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': secret,
          },
          body,
        });
        if (!response.ok && isRetryableHttpStatus(response.status)) {
          throw new Error(`N8N HTTP ${response.status}`);
        }
        return response;
      },
      {
        attempts: 3,
        baseDelayMs: 250,
        retryOn: (err) => isNetworkError(err) || /N8N HTTP (429|5\d\d)/.test(String(err)),
      }
    );
    if (!res.ok) {
      return { enviado: false, motivo: `N8N respondeu ${res.status}` };
    }
    return { enviado: true };
  } catch {
    return { enviado: false, motivo: 'N8N indisponível (dev local OK)' };
  }
}
