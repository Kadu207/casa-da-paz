import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portalAssets } from '../lib/portal-assets';

const nav: { path: string; label: string; roles: string[] }[] = [
  { path: '/app/dashboard', label: 'Dashboard', roles: ['DIRETORIA', 'FINANCEIRO', 'MEDIUM'] },
  { path: '/app/financeiro', label: 'Financeiro', roles: ['DIRETORIA', 'FINANCEIRO'] },
  { path: '/app/recepcao', label: 'Recepção', roles: ['DIRETORIA', 'RECEPCAO'] },
  { path: '/app/eventos', label: 'Eventos', roles: ['DIRETORIA', 'RECEPCAO'] },
  {
    path: '/app/pessoas',
    label: 'Pessoas',
    roles: ['DIRETORIA', 'RECEPCAO', 'FINANCEIRO', 'LIVRARIA', 'SUPORTE'],
  },
  { path: '/app/livraria', label: 'Livraria', roles: ['DIRETORIA', 'LIVRARIA'] },
  { path: '/app/ecommerce', label: 'E-commerce', roles: ['DIRETORIA', 'LIVRARIA'] },
  { path: '/app/usuarios', label: 'Usuários', roles: ['DIRETORIA'] },
  { path: '/app/auditoria', label: 'Auditoria', roles: ['DIRETORIA', 'SUPORTE'] },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      {nav
        .filter((n) => user && n.roles.includes(user.setorAcesso))
        .map((n) => (
          <Link
            key={n.path}
            to={n.path}
            onClick={onNavigate}
            className={`block px-3 py-2.5 rounded text-sm ${
              location.pathname === n.path ? 'bg-[var(--color-accent)] text-black' : 'hover:bg-white/10'
            }`}
          >
            {n.label}
          </Link>
        ))}
    </>
  );
}

export default function AppLayout() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell flex flex-col md:flex-row">
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-surface)] border-b border-white/10">
        <span className="text-[var(--color-accent)] font-serif text-lg">Casa da Paz</span>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="app-nav"
          onClick={() => setMenuOpen((o) => !o)}
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-white/20 text-lg"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      <aside
        id="app-nav"
        className={`${
          menuOpen ? 'flex' : 'hidden'
        } md:flex shrink-0 w-full md:w-56 flex-col gap-1 p-4 bg-[var(--color-surface)] md:min-h-dvh border-b md:border-b-0 md:border-r border-white/10`}
      >
        <h1 className="hidden md:block text-[var(--color-accent)] font-serif text-lg mb-3">Casa da Paz</h1>
        <nav className="flex flex-col gap-1">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <Link
            to="/app/minha-senha"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded text-sm hover:bg-white/10 text-white/80"
          >
            Alterar senha
          </Link>
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-4 md:mt-auto text-sm text-left px-3 py-2.5 hover:bg-white/10 rounded"
        >
          Sair
        </button>
      </aside>

      <main className="app-main relative p-4 sm:p-6 md:p-8 flex-1 min-w-0">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-0 md:w-[28%] lg:w-[32%] overflow-hidden hidden md:block"
          aria-hidden
        >
          <img
            src={portalAssets.pretoVelho}
            alt=""
            className="h-full w-full object-cover opacity-[0.18]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[var(--color-bg)]" />
        </div>
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
