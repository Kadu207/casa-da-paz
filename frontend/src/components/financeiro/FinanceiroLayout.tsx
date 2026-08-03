import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { hasPermission, useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import type { ErpTranslationKey } from '../../i18n/erp-pt-BR';

const tabs: {
  to: string;
  labelKey: ErpTranslationKey;
  end?: boolean;
  showPendingBadge?: boolean;
  resource?: string;
}[] = [
  { to: '/app/financeiro/lancamentos', labelKey: 'erp.financeiro.tab.lancamentos', end: true },
  { to: '/app/financeiro/fluxo', labelKey: 'erp.financeiro.tab.fluxo' },
  { to: '/app/financeiro/atrasados', labelKey: 'erp.financeiro.tab.atrasados' },
  { to: '/app/financeiro/conciliacao', labelKey: 'erp.financeiro.tab.conciliacao' },
  { to: '/app/financeiro/contas', labelKey: 'erp.financeiro.tab.contas', resource: 'contas' },
  { to: '/app/financeiro/cobrancas', labelKey: 'erp.financeiro.tab.cobrancas', resource: 'cobrancas' },
  { to: '/app/financeiro/transparencia', labelKey: 'erp.financeiro.tab.transparencia', resource: 'transparencia' },
  { to: '/app/financeiro/alertas', labelKey: 'erp.financeiro.tab.alertas', showPendingBadge: true, resource: 'alertas' },
];

export default function FinanceiroLayout() {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const [pendingAlertas, setPendingAlertas] = useState(0);

  const canReadAlertas = hasPermission(user, 'alertas', 'read');
  const visibleTabs = tabs.filter((tab) => !tab.resource || hasPermission(user, tab.resource, 'read'));

  const loadPendingAlertas = useCallback(async () => {
    if (!canReadAlertas) {
      setPendingAlertas(0);
      return;
    }
    try {
      const res = await api<{ total: number }>('/alertas?disparado=false&limit=1&page=1');
      setPendingAlertas(res.total);
    } catch {
      setPendingAlertas(0);
    }
  }, [canReadAlertas]);

  useEffect(() => {
    loadPendingAlertas();
  }, [loadPendingAlertas, location.pathname]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.financeiro.title')}</h2>
      <nav className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-2 rounded-t text-sm ${
                isActive
                  ? 'bg-[var(--color-accent)] text-black font-medium'
                  : 'text-white/70 hover:bg-white/10'
              }`
            }
          >
            {t(tab.labelKey)}
            {tab.showPendingBadge && pendingAlertas > 0 && (
              <span
                className="min-w-[1.25rem] h-5 px-1 rounded-full bg-[var(--color-danger)] text-white text-xs font-semibold inline-flex items-center justify-center"
                aria-label={t('erp.alertas.pendingBadge', { count: pendingAlertas })}
              >
                {pendingAlertas > 99 ? '99+' : pendingAlertas}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
