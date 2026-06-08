import { useEffect, useState } from 'react';
import { getToken } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function MediaUploadPanel() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/media/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { cloudflareImages: boolean }) => setEnabled(d.cloudflareImages))
      .catch(() => setEnabled(false));
  }, []);

  if (enabled === null) return null;
  if (!enabled) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface)] text-sm text-white/60">
        {t('erp.media.disabled')}
      </div>
    );
  }

  const upload = async () => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = getToken();
      const res = await fetch(`${API_BASE}/media/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = (await res.json()) as { id?: string; url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? t('erp.media.uploadFail'));
      setResult({ id: data.id!, url: data.url! });
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('erp.media.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface)] space-y-3">
      <h3 className="text-sm font-medium text-[var(--color-accent)]">{t('erp.media.title')}</h3>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm text-white/80"
      />
      <button
        type="button"
        disabled={!file || uploading}
        onClick={upload}
        className="text-sm px-4 py-2 rounded bg-[var(--color-accent)] text-black disabled:opacity-50"
      >
        {uploading ? t('erp.media.uploading') : t('erp.media.upload')}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && (
        <div className="text-xs text-white/70 break-all">
          <p>ID: {result.id}</p>
          <a href={result.url} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] hover:underline">
            {result.url}
          </a>
        </div>
      )}
    </div>
  );
}
