import type { AsaasBillingType, AsaasCobrancaStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { timingSafeEqualString } from '../../lib/runtime-env.js';
import { getAsaasConfig } from './client.js';
import type { AsaasPayment } from './payments.js';

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);

export function mapAsaasPaymentStatus(status: string): AsaasCobrancaStatus {
  const upper = status.toUpperCase();
  switch (upper) {
    case 'PENDING':
      return 'PENDING';
    case 'RECEIVED':
      return 'RECEIVED';
    case 'CONFIRMED':
      return 'CONFIRMED';
    case 'OVERDUE':
      return 'OVERDUE';
    case 'REFUNDED':
      return 'REFUNDED';
    case 'DELETED':
      return 'DELETED';
    case 'RECEIVED_IN_CASH':
      return 'RECEIVED_IN_CASH';
    default:
      return 'PENDING';
  }
}

export function mapBillingType(billingType: string): AsaasBillingType {
  const upper = billingType.toUpperCase();
  switch (upper) {
    case 'BOLETO':
      return 'BOLETO';
    case 'PIX':
      return 'PIX';
    case 'CREDIT_CARD':
      return 'CREDIT_CARD';
    default:
      return 'UNDEFINED';
  }
}

export function validateAsaasWebhookToken(headerValue: string | undefined): boolean {
  const token = getAsaasConfig().webhookToken;
  if (!headerValue || !token) return false;
  return timingSafeEqualString(headerValue, token);
}

export interface AsaasWebhookPayload {
  id?: string;
  event: string;
  payment?: AsaasPayment & { id: string; status: string };
}

async function ensureContaAsaas(tx: Prisma.TransactionClient) {
  let conta = await tx.contaFinanceira.findFirst({ where: { tipo: 'ASAAS', ativa: true } });
  if (!conta) {
    conta = await tx.contaFinanceira.create({
      data: { nome: 'Conta Asaas', tipo: 'ASAAS', saldoInicial: 0, ativa: true },
    });
  }
  return conta;
}

export async function processAsaasWebhook(payload: AsaasWebhookPayload): Promise<{
  ok: boolean;
  duplicate?: boolean;
  paymentId?: string;
}> {
  const eventId = payload.id ?? `${payload.event}:${payload.payment?.id ?? 'none'}:${Date.now()}`;
  const existing = await prisma.asaasWebhookEvent.findUnique({ where: { eventId } });
  if (existing) {
    return { ok: true, duplicate: true };
  }

  await prisma.asaasWebhookEvent.create({
    data: {
      eventId,
      eventType: payload.event,
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });

  const payment = payload.payment;
  if (!payment?.id) {
    return { ok: true };
  }

  const status = mapAsaasPaymentStatus(payment.status);

  await prisma.$transaction(async (tx) => {
    const cobranca = await tx.asaasCobranca.findUnique({
      where: { asaasPaymentId: payment.id },
    });

    if (cobranca) {
      await tx.asaasCobranca.update({
        where: { id: cobranca.id },
        data: {
          status,
          invoiceUrl: payment.invoiceUrl ?? cobranca.invoiceUrl,
        },
      });

      if (PAID_STATUSES.has(status) && cobranca.transacaoId) {
        await tx.financeiroTransacao.update({
          where: { id: cobranca.transacaoId },
          data: { status: 'CONCLUIDO' },
        });
      }

      if (PAID_STATUSES.has(status) && cobranca.pedidoId) {
        const pedido = await tx.ecommercePedido.findUnique({
          where: { id: cobranca.pedidoId },
          include: { itens: true },
        });
        if (pedido && pedido.status === 'PENDENTE_PAGAMENTO') {
          await tx.ecommercePedido.update({
            where: { id: pedido.id },
            data: { status: 'PAGO', asaasPaymentId: payment.id },
          });
          for (const item of pedido.itens) {
            await tx.produto.update({
              where: { id: item.produtoId },
              data: { estoqueAtual: { decrement: item.quantidade } },
            });
            await tx.estoqueMovimentacao.create({
              data: {
                produtoId: item.produtoId,
                tipo: 'SAIDA',
                quantidade: item.quantidade,
              },
            });
          }
          const conta = await ensureContaAsaas(tx);
          await tx.financeiroTransacao.create({
            data: {
              tipo: 'RECEITA',
              categoria: 'LIVRARIA',
              valor: pedido.valorTotal,
              dataTransacao: new Date(),
              status: 'CONCLUIDO',
              origem: 'ECOMMERCE',
              contaId: conta.id,
              asaasPaymentId: payment.id,
              observacoes: `Pedido ${pedido.protocolo}`,
            },
          });
        }
      }

      if (PAID_STATUSES.has(status) && cobranca.inscricaoId) {
        await tx.inscricao.update({
          where: { id: cobranca.inscricaoId },
          data: { statusPagamento: 'CONCLUIDO' },
        });
        if (!cobranca.transacaoId) {
          const inscricao = await tx.inscricao.findUnique({ where: { id: cobranca.inscricaoId } });
          if (inscricao) {
            const conta = await ensureContaAsaas(tx);
            const transacao = await tx.financeiroTransacao.create({
              data: {
                pessoaId: inscricao.pessoaId,
                tipo: 'RECEITA',
                categoria: 'EVENTOS',
                valor: inscricao.valor,
                dataTransacao: new Date(),
                vencimento: inscricao.vencimento,
                status: 'CONCLUIDO',
                origem: 'EVENTO',
                contaId: conta.id,
                asaasPaymentId: payment.id,
              },
            });
            await tx.asaasCobranca.update({
              where: { id: cobranca.id },
              data: { transacaoId: transacao.id },
            });
          }
        }
      }
    } else if (PAID_STATUSES.has(status)) {
      // Cobrança ainda não persistida localmente — criar ledger mínimo
      const conta = await ensureContaAsaas(tx);
      const billingType = mapBillingType(payment.billingType);
      const transacao = await tx.financeiroTransacao.create({
        data: {
          tipo: 'RECEITA',
          categoria: 'DOACAO',
          valor: payment.value,
          dataTransacao: new Date(),
          status: 'CONCLUIDO',
          origem: payment.subscription ? 'ASSINATURA' : 'MANUAL',
          contaId: conta.id,
          asaasPaymentId: payment.id,
          asaasSubscriptionId: payment.subscription ?? null,
          observacoes: payment.externalReference ?? `Asaas ${payment.id}`,
        },
      });
      await tx.asaasCobranca.create({
        data: {
          asaasPaymentId: payment.id,
          status,
          billingType,
          valor: payment.value,
          vencimento: new Date(payment.dueDate),
          invoiceUrl: payment.invoiceUrl,
          externalRef: payment.externalReference,
          transacaoId: transacao.id,
        },
      });
    }
  });

  return { ok: true, paymentId: payment.id };
}
