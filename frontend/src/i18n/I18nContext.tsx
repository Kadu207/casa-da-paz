import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ptBR } from './pt-BR';
import { en } from './en';
import { erpPtBR, type ErpTranslationKey } from './erp-pt-BR';
import { erpEn } from './erp-en';

export type Locale = 'pt-BR' | 'en';

export type TranslationKey = keyof typeof ptBR | ErpTranslationKey;

const STORAGE_KEY = 'casadapaz-locale';

const bundles: Record<Locale, Record<TranslationKey, string>> = {
  'pt-BR': { ...ptBR, ...erpPtBR },
  en: { ...en, ...erpEn },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  dateLocale: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'en' ? 'en' : 'pt-BR';
}

function applyDocumentLang(locale: Locale) {
  document.documentElement.lang = locale === 'en' ? 'en' : 'pt-BR';
}

function applyDocumentTitle(locale: Locale) {
  document.title = translate(locale, 'site.documentTitle');
}

function translate(locale: Locale, key: TranslationKey, vars?: Record<string, string | number>) {
  let text = bundles[locale][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window !== 'undefined' ? readStoredLocale() : 'pt-BR'
  );

  useEffect(() => {
    applyDocumentLang(locale);
    applyDocumentTitle(locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
    applyDocumentLang(l);
    applyDocumentTitle(l);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const dateLocale = locale === 'en' ? 'en-US' : 'pt-BR';

  const value = useMemo(() => ({ locale, setLocale, t, dateLocale }), [locale, setLocale, t, dateLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n outside I18nProvider');
  return ctx;
}
