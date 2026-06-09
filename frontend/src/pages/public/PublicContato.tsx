import { PublicLayout } from '../../components/public/PublicLayout';
import { isChatwootConfigured } from '../../components/public/ChatwootWidget';
import { SafeImage } from '../../components/public/SafeImage';
import { ADDRESS, WHATSAPP_NUMBER, portalAssets } from '../../lib/portal-assets';
import { useI18n } from '../../i18n/I18nContext';
import { DPO_EMAIL, DATA_PROTECTION_CONTACTS, formatContactList, whatsappDsarUrl } from '../../lib/lgpd-contact';
import { Link } from 'react-router-dom';

export default function PublicContato() {
  const { t, locale } = useI18n();

  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('contact.whatsapp.prefill'))}`;
  const waDsar = whatsappDsarUrl(locale);

  return (
    <PublicLayout>
      <section className="relative h-40 sm:h-52 overflow-hidden">
        <SafeImage
          src={portalAssets.bannerLandscape}
          alt=""
          width={1536}
          height={768}
          fallbackLabel={t('contact.title')}
          className="cover-fill"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 pb-5">
            <h1 className="font-serif text-3xl sm:text-4xl text-primary">{t('contact.title')}</h1>
            <p className="text-foreground/75 text-sm mt-1">{t('contact.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-primary text-primary-foreground p-5 sm:p-6 shadow-lg hover:bg-primary/90 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/15 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <p className="font-serif text-xl">WhatsApp</p>
              <p className="text-sm opacity-90">{t('contact.whatsapp.hint')}</p>
            </div>
          </div>
        </a>

        <a
          href="https://instagram.com/umbandacasadapaz"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-card border border-border/60 p-5 sm:p-6 hover:border-primary/40 transition-colors"
        >
          <p className="font-serif text-lg text-primary">Instagram</p>
          <p className="text-foreground/80">@umbandacasadapaz</p>
        </a>

        <a
          href="mailto:terreirocasadapaz@gmail.com"
          className="block rounded-2xl bg-card border border-border/60 p-5 sm:p-6 hover:border-primary/40 transition-colors"
        >
          <p className="font-serif text-lg text-primary">E-mail</p>
          <p className="text-foreground/80">{DPO_EMAIL}</p>
        </a>

        <div className="rounded-2xl bg-card border border-primary/30 p-5 sm:p-6 space-y-3">
          <p className="font-serif text-lg text-primary">{t('contact.privacy.title')}</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{t('contact.privacy.body')}</p>
          <p className="text-sm text-foreground/70">
            <span className="font-medium text-foreground/85">
              {formatContactList(DATA_PROTECTION_CONTACTS, locale)}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`mailto:${DPO_EMAIL}?subject=${encodeURIComponent(locale === 'en' ? 'LGPD request' : 'Solicitação LGPD')}`}
              className="text-sm text-primary hover:underline"
            >
              {DPO_EMAIL}
            </a>
            <span className="text-foreground/40">·</span>
            <a href={waDsar} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              {t('contact.privacy.whatsapp')}
            </a>
            <span className="text-foreground/40">·</span>
            <Link to="/public/termos" className="text-sm text-primary hover:underline">
              {t('terms.privacyLink')}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-6">
          <p className="font-serif text-lg text-primary mb-2">{t('contact.where')}</p>
          <p className="text-foreground/85">
            {ADDRESS.line1}
            <br />
            {ADDRESS.line2}
          </p>
        </div>

        {isChatwootConfigured() ? (
          <p className="text-xs text-foreground/55 text-center">{t('contact.chat.online')}</p>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-5 sm:p-6 text-sm text-foreground/55 text-center">
            {t('contact.chat.soon')}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
