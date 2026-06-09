import { useI18n } from '../../i18n/I18nContext';
import { labelEnum } from '../../i18n/helpers';

export function AdimplenciaBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const colors: Record<string, string> = {
    PAGO: 'bg-[var(--color-success)]',
    EM_DIA: 'bg-emerald-600',
    ATRASADO: 'bg-[var(--color-danger)]',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs text-black ${colors[status] ?? 'bg-gray-500'}`}>
      {labelEnum(t, 'adimplencia', status)}
    </span>
  );
}
