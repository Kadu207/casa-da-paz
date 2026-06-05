import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, signToken } from '../middleware/auth.js';

const router = Router();

const loginFieldSchema = z
  .string()
  .min(3, 'Usuário deve ter pelo menos 3 caracteres')
  .max(50)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou underscore');

const loginSchema = z.object({
  login: loginFieldSchema,
  senha: z.string().min(6),
});

const usuarioSchema = z.object({
  login: loginFieldSchema,
  senha: z.string().min(6),
  setorAcesso: z.enum(['DIRETORIA', 'FINANCEIRO', 'RECEPCAO', 'LIVRARIA', 'MEDIUM', 'SUPORTE']),
  pessoaId: z.number().int().positive(),
});

const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  senhaNova: z.string().min(6),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { login, senha } = parsed.data;
  const usuario = await prisma.usuario.findUnique({
    where: { login },
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
    login: usuario.login,
  });
  res.json({
    token,
    user: {
      id: usuario.id,
      login: usuario.login,
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
    login: usuario.login,
    setorAcesso: usuario.setorAcesso,
    pessoa: usuario.pessoa,
  });
});

router.put('/me/senha', authenticate, async (req, res) => {
  const parsed = alterarSenhaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.userId } });
  if (!usuario) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  const ok = await bcrypt.compare(parsed.data.senhaAtual, usuario.senhaHash);
  if (!ok) {
    res.status(401).json({ error: 'Senha atual incorreta' });
    return;
  }
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: await bcrypt.hash(parsed.data.senhaNova, 10) },
  });
  res.json({ ok: true });
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
  const { login, senha, setorAcesso, pessoaId } = parsed.data;
  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { login, senhaHash, setorAcesso, pessoaId },
    include: { pessoa: true },
  });
  res.status(201).json({ ...usuario, senhaHash: undefined });
});

router.put('/usuarios/:id', authenticate, authorize('usuarios', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const body = z
    .object({
      login: loginFieldSchema.optional(),
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
  if (body.data.login) data.login = body.data.login;
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
