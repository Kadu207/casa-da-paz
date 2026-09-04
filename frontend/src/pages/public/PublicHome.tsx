import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage, buildSrcSet } from '../../components/public/SafeImage';
import { ADDRESS, portalAssets, portalMapLinks } from '../../lib/portal-assets';
import { useI18n } from '../../i18n/I18nContext';

export default function PublicHome() {
  const { t } = useI18n();

  const GALLERY = [
    {
      src: portalAssets.iemanja,
      label: t('home.gallery.iemanja'),
      w: 1024,
      h: 1024,
      className: 'sm:row-span-2 aspect-square sm:aspect-auto',
      sizes: '(min-width: 640px) 33vw, 50vw',
    },
    {
      src: portalAssets.pretoVelho,
      label: t('home.gallery.pretoVelho'),
      w: 1024,
      h: 768,
      className: 'aspect-square sm:aspect-auto',
      sizes: '(min-width: 640px) 33vw, 50vw',
    },
    {
      src: portalAssets.atabaque,
      label: t('home.gallery.atabaque'),
      w: 1024,
      h: 768,
      className: 'aspect-square sm:aspect-auto',
      sizes: '(min-width: 640px) 33vw, 50vw',
    },
    {
      src: portalAssets.ervas,
      label: t('home.cta.studies'),
      hint: t('home.gallery.ervasHint'),
      to: '/public/estudos',
      w: 1024,
      h: 768,
      className: 'col-span-2 sm:col-span-2 aspect-[16/9] sm:aspect-auto',
      sizes: '(min-width: 640px) 66vw, 100vw',
    },
  ] as const;

  const maps = portalMapLinks();
  /** Preferir embed OSM (CSP frame-src liberado); static só se o iframe falhar no ambiente. */
  const [mapUseEmbed, setMapUseEmbed] = useState(true);

  return (
    <PublicLayout showBack={false}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={portalAssets.hero}
            alt=""
            width={1280}
            height={800}
            loading="eager"
            fetchPriority="high"
            fallbackLabel={t('home.title')}
            className="cover-fill"
            srcSet={buildSrcSet(portalAssets.hero, [640, 960, 1280, 1920])}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/55 to-background" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 text-center">
          <img
            src={portalAssets.logo}
            alt={t('home.logoAlt')}
            width={140}
            height={140}
            className="mx-auto h-28 w-28 sm:h-32 sm:w-32 rounded-full shadow-2xl ring-1 ring-primary/30 object-cover"
          />
          <h1 className="mt-6 font-serif text-4xl sm:text-5xl text-primary">{t('home.title')}</h1>
          <p className="mt-6 text-base sm:text-lg text-foreground/85 max-w-xl mx-auto leading-relaxed">
            {t('home.subtitle')}
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-lg">
          <h2 className="font-serif text-2xl text-primary mb-3">{t('home.mission.title')}</h2>
          <p className="text-foreground/85 leading-relaxed">{t('home.mission.text')}</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-10">
        <Link
          to="/public/estudos"
          className="block rounded-2xl border border-primary/25 overflow-hidden bg-card shadow-xl grid md:grid-cols-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
        >
          <div className="relative min-h-[200px] md:min-h-0">
            <SafeImage
              src={portalAssets.ervas}
              alt=""
              width={640}
              height={400}
              fallbackLabel={t('home.cta.studies')}
              className="cover-fill transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/90 hidden md:block" />
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80">{t('nav.studies')}</p>
            <h2 className="mt-2 font-serif text-2xl text-primary">{t('home.cta.studies')}</h2>
            <p className="mt-3 text-foreground/80 leading-relaxed">{t('home.studies.text')}</p>
            <span className="mt-5 min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 w-fit">
              {t('home.cta.studiesOpen')}
            </span>
          </div>
        </Link>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-12">
        <div className="flex flex-col gap-3">
          <Link
            to="/public/galeria"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-border text-foreground font-medium px-6 py-3 hover:bg-card transition-colors"
          >
            {t('nav.gallery')}
          </Link>
          <Link
            to="/public/eventos"
            className="min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 transition-colors shadow"
          >
            {t('home.cta.events')}
          </Link>
          <Link
            to="/public/agendar"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-6 py-3 hover:bg-primary/10 transition-colors"
          >
            {t('home.cta.schedule')}
          </Link>
          <Link
            to="/public/livraria"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-6 py-3 hover:bg-primary/10 transition-colors"
          >
            {t('home.cta.shop')}
          </Link>
          <Link
            to="/public/contato"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-border text-foreground/90 font-medium px-6 py-3 hover:bg-card transition-colors"
          >
            {t('home.cta.contact')}
          </Link>
          <Link
            to="/login"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-6 py-3 hover:bg-primary/10 transition-colors"
          >
            {t('nav.internal')}
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">{t('home.tradition.eyebrow')}</p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">{t('home.tradition.title')}</h2>
          <p className="mt-3 text-foreground/80 leading-relaxed">{t('home.tradition.text')}</p>
        </div>

        <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 auto-rows-fr gap-3 sm:gap-4 sm:min-h-[520px]">
          {GALLERY.map((it) => (
            <li
              key={it.label}
              className={
                'group relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-xl ring-1 ring-primary/10 min-h-[140px] ' +
                it.className
              }
            >
              {'to' in it && it.to ? (
                <Link
                  to={it.to}
                  className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                  aria-label={`${it.label}. ${'hint' in it && it.hint ? it.hint : ''}`}
                />
              ) : null}
              <SafeImage
                src={it.src}
                alt={it.label}
                width={it.w}
                height={it.h}
                fallbackLabel={it.label}
                className="cover-fill transition-transform duration-700 group-hover:scale-110"
                srcSet={buildSrcSet(it.src, [320, 640, 960, 1280])}
                sizes={it.sizes}
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 via-background/40 to-transparent pointer-events-none" />
              <span className="absolute bottom-3 left-4 right-4 font-serif text-primary text-base sm:text-lg drop-shadow-lg pointer-events-none">
                {it.label}
                {'hint' in it && it.hint ? (
                  <span className="block text-xs font-sans font-normal text-primary/80 mt-0.5">
                    {it.hint}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-lg">
          <div className="p-6 sm:p-7">
            <h2 className="font-serif text-2xl text-primary">{t('home.map.title')}</h2>
            <p className="mt-2 text-foreground/85 leading-relaxed">
              {ADDRESS.line1}
              <br />
              {ADDRESS.line2}
              <br />
              <span className="text-foreground/70">CEP {ADDRESS.cep}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={maps.googleDirections}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
              >
                {t('home.map.directions')}
              </a>
              <a
                href={maps.googleSearch}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                {t('home.map.googleMaps')}
              </a>
              <a
                href={maps.waze}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                {t('home.map.waze')}
              </a>
            </div>
          </div>
          <div className="aspect-[4/3] sm:aspect-[16/10] w-full bg-background">
            {mapUseEmbed ? (
              <iframe
                title={t('home.map.iframeTitle')}
                src={maps.osmEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            ) : (
              <img
                src={maps.osmStatic}
                alt={t('home.map.staticAlt')}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover bg-background"
                onError={() => setMapUseEmbed(true)}
              />
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
