import type { ReactNode } from 'react';
import { portalAssets } from '../lib/portal-assets';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SolidScreenLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
}

/** Layout com imagem espiritual em primeiro plano + painel de conteúdo (login, senha, etc.). */
export function SolidScreenLayout({
  children,
  title,
  subtitle,
  imageSrc = portalAssets.velasAltar,
  imageAlt,
}: SolidScreenLayoutProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh w-full bg-[var(--color-bg)] text-white flex flex-col md:flex-row">
      <div className="relative md:w-[42%] lg:w-[45%] min-h-[220px] md:min-h-dvh shrink-0 overflow-hidden">
        <img
          src={imageSrc}
          alt={imageAlt ?? t('erp.layout.imageAlt')}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[var(--color-bg)] via-[var(--color-bg)]/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end md:justify-center h-full p-6 sm:p-10">
          <img
            src={portalAssets.logo}
            alt=""
            width={72}
            height={72}
            className="h-16 w-16 rounded-full ring-2 ring-[var(--color-accent)]/40 object-cover mb-4 hidden md:block"
          />
          <p className="font-serif text-2xl sm:text-3xl text-[var(--color-accent)]">{t('erp.layout.tagline')}</p>
          <p className="mt-2 text-sm sm:text-base text-white/75 max-w-sm leading-relaxed">{t('erp.layout.hero')}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-serif text-[var(--color-accent)]">{title ?? t('home.title')}</h1>
              {subtitle && <p className="text-sm text-white/70 mt-1">{subtitle}</p>}
            </div>
            <LanguageSwitcher className="text-xs text-white/70 hover:text-[var(--color-accent)] px-2 min-h-11 shrink-0" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
