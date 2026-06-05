import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { TurnstileWidget, turnstileConfigured } from './TurnstileWidget';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function NewsletterSignup() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (turnstileConfigured() && !turnstileToken) {
      setErr(locale === 'en' ? 'Complete the security check.' : 'Complete a verificação de segurança.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/public/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, turnstileToken: turnstileToken || undefined }),
      });
      if (!res.ok) throw new Error('fail');
      setOk(true);
      setEmail('');
      setTurnstileToken('');
    } catch {
      setErr(locale === 'en' ? 'Could not subscribe.' : 'Não foi possível inscrever.');
    }
  };

  if (ok) {
    return <p className="text-sm text-success">{t('newsletter.success')}</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('newsletter.placeholder')}
          className="portal-input flex-1"
        />
        <button
          type="submit"
          className="min-h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          {t('newsletter.submit')}
        </button>
      </div>
      <TurnstileWidget onToken={setTurnstileToken} onExpire={() => setTurnstileToken('')} />
      {err && <p className="text-destructive text-xs">{err}</p>}
      <p className="text-xs text-foreground/60">
        <Link to="/public/termos" className="hover:text-primary underline">
          {t('terms.link')}
        </Link>
      </p>
    </form>
  );
}
