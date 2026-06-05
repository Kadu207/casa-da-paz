import { Link } from 'react-router-dom';

export default function PublicHome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-accent)] mb-2">Casa da Paz</h1>
      <p className="text-lg text-white/80 max-w-lg mb-8">
        Um ecossistema digital inteligente, responsivo e seguro para fortalecer o acolhimento, a gestão e a
        comunidade afroindígena.
      </p>
      <p className="text-sm text-white/60 mb-8">Conselheiro Lafaiete, MG — Bairro Areal</p>
      <nav className="flex flex-wrap gap-3 justify-center">
        <Link to="/public/eventos" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded">
          Eventos
        </Link>
        <Link to="/public/agendar" className="px-4 py-2 border border-[var(--color-accent)] rounded">
          Agendar consulta
        </Link>
        <Link to="/public/contato" className="px-4 py-2 border border-white/30 rounded">
          Contato
        </Link>
        <Link to="/login" className="px-4 py-2 text-white/60 text-sm">
          Área interna
        </Link>
      </nav>
    </div>
  );
}
