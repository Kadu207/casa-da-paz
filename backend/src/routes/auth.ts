import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import {
  authenticate,
  authorize,
  requireSupervisor,
  signToken,
} from '../middleware/auth.js';
import {
  RBAC_RESOURCES,
  canManageTargetUser,
  defaultGrantsForSetor,
  effectiveGrants,
  snapshotGrantsForSetor,
  type PolicyGrants,
} from '../policies/rbac.js';
import { enrichEstoqueCasaGrants } from '../lib/estoque-casa.js';
import { registrarAuditoria } from '../lib/auditoria.js';

const router = Router();

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde e tente novamente.' },
});

const loginFieldSchema = z
  .string()
  .min(3, 'Usuário deve ter pelo menos 3 caracteres')
  .max(50)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou underscore');

const loginSchema = z.object({
  login: loginFieldSchema,
  senha: z.string().min(6),
});

const operationalSetorSchema = z.enum([
  'DIRETORIA',
  'FINANCEIRO',
  'TESOURARIA',
  'MARKETING',
  'RECEPCAO',
  'LIVRARIA',
  'MEDIUM',
  'SUPORTE',
]);

const grantSchema = z.enum(['read', 'write', 'own', 'none']);
const policyGrantsSchema = z.record(z.enum(RBAC_RESOURCES), grantSchema);

const usuarioSchema = z.object({
  login: loginFieldSchema,
  senha: z.string().min(6),
  setorAcesso: operationalSetorSchema,
  pessoaId: z.number().int().positive(),
  /** Políticas definidas no ato do cadastro (opcional → snapshot do setor). */
  grants: policyGrantsSchema.optional(),
});

const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  senhaNova: z.string().min(6),
});

async function loadUsuarioOr404(id: number, res: import('express').Response) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { pessoa: true, policy: true },
  });
  if (!usuario) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return null;
  }
  return usuario;
}

async function serializeUsuario(u: {
  id: number;
  login: string;
  setorAcesso: import('@prisma/client').SetorAcesso;
  pessoaId: number;
  ativo?: boolean;
  pessoa?: unknown;
  policy?: { grants: unknown } | null;
  senhaHash?: string;
}) {
  const customGrants = (u.policy?.grants as PolicyGrants | undefined) ?? null;
  return {
    id: u.id,
    login: u.login,
    setorAcesso: u.setorAcesso,
    pessoaId: u.pessoaId,
    ativo: u.ativo ?? true,
    pessoa: u.pessoa,
    policy: customGrants,
    effectiveGrants: await enrichEstoqueCasaGrants(u.id, u.setorAcesso, customGrants),
  };
}

router.post('/login', loginRateLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { login, senha } = parsed.data;
  const usuario = await prisma.usuario.findUnique({
    where: { login },
    include: { pessoa: true, policy: true },
  });
  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    await registrarAuditoria(req, {
      rota: 'admin.login.fail',
      recurso: 'auth',
      acao: 'login_fail',
      metodo: 'POST',
      login,
      statusHttp: 401,
      sucesso: false,
      motivo: 'credenciais_invalidas',
    });
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  if (usuario.ativo === false) {
    await registrarAuditoria(req, {
      rota: 'admin.login.fail',
      recurso: 'auth',
      acao: 'login_fail',
      metodo: 'POST',
      login,
      usuarioId: usuario.id,
      statusHttp: 403,
      sucesso: false,
      motivo: 'usuario_inativo',
    });
    res.status(403).json({ error: 'Usuário desativado. Contate o SUPERVISOR.' });
    return;
  }
  const token = signToken({
    userId: usuario.id,
    pessoaId: usuario.pessoaId,
    setorAcesso: usuario.setorAcesso,
    login: usuario.login,
  });
  await registrarAuditoria(req, {
    rota: 'admin.login',
    recurso: 'auth',
    acao: 'login',
    metodo: 'POST',
    usuarioId: usuario.id,
    login: usuario.login,
    setor: usuario.setorAcesso,
    statusHttp: 200,
    sucesso: true,
  });
  res.json({
    token,
    user: await serializeUsuario(usuario),
  });
});

router.get('/me', authenticate, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.userId },
    include: { pessoa: true, policy: true },
  });
  if (!usuario) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  res.json(await serializeUsuario(usuario));
});

router.get('/politicas/catalogo', authenticate, requireSupervisor, (_req, res) => {
  res.json({
    resources: RBAC_RESOURCES,
    grants: ['read', 'write', 'own', 'none'],
    operationalSetores: operationalSetorSchema.options,
    defaults: {
      DIRETORIA: defaultGrantsForSetor('DIRETORIA'),
      FINANCEIRO: defaultGrantsForSetor('FINANCEIRO'),
      TESOURARIA: defaultGrantsForSetor('TESOURARIA'),
      MARKETING: defaultGrantsForSetor('MARKETING'),
      RECEPCAO: defaultGrantsForSetor('RECEPCAO'),
      LIVRARIA: defaultGrantsForSetor('LIVRARIA'),
      MEDIUM: defaultGrantsForSetor('MEDIUM'),
      SUPORTE: defaultGrantsForSetor('SUPORTE'),
    },
  });
});

router.get('/usuarios/:id/politicas', authenticate, requireSupervisor, async (req, res) => {
  const usuario = await loadUsuarioOr404(Number(req.params.id), res);
  if (!usuario) return;
  if (!canManageTargetUser(req.user!.setorAcesso, usuario.setorAcesso)) {
    res.status(403).json({ error: 'Não é possível configurar políticas deste usuário' });
    return;
  }
  const custom = (usuario.policy?.grants as PolicyGrants | undefined) ?? {};
  res.json({
    usuarioId: usuario.id,
    setorAcesso: usuario.setorAcesso,
    customGrants: custom,
    effectiveGrants: effectiveGrants(usuario.setorAcesso, custom),
    defaults: defaultGrantsForSetor(usuario.setorAcesso),
  });
});

router.put('/usuarios/:id/politicas', authenticate, requireSupervisor, async (req, res) => {
  const id = Number(req.params.id);
  const usuario = await loadUsuarioOr404(id, res);
  if (!usuario) return;
  if (!canManageTargetUser(req.user!.setorAcesso, usuario.setorAcesso)) {
    res.status(403).json({ error: 'Não é possível configurar políticas deste usuário' });
    return;
  }
  const parsed = policyGrantsSchema.safeParse(req.body.grants ?? req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await prisma.usuarioPolicy.upsert({
    where: { usuarioId: id },
    create: {
      usuarioId: id,
      grants: snapshotGrantsForSetor(usuario.setorAcesso, parsed.data),
      atualizadoPorId: req.user!.userId,
    },
    update: {
      grants: snapshotGrantsForSetor(usuario.setorAcesso, parsed.data),
      atualizadoPorId: req.user!.userId,
    },
  });
  res.json({ ok: true, grants: snapshotGrantsForSetor(usuario.setorAcesso, parsed.data) });
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
    include: {
      pessoa: { select: { id: true, nomeCompleto: true, telefone: true } },
      policy: true,
    },
  });
  res.json(await Promise.all(usuarios.map((u) => serializeUsuario(u))));
});

router.post('/usuarios', authenticate, authorize('usuarios', 'write'), async (req, res) => {
  const parsed = usuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { login, senha, setorAcesso, pessoaId, grants } = parsed.data;
  if (!canManageTargetUser(req.user!.setorAcesso, setorAcesso)) {
    res.status(403).json({ error: 'Sem permissão para criar usuário neste setor' });
    return;
  }

  const grantsSnapshot = snapshotGrantsForSetor(setorAcesso, grants ?? null);
  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.$transaction(async (tx) => {
    const created = await tx.usuario.create({
      data: { login, senhaHash, setorAcesso, pessoaId },
    });
    await tx.usuarioPolicy.create({
      data: {
        usuarioId: created.id,
        grants: grantsSnapshot,
        atualizadoPorId: req.user!.userId,
      },
    });
    return tx.usuario.findUniqueOrThrow({
      where: { id: created.id },
      include: { pessoa: true, policy: true },
    });
  });

  res.status(201).json(await serializeUsuario(usuario));
});

router.put('/usuarios/:id', authenticate, authorize('usuarios', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  const target = await loadUsuarioOr404(id, res);
  if (!target) return;
  if (!canManageTargetUser(req.user!.setorAcesso, target.setorAcesso)) {
    res.status(403).json({ error: 'Sem permissão para alterar este usuário' });
    return;
  }
  const body = z
    .object({
      login: loginFieldSchema.optional(),
      senha: z.string().min(6).optional(),
      setorAcesso: operationalSetorSchema.optional(),
      ativo: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }
  if (body.data.setorAcesso && !canManageTargetUser(req.user!.setorAcesso, body.data.setorAcesso)) {
    res.status(403).json({ error: 'Sem permissão para mover usuário para este setor' });
    return;
  }
  if (body.data.ativo === false && id === req.user!.userId) {
    res.status(400).json({ error: 'Não é possível desativar o próprio usuário' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (body.data.login) data.login = body.data.login;
  if (body.data.setorAcesso) data.setorAcesso = body.data.setorAcesso;
  if (body.data.senha) data.senhaHash = await bcrypt.hash(body.data.senha, 10);
  if (body.data.ativo !== undefined) data.ativo = body.data.ativo;

  const usuario = await prisma.$transaction(async (tx) => {
    const updated = await tx.usuario.update({
      where: { id },
      data,
      include: { pessoa: true, policy: true },
    });
    if (body.data.setorAcesso && body.data.setorAcesso !== target.setorAcesso) {
      const grants = snapshotGrantsForSetor(body.data.setorAcesso);
      await tx.usuarioPolicy.upsert({
        where: { usuarioId: id },
        create: {
          usuarioId: id,
          grants,
          atualizadoPorId: req.user!.userId,
        },
        update: {
          grants,
          atualizadoPorId: req.user!.userId,
        },
      });
      return tx.usuario.findUniqueOrThrow({
        where: { id },
        include: { pessoa: true, policy: true },
      });
    }
    return updated;
  });

  res.json(await serializeUsuario(usuario));
});

router.delete('/usuarios/:id', authenticate, authorize('usuarios', 'write'), async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user!.userId) {
    res.status(400).json({ error: 'Não é possível excluir o próprio usuário' });
    return;
  }
  const target = await loadUsuarioOr404(id, res);
  if (!target) return;
  if (!canManageTargetUser(req.user!.setorAcesso, target.setorAcesso)) {
    res.status(403).json({ error: 'Sem permissão para excluir este usuário' });
    return;
  }
  await prisma.usuario.delete({ where: { id } });
  res.status(204).send();
});

export default router;
