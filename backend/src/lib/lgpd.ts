/** Versão da política de privacidade — incrementar ao alterar PublicTermos. */
export const LGPD_POLICY_VERSION = '2026-06-01';

export function assertLgpdConsent(aceiteLgpd: boolean | undefined): string | null {
  if (aceiteLgpd !== true) {
    return 'É necessário aceitar a Política de Privacidade para continuar.';
  }
  return null;
}
