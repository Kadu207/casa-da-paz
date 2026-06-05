import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, senha);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[var(--color-surface)] p-8 rounded-xl space-y-4">
        <h1 className="text-2xl font-serif text-[var(--color-accent)] text-center">Casa da Paz</h1>
        <p className="text-sm text-center text-white/70">Área interna</p>
        {error && <p className="text-[var(--color-danger)] text-sm">{error}</p>}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
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
    </div>
  );
}
