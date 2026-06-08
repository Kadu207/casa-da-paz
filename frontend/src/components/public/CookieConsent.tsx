import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { COOKIE_CONSENT_KEY } from '../../lib/lgpd';

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    } catch {
      /* quota / private mode */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('lgpd.cookie.title')}
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto rounded-2xl border border-border/60 bg-card/95 backdrop-blur shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-foreground/85 flex-1 leading-relaxed">
          {t('lgpd.cookie.body')}{' '}
          <Link to="/public/termos" className="text-primary hover:underline whitespace-nowrap">
            {t('terms.privacyLink')}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 min-h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          {t('lgpd.cookie.accept')}
        </button>
      </div>
    </div>
  );
}
