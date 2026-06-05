import type { SetorAcesso } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  pessoaId: number;
  setorAcesso: SetorAcesso;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
