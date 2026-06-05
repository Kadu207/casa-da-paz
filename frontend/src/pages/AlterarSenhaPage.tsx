import { useState } from 'react';
import { api } from '../lib/api';
import { portalAssets } from '../lib/portal-assets';

export default function AlterarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setOk(false);
    if (senhaNova !== confirmar) {
      setErro('A confirmação não coincide com a nova senha');
      return;
    }
    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres');
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
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-white/10 h-36 sm:h-40">
        <img
          src={portalAssets.velasAltar}
          alt="Tradição Umbanda"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent" />
        <p className="absolute bottom-3 left-4 font-serif text-[var(--color-accent)] text-lg">Salve a Umbanda</p>
      </div>
      <h2 className="text-xl font-serif text-[var(--color-accent)]">Alterar senha</h2>
      <p className="text-sm text-white/70">
        Use esta página para trocar a senha da sua conta. Diretoria pode redefinir senhas de outros usuários em
        Usuários.
      </p>

      <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
        {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
        {ok && <p className="text-[var(--color-success)] text-sm">Senha alterada com sucesso.</p>}
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          placeholder="Senha atual"
          autoComplete="current-password"
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <input
          type="password"
          value={senhaNova}
          onChange={(e) => setSenhaNova(e.target.value)}
          placeholder="Nova senha (mín. 6)"
          autoComplete="new-password"
          minLength={6}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Confirmar nova senha"
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
          {salvando ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}
