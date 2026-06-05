import { Navigate } from 'react-router-dom';
import { useAuth, type SetorAcesso } from '../context/AuthContext';

const routeRoles: Record<string, SetorAcesso[]> = {
  '/app/dashboard': ['DIRETORIA', 'FINANCEIRO', 'MEDIUM'],
  '/app/financeiro': ['DIRETORIA', 'FINANCEIRO'],
  '/app/recepcao': ['DIRETORIA', 'RECEPCAO'],
  '/app/livraria': ['DIRETORIA', 'LIVRARIA'],
  '/app/usuarios': ['DIRETORIA'],
};

export function RequireRole({ children, path }: { children: React.ReactNode; path: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = routeRoles[path];
  if (allowed && !allowed.includes(user.setorAcesso)) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
}
