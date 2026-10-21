import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import {
  CAMPOS_FICHA,
  ervasVizinhas,
  getErvaBySlug,
} from '../../data/enciclopedia-ervas';
import { safeHref } from '../../lib/safe-url';
import { useI18n } from '../../i18n/I18nContext';
import { campoKey, classeKey, pillClass, segurancaKey } from './erva-labels';

export default function PublicErvaDetalhe() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const erva = getErvaBySlug(slug);
  const { anterior, proxima } = ervasVizinhas(slug);

  return (
    <PublicLayout>
      <article className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/public/ervas#catalogo" className="text-sm text-primary hover:underline">
          ← {t('herbs.back')}
        </Link>

        {!erva && <p className="mt-8 text-destructive">{t('herbs.notFound')}</p>}

        {erva && (
          <>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary/80">
              {t('herbs.sheet', { n: String(erva.numero).padStart(3, '0') })}
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">{erva.nome}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${pillClass(erva.seguranca)}`}>
                {t(segurancaKey(erva.seguranca))}
              </span>
              {classeKey(erva.classificacao) && (
                <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-foreground/80">
                  {t(classeKey(erva.classificacao)!)}
                </span>
              )}
            </div>

            <figure className="mt-6">
              <div className="rounded-2xl overflow-hidden border border-border/60 bg-card">
                <SafeImage
                  src={erva.imagem}
                  alt={t('herbs.illustrationAlt', { name: erva.nome })}
                  width={1280}
                  height={960}
                  className={`w-full max-h-[28rem] bg-card ${
                    erva.credito?.tipo === 'fotografia' ? 'object-cover' : 'object-contain'
                  }`}
                  fallbackLabel={erva.nome}
                />
              </div>
              <figcaption className="mt-2 text-xs text-foreground/70 leading-relaxed">
                {erva.credito?.tipo === 'fotografia' ? (
                  <>
                    {t('herbs.photoBy', { author: erva.credito.autor })}
                    {' · '}
                    {erva.credito.licencaUrl && safeHref(erva.credito.licencaUrl) ? (
                      <a
                        href={safeHref(erva.credito.licencaUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {erva.credito.licenca}
                      </a>
                    ) : (
                      erva.credito.licenca
                    )}
                    {safeHref(erva.credito.fonte) ? (
                      <>
                        {' · '}
                        <a
                          href={safeHref(erva.credito.fonte)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t('herbs.photoSource')}
                        </a>
                      </>
                    ) : null}
                    <span className="block mt-1 text-foreground/60">{t('herbs.illustrationNote')}</span>
                    {erva.credito.nota ? (
                      <span className="block mt-1 text-foreground/70">{erva.credito.nota}</span>
                    ) : null}
                  </>
                ) : (
                  t('herbs.illustrationNote')
                )}
              </figcaption>
            </figure>

            <dl className="mt-8 space-y-4">
              {CAMPOS_FICHA.map((campo) => {
                const valor = erva.campos[campo];
                const labelKey = campoKey(campo);
                if (!valor || !labelKey) return null;
                const botanico = campo === 'Identificação botânica de referência';
                return (
                  <div key={campo} className="rounded-2xl border border-border/60 bg-card px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.14em] text-primary/75">{t(labelKey)}</dt>
                    <dd className={`mt-1 text-foreground/90 leading-relaxed ${botanico ? 'italic' : ''}`}>
                      {valor}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <section
              className={`mt-6 rounded-2xl border p-4 sm:p-5 ${
                erva.seguranca === 'atencao'
                  ? 'border-destructive/40 bg-destructive/10'
                  : 'border-primary/25 bg-card'
              }`}
              aria-labelledby="cuidados-erva"
            >
              <h2 id="cuidados-erva" className="font-serif text-xl text-primary">
                {t('herbs.care')}
              </h2>
              <p className="mt-2 text-foreground/90 leading-relaxed">{erva.cuidados}</p>
            </section>

            <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label={t('herbs.neighbors')}>
              {anterior ? (
                <Link
                  to={`/public/ervas/${anterior.slug}`}
                  className="rounded-xl border border-border px-4 py-3 hover:border-primary/40"
                >
                  <span className="block text-xs text-foreground/60">{t('herbs.prev')}</span>
                  <span className="font-serif text-primary">{anterior.nome}</span>
                </Link>
              ) : (
                <span />
              )}
              {proxima && (
                <Link
                  to={`/public/ervas/${proxima.slug}`}
                  className="rounded-xl border border-border px-4 py-3 hover:border-primary/40 sm:text-right"
                >
                  <span className="block text-xs text-foreground/60">{t('herbs.next')}</span>
                  <span className="font-serif text-primary">{proxima.nome}</span>
                </Link>
              )}
            </nav>
          </>
        )}
      </article>
    </PublicLayout>
  );
}
