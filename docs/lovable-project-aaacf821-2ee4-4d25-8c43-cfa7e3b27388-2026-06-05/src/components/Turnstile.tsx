import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getTurnstileSiteKey } from "@/lib/turnstile.functions";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement | string,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    __turnstileLoading?: Promise<void>;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileLoading) return window.__turnstileLoading;

  window.__turnstileLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(s);
  });
  return window.__turnstileLoading;
}

type Props = {
  onToken: (token: string | null) => void;
};

export function Turnstile({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchSiteKey = useServerFn(getTurnstileSiteKey);

  useEffect(() => {
    let cancelled = false;
    fetchSiteKey()
      .then((r) => {
        if (!cancelled) setSiteKey(r.siteKey || null);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar a verificação.");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSiteKey]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let mounted = true;

    loadTurnstileScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "auto",
          callback: (token: string) => onToken(token),
          "error-callback": () => {
            onToken(null);
            setError("Falha na verificação anti-spam. Tente novamente.");
          },
          "expired-callback": () => onToken(null),
        });
      })
      .catch(() => setError("Não foi possível carregar a verificação."));

    return () => {
      mounted = false;
      try {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      } catch {
        /* noop */
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, onToken]);

  if (!siteKey && !error) {
    return (
      <div className="text-xs text-foreground/60" aria-live="polite">
        Carregando verificação anti-spam…
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} />
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-[color:var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
