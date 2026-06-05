import { Link } from 'react-router-dom';

const CHATWOOT_WEBSITE_TOKEN = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN;
const WHATSAPP = '5531999990000';

export default function PublicContato() {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <Link to="/public" className="text-sm text-white/60 hover:text-white">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-serif text-[var(--color-accent)] mt-4 mb-6">Contato</h1>
      <p className="text-white/80 mb-6">Um espaço de cura, escuta e espiritualidade ancestral afroindígena.</p>
      <div className="space-y-4 text-left bg-[var(--color-surface)] p-6 rounded-xl">
        <p>
          <span className="text-[var(--color-accent)]">Instagram:</span>{' '}
          <a href="https://instagram.com/umbandacasadapaz" className="hover:underline" target="_blank" rel="noreferrer">
            @umbandacasadapaz
          </a>
        </p>
        <p>
          <span className="text-[var(--color-accent)]">E-mail:</span>{' '}
          <a href="mailto:terreirocasadapaz@gmail.com" className="hover:underline">
            terreirocasadapaz@gmail.com
          </a>
        </p>
        <p>
          <span className="text-[var(--color-accent)]">Local:</span> Bairro Areal — Conselheiro Lafaiete, MG
        </p>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="block w-full py-3 bg-green-600 text-center rounded font-medium"
        >
          WhatsApp
        </a>
      </div>
      {CHATWOOT_WEBSITE_TOKEN && (
        <p className="text-xs text-white/40 mt-4">Chatwoot widget ativo em produção</p>
      )}
    </div>
  );
}
