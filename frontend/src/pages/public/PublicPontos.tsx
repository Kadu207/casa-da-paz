import { useEffect, useState } from 'react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

type SpotifyKind = 'playlist' | 'track' | 'album' | 'episode';

interface SpotifyItem {
  titulo: string;
  kind: SpotifyKind;
  embedUrl: string;
  url: string;
}

interface Ponto extends SpotifyItem {
  id: number;
  linha: string;
  letra: string | null;
  ordem: number;
}

interface PontosPayload {
  playlist: SpotifyItem | null;
  pontos: Ponto[];
}

function playerHeight(kind: SpotifyKind): number {
  return kind === 'track' ? 152 : 352;
}

export default function PublicPontos() {
  const { t } = useI18n();
  const [data, setData] = useState<PontosPayload | null>(null);
  const [erro, setErro] = useState('');
  const [atual, setAtual] = useState<SpotifyItem | null>(null);
  const [pontoId, setPontoId] = useState<number | null>(null);

  useEffect(() => {
    api<PontosPayload>('/public/pontos')
      .then((payload) => {
        setData(payload);
        setAtual(payload.playlist);
      })
      .catch(() => setErro(t('pontos.empty')));
  }, [t]);

  const temRepertorio = Boolean(data?.playlist || (data?.pontos.length ?? 0) > 0);
  const tocando = atual ?? data?.playlist ?? null;

  return (
    <PublicLayout>
      <section className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        <h1 className="font-serif text-3xl sm:text-4xl text-primary">{t('pontos.title')}</h1>
        <p className="mt-2 text-foreground/75">{t('pontos.subtitle')}</p>

        {erro || (data && !temRepertorio) ? (
          <p className="mt-8 text-foreground/80">{t('pontos.empty')}</p>
        ) : null}

        {data && temRepertorio && tocando ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="lg:sticky lg:top-20 self-start space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-primary/80">
                {pontoId ? t('pontos.playing') : t('pontos.playlist')}
              </p>
              <p className="font-serif text-xl text-primary">{tocando.titulo}</p>
              <iframe
                title={tocando.titulo}
                src={tocando.embedUrl}
                width="100%"
                height={playerHeight(tocando.kind)}
                style={{ borderRadius: 12 }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
              {pontoId ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {data.pontos.find((ponto) => ponto.id === pontoId)?.letra}
                </p>
              ) : null}
            </div>
            <ul className="space-y-3">
              <li className="font-serif text-lg text-primary">{t('pontos.list')}</li>
              {data.pontos.map((ponto) => {
                const selected = ponto.id === pontoId;
                return (
                  <li key={ponto.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPontoId(ponto.id);
                        setAtual(ponto);
                      }}
                      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                        selected ? 'border-primary bg-primary/10' : 'border-border/60 bg-card hover:border-primary/40'
                      }`}
                    >
                      <p className="font-serif text-lg text-primary">{ponto.titulo}</p>
                      <p className="text-sm text-foreground/70">{ponto.linha}</p>
                      <p className="mt-2 text-sm text-primary">{selected ? t('pontos.playing') : t('pontos.play')}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>
    </PublicLayout>
  );
}
