import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth, hasPermission } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

interface Config {
  playlistTitulo: string;
  playlistUrl: string | null;
  telegramUrl: string | null;
}

interface Ponto {
  id: number;
  titulo: string;
  linha: string;
  letra: string | null;
  spotifyUrl: string;
  ordem: number;
  publicado: boolean;
}

const vazio = { titulo: '', linha: '', letra: '', spotifyUrl: '', ordem: 0, publicado: false };

export default function PontosPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'marketing', 'write');
  const [config, setConfig] = useState<Config>({ playlistTitulo: 'Pontos da Casa', playlistUrl: '', telegramUrl: '' });
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  async function load() {
    const [cfg, list] = await Promise.all([
      api<Config>('/marketing/pontos/config'),
      api<Ponto[]>('/marketing/pontos'),
    ]);
    setConfig({
      playlistTitulo: cfg.playlistTitulo,
      playlistUrl: cfg.playlistUrl ?? '',
      telegramUrl: cfg.telegramUrl ?? '',
    });
    setPontos(list);
  }

  useEffect(() => {
    load().catch(() => setErro(t('erp.pontos.saveError')));
  }, [t]);

  async function saveConfig(event: FormEvent) {
    event.preventDefault();
    setErro('');
    try {
      await api('/marketing/pontos/config', {
        method: 'PUT',
        body: JSON.stringify({
          playlistTitulo: config.playlistTitulo,
          playlistUrl: config.playlistUrl || null,
          telegramUrl: config.telegramUrl || null,
        }),
      });
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.pontos.saveError'));
    }
  }

  async function savePonto(event: FormEvent) {
    event.preventDefault();
    setErro('');
    const body = {
      titulo: form.titulo,
      linha: form.linha,
      letra: form.letra || null,
      spotifyUrl: form.spotifyUrl,
      ordem: Number(form.ordem) || 0,
      publicado: form.publicado,
    };
    try {
      if (editId) {
        await api(`/marketing/pontos/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api('/marketing/pontos', { method: 'POST', body: JSON.stringify(body) });
      }
      setForm(vazio);
      setEditId(null);
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.pontos.saveError'));
    }
  }

  async function unpublish(id: number) {
    await api(`/marketing/pontos/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.pontos.title')}</h2>
        <p className="text-sm text-white/70 mt-1">{t('erp.pontos.subtitle')}</p>
      </div>
      {erro ? <p className="text-sm text-red-300">{erro}</p> : null}

      <form onSubmit={saveConfig} className="space-y-3 rounded-xl border border-white/10 p-4">
        <input
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
          placeholder={t('erp.pontos.playlistTitle')}
          value={config.playlistTitulo}
          disabled={!canWrite}
          onChange={(event) => setConfig({ ...config, playlistTitulo: event.target.value })}
        />
        <input
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
          placeholder={t('erp.pontos.playlistUrl')}
          value={config.playlistUrl ?? ''}
          disabled={!canWrite}
          onChange={(event) => setConfig({ ...config, playlistUrl: event.target.value })}
        />
        <input
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
          placeholder={t('erp.pontos.telegram')}
          value={config.telegramUrl ?? ''}
          disabled={!canWrite}
          onChange={(event) => setConfig({ ...config, telegramUrl: event.target.value })}
        />
        {canWrite ? (
          <button type="submit" className="rounded-lg bg-[var(--color-accent)] text-black px-4 py-2 text-sm">
            {t('erp.pontos.saveConfig')}
          </button>
        ) : null}
      </form>

      {canWrite ? (
        <form onSubmit={savePonto} className="space-y-3 rounded-xl border border-white/10 p-4">
          <input
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
            placeholder={t('erp.pontos.titulo')}
            value={form.titulo}
            onChange={(event) => setForm({ ...form, titulo: event.target.value })}
            required
          />
          <input
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
            placeholder={t('erp.pontos.linha')}
            value={form.linha}
            onChange={(event) => setForm({ ...form, linha: event.target.value })}
            required
          />
          <input
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
            placeholder={t('erp.pontos.spotify')}
            value={form.spotifyUrl}
            onChange={(event) => setForm({ ...form, spotifyUrl: event.target.value })}
            required
          />
          <textarea
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm min-h-24"
            placeholder={t('erp.pontos.letra')}
            value={form.letra}
            onChange={(event) => setForm({ ...form, letra: event.target.value })}
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={0}
              className="w-24 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
              placeholder={t('erp.pontos.ordem')}
              value={form.ordem}
              onChange={(event) => setForm({ ...form, ordem: Number(event.target.value) })}
            />
            <label className="text-sm text-white/80 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.publicado}
                onChange={(event) => setForm({ ...form, publicado: event.target.checked })}
              />
              {t('erp.pontos.publicado')}
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-[var(--color-accent)] text-black px-4 py-2 text-sm">
              {editId ? t('erp.pontos.save') : t('erp.pontos.create')}
            </button>
            {editId ? (
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm"
                onClick={() => {
                  setEditId(null);
                  setForm(vazio);
                }}
              >
                {t('erp.pontos.cancel')}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <ul className="space-y-2">
        {pontos.length === 0 ? <li className="text-white/50">{t('erp.pontos.empty')}</li> : null}
        {pontos.map((ponto) => (
          <li key={ponto.id} className="rounded-xl border border-white/10 p-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-white">{ponto.titulo}</p>
              <p className="text-xs text-white/50">
                {ponto.linha}
                {ponto.publicado ? '' : ' · rascunho'}
              </p>
            </div>
            {canWrite ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-sm text-[var(--color-accent)]"
                  onClick={() => {
                    setEditId(ponto.id);
                    setForm({
                      titulo: ponto.titulo,
                      linha: ponto.linha,
                      letra: ponto.letra ?? '',
                      spotifyUrl: ponto.spotifyUrl,
                      ordem: ponto.ordem,
                      publicado: ponto.publicado,
                    });
                  }}
                >
                  {t('erp.pontos.edit')}
                </button>
                {ponto.publicado ? (
                  <button type="button" className="text-sm text-white/70" onClick={() => unpublish(ponto.id)}>
                    {t('erp.pontos.unpublish')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
