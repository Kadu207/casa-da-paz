import type { SetorAcesso } from '@prisma/client';
import type { PolicyGrants } from '../policies/rbac.js';

export interface JwtPayload {
  userId: number;
  pessoaId: number;
  setorAcesso: SetorAcesso;
  login: string;
  policies?: PolicyGrants | null;
  deveTrocarSenha?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
