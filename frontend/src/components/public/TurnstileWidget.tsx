import { useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export function turnstileConfigured(): boolean {
  return Boolean(SITE_KEY);
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onToken, onExpire }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;

    const mount = () => {
      if (!ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: onToken,
        'expired-callback': () => {
          onExpire?.();
          if (widgetId.current) window.turnstile?.reset(widgetId.current);
        },
      });
      setReady(true);
    };

    if (window.turnstile) {
      mount();
      return;
    }

    window.onTurnstileLoad = mount;
    const existing = document.querySelector('script[data-turnstile]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      s.async = true;
      s.defer = true;
      s.setAttribute('data-turnstile', '1');
      document.head.appendChild(s);
    }

    return () => {
      window.onTurnstileLoad = undefined;
    };
  }, [onToken, onExpire]);

  if (!SITE_KEY) return null;

  return (
    <div className="min-h-[65px]">
      <div ref={ref} />
      {!ready && <p className="text-xs text-foreground/60">Carregando verificação…</p>}
    </div>
  );
}
