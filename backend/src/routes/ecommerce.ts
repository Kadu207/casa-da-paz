import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { clienteAdminSchema, normalizeClienteData } from '../lib/ecommerce-schemas.js';

const router = Router();

router.get('/pedidos', authenticate, authorize('ecommerce', 'read'), async (req, res) => {
  const status = req.query.status as string | undefined;
  const pedidos = await prisma.ecommercePedido.findMany({
    where: status ? { status: status as 'PENDENTE_PAGAMENTO' | 'PAGO' | 'CANCELADO' | 'EXPIRADO' } : undefined,
    include: {
      cliente: true,
      itens: { include: { produto: { select: { id: true, nome: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(pedidos);
});

router.get('/pedidos/:id', authenticate, authorize('ecommerce', 'read'), async (req, res) => {
  const pedido = await prisma.ecommercePedido.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      cliente: true,
      itens: { include: { produto: true } },
    },
  });
  if (!pedido) {
    res.status(404).json({ error: 'Pedido não encontrado' });
    return;
  }
  res.json(pedido);
});

router.patch('/pedidos/:id/status', authenticate, authorize('ecommerce', 'write'), async (req, res) => {
  const body = z
    .object({
      status: z.enum(['PENDENTE_PAGAMENTO', 'PAGO', 'CANCELADO', 'EXPIRADO']),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const pedido = await prisma.ecommercePedido.update({
    where: { id: Number(req.params.id) },
    data: { status: body.data.status },
    include: { cliente: true, itens: { include: { produto: true } } },
  });
  res.json(pedido);
});

router.get('/clientes', authenticate, authorize('ecommerce', 'read'), async (_req, res) => {
  const clientes = await prisma.ecommerceCliente.findMany({
    orderBy: { nomeCompleto: 'asc' },
    include: { _count: { select: { pedidos: true } } },
  });
  res.json(clientes);
});

router.get('/clientes/:id', authenticate, authorize('ecommerce', 'read'), async (req, res) => {
  const cliente = await prisma.ecommerceCliente.findUnique({
    where: { id: Number(req.params.id) },
    include: { pedidos: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!cliente) {
    res.status(404).json({ error: 'Cliente não encontrado' });
    return;
  }
  res.json(cliente);
});

router.post('/clientes', authenticate, authorize('ecommerce', 'write'), async (req, res) => {
  const parsed = clienteAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const data = normalizeClienteData(parsed.data);
  const cliente = await prisma.ecommerceCliente.create({ data });
  res.status(201).json(cliente);
});

router.put('/clientes/:id', authenticate, authorize('ecommerce', 'write'), async (req, res) => {
  const parsed = clienteAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const data = normalizeClienteData(parsed.data);
  const cliente = await prisma.ecommerceCliente.update({
    where: { id: Number(req.params.id) },
    data,
  });
  res.json(cliente);
});

router.delete('/clientes/:id', authenticate, authorize('ecommerce', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const count = await prisma.ecommercePedido.count({ where: { clienteId: id } });
  if (count > 0) {
    res.status(409).json({ error: 'Cliente possui pedidos — não é possível excluir' });
    return;
  }
  await prisma.ecommerceCliente.delete({ where: { id } });
  res.status(204).send();
});

export default router;
