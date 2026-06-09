/** Traduções de rotas/motivos do admin_audit_log (pt-BR / en). */
const ROTAS: Record<string, { 'pt-BR': string; en: string }> = {
  'admin.login': { 'pt-BR': 'Login administrativo', en: 'Admin login' },
  'admin.eventos.create': { 'pt-BR': 'Criar evento', en: 'Create event' },
  'admin.eventos.update': { 'pt-BR': 'Atualizar evento', en: 'Update event' },
  'admin.eventos.delete': { 'pt-BR': 'Excluir evento', en: 'Delete event' },
  'admin.usuarios.role.update': { 'pt-BR': 'Alterar setor de usuário', en: 'Update user role' },
  'admin.auditoria.export.csv': { 'pt-BR': 'Exportar auditoria (CSV)', en: 'Export audit (CSV)' },
  'admin.auditoria.export.pdf': { 'pt-BR': 'Exportar auditoria (PDF)', en: 'Export audit (PDF)' },
  'financeiro.conciliacao.fechar': { 'pt-BR': 'Fechar mês (conciliação)', en: 'Close month (reconciliation)' },
  'financeiro.conciliacao.reabrir': { 'pt-BR': 'Reabrir mês (conciliação)', en: 'Reopen month (reconciliation)' },
  'admin.media.upload': { 'pt-BR': 'Upload imagem (Cloudflare)', en: 'Image upload (Cloudflare)' },
  'portal.newsletter.subscribe': { 'pt-BR': 'Inscrição newsletter', en: 'Newsletter signup' },
  'portal.evento.view': { 'pt-BR': 'Visualização de evento', en: 'Event view' },
};

export type AuditLocale = 'pt-BR' | 'en';

export function traduzirRotaAuditoria(rota: string, locale: AuditLocale = 'pt-BR'): string {
  return ROTAS[rota]?.[locale] ?? rota;
}

export function traduzirMotivoAuditoria(motivo: string | null, locale: AuditLocale = 'pt-BR'): string | null {
  if (!motivo) return null;
  const map: Record<string, { 'pt-BR': string; en: string }> = {
    export_filtros: { 'pt-BR': 'Exportação com filtros aplicados', en: 'Export with active filters' },
    novo_inscrito: { 'pt-BR': 'Novo inscrito na newsletter', en: 'New newsletter subscriber' },
  };
  return map[motivo]?.[locale] ?? motivo;
}

export function enriquecerLogAuditoria<T extends { rota: string; motivo: string | null }>(
  log: T,
  locale: AuditLocale
): T & { rotaLabel: string; motivoLabel: string | null } {
  return {
    ...log,
    rotaLabel: traduzirRotaAuditoria(log.rota, locale),
    motivoLabel: traduzirMotivoAuditoria(log.motivo, locale),
  };
}
