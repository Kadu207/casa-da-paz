import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { hasPermission, useAuth } from '../context/AuthContext';
import { MediaUploadPanel } from '../components/MediaUploadPanel';
import { parseVideoEmbed } from '../lib/video-embed';

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  status: string;
  tipo?: string;
  capacidadeMax: number | null;
  _count: { inscricoes: number };
}

interface Produto {
  id: number;
  nome: string;
  tipo: string;
  preco: string;
  estoqueAtual: number;
  publicadoEcommerce: boolean;
  descricaoEcommerce: string | null;
}

interface Conteudo {
  id: number;
  tipo: string;
  titulo: string;
  publicado: boolean;
  produto?: { id: number; nome: string } | null;
}

type CategoriaEstudo = 'ERVAS' | 'BANHOS' | 'DEFUMACAO' | 'OUTROS';

interface MaterialEstudo {
  id: number;
  slug: string;
  categoria: CategoriaEstudo;
  titulo: string;
  resumo: string;
  corpo: string;
  imagemUrl: string | null;
  ordem: number;
  publicado: boolean;
}

type TipoMidia = 'FOTO' | 'VIDEO';
type VisibilidadeMidia = 'PUBLICO' | 'PRIVADO';
type StatusMidia = 'RASCUNHO' | 'PUBLICADO';

interface MidiaAlbum {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ano?: number | null;
  ordem?: number;
  ativo?: boolean;
}

interface MidiaPublicacao {
  id: number;
  tipo: TipoMidia;
  titulo: string;
  descricao: string | null;
  slug: string;
  imagemUrl: string | null;
  videoUrl: string | null;
  visibilidade: VisibilidadeMidia;
  status: StatusMidia;
  publicadoEm: string | null;
  albumId: number | null;
  album?: MidiaAlbum | null;
  ordem: number;
}

const CATEGORIAS: CategoriaEstudo[] = ['ERVAS', 'BANHOS', 'DEFUMACAO', 'OUTROS'];

const emptyMaterial = {
  categoria: 'ERVAS' as CategoriaEstudo,
  titulo: '',
  resumo: '',
  corpo: '',
  imagemUrl: '',
  ordem: '0',
  publicado: false,
};

const emptyMidia = {
  tipo: 'FOTO' as TipoMidia,
  titulo: '',
  descricao: '',
  imagemUrl: '',
  videoUrl: '',
  visibilidade: 'PUBLICO' as VisibilidadeMidia,
  status: 'RASCUNHO' as StatusMidia,
  publicadoEm: '',
  albumId: '',
  ordem: '0',
};

export default function MarketingPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'marketing', 'write');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [materiais, setMateriais] = useState<MaterialEstudo[]>([]);
  const [midias, setMidias] = useState<MidiaPublicacao[]>([]);
  const [albuns, setAlbuns] = useState<MidiaAlbum[]>([]);
  const [novoAlbumNome, setNovoAlbumNome] = useState('');
  const [resumo, setResumo] = useState<{
    eventosAbertos: number;
    produtosPublicados: number;
    conteudosPublicados: number;
    materiaisEstudoPublicados?: number;
  } | null>(null);
  const [nomeEvento, setNomeEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [tipoEvento, setTipoEvento] = useState<'GIRA' | 'OFICINA'>('GIRA');
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [editMaterialId, setEditMaterialId] = useState<number | null>(null);
  const [materialErro, setMaterialErro] = useState('');
  const [midiaForm, setMidiaForm] = useState(emptyMidia);
  const [editMidiaId, setEditMidiaId] = useState<number | null>(null);
  const [midiaErro, setMidiaErro] = useState('');
  const [showMidiaForm, setShowMidiaForm] = useState(false);

  const load = useCallback(async () => {
    const [r, e, p, c, m, g, a] = await Promise.all([
      api<typeof resumo>('/marketing/resumo'),
      api<Evento[]>('/marketing/eventos'),
      api<Produto[]>('/marketing/produtos'),
      api<Conteudo[]>('/marketing/conteudos'),
      api<MaterialEstudo[]>('/marketing/materiais-estudo'),
      api<MidiaPublicacao[]>('/marketing/galeria'),
      api<MidiaAlbum[]>('/marketing/galeria/albuns'),
    ]);
    setResumo(r);
    setEventos(e);
    setProdutos(p);
    setConteudos(c);
    setMateriais(m);
    setMidias(g);
    setAlbuns(a);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const criarEvento = async (ev: React.FormEvent) => {
    ev.preventDefault();
    await api('/marketing/eventos', {
      method: 'POST',
      body: JSON.stringify({ nomeEvento, dataEvento, tipo: tipoEvento }),
    });
    setNomeEvento('');
    setDataEvento('');
    setTipoEvento('GIRA');
    await load();
  };

  const toggleEvento = async (id: number, status: string) => {
    await api(`/marketing/eventos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status === 'ABERTO' ? 'ENCERRADO' : 'ABERTO' }),
    });
    await load();
  };

  const toggleProduto = async (id: number, publicado: boolean) => {
    await api(`/marketing/produtos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ publicadoEcommerce: !publicado }),
    });
    await load();
  };

  const toggleConteudo = async (id: number, publicado: boolean) => {
    await api(`/marketing/conteudos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ publicado: !publicado }),
    });
    await load();
  };

  const salvarMaterial = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setMaterialErro('');
    const payload = {
      categoria: materialForm.categoria,
      titulo: materialForm.titulo.trim(),
      resumo: materialForm.resumo.trim(),
      corpo: materialForm.corpo.trim(),
      imagemUrl: materialForm.imagemUrl.trim() || null,
      ordem: Number(materialForm.ordem) || 0,
      publicado: materialForm.publicado,
    };
    try {
      if (editMaterialId) {
        await api(`/marketing/materiais-estudo/${editMaterialId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/marketing/materiais-estudo', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setMaterialForm(emptyMaterial);
      setEditMaterialId(null);
      await load();
    } catch (err) {
      setMaterialErro(err instanceof Error ? err.message : t('erp.marketing.studySaveError'));
    }
  };

  const editarMaterial = (m: MaterialEstudo) => {
    setEditMaterialId(m.id);
    setMaterialForm({
      categoria: m.categoria,
      titulo: m.titulo,
      resumo: m.resumo,
      corpo: m.corpo,
      imagemUrl: m.imagemUrl ?? '',
      ordem: String(m.ordem),
      publicado: m.publicado,
    });
  };

  const toggleMaterial = async (m: MaterialEstudo) => {
    await api(`/marketing/materiais-estudo/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ publicado: !m.publicado }),
    });
    await load();
  };

  const toDatetimeLocal = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const salvarMidia = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setMidiaErro('');
    const publicadoEm = midiaForm.publicadoEm
      ? new Date(midiaForm.publicadoEm).toISOString()
      : null;
    const payload = {
      tipo: midiaForm.tipo,
      titulo: midiaForm.titulo.trim(),
      descricao: midiaForm.descricao.trim() || null,
      imagemUrl: midiaForm.imagemUrl.trim() || null,
      videoUrl: midiaForm.videoUrl.trim() || null,
      visibilidade: midiaForm.visibilidade,
      status: midiaForm.status,
      publicadoEm,
      albumId: midiaForm.albumId ? Number(midiaForm.albumId) : null,
      ordem: Number(midiaForm.ordem) || 0,
    };
    try {
      if (editMidiaId) {
        await api(`/marketing/galeria/${editMidiaId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/marketing/galeria', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setMidiaForm(emptyMidia);
      setEditMidiaId(null);
      setShowMidiaForm(false);
      await load();
    } catch (err) {
      setMidiaErro(err instanceof Error ? err.message : t('erp.marketing.gallerySaveError'));
    }
  };

  const abrirFormMidia = (tipo: TipoMidia) => {
    setEditMidiaId(null);
    setMidiaErro('');
    setMidiaForm({ ...emptyMidia, tipo });
    setShowMidiaForm(true);
  };

  const editarMidia = (m: MidiaPublicacao) => {
    setEditMidiaId(m.id);
    setShowMidiaForm(true);
    setMidiaForm({
      tipo: m.tipo,
      titulo: m.titulo,
      descricao: m.descricao ?? '',
      imagemUrl: m.imagemUrl ?? '',
      videoUrl: m.videoUrl ?? '',
      visibilidade: m.visibilidade === 'PRIVADO' ? 'PRIVADO' : 'PUBLICO',
      status: m.status,
      publicadoEm: toDatetimeLocal(m.publicadoEm),
      albumId: m.albumId ? String(m.albumId) : '',
      ordem: String(m.ordem),
    });
  };

  const criarAlbum = async () => {
    const nome = novoAlbumNome.trim();
    if (!nome) return;
    try {
      const created = await api<MidiaAlbum>('/marketing/galeria/albuns', {
        method: 'POST',
        body: JSON.stringify({ nome }),
      });
      setNovoAlbumNome('');
      await load();
      setMidiaForm((f) => ({ ...f, albumId: String(created.id) }));
    } catch (err) {
      setMidiaErro(err instanceof Error ? err.message : t('erp.marketing.galleryAlbumError'));
    }
  };

  const toggleMidiaStatus = async (m: MidiaPublicacao) => {
    await api(`/marketing/galeria/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: m.status === 'PUBLICADO' ? 'RASCUNHO' : 'PUBLICADO',
      }),
    });
    await load();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.marketing.title')}</h2>
        <p className="text-sm text-white/70 mt-1">{t('erp.marketing.subtitle')}</p>
      </div>

      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.events')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.eventosAbertos}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.products')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.produtosPublicados}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.content')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.conteudosPublicados}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.studies')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.materiaisEstudoPublicados ?? 0}</p>
          </div>
        </div>
      )}

      <section id="galeria" className="space-y-3 scroll-mt-4">
        <h3 className="text-lg text-white/90">{t('erp.marketing.gallery')}</h3>
        <p className="text-xs text-white/50">{t('erp.marketing.galleryHint')}</p>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => abrirFormMidia('FOTO')}
              className="min-h-11 px-4 rounded-lg bg-[var(--color-accent)] text-black text-sm font-medium"
            >
              {t('erp.marketing.galleryAddPhoto')}
            </button>
            <button
              type="button"
              onClick={() => abrirFormMidia('VIDEO')}
              className="min-h-11 px-4 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] text-sm font-medium hover:bg-white/5"
            >
              {t('erp.marketing.galleryAddVideo')}
            </button>
          </div>
        )}
        {canWrite && showMidiaForm && (
          <form onSubmit={salvarMidia} className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-[var(--color-accent)]">
              {editMidiaId
                ? t('erp.marketing.galleryEdit')
                : midiaForm.tipo === 'VIDEO'
                  ? t('erp.marketing.galleryFormVideo')
                  : t('erp.marketing.galleryFormPhoto')}
            </p>
            {midiaErro && <p className="text-sm text-[var(--color-danger)]">{midiaErro}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={midiaForm.tipo}
                onChange={(e) => setMidiaForm({ ...midiaForm, tipo: e.target.value as TipoMidia })}
                className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
              >
                <option value="FOTO">{t('erp.galeria.typePhoto')}</option>
                <option value="VIDEO">{t('erp.galeria.typeVideo')}</option>
              </select>
              <fieldset className="flex items-center gap-4 px-2 py-1 rounded bg-black/20 border border-white/10">
                <legend className="sr-only">{t('erp.galeria.visibility')}</legend>
                <label className="flex items-center gap-1.5 text-sm text-white/85">
                  <input
                    type="radio"
                    name="visibilidade-midia"
                    checked={midiaForm.visibilidade === 'PUBLICO'}
                    onChange={() => setMidiaForm({ ...midiaForm, visibilidade: 'PUBLICO' })}
                  />
                  {t('erp.galeria.visibilityPublic')}
                </label>
                <label className="flex items-center gap-1.5 text-sm text-white/85">
                  <input
                    type="radio"
                    name="visibilidade-midia"
                    checked={midiaForm.visibilidade === 'PRIVADO'}
                    onChange={() => setMidiaForm({ ...midiaForm, visibilidade: 'PRIVADO' })}
                  />
                  {t('erp.galeria.visibilityPrivate')}
                </label>
              </fieldset>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-white/50">{t('erp.marketing.galleryAlbum')}</label>
              <select
                value={midiaForm.albumId}
                onChange={(e) => setMidiaForm({ ...midiaForm, albumId: e.target.value })}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
              >
                <option value="">{t('erp.marketing.galleryAlbumNone')}</option>
                {albuns.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                    {a.ano ? ` (${a.ano})` : ''}
                  </option>
                ))}
              </select>
              {canWrite && (
                <div className="flex flex-wrap gap-2">
                  <input
                    value={novoAlbumNome}
                    onChange={(e) => setNovoAlbumNome(e.target.value)}
                    placeholder={t('erp.marketing.galleryAlbumNew')}
                    className="flex-1 min-w-[12rem] px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                  />
                  <button
                    type="button"
                    onClick={criarAlbum}
                    className="px-3 py-2 rounded border border-white/20 text-sm text-white/80 hover:bg-white/5"
                  >
                    {t('erp.marketing.galleryAlbumCreate')}
                  </button>
                </div>
              )}
            </div>
            <input
              required
              value={midiaForm.titulo}
              onChange={(e) => setMidiaForm({ ...midiaForm, titulo: e.target.value })}
              placeholder={t('erp.marketing.galleryTitle')}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
            <textarea
              rows={2}
              value={midiaForm.descricao}
              onChange={(e) => setMidiaForm({ ...midiaForm, descricao: e.target.value })}
              placeholder={t('erp.marketing.galleryDesc')}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
            {(midiaForm.tipo === 'FOTO' || midiaForm.tipo === 'VIDEO') && (
              <>
                <MediaUploadPanel
                  compact
                  onUploaded={(url) => setMidiaForm((f) => ({ ...f, imagemUrl: url }))}
                />
                <input
                  value={midiaForm.imagemUrl}
                  onChange={(e) => setMidiaForm({ ...midiaForm, imagemUrl: e.target.value })}
                  placeholder={
                    midiaForm.tipo === 'FOTO'
                      ? t('erp.marketing.galleryImageRequired')
                      : t('erp.marketing.galleryThumb')
                  }
                  required={midiaForm.tipo === 'FOTO'}
                  className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                />
              </>
            )}
            {midiaForm.tipo === 'VIDEO' && (
              <>
                <input
                  required
                  value={midiaForm.videoUrl}
                  onChange={(e) => setMidiaForm({ ...midiaForm, videoUrl: e.target.value })}
                  placeholder={t('erp.marketing.galleryVideoUrl')}
                  className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                />
                {(() => {
                  const emb = parseVideoEmbed(midiaForm.videoUrl);
                  if (!emb) return null;
                  return (
                    <div className="rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/40">
                      <iframe
                        title={t('erp.marketing.galleryPreview')}
                        src={emb.embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                })()}
              </>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={midiaForm.status}
                onChange={(e) => setMidiaForm({ ...midiaForm, status: e.target.value as StatusMidia })}
                className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
              >
                <option value="RASCUNHO">{t('erp.marketing.galleryDraft')}</option>
                <option value="PUBLICADO">{t('erp.marketing.galleryPublished')}</option>
              </select>
              <input
                type="datetime-local"
                value={midiaForm.publicadoEm}
                onChange={(e) => setMidiaForm({ ...midiaForm, publicadoEm: e.target.value })}
                className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                title={t('erp.marketing.gallerySchedule')}
              />
              <input
                type="number"
                min={0}
                value={midiaForm.ordem}
                onChange={(e) => setMidiaForm({ ...midiaForm, ordem: e.target.value })}
                placeholder={t('erp.marketing.studyOrder')}
                className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
              />
            </div>
            <p className="text-[11px] text-white/40">{t('erp.marketing.galleryScheduleHint')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium"
              >
                {editMidiaId ? t('erp.marketing.galleryUpdate') : t('erp.marketing.galleryCreate')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMidiaId(null);
                  setMidiaForm(emptyMidia);
                  setShowMidiaForm(false);
                  setMidiaErro('');
                }}
                className="px-4 py-2 rounded border border-white/20 text-sm text-white/80"
              >
                {t('erp.marketing.galleryCancel')}
              </button>
            </div>
          </form>
        )}
        <ul className="space-y-2 text-sm">
          {midias.length === 0 && (
            <li className="text-white/50">{t('erp.marketing.galleryEmpty')}</li>
          )}
          {midias.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2"
            >
              <span>
                [{m.tipo}] {m.titulo}{' '}
                <span className="text-white/40">
                  ({m.visibilidade === 'PRIVADO' ? t('erp.galeria.visibilityPrivate') : t('erp.galeria.visibilityPublic')}
                  {m.album ? ` · ${m.album.nome}` : ''}
                  {' · '}
                  {m.status}
                  {m.publicadoEm
                    ? ` · ${new Date(m.publicadoEm).toLocaleString('pt-BR')}`
                    : ''}
                  )
                </span>
              </span>
              {canWrite && (
                <span className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => editarMidia(m)}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {t('erp.marketing.galleryEdit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMidiaStatus(m)}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {m.status === 'PUBLICADO'
                      ? t('erp.marketing.unpublish')
                      : t('erp.marketing.publish')}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.studies')}</h3>
        <p className="text-xs text-white/50">{t('erp.marketing.studiesHint')}</p>
        {canWrite && (
        <form onSubmit={salvarMaterial} className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
          {materialErro && <p className="text-sm text-[var(--color-danger)]">{materialErro}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={materialForm.categoria}
              onChange={(e) =>
                setMaterialForm({ ...materialForm, categoria: e.target.value as CategoriaEstudo })
              }
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {t(`studies.cat.${c}` as 'studies.cat.ERVAS')}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={materialForm.ordem}
              onChange={(e) => setMaterialForm({ ...materialForm, ordem: e.target.value })}
              placeholder={t('erp.marketing.studyOrder')}
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
          </div>
          <input
            required
            value={materialForm.titulo}
            onChange={(e) => setMaterialForm({ ...materialForm, titulo: e.target.value })}
            placeholder={t('erp.marketing.studyTitle')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <input
            required
            value={materialForm.resumo}
            onChange={(e) => setMaterialForm({ ...materialForm, resumo: e.target.value })}
            placeholder={t('erp.marketing.studySummary')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <textarea
            required
            rows={6}
            value={materialForm.corpo}
            onChange={(e) => setMaterialForm({ ...materialForm, corpo: e.target.value })}
            placeholder={t('erp.marketing.studyBody')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <input
            value={materialForm.imagemUrl}
            onChange={(e) => setMaterialForm({ ...materialForm, imagemUrl: e.target.value })}
            placeholder={t('erp.marketing.studyImage')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={materialForm.publicado}
              onChange={(e) => setMaterialForm({ ...materialForm, publicado: e.target.checked })}
            />
            {t('erp.marketing.studyPublished')}
          </label>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium">
              {editMaterialId ? t('erp.common.save') : t('erp.marketing.studyCreate')}
            </button>
            {editMaterialId && (
              <button
                type="button"
                onClick={() => {
                  setEditMaterialId(null);
                  setMaterialForm(emptyMaterial);
                }}
                className="px-4 py-2 rounded bg-white/10 text-sm"
              >
                {t('erp.common.cancel')}
              </button>
            )}
          </div>
        </form>
        )}
        <ul className="space-y-2 text-sm">
          {materiais.map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                [{m.categoria}] {m.titulo}{' '}
                <span className="text-white/40">({m.slug})</span>
              </span>
              {canWrite && (
              <div className="flex gap-2">
                <button type="button" onClick={() => editarMaterial(m)} className="text-white/70 hover:underline">
                  {t('erp.common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMaterial(m)}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {m.publicado ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
                </button>
              </div>
              )}
            </li>
          ))}
          {materiais.length === 0 && (
            <li className="text-white/50 py-2">{t('erp.marketing.studyEmpty')}</li>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.events')}</h3>
        {canWrite && (
        <form onSubmit={criarEvento} className="flex flex-wrap gap-2 items-end">
          <input
            value={nomeEvento}
            onChange={(e) => setNomeEvento(e.target.value)}
            placeholder={t('erp.marketing.eventName')}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10 flex-1 min-w-[12rem]"
          />
          <select
            value={tipoEvento}
            onChange={(e) => setTipoEvento(e.target.value as 'GIRA' | 'OFICINA')}
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          >
            <option value="GIRA">{t('events.tipo.GIRA')}</option>
            <option value="OFICINA">{t('events.tipo.OFICINA')}</option>
          </select>
          <input
            type="date"
            value={dataEvento}
            onChange={(e) => setDataEvento(e.target.value)}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          />
          <button type="submit" className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium">
            {t('erp.marketing.publishEvent')}
          </button>
        </form>
        )}
        <ul className="space-y-2 text-sm">
          {eventos.map((e) => (
            <li key={e.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                [{e.tipo === 'OFICINA' ? t('events.tipo.OFICINA') : t('events.tipo.GIRA')}] {e.nomeEvento}{' '}
                <span className="text-white/40">
                  ({new Date(e.dataEvento).toLocaleDateString('pt-BR')} · {e.status})
                </span>
              </span>
              {canWrite && (
              <button
                type="button"
                onClick={() => toggleEvento(e.id, e.status)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {e.status === 'ABERTO' ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.books')}</h3>
        <ul className="space-y-2 text-sm">
          {produtos.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                {p.nome}{' '}
                <span className="text-white/40">
                  ({p.tipo} · {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                </span>
              </span>
              {canWrite && (
              <button
                type="button"
                onClick={() => toggleProduto(p.id, p.publicadoEcommerce)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {p.publicadoEcommerce ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.contents')}</h3>
        <ul className="space-y-2 text-sm">
          {conteudos.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                [{c.tipo}] {c.titulo}
              </span>
              {canWrite && (
              <button
                type="button"
                onClick={() => toggleConteudo(c.id, c.publicado)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {c.publicado ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
