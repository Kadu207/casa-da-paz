import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, getToken } from '../lib/api';

export type SetorAcesso =
  | 'SUPERVISOR'
  | 'ADMIN'
  | 'DIRETORIA'
  | 'FINANCEIRO'
  | 'TESOURARIA'
  | 'MARKETING'
  | 'RECEPCAO'
  | 'LIVRARIA'
  | 'MEDIUM'
  | 'SUPORTE';

export type PolicyGrant = 'read' | 'write' | 'own' | 'none';

export interface User {
  id: number;
  login: string;
  setorAcesso: SetorAcesso;
  pessoa: { id: number; nomeCompleto: string };
  policy?: Partial<Record<string, PolicyGrant>> | null;
  effectiveGrants?: Partial<Record<string, PolicyGrant>>;
  deveTrocarSenha?: boolean;
}

function grantAllows(grant: PolicyGrant | undefined, action: 'read' | 'write'): boolean {
  if (!grant || grant === 'none') return false;
  if (grant === 'own') return action === 'read';
  if (action === 'read') return grant === 'read' || grant === 'write';
  return grant === 'write';
}

export function hasPermission(
  user: User | null,
  resource: string,
  action: 'read' | 'write' = 'read'
): boolean {
  if (!user) return false;
  // Auditoria / logs de atividades: somente SUPERVISOR
  if (resource === 'auditoria') {
    return user.setorAcesso === 'SUPERVISOR';
  }
  if (user.setorAcesso === 'SUPERVISOR') {
    if (resource === 'integracoes' || resource === 'webhooks') return action === 'read';
    return true;
  }
  if (user.setorAcesso === 'ADMIN') {
    if (resource === 'estoque_casa') return true;
    return ['integracoes', 'webhooks', 'logs', 'manutencao'].includes(resource);
  }
  const grant = user.effectiveGrants?.[resource];
  if (grant) return grantAllows(grant, action);
  return false;
}

interface AuthContextType {
  user: User | null;
  login: (login: string, senha: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api<User>('/auth/me')
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const me = await api<User>('/auth/me');
      setUser(me);
      return me;
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      return null;
    }
  };

  const login = async (loginName: string, senha: string) => {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginName, senha }),
    });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora de AuthProvider');
  return ctx;
}
