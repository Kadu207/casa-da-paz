import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { portalAssets, ADDRESS } from '../../lib/portal-assets';
import { useI18n } from '../../i18n/I18nContext';
import { NewsletterSignup } from './NewsletterSignup';

export function PublicLayout({
  children,
  showBack = true,
}: {
  children: ReactNode;
  showBack?: boolean;
}) {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="portal-root min-h-dvh flex flex-col bg-background text-foreground">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border/50 bg-background/85 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link
            to="/public"
            className="flex items-center gap-2 min-h-11 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Ir para a página inicial da Casa da Paz"
          >
            <img
              src={portalAssets.logo}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
            <span className="font-serif text-lg text-primary truncate">{t('home.title')}</span>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR')}
              className="text-xs text-foreground/70 hover:text-primary px-2 min-h-11"
            >
              {t('lang.switch')}
            </button>
            {showBack && (
              <Link
                to="/public"
                className="text-sm text-foreground/85 hover:text-primary min-h-11 px-2 flex items-center transition-colors"
              >
                ← {t('nav.home')}
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="conteudo" className="flex-1 w-full min-w-0">
        {children}
      </main>
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-foreground/80">
          <div className="mb-8 rounded-2xl bg-card/50 border border-border/40 p-5">
            <p className="font-serif text-primary text-base mb-2">{t('newsletter.title')}</p>
            <NewsletterSignup />
          </div>
          <div className="grid gap-6 sm:grid-cols-3 text-center sm:text-left">
            <div>
              <p className="font-serif text-primary text-base">Casa da Paz</p>
              <p className="mt-1 text-foreground/75">
                {ADDRESS.line1}
                <br />
                {ADDRESS.line2}
              </p>
            </div>
            <nav aria-label="Rodapé" className="space-y-1.5">
              <p className="font-serif text-primary text-base mb-1">Navegar</p>
              <Link to="/public" className="block hover:text-primary">
                {t('nav.home')}
              </Link>
              <Link to="/public/eventos" className="block hover:text-primary">
                {t('nav.events')}
              </Link>
              <Link to="/public/agendar" className="block hover:text-primary">
                {t('nav.schedule')}
              </Link>
              <Link to="/public/livraria" className="block hover:text-primary">
                {t('nav.shop')}
              </Link>
              <Link to="/public/contato" className="block hover:text-primary">
                {t('nav.contact')}
              </Link>
            </nav>
            <div className="space-y-1.5">
              <p className="font-serif text-primary text-base mb-1">{t('terms.link')}</p>
              <Link to="/public/termos" className="block hover:text-primary">
                {t('terms.link')}
              </Link>
              <Link to="/login" className="block hover:text-primary">
                {t('nav.internal')}
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-foreground/65">
            Comunidade de Terreiro Afro-Indígena · Tradição Umbanda · © {new Date().getFullYear()} Casa da Paz
          </p>
        </div>
      </footer>
    </div>
  );
}
