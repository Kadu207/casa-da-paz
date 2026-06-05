import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, getToken } from '../lib/api';

export type SetorAcesso =
  | 'DIRETORIA'
  | 'FINANCEIRO'
  | 'RECEPCAO'
  | 'LIVRARIA'
  | 'MEDIUM'
  | 'SUPORTE';

interface User {
  id: number;
  email: string;
  setorAcesso: SetorAcesso;
  pessoa: { id: number; nomeCompleto: string };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
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

  const login = async (email: string, senha: string) => {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora de AuthProvider');
  return ctx;
}
