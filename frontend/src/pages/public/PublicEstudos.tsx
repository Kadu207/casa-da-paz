import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import { api } from '../../lib/api';
import { portalAssets } from '../../lib/portal-assets';
import { useI18n } from '../../i18n/I18nContext';

type Categoria = 'ERVAS' | 'BANHOS' | 'DEFUMACAO' | 'OUTROS';

interface MaterialCard {
  id: number;
  slug: string;
  categoria: Categoria;
  titulo: string;
  resumo: string;
  imagemUrl: string | null;
}

const CATEGORIAS: Categoria[] = ['ERVAS', 'BANHOS', 'DEFUMACAO', 'OUTROS'];

export default function PublicEstudos() {
  const { t } = useI18n();
  const [itens, setItens] = useState<MaterialCard[]>([]);
  const [filtro, setFiltro] = useState<Categoria | 'TODOS'>('TODOS');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLoading(true);
    api<MaterialCard[]>('/public/materiais-estudo')
      .then(setItens)
      .catch(() => setErro(t('studies.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  const filtrados = useMemo(
    () => (filtro === 'TODOS' ? itens : itens.filter((i) => i.categoria === filtro)),
    [itens, filtro]
  );

  const labelCat = (c: Categoria) => t(`studies.cat.${c}` as 'studies.cat.ERVAS');

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={portalAssets.ervas}
            alt=""
            width={1280}
            height={640}
            loading="eager"
            className="cover-fill"
            fallbackLabel={t('studies.title')}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 pt-14 pb-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/90">{t('studies.eyebrow')}</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-primary">{t('studies.title')}</h1>
          <p className="mt-4 text-foreground/85 leading-relaxed max-w-xl mx-auto">{t('studies.subtitle')}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            type="button"
            onClick={() => setFiltro('TODOS')}
            className={`min-h-10 px-4 rounded-xl text-sm ${
              filtro === 'TODOS'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground/80 hover:bg-card'
            }`}
          >
            {t('studies.filterAll')}
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFiltro(c)}
              className={`min-h-10 px-4 rounded-xl text-sm ${
                filtro === c
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-foreground/80 hover:bg-card'
              }`}
            >
              {labelCat(c)}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-foreground/60">{t('studies.loading')}</p>}
        {erro && <p className="text-center text-destructive text-sm">{erro}</p>}

        {!loading && !erro && filtrados.length === 0 && (
          <p className="text-center text-foreground/60">{t('studies.empty')}</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {filtrados.map((m) => (
            <li key={m.id}>
              <Link
                to={`/public/estudos/${m.slug}`}
                className="block h-full rounded-2xl border border-border/60 bg-card overflow-hidden shadow hover:border-primary/40 transition-colors"
              >
                {m.imagemUrl ? (
                  <SafeImage
                    src={m.imagemUrl}
                    alt=""
                    width={640}
                    height={360}
                    className="w-full h-36 object-cover"
                    fallbackLabel={m.titulo}
                  />
                ) : (
                  <div className="h-36 bg-primary/10 flex items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-primary/70">
                      {labelCat(m.categoria)}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wider text-primary/70">{labelCat(m.categoria)}</p>
                  <h2 className="mt-1 font-serif text-xl text-primary">{m.titulo}</h2>
                  <p className="mt-2 text-sm text-foreground/75 leading-relaxed line-clamp-3">{m.resumo}</p>
                  <span className="mt-3 inline-block text-sm text-primary font-medium">
                    {t('studies.readMore')} →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PublicLayout>
  );
}
