import type { SetorAcesso } from '@prisma/client';

export const RBAC_RESOURCES = [
  'usuarios',
  'pessoas',
  'financeiro',
  'import',
  'eventos',
  'checkin',
  'livraria',
  'estoque',
  'estoque_casa',
  'delegacoes',
  'dashboard',
  'agendamentos',
  'logs',
  'webhooks',
  'integracoes',
  'ecommerce',
  'auditoria',
  'alertas',
  'manutencao',
  'marketing',
  'transparencia',
  'contas',
  'cobrancas',
  'contas_pagar',
  'recorrencia',
  'dre',
  'conciliacao_bancaria',
  'contribuintes',
] as const;

export type Resource = (typeof RBAC_RESOURCES)[number];
export type PolicyGrant = 'read' | 'write' | 'own' | 'none';
export type PolicyGrants = Partial<Record<Resource, PolicyGrant>>;

export const OPERATIONAL_ROLES: SetorAcesso[] = [
  'DIRETORIA',
  'FINANCEIRO',
  'TESOURARIA',
  'MARKETING',
  'RECEPCAO',
  'LIVRARIA',
  'MEDIUM',
  'SUPORTE',
];

export function isSystemRole(setor: SetorAcesso): boolean {
  return setor === 'SUPERVISOR' || setor === 'ADMIN';
}

export function isOperationalRole(setor: SetorAcesso): boolean {
  return OPERATIONAL_ROLES.includes(setor);
}

export function canManageTargetUser(actor: SetorAcesso, target: SetorAcesso): boolean {
  if (actor !== 'SUPERVISOR') return false;
  return isOperationalRole(target);
}

const treasuryWrite = {
  contas_pagar: 'write' as const,
  recorrencia: 'write' as const,
  dre: 'write' as const,
  conciliacao_bancaria: 'write' as const,
  contribuintes: 'write' as const,
};

const matrix: Record<SetorAcesso, Partial<Record<Resource, PolicyGrant>>> = {
  SUPERVISOR: {
    usuarios: 'write',
    pessoas: 'write',
    financeiro: 'write',
    import: 'write',
    eventos: 'write',
    checkin: 'write',
    livraria: 'write',
    estoque: 'write',
    estoque_casa: 'write',
    delegacoes: 'write',
    dashboard: 'read',
    agendamentos: 'write',
    logs: 'write',
    webhooks: 'read',
    integracoes: 'read',
    ecommerce: 'write',
    auditoria: 'write',
    alertas: 'write',
    manutencao: 'write',
    marketing: 'write',
    transparencia: 'read',
    contas: 'write',
    cobrancas: 'write',
    ...treasuryWrite,
  },
  ADMIN: {
    webhooks: 'write',
    integracoes: 'write',
    logs: 'write',
    manutencao: 'read',
    estoque_casa: 'write',
    delegacoes: 'write',
  },
  DIRETORIA: {
    pessoas: 'write',
    financeiro: 'write',
    import: 'write',
    eventos: 'write',
    checkin: 'write',
    livraria: 'write',
    estoque: 'write',
    estoque_casa: 'write',
    delegacoes: 'write',
    dashboard: 'read',
    agendamentos: 'write',
    logs: 'read',
    ecommerce: 'write',
    alertas: 'write',
    marketing: 'write',
    transparencia: 'read',
    contas: 'write',
    cobrancas: 'write',
    ...treasuryWrite,
  },
  FINANCEIRO: {
    pessoas: 'read',
    financeiro: 'write',
    import: 'write',
    dashboard: 'read',
    alertas: 'write',
    eventos: 'read',
    livraria: 'read',
    ecommerce: 'read',
    transparencia: 'read',
    contas: 'write',
    cobrancas: 'write',
    delegacoes: 'read',
    ...treasuryWrite,
  },
  /** Setor operacional Tesouraria — mesma matriz financeira (usuários tesouraria01–04). */
  TESOURARIA: {
    pessoas: 'read',
    financeiro: 'write',
    import: 'write',
    dashboard: 'read',
    alertas: 'write',
    eventos: 'read',
    livraria: 'read',
    ecommerce: 'read',
    transparencia: 'read',
    contas: 'write',
    cobrancas: 'write',
    estoque_casa: 'write',
    delegacoes: 'read',
    ...treasuryWrite,
  },
  MARKETING: {
    marketing: 'write',
    eventos: 'write',
    livraria: 'write',
    ecommerce: 'write',
    delegacoes: 'read',
  },
  RECEPCAO: {
    pessoas: 'write',
    eventos: 'write',
    checkin: 'write',
    agendamentos: 'write',
    alertas: 'read',
    delegacoes: 'read',
  },
  LIVRARIA: {
    pessoas: 'read',
    livraria: 'write',
    estoque: 'write',
    ecommerce: 'write',
    delegacoes: 'read',
  },
  MEDIUM: {
    financeiro: 'own',
    dashboard: 'own',
    cobrancas: 'own',
    delegacoes: 'read',
  },
  SUPORTE: {
    pessoas: 'read',
    logs: 'write',
    alertas: 'read',
    manutencao: 'write',
    delegacoes: 'read',
  },
};

function grantAllows(grant: PolicyGrant, action: 'read' | 'write'): boolean {
  if (grant === 'none') return false;
  if (grant === 'own') return action === 'read';
  if (action === 'read') return grant === 'read' || grant === 'write';
  return grant === 'write';
}

export function defaultGrantsForSetor(setor: SetorAcesso): PolicyGrants {
  return { ...matrix[setor] };
}

/** Congela a matriz do setor + overrides no ato do cadastro/edição. */
export function snapshotGrantsForSetor(
  setor: SetorAcesso,
  overrides?: PolicyGrants | null
): PolicyGrants {
  return { ...defaultGrantsForSetor(setor), ...(overrides ?? {}) };
}

export function canAccess(
  setor: SetorAcesso,
  resource: Resource,
  action: 'read' | 'write' = 'read',
  customGrants?: PolicyGrants | null
): boolean {
  const custom = customGrants?.[resource];
  if (custom !== undefined) {
    return grantAllows(custom, action);
  }
  const perm = matrix[setor]?.[resource];
  if (!perm) return false;
  return grantAllows(perm, action);
}

export function effectiveGrants(
  setor: SetorAcesso,
  customGrants?: PolicyGrants | null
): PolicyGrants {
  if (isSystemRoleStatic(setor)) {
    return defaultGrantsForSetor(setor);
  }
  const base = defaultGrantsForSetor(setor);
  return { ...base, ...(customGrants ?? {}) };
}

/** Grant efetivo do recurso (matriz do setor + overrides de policy). */
export function effectiveGrant(
  setor: SetorAcesso,
  resource: Resource,
  customGrants?: PolicyGrants | null
): PolicyGrant | undefined {
  return effectiveGrants(setor, customGrants)[resource];
}

/** Escopo `own`: filtrar por pessoa_id do JWT (não usar só setorAcesso === MEDIUM). */
export function isOwnScope(
  setor: SetorAcesso,
  resource: Resource,
  customGrants?: PolicyGrants | null
): boolean {
  return effectiveGrant(setor, resource, customGrants) === 'own';
}

function isSystemRoleStatic(setor: SetorAcesso): boolean {
  return setor === 'SUPERVISOR' || setor === 'ADMIN';
}
