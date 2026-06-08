import { useI18n } from '../i18n/I18nContext';

/** Botão compacto PT ↔ EN — portal e ERP */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR')}
      className={className}
    >
      {t('lang.switch')}
    </button>
  );
}
