import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import type { ErpTranslationKey } from '../../i18n/erp-pt-BR';

const tabs: { to: string; labelKey: ErpTranslationKey; end?: boolean }[] = [
  { to: '/app/financeiro/lancamentos', labelKey: 'erp.financeiro.tab.lancamentos', end: true },
  { to: '/app/financeiro/fluxo', labelKey: 'erp.financeiro.tab.fluxo' },
  { to: '/app/financeiro/atrasados', labelKey: 'erp.financeiro.tab.atrasados' },
  { to: '/app/financeiro/conciliacao', labelKey: 'erp.financeiro.tab.conciliacao' },
];

export default function FinanceiroLayout() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.financeiro.title')}</h2>
      <nav className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-t text-sm ${
                isActive
                  ? 'bg-[var(--color-accent)] text-black font-medium'
                  : 'text-white/70 hover:bg-white/10'
              }`
            }
          >
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
