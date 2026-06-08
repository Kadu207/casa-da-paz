import { ADDRESS, WHATSAPP_NUMBER } from './portal-assets';

/** Responsáveis pelo tratamento de dados (LGPD). Adicione nomes aqui ou via VITE_DPO_EXTRA_NAMES. */
const DATA_PROTECTION_BASE = ['Carlos Eduardo Souza Silva', 'Raquel Cristina'] as const;

/** Desenvolvimento técnico do sistema/portal. */
export const SYSTEM_DEV_CONTACTS = ['Carlos Eduardo Souza Silva'] as const;

function parseExtraDpoNames(): string[] {
  const raw = import.meta.env.VITE_DPO_EXTRA_NAMES as string | undefined;
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Lista publicada na política — editável no código ou com VITE_DPO_EXTRA_NAMES=Nome1,Nome2 */
export const DATA_PROTECTION_CONTACTS: readonly string[] = [
  ...DATA_PROTECTION_BASE,
  ...parseExtraDpoNames(),
];

/** Canal oficial LGPD — override: VITE_DPO_EMAIL */
export const DPO_EMAIL =
  import.meta.env.VITE_DPO_EMAIL ?? 'terreirocasadapaz@gmail.com';

export const DSAR_SLA_DAYS = 15;

export const DPO_ADDRESS = `${ADDRESS.line1}, ${ADDRESS.line2}`;

/** Rótulo curto para cards (lista formatada). */
export function formatContactList(names: readonly string[], locale: 'pt-BR' | 'en'): string {
  if (names.length === 0) return locale === 'en' ? 'Data protection team' : 'Equipe de proteção de dados';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) {
    return locale === 'en'
      ? `${names[0]} and ${names[1]}`
      : `${names[0]} e ${names[1]}`;
  }
  const last = names[names.length - 1]!;
  const rest = names.slice(0, -1).join(', ');
  return locale === 'en' ? `${rest}, and ${last}` : `${rest} e ${last}`;
}

export function whatsappDsarUrl(locale: 'pt-BR' | 'en'): string {
  const msg =
    locale === 'en'
      ? 'Hello, I would like to exercise my data protection rights (LGPD) with Casa da Paz.'
      : 'Olá, gostaria de exercer meus direitos de proteção de dados (LGPD) junto à Casa da Paz.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}
