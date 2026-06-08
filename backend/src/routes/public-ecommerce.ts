import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { protocoloPedido } from '../lib/ecommerce-protocolo.js';
import {
  checkoutSchema,
  clienteAdminSchema,
  normalizeClienteData,
} from '../lib/ecommerce-schemas.js';
import { LGPD_POLICY_VERSION } from '../lib/lgpd.js';

const router = Router();

const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Limite de pedidos atingido. Tente mais tarde.' },
});

router.get('/livraria/produtos', async (req, res) => {
  const tipo = req.query.tipo as string | undefined;
  const where = {
    publicadoEcommerce: true,
    estoqueAtual: { gt: 0 },
    ...(tipo && ['LIVRO', 'ERVA', 'ARTIGO'].includes(tipo) ? { tipo: tipo as 'LIVRO' | 'ERVA' | 'ARTIGO' } : {}),
  };
  const produtos = await prisma.produto.findMany({
    where,
    select: {
      id: true,
      nome: true,
      tipo: true,
      preco: true,
      estoqueAtual: true,
      descricaoEcommerce: true,
    },
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
  });
  res.json(produtos);
});

router.get('/livraria/conteudos', async (_req, res) => {
  const conteudos = await prisma.livrariaConteudo.findMany({
    where: { publicado: true },
    select: {
      id: true,
      tipo: true,
      titulo: true,
      texto: true,
      ordem: true,
      produto: {
        select: { id: true, nome: true, preco: true, tipo: true, descricaoEcommerce: true },
      },
    },
    orderBy: [{ tipo: 'asc' }, { ordem: 'asc' }, { createdAt: 'desc' }],
  });
  res.json(conteudos);
});

router.post('/livraria/pedidos', checkoutLimiter, async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const clienteData = normalizeClienteData(parsed.data.cliente);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const produtoIds = parsed.data.itens.map((i) => i.produtoId);
      const produtos = await tx.produto.findMany({
        where: { id: { in: produtoIds }, publicadoEcommerce: true },
      });
      const mapa = new Map(produtos.map((p) => [p.id, p]));

      let valorTotal = 0;
      const linhas: { produtoId: number; quantidade: number; precoUnitario: number }[] = [];

      for (const item of parsed.data.itens) {
        const produto = mapa.get(item.produtoId);
        if (!produto) {
          throw Object.assign(new Error(`Produto ${item.produtoId} indisponível`), { status: 404 });
        }
        if (produto.estoqueAtual < item.quantidade) {
          throw Object.assign(new Error(`Estoque insuficiente: ${produto.nome}`), { status: 409 });
        }
        const precoUnitario = Number(produto.preco);
        valorTotal += precoUnitario * item.quantidade;
        linhas.push({ produtoId: produto.id, quantidade: item.quantidade, precoUnitario });
      }

      let cliente = await tx.ecommerceCliente.findFirst({
        where:
          clienteData.tipo === 'PF'
            ? { cpf: clienteData.cpf! }
            : { cnpj: clienteData.cnpj! },
      });

      if (cliente) {
        cliente = await tx.ecommerceCliente.update({
          where: { id: cliente.id },
          data: clienteData,
        });
      } else {
        cliente = await tx.ecommerceCliente.create({ data: clienteData });
      }

      const pedido = await tx.ecommercePedido.create({
        data: {
          protocolo: 'TEMP',
          clienteId: cliente.id,
          valorTotal,
          status: 'PENDENTE_PAGAMENTO',
          aceiteLgpdEm: new Date(),
          aceiteLgpdVersao: LGPD_POLICY_VERSION,
        },
      });

      const protocolo = protocoloPedido(pedido.id);
      await tx.ecommercePedido.update({
        where: { id: pedido.id },
        data: { protocolo },
      });

      await tx.ecommerceItemPedido.createMany({
        data: linhas.map((l) => ({
          pedidoId: pedido.id,
          produtoId: l.produtoId,
          quantidade: l.quantidade,
          precoUnitario: l.precoUnitario,
        })),
      });

      const completo = await tx.ecommercePedido.findUnique({
        where: { id: pedido.id },
        include: {
          itens: { include: { produto: { select: { id: true, nome: true } } } },
          cliente: { select: { id: true, nomeCompleto: true, email: true } },
        },
      });

      return completo!;
    });

    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

    res.status(201).json({
      pedido: result,
      pagamento: {
        provider: 'stripe',
        configurado: stripeConfigured,
        checkoutUrl: null as string | null,
        mensagem: stripeConfigured
          ? 'Stripe será acionado em breve.'
          : 'Pedido registrado. Pagamento via Stripe será habilitado em breve — guarde o protocolo.',
      },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : 'Erro ao criar pedido';
    res.status(status).json({ error: message });
  }
});

router.get('/livraria/pedidos/:protocolo', async (req, res) => {
  const pedido = await prisma.ecommercePedido.findUnique({
    where: { protocolo: req.params.protocolo },
    select: {
      protocolo: true,
      status: true,
      valorTotal: true,
      createdAt: true,
      itens: {
        select: {
          quantidade: true,
          precoUnitario: true,
          produto: { select: { nome: true } },
        },
      },
    },
  });
  if (!pedido) {
    res.status(404).json({ error: 'Pedido não encontrado' });
    return;
  }
  res.json(pedido);
});

export default router;
