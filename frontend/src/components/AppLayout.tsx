import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth, hasPermission } from '../context/AuthContext';
import { portalAssets } from '../lib/portal-assets';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { ErpTranslationKey } from '../i18n/erp-pt-BR';

const nav: { path: string; labelKey: ErpTranslationKey; resource?: string }[] = [
  { path: '/app/dashboard', labelKey: 'erp.nav.dashboard', resource: 'dashboard' },
  { path: '/app/delegacoes', labelKey: 'erp.nav.delegacoes', resource: 'delegacoes' },
  { path: '/app/galeria', labelKey: 'erp.nav.galeria' },
  { path: '/app/financeiro', labelKey: 'erp.nav.financeiro', resource: 'financeiro' },
  { path: '/app/marketing', labelKey: 'erp.nav.marketing', resource: 'marketing' },
  { path: '/app/recepcao', labelKey: 'erp.nav.recepcao', resource: 'eventos' },
  { path: '/app/eventos', labelKey: 'erp.nav.eventos', resource: 'eventos' },
  { path: '/app/pessoas', labelKey: 'erp.nav.pessoas', resource: 'pessoas' },
  { path: '/app/livraria', labelKey: 'erp.nav.livraria', resource: 'livraria' },
  { path: '/app/estoque', labelKey: 'erp.nav.estoque', resource: 'estoque_casa' },
  { path: '/app/ecommerce', labelKey: 'erp.nav.ecommerce', resource: 'ecommerce' },
  { path: '/app/usuarios', labelKey: 'erp.nav.usuarios', resource: 'usuarios' },
  { path: '/app/auditoria', labelKey: 'erp.nav.auditoria', resource: 'auditoria' },
  { path: '/app/integracoes', labelKey: 'erp.nav.integracoes', resource: 'integracoes' },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [atrasadas, setAtrasadas] = useState(0);

  useEffect(() => {
    if (!user || !hasPermission(user, 'delegacoes', 'read')) return;
    let cancelled = false;
    api<{ atrasadas: number }>('/delegacoes/resumo')
      .then((r) => {
        if (!cancelled) setAtrasadas(r.atrasadas ?? 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  return (
    <>
      {nav
        .filter((n) => user && (!n.resource || hasPermission(user, n.resource, 'read')))
        .map((n) => (
          <Link
            key={n.path}
            to={n.path}
            onClick={onNavigate}
            className={`block px-3 py-2.5 rounded text-sm ${
              location.pathname === n.path || location.pathname.startsWith(`${n.path}/`)
                ? 'bg-[var(--color-accent)] text-black'
                : 'hover:bg-white/10'
            }`}
          >
            {t(n.labelKey)}
            {n.path === '/app/delegacoes' && atrasadas > 0 ? (
              <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-red-500/80 text-white text-[10px] px-1.5 py-0.5">
                {atrasadas}
              </span>
            ) : null}
          </Link>
        ))}
    </>
  );
}

export default function AppLayout() {
  const { logout } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell flex flex-col md:flex-row">
      <header className="md:hidden relative z-[60] shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-surface)] border-b border-white/10">
        <span className="text-[var(--color-accent)] font-serif text-lg">{t('home.title')}</span>
        <div className="flex items-center gap-1">
          <LanguageSwitcher className="text-xs text-white/70 hover:text-[var(--color-accent)] px-2 min-h-11" />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="app-nav"
            aria-label={menuOpen ? t('erp.app.closeMenu') : t('erp.app.openMenu')}
            onClick={() => setMenuOpen((o) => !o)}
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-white/20 text-lg"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <button
        type="button"
        aria-label={t('erp.app.closeMenu')}
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
        className={`md:hidden fixed inset-0 z-40 h-dvh bg-black/50 transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        id="app-nav"
        className={`fixed top-0 left-0 z-[55] flex h-dvh w-64 max-w-[85vw] flex-col gap-1 p-4 pt-[4.25rem] bg-[var(--color-surface)] border-r border-white/10 transition-transform duration-300 ease-in-out md:static md:z-auto md:flex md:h-auto md:w-56 md:max-w-none md:min-h-dvh md:shrink-0 md:pt-4 md:translate-x-0 md:border-b-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="hidden md:flex items-center justify-between gap-2 mb-3">
          <h1 className="text-[var(--color-accent)] font-serif text-lg">{t('home.title')}</h1>
          <LanguageSwitcher className="text-xs text-white/70 hover:text-[var(--color-accent)] px-1" />
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto min-h-0 flex-1">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <Link
            to="/app/minha-senha"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded text-sm hover:bg-white/10 text-white/80"
          >
            {t('erp.app.changePassword')}
          </Link>
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-4 md:mt-auto shrink-0 text-sm text-left px-3 py-2.5 hover:bg-white/10 rounded"
        >
          {t('erp.app.logout')}
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
