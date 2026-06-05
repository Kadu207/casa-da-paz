import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SolidScreenLayout } from '../components/SolidScreenLayout';
import { portalAssets } from '../lib/portal-assets';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await doLogin(login.trim(), senha);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    }
  };

  return (
    <SolidScreenLayout
      title="Casa da Paz"
      subtitle="Área interna"
      imageSrc={portalAssets.hero}
      imageAlt="Casa da Paz — tradição Umbanda"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-xl space-y-4 shadow-xl border border-white/10"
      >
        {error && <p className="text-[var(--color-danger)] text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Usuário"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <button type="submit" className="w-full py-2 bg-[var(--color-accent)] text-black font-medium rounded">
          Entrar
        </button>
        <Link to="/public" className="block text-center text-sm text-white/60 hover:text-white">
          Portal público →
        </Link>
      </form>
    </SolidScreenLayout>
  );
}
