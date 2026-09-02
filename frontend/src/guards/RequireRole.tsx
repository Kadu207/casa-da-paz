import { Navigate } from 'react-router-dom';
import { hasPermission, useAuth } from '../context/AuthContext';

const routeResources: Record<string, string> = {
  '/app/dashboard': 'dashboard',
  '/app/delegacoes': 'delegacoes',
  '/app/financeiro': 'financeiro',
  '/app/financeiro/pagamentos': 'contas_pagar',
  '/app/financeiro/contas-pagar': 'contas_pagar',
  '/app/financeiro/recorrencia': 'recorrencia',
  '/app/financeiro/contribuintes': 'contribuintes',
  '/app/financeiro/dre': 'dre',
  '/app/financeiro/ofx': 'conciliacao_bancaria',
  '/app/financeiro/contas': 'contas',
  '/app/financeiro/alertas': 'alertas',
  '/app/financeiro/cobrancas': 'cobrancas',
  '/app/financeiro/transparencia': 'transparencia',
  '/app/marketing': 'marketing',
  '/app/recepcao': 'eventos',
  '/app/eventos': 'eventos',
  '/app/pessoas': 'pessoas',
  '/app/livraria': 'livraria',
  '/app/estoque': 'estoque_casa',
  '/app/ecommerce': 'ecommerce',
  '/app/usuarios': 'usuarios',
  '/app/auditoria': 'auditoria',
  '/app/integracoes': 'integracoes',
};

export function RequireRole({ children, path }: { children: React.ReactNode; path: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.deveTrocarSenha && path !== '/app/minha-senha') {
    return <Navigate to="/app/minha-senha" replace />;
  }
  const resource = routeResources[path];
  if (resource && !hasPermission(user, resource, 'read')) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
}
