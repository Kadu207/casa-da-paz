import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';

interface LgpdConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export function LgpdConsentCheckbox({
  checked,
  onChange,
  id = 'aceite-lgpd',
  className = '',
}: LgpdConsentCheckboxProps) {
  const { t } = useI18n();

  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-2.5 text-xs text-foreground/80 cursor-pointer ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
      />
      <span>
        {t('lgpd.consentPrefix')}{' '}
        <Link to="/public/termos" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
          {t('terms.privacyLink')}
        </Link>
        {t('lgpd.consentSuffix')}
      </span>
    </label>
  );
}
