/** Protocolo público de acompanhamento (compatível com UI Lovable). */
export function protocoloAgendamento(id: number, createdAt: Date = new Date()): string {
  const ts = createdAt.getTime().toString(36).toUpperCase();
  const suffix = id.toString(36).toUpperCase().slice(-4).padStart(4, '0');
  return `CDP-${ts}-${suffix}`;
}
