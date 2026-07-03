import { Turnstile } from '@marsidev/react-turnstile';
import { useEffect, useState } from 'react';

const ENV_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim();
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function fetchSiteKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/public/portal-config`, { cache: 'no-store' });
    if (!res.ok) return ENV_SITE_KEY || null;
    const data = (await res.json()) as { turnstileSiteKey?: string | null };
    return data.turnstileSiteKey?.trim() || ENV_SITE_KEY || null;
  } catch {
    return ENV_SITE_KEY || null;
  }
}

export function turnstileConfigured(): boolean {
  return Boolean(ENV_SITE_KEY);
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onRequiredChange?: (required: boolean) => void;
}

export function TurnstileWidget({ onToken, onExpire, onRequiredChange }: Props) {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchSiteKey()
      .then((key) => {
        if (cancelled) return;
        setSiteKey(key);
        onRequiredChange?.(Boolean(key));
        if (!key) setStatus('error');
      })
      .catch(() => {
        if (cancelled) return;
        const key = ENV_SITE_KEY || null;
        setSiteKey(key);
        onRequiredChange?.(Boolean(key));
        if (!key) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [retry, onRequiredChange]);

  if (status === 'loading' && !siteKey) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/40 p-3">
        <p className="text-xs text-foreground/70">Carregando verificação de segurança…</p>
      </div>
    );
  }

  if (!siteKey) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
        <p className="text-xs text-destructive" role="alert">
          Verificação indisponível (site key ausente). Confira TURNSTILE_SITE_KEY na VPS.
        </p>
        <button type="button" className="mt-2 text-xs text-primary underline" onClick={() => setRetry((n) => n + 1)}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <p className="text-sm font-medium mb-2">Verificação de segurança</p>
      <div className="turnstile-widget-host min-h-[65px] w-full overflow-visible">
        <Turnstile
          key={`${siteKey}-${retry}`}
          siteKey={siteKey}
          options={{ theme: 'light', size: 'normal' }}
          onSuccess={(token) => {
            onToken(token);
            setStatus('verified');
          }}
          onExpire={() => {
            onExpire?.();
            setStatus('ready');
          }}
          onError={() => setStatus('error')}
          onWidgetLoad={() => setStatus('ready')}
        />
      </div>
      {status === 'ready' && (
        <p className="text-xs text-foreground/70 mt-2">Marque a caixa acima para continuar.</p>
      )}
      {status === 'verified' && (
        <p className="text-xs text-success mt-2">Verificação concluída.</p>
      )}
      {status === 'error' && (
        <>
          <p className="text-xs text-destructive mt-2" role="alert">
            Falha na verificação. Confira o domínio no painel Cloudflare Turnstile (
            <code className="text-[11px]">casadapaz.inovatitech.com.br</code>
            ) ou desative bloqueadores.
          </p>
          <button type="button" className="mt-2 text-xs text-primary underline" onClick={() => setRetry((n) => n + 1)}>
            Tentar novamente
          </button>
        </>
      )}
    </div>
  );
}
