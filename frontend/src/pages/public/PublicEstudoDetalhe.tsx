import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

type Categoria = 'ERVAS' | 'BANHOS' | 'DEFUMACAO' | 'OUTROS';

interface Material {
  id: number;
  slug: string;
  categoria: Categoria;
  titulo: string;
  resumo: string;
  corpo: string;
  imagemUrl: string | null;
  updatedAt: string;
}

export default function PublicEstudoDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const { t, dateLocale } = useI18n();
  const [item, setItem] = useState<Material | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api<Material>(`/public/materiais-estudo/${encodeURIComponent(slug)}`)
      .then(setItem)
      .catch(() => setErro(t('studies.notFound')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  return (
    <PublicLayout>
      <article className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/public/estudos" className="text-sm text-primary hover:underline">
          ← {t('studies.back')}
        </Link>

        {loading && <p className="mt-8 text-foreground/60">{t('studies.loading')}</p>}
        {erro && <p className="mt-8 text-destructive">{erro}</p>}

        {item && (
          <>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary/80">
              {t(`studies.cat.${item.categoria}` as 'studies.cat.ERVAS')}
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">{item.titulo}</h1>
            <p className="mt-3 text-foreground/80 leading-relaxed">{item.resumo}</p>
            <p className="mt-2 text-xs text-foreground/50">
              {t('studies.updated', {
                date: new Date(item.updatedAt).toLocaleDateString(dateLocale),
              })}
            </p>

            {item.imagemUrl && (
              <div className="mt-6 rounded-2xl overflow-hidden border border-border/50">
                <SafeImage
                  src={item.imagemUrl}
                  alt=""
                  width={960}
                  height={540}
                  className="w-full max-h-80 object-cover"
                  fallbackLabel={item.titulo}
                />
              </div>
            )}

            <div className="mt-8 prose prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {item.corpo}
            </div>
          </>
        )}
      </article>
    </PublicLayout>
  );
}
