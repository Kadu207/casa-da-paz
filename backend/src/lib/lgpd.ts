/** Versão da política de privacidade — incrementar ao alterar PublicTermos. */
export const LGPD_POLICY_VERSION = '2026-06-09';

/** Prazo de resposta a titulares (art. 18, §1º LGPD). */
export const DSAR_SLA_DAYS = 15;

export function assertLgpdConsent(aceiteLgpd: boolean | undefined): string | null {
  if (aceiteLgpd !== true) {
    return 'É necessário aceitar a Política de Privacidade para continuar.';
  }
  return null;
}
