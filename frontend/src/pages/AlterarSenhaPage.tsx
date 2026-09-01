import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { portalAssets } from '../lib/portal-assets';
import { useI18n } from '../i18n/I18nContext';

export default function AlterarSenhaPage() {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const obrigatorio = Boolean(user?.deveTrocarSenha);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setOk(false);
    if (senhaNova !== confirmar) {
      setErro(t('erp.password.mismatch'));
      return;
    }
    if (senhaNova.length < 6) {
      setErro(t('erp.password.minLength'));
      return;
    }
    setSalvando(true);
    try {
      await api('/auth/me/senha', {
        method: 'PUT',
        body: JSON.stringify({ senhaAtual, senhaNova }),
      });
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmar('');
      setOk(true);
      await refreshUser();
      if (obrigatorio) {
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.password.error'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-white/10 h-36 sm:h-40">
        <img
          src={portalAssets.velasAltar}
          alt={t('erp.layout.imageAlt')}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent" />
        <p className="absolute bottom-3 left-4 font-serif text-[var(--color-accent)] text-lg">{t('erp.layout.tagline')}</p>
      </div>
      <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.password.title')}</h2>
      <p className="text-sm text-white/70">
        {obrigatorio ? t('erp.password.required') : t('erp.password.description')}
      </p>

      <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
        {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
        {ok && <p className="text-[var(--color-success)] text-sm">{t('erp.password.success')}</p>}
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          placeholder={t('erp.password.current')}
          autoComplete="current-password"
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <input
          type="password"
          value={senhaNova}
          onChange={(e) => setSenhaNova(e.target.value)}
          placeholder={t('erp.password.new')}
          autoComplete="new-password"
          minLength={6}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder={t('erp.password.confirm')}
          autoComplete="new-password"
          minLength={6}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <button
          type="submit"
          disabled={salvando}
          className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm font-medium disabled:opacity-60"
        >
          {salvando ? t('erp.password.saving') : t('erp.password.save')}
        </button>
      </form>
    </div>
  );
}
