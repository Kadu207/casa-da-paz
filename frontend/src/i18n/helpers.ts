import type { TranslationKey } from './I18nContext';

export function labelEnum(
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
  group: string,
  value: string
): string {
  const key = `erp.enum.${group}.${value}` as TranslationKey;
  const out = t(key);
  return out === key ? value : out;
}

export function formatMoney(locale: string, value: number) {
  return value.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });
}

export function formatMoneyShort(locale: string, value: number) {
  return value.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}
