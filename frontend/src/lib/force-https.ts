const PRODUCTION_HOSTS = ['casadapaz.inovatitech.com.br'];

/** Redireciona HTTP → HTTPS no domínio de produção (Cloudflare pode servir ambos sem redirect). */
export function enforceProductionHttps(): void {
  if (typeof window === 'undefined') return;
  const { hostname, protocol, href } = window.location;
  const isProdHost =
    PRODUCTION_HOSTS.includes(hostname) || hostname.endsWith('.inovatitech.com.br');
  if (protocol === 'http:' && isProdHost) {
    window.location.replace(href.replace(/^http:/, 'https:'));
  }
}
