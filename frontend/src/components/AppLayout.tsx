import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav: { path: string; label: string; roles: string[] }[] = [
  { path: '/app/dashboard', label: 'Dashboard', roles: ['DIRETORIA', 'FINANCEIRO', 'MEDIUM'] },
  { path: '/app/financeiro', label: 'Financeiro', roles: ['DIRETORIA', 'FINANCEIRO'] },
  { path: '/app/recepcao', label: 'Recepção', roles: ['DIRETORIA', 'RECEPCAO'] },
  { path: '/app/livraria', label: 'Livraria', roles: ['DIRETORIA', 'LIVRARIA'] },
  { path: '/app/usuarios', label: 'Usuários', roles: ['DIRETORIA'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-56 bg-[var(--color-surface)] p-4 flex md:flex-col gap-2">
        <h1 className="text-[var(--color-accent)] font-serif text-lg mb-4">Casa da Paz</h1>
        {nav
          .filter((n) => user && n.roles.includes(user.setorAcesso))
          .map((n) => (
            <Link
              key={n.path}
              to={n.path}
              className={`px-3 py-2 rounded text-sm ${
                location.pathname === n.path ? 'bg-[var(--color-accent)] text-black' : 'hover:bg-white/10'
              }`}
            >
              {n.label}
            </Link>
          ))}
        <button onClick={logout} className="mt-auto text-sm text-left px-3 py-2 hover:bg-white/10 rounded">
          Sair
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
