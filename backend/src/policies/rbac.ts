import type { SetorAcesso } from '@prisma/client';

type Resource =
  | 'usuarios'
  | 'pessoas'
  | 'financeiro'
  | 'import'
  | 'eventos'
  | 'checkin'
  | 'livraria'
  | 'estoque'
  | 'dashboard'
  | 'agendamentos'
  | 'logs'
  | 'webhooks';

const matrix: Record<SetorAcesso, Partial<Record<Resource, 'read' | 'write' | 'own'>>> = {
  DIRETORIA: {
    usuarios: 'write',
    pessoas: 'write',
    financeiro: 'write',
    import: 'write',
    eventos: 'write',
    checkin: 'write',
    livraria: 'write',
    estoque: 'write',
    dashboard: 'read',
    agendamentos: 'write',
    logs: 'read',
    webhooks: 'write',
  },
  FINANCEIRO: {
    pessoas: 'read',
    financeiro: 'write',
    import: 'write',
    dashboard: 'read',
  },
  RECEPCAO: {
    pessoas: 'write',
    eventos: 'write',
    checkin: 'write',
    agendamentos: 'write',
  },
  LIVRARIA: {
    pessoas: 'read',
    livraria: 'write',
    estoque: 'write',
  },
  MEDIUM: {
    financeiro: 'own',
    dashboard: 'own',
  },
  SUPORTE: {
    pessoas: 'read',
    logs: 'write',
  },
};

export function canAccess(
  setor: SetorAcesso,
  resource: Resource,
  action: 'read' | 'write' = 'read'
): boolean {
  const perm = matrix[setor]?.[resource];
  if (!perm) return false;
  if (perm === 'own') return action === 'read';
  if (action === 'read') return perm === 'read' || perm === 'write';
  return perm === 'write';
}
