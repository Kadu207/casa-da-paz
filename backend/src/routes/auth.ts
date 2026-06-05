import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, signToken } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

const usuarioSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  setorAcesso: z.enum(['DIRETORIA', 'FINANCEIRO', 'RECEPCAO', 'LIVRARIA', 'MEDIUM', 'SUPORTE']),
  pessoaId: z.number().int().positive(),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, senha } = parsed.data;
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { pessoa: true },
  });
  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  const token = signToken({
    userId: usuario.id,
    pessoaId: usuario.pessoaId,
    setorAcesso: usuario.setorAcesso,
    email: usuario.email,
  });
  res.json({
    token,
    user: {
      id: usuario.id,
      email: usuario.email,
      setorAcesso: usuario.setorAcesso,
      pessoa: usuario.pessoa,
    },
  });
});

router.get('/me', authenticate, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.userId },
    include: { pessoa: true },
  });
  if (!usuario) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  res.json({
    id: usuario.id,
    email: usuario.email,
    setorAcesso: usuario.setorAcesso,
    pessoa: usuario.pessoa,
  });
});

router.get('/usuarios', authenticate, authorize('usuarios', 'read'), async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({
    include: { pessoa: { select: { id: true, nomeCompleto: true, telefone: true } } },
  });
  res.json(usuarios.map((u) => ({ ...u, senhaHash: undefined })));
});

router.post('/usuarios', authenticate, authorize('usuarios', 'write'), async (req, res) => {
  const parsed = usuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, senha, setorAcesso, pessoaId } = parsed.data;
  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { email, senhaHash, setorAcesso, pessoaId },
    include: { pessoa: true },
  });
  res.status(201).json({ ...usuario, senhaHash: undefined });
});

router.put('/usuarios/:id', authenticate, authorize('usuarios', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      email: z.string().email().optional(),
      senha: z.string().min(6).optional(),
      setorAcesso: z
        .enum(['DIRETORIA', 'FINANCEIRO', 'RECEPCAO', 'LIVRARIA', 'MEDIUM', 'SUPORTE'])
        .optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  const data: Record<string, unknown> = {};
  if (body.data.email) data.email = body.data.email;
  if (body.data.setorAcesso) data.setorAcesso = body.data.setorAcesso;
  if (body.data.senha) data.senhaHash = await bcrypt.hash(body.data.senha, 10);
  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    include: { pessoa: true },
  });
  res.json({ ...usuario, senhaHash: undefined });
});

router.delete('/usuarios/:id', authenticate, authorize('usuarios', 'write'), async (req, res) => {
  await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

export default router;
