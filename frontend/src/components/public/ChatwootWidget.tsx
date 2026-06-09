import { useEffect } from 'react';

const WEBSITE_TOKEN = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN;
const BASE_URL = (import.meta.env.VITE_CHATWOOT_BASE_URL ?? '').replace(/\/$/, '');

declare global {
  interface Window {
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      locale?: string;
      position?: 'left' | 'right';
    };
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
  }
}

let sdkLoading = false;

export function ChatwootWidget({ locale = 'pt_BR' }: { locale?: string }) {
  useEffect(() => {
    if (!WEBSITE_TOKEN || !BASE_URL || sdkLoading) return;
    if (window.chatwootSDK) return;

    sdkLoading = true;
    window.chatwootSettings = {
      hideMessageBubble: false,
      locale,
      position: 'right',
    };

    const script = document.createElement('script');
    script.src = `${BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.chatwootSDK?.run({
        websiteToken: WEBSITE_TOKEN,
        baseUrl: BASE_URL,
      });
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [locale]);

  return null;
}

export function isChatwootConfigured(): boolean {
  return Boolean(WEBSITE_TOKEN && BASE_URL);
}
