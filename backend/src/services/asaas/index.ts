import { getAsaasConfig } from './client.js';
import { ensureAsaasCustomer } from './customers.js';
import {
  createAsaasPayment,
  getAsaasPixQrCode,
  type AsaasBillingTypeApi,
} from './payments.js';
import { createAsaasSubscription } from './subscriptions.js';
import { getAsaasBalance } from './balance.js';
import { mapBillingType, mapAsaasPaymentStatus } from './webhooks.js';
import { prisma } from '../../lib/prisma.js';

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function createCobrancaForPedido(opts: {
  pedidoId: number;
  ecommerceClienteId?: number;
  customerName: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  value: number;
  billingType?: AsaasBillingTypeApi;
  description?: string;
}) {
  const cfg = getAsaasConfig();
  if (!cfg.configured) {
    return {
      configurado: false as const,
      invoiceUrl: null as string | null,
      paymentId: null as string | null,
      mensagem: 'Asaas não configurado (sandbox). Pedido registrado — configure ASAAS_API_KEY.',
    };
  }

  if (!opts.cpfCnpj.replace(/\D/g, '')) {
    return {
      configurado: false as const,
      invoiceUrl: null as string | null,
      paymentId: null as string | null,
      mensagem: 'CPF/CNPJ obrigatório para cobrança Asaas. Pedido registrado.',
    };
  }

  const customer = await ensureAsaasCustomer({
    name: opts.customerName,
    cpfCnpj: opts.cpfCnpj.replace(/\D/g, ''),
    email: opts.email,
    mobilePhone: opts.phone,
  });

  await prisma.asaasCliente.upsert({
    where: { asaasCustomerId: customer.id },
    update: {
      email: opts.email,
      cpfCnpj: opts.cpfCnpj.replace(/\D/g, ''),
      ecommerceClienteId: opts.ecommerceClienteId,
    },
    create: {
      asaasCustomerId: customer.id,
      ecommerceClienteId: opts.ecommerceClienteId,
      email: opts.email,
      cpfCnpj: opts.cpfCnpj.replace(/\D/g, ''),
    },
  });

  const billingType = opts.billingType ?? 'UNDEFINED';
  const payment = await createAsaasPayment({
    customer: customer.id,
    billingType,
    value: opts.value,
    dueDate: todayPlusDays(3),
    description: opts.description ?? `Pedido #${opts.pedidoId}`,
    externalReference: `pedido:${opts.pedidoId}`,
  });

  let pixQrCode: string | null = null;
  let pixCopiaCola: string | null = null;
  if (billingType === 'PIX' || billingType === 'UNDEFINED') {
    try {
      const pix = await getAsaasPixQrCode(payment.id);
      pixQrCode = pix.encodedImage;
      pixCopiaCola = pix.payload;
    } catch {
      // QR opcional
    }
  }

  await prisma.asaasCobranca.create({
    data: {
      asaasPaymentId: payment.id,
      status: mapAsaasPaymentStatus(payment.status),
      billingType: mapBillingType(payment.billingType),
      valor: opts.value,
      vencimento: new Date(payment.dueDate),
      invoiceUrl: payment.invoiceUrl,
      pixQrCode,
      pixCopiaCola,
      externalRef: `pedido:${opts.pedidoId}`,
      pedidoId: opts.pedidoId,
    },
  });

  await prisma.ecommercePedido.update({
    where: { id: opts.pedidoId },
    data: {
      asaasPaymentId: payment.id,
      asaasInvoiceUrl: payment.invoiceUrl ?? null,
    },
  });

  return {
    configurado: true as const,
    invoiceUrl: payment.invoiceUrl ?? null,
    paymentId: payment.id,
    pixQrCode,
    pixCopiaCola,
    mensagem: 'Cobrança Asaas criada. Conclua o pagamento pela fatura.',
  };
}

export async function createCobrancaAvulsa(opts: {
  pessoaId?: number;
  customerName: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  value: number;
  billingType: AsaasBillingTypeApi;
  categoria: string;
  dueDate?: string;
  description?: string;
  inscricaoId?: number;
}) {
  const cfg = getAsaasConfig();
  if (!cfg.configured) {
    throw Object.assign(new Error('ASAAS_API_KEY não configurada'), { status: 503 });
  }

  const customer = await ensureAsaasCustomer({
    name: opts.customerName,
    cpfCnpj: opts.cpfCnpj.replace(/\D/g, ''),
    email: opts.email,
    mobilePhone: opts.phone,
  });

  if (opts.pessoaId) {
    await prisma.asaasCliente.upsert({
      where: { asaasCustomerId: customer.id },
      update: { pessoaId: opts.pessoaId },
      create: {
        asaasCustomerId: customer.id,
        pessoaId: opts.pessoaId,
        cpfCnpj: opts.cpfCnpj.replace(/\D/g, ''),
        email: opts.email,
      },
    });
  }

  const dueDate = opts.dueDate ?? todayPlusDays(3);
  const payment = await createAsaasPayment({
    customer: customer.id,
    billingType: opts.billingType,
    value: opts.value,
    dueDate,
    description: opts.description,
    externalReference: opts.inscricaoId
      ? `inscricao:${opts.inscricaoId}`
      : opts.pessoaId
        ? `pessoa:${opts.pessoaId}`
        : undefined,
  });

  const conta =
    (await prisma.contaFinanceira.findFirst({ where: { tipo: 'ASAAS', ativa: true } })) ??
    (await prisma.contaFinanceira.create({
      data: { nome: 'Conta Asaas', tipo: 'ASAAS', saldoInicial: 0, ativa: true },
    }));

  const transacao = await prisma.financeiroTransacao.create({
    data: {
      pessoaId: opts.pessoaId,
      tipo: 'RECEITA',
      categoria: opts.categoria,
      valor: opts.value,
      dataTransacao: new Date(),
      vencimento: new Date(dueDate),
      status: 'PENDENTE',
      origem: opts.inscricaoId ? 'EVENTO' : 'MANUAL',
      contaId: conta.id,
      asaasPaymentId: payment.id,
      observacoes: opts.description,
    },
  });

  let pixQrCode: string | null = null;
  let pixCopiaCola: string | null = null;
  if (opts.billingType === 'PIX') {
    try {
      const pix = await getAsaasPixQrCode(payment.id);
      pixQrCode = pix.encodedImage;
      pixCopiaCola = pix.payload;
    } catch {
      // ignore
    }
  }

  const cobranca = await prisma.asaasCobranca.create({
    data: {
      asaasPaymentId: payment.id,
      status: mapAsaasPaymentStatus(payment.status),
      billingType: mapBillingType(payment.billingType),
      valor: opts.value,
      vencimento: new Date(dueDate),
      invoiceUrl: payment.invoiceUrl,
      pixQrCode,
      pixCopiaCola,
      transacaoId: transacao.id,
      inscricaoId: opts.inscricaoId,
    },
  });

  return { payment, cobranca, transacao };
}

export async function createAssinaturaMedium(opts: {
  pessoaId: number;
  customerName: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  value: number;
  billingType: AsaasBillingTypeApi;
  nextDueDate?: string;
}) {
  const cfg = getAsaasConfig();
  if (!cfg.configured) {
    throw Object.assign(new Error('ASAAS_API_KEY não configurada'), { status: 503 });
  }

  const existing = await prisma.asaasAssinatura.findFirst({
    where: { pessoaId: opts.pessoaId, status: 'ACTIVE' },
  });
  if (existing) {
    throw Object.assign(new Error('Médium já possui assinatura ativa'), { status: 409 });
  }

  const customer = await ensureAsaasCustomer({
    name: opts.customerName,
    cpfCnpj: opts.cpfCnpj.replace(/\D/g, ''),
    email: opts.email,
    mobilePhone: opts.phone,
  });

  await prisma.asaasCliente.upsert({
    where: { asaasCustomerId: customer.id },
    update: { pessoaId: opts.pessoaId },
    create: {
      asaasCustomerId: customer.id,
      pessoaId: opts.pessoaId,
      cpfCnpj: opts.cpfCnpj.replace(/\D/g, ''),
      email: opts.email,
    },
  });

  const nextDueDate = opts.nextDueDate ?? todayPlusDays(5);
  const sub = await createAsaasSubscription({
    customer: customer.id,
    billingType: opts.billingType,
    value: opts.value,
    nextDueDate,
    cycle: 'MONTHLY',
    description: `Mensalidade médium #${opts.pessoaId}`,
    externalReference: `medium:${opts.pessoaId}`,
  });

  const assinatura = await prisma.asaasAssinatura.create({
    data: {
      asaasSubscriptionId: sub.id,
      pessoaId: opts.pessoaId,
      valor: opts.value,
      cycle: 'MONTHLY',
      billingType: mapBillingType(opts.billingType),
      status: 'ACTIVE',
      nextDueDate: new Date(nextDueDate),
    },
  });

  return { subscription: sub, assinatura };
}

export async function syncAsaasBalanceToConta() {
  const cfg = getAsaasConfig();
  if (!cfg.configured) {
    return { configurado: false, balance: null as number | null };
  }
  const bal = await getAsaasBalance();
  const conta = await prisma.contaFinanceira.findFirst({ where: { tipo: 'ASAAS', ativa: true } });
  if (conta) {
    await prisma.contaFinanceira.update({
      where: { id: conta.id },
      data: { asaasWalletId: cfg.walletId || conta.asaasWalletId },
    });
  }
  return { configurado: true, balance: bal.balance, contaId: conta?.id ?? null };
}

export { getAsaasConfig };
