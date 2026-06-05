import { Navigate } from 'react-router-dom';
import { useAuth, type SetorAcesso } from '../context/AuthContext';

const routeRoles: Record<string, SetorAcesso[]> = {
  '/app/dashboard': ['DIRETORIA', 'FINANCEIRO', 'MEDIUM'],
  '/app/financeiro': ['DIRETORIA', 'FINANCEIRO'],
  '/app/recepcao': ['DIRETORIA', 'RECEPCAO'],
  '/app/eventos': ['DIRETORIA', 'RECEPCAO'],
  '/app/pessoas': ['DIRETORIA', 'RECEPCAO', 'FINANCEIRO', 'LIVRARIA', 'SUPORTE'],
  '/app/livraria': ['DIRETORIA', 'LIVRARIA'],
  '/app/ecommerce': ['DIRETORIA', 'LIVRARIA'],
  '/app/usuarios': ['DIRETORIA'],
  '/app/auditoria': ['DIRETORIA', 'SUPORTE'],
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
