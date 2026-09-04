import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SafeImage } from '../components/public/SafeImage';
import { api } from '../lib/api';
import { parseVideoEmbed } from '../lib/video-embed';
import { useI18n } from '../i18n/I18nContext';
import { hasPermission, useAuth } from '../context/AuthContext';

type Tipo = 'FOTO' | 'VIDEO';

interface MidiaAlbum {
  id: number;
  nome: string;
  slug: string;
}

interface MidiaCard {
  id: number;
  tipo: Tipo;
  slug: string;
  titulo: string;
  descricao: string | null;
  imagemUrl: string | null;
  videoUrl: string | null;
  visibilidade: 'PUBLICO' | 'PRIVADO';
  embedUrl?: string | null;
  album?: MidiaAlbum | null;
}

export default function GaleriaPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const canPublish = hasPermission(user, 'marketing', 'write');
  const [itens, setItens] = useState<MidiaCard[]>([]);
  const [albuns, setAlbuns] = useState<MidiaAlbum[]>([]);
  const [filtro, setFiltro] = useState<Tipo | 'TODOS'>('TODOS');
  const [albumSlug, setAlbumSlug] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState<MidiaCard | null>(null);

  useEffect(() => {
    api<MidiaAlbum[]>('/galeria/albuns')
      .then(setAlbuns)
      .catch(() => setAlbuns([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = albumSlug !== 'TODOS' ? `?album=${encodeURIComponent(albumSlug)}` : '';
    api<MidiaCard[]>(`/galeria${qs}`)
      .then(setItens)
      .catch(() => setErro(t('erp.galeria.loadError')))
      .finally(() => setLoading(false));
  }, [t, albumSlug]);

  useEffect(() => {
    if (!slug) {
      setDetalhe(null);
      return;
    }
    api<MidiaCard>(`/galeria/${encodeURIComponent(slug)}`)
      .then(setDetalhe)
      .catch(() => setDetalhe(null));
  }, [slug]);

  const filtrados = useMemo(
    () => (filtro === 'TODOS' ? itens : itens.filter((i) => i.tipo === filtro)),
    [itens, filtro]
  );

  const embed =
    detalhe?.embedUrl ??
    (detalhe?.videoUrl ? parseVideoEmbed(detalhe.videoUrl)?.embedUrl : null);

  if (slug && detalhe) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Link to="/app/galeria" className="text-sm text-[var(--color-accent)] hover:underline">
          ← {t('erp.galeria.back')}
        </Link>
        <p className="text-xs uppercase tracking-wider text-white/50">
          {detalhe.tipo === 'VIDEO' ? t('erp.galeria.typeVideo') : t('erp.galeria.typePhoto')}
          {' · '}
          {detalhe.visibilidade === 'PRIVADO'
            ? t('erp.galeria.visibilityPrivate')
            : t('erp.galeria.visibilityPublic')}
          {detalhe.album ? ` · ${detalhe.album.nome}` : ''}
        </p>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{detalhe.titulo}</h2>
        {detalhe.descricao && <p className="text-sm text-white/70">{detalhe.descricao}</p>}
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
          {detalhe.tipo === 'VIDEO' && embed ? (
            <div className="aspect-video">
              <iframe
                title={detalhe.titulo}
                src={embed}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : detalhe.imagemUrl ? (
            <SafeImage
              src={detalhe.imagemUrl}
              alt=""
              width={1280}
              height={720}
              className="w-full max-h-[70vh] object-contain"
              fallbackLabel={detalhe.titulo}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.galeria.title')}</h2>
        <p className="text-sm text-white/70 mt-1">{t('erp.galeria.subtitle')}</p>
        {canPublish && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/app/marketing#galeria"
              className="min-h-10 inline-flex items-center px-4 rounded-lg bg-[var(--color-accent)] text-black text-sm font-medium"
            >
              {t('erp.marketing.galleryAddPhoto')}
            </Link>
            <Link
              to="/app/marketing#galeria"
              className="min-h-10 inline-flex items-center px-4 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] text-sm font-medium"
            >
              {t('erp.marketing.galleryAddVideo')}
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['TODOS', 'erp.galeria.filterAll'],
            ['FOTO', 'erp.galeria.filterPhoto'],
            ['VIDEO', 'erp.galeria.filterVideo'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFiltro(key)}
            className={`min-h-9 px-3 rounded-lg text-sm ${
              filtro === key
                ? 'bg-[var(--color-accent)] text-black'
                : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {albuns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAlbumSlug('TODOS')}
            className={`min-h-9 px-3 rounded-lg text-sm ${
              albumSlug === 'TODOS'
                ? 'bg-[var(--color-accent)] text-black'
                : 'border border-white/20 text-white/80 hover:bg-white/5'
            }`}
          >
            {t('erp.galeria.filterAlbumAll')}
          </button>
          {albuns.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAlbumSlug(a.slug)}
              className={`min-h-9 px-3 rounded-lg text-sm ${
                albumSlug === a.slug
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'border border-white/20 text-white/80 hover:bg-white/5'
              }`}
            >
              {a.nome}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-white/60 text-sm">{t('erp.galeria.loading')}</p>}
      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {!loading && !erro && filtrados.length === 0 && (
        <p className="text-white/60 text-sm">{t('erp.galeria.empty')}</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((m) => (
          <li key={m.id}>
            <Link
              to={`/app/galeria/${m.slug}`}
              className="block rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-[var(--color-accent)]/40 transition-colors"
            >
              <div className="aspect-video bg-black/30 relative">
                {m.imagemUrl ? (
                  <SafeImage
                    src={m.imagemUrl}
                    alt=""
                    width={480}
                    height={270}
                    className="w-full h-full object-cover"
                    fallbackLabel={m.titulo}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                    {m.tipo}
                  </div>
                )}
                {m.visibilidade === 'PRIVADO' && (
                  <span className="absolute top-2 left-2 text-[10px] uppercase bg-amber-500/90 text-black px-2 py-0.5 rounded">
                    {t('erp.galeria.visibilityPrivate')}
                  </span>
                )}
                {m.album && (
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
                    {m.album.nome}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm text-white/90 line-clamp-2">{m.titulo}</h3>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
