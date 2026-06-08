import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage, buildSrcSet } from '../../components/public/SafeImage';
import { ADDRESS, portalAssets } from '../../lib/portal-assets';
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
      label: t('home.gallery.ervas'),
      w: 1024,
      h: 768,
      className: 'col-span-2 sm:col-span-2 aspect-[16/9] sm:aspect-auto',
      sizes: '(min-width: 640px) 66vw, 100vw',
    },
  ] as const;

  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS.query)}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS.query)}&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS.query)}`;
  const wazeHref = `https://www.waze.com/ul?ll=${ADDRESS.wazeCoords}&navigate=yes&q=${encodeURIComponent(ADDRESS.line1)}`;

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
        <div className="rounded-2xl border border-primary/25 overflow-hidden bg-card shadow-xl grid md:grid-cols-2">
          <div className="relative min-h-[200px] md:min-h-0">
            <SafeImage
              src={portalAssets.ervas}
              alt=""
              width={640}
              height={400}
              fallbackLabel={t('home.shop.title')}
              className="cover-fill"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/90 hidden md:block" />
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80">{t('nav.shop')}</p>
            <h2 className="mt-2 font-serif text-2xl text-primary">{t('home.shop.title')}</h2>
            <p className="mt-3 text-foreground/80 leading-relaxed">{t('home.shop.text')}</p>
            <Link
              to="/public/livraria"
              className="mt-5 min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 hover:bg-primary/90 transition-colors w-fit"
            >
              {t('home.cta.shop')}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-12">
        <div className="flex flex-col gap-3">
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
              <span className="absolute bottom-3 left-4 right-4 font-serif text-primary text-base sm:text-lg drop-shadow-lg">
                {it.label}
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
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
              >
                {t('home.map.directions')}
              </a>
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                {t('home.map.googleMaps')}
              </a>
              <a
                href={wazeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                {t('home.map.waze')}
              </a>
            </div>
          </div>
          <div className="aspect-[4/3] sm:aspect-[16/10] w-full bg-background">
            <iframe
              title={t('home.map.iframeTitle')}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
