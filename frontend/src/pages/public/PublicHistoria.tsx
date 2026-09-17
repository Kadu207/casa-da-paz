import { PublicLayout } from '../../components/public/PublicLayout';
import { useI18n } from '../../i18n/I18nContext';

/** Marcos fixos da Casa da Paz — texto longo editável via i18n `historia.body`. */
const MILESTONES = [
  { yearKey: 'historia.m1.year', titleKey: 'historia.m1.title', textKey: 'historia.m1.text' },
  { yearKey: 'historia.m2.year', titleKey: 'historia.m2.title', textKey: 'historia.m2.text' },
  { yearKey: 'historia.m3.year', titleKey: 'historia.m3.title', textKey: 'historia.m3.text' },
] as const;

export default function PublicHistoria() {
  const { t } = useI18n();

  return (
    <PublicLayout>
      <article className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">{t('historia.eyebrow')}</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">{t('historia.title')}</h1>
          <p className="mt-4 text-foreground/85 leading-relaxed">{t('historia.lead')}</p>
        </header>

        <ol className="mt-10 space-y-4">
          {MILESTONES.map((m) => (
            <li
              key={m.yearKey}
              className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80">{t(m.yearKey)}</p>
              <h2 className="mt-1 font-serif text-xl text-primary">{t(m.titleKey)}</h2>
              <p className="mt-2 text-foreground/85 leading-relaxed">{t(m.textKey)}</p>
            </li>
          ))}
        </ol>

        <section className="mt-12" aria-labelledby="historia-completa">
          <h2 id="historia-completa" className="font-serif text-2xl text-primary">
            {t('historia.bodyTitle')}
          </h2>
          <p className="mt-2 text-sm text-foreground/70">{t('historia.bodyHint')}</p>
          {/* Espaço reservado para a narrativa completa — editar `historia.body` em pt-BR.ts / en.ts */}
          <div className="mt-5 min-h-[16rem] rounded-2xl border border-dashed border-primary/30 bg-card/40 p-6 sm:p-8">
            <div className="text-foreground/85 leading-relaxed whitespace-pre-line">
              {t('historia.body')}
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
