import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ptBR, type TranslationKey } from './pt-BR';
import { en } from './en';

export type Locale = 'pt-BR' | 'en';

const STORAGE_KEY = 'casadapaz-locale';

const bundles: Record<Locale, Record<TranslationKey, string>> = { 'pt-BR': ptBR, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'en' ? 'en' : 'pt-BR';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window !== 'undefined' ? readStoredLocale() : 'pt-BR'
  );

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
    document.documentElement.lang = l === 'en' ? 'en' : 'pt-BR';
  }, []);

  const t = useCallback((key: TranslationKey) => bundles[locale][key] ?? key, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n outside I18nProvider');
  return ctx;
}
