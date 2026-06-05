/** Protocolo público de pedido e-commerce. */
export function protocoloPedido(id: number, createdAt: Date = new Date()): string {
  const ts = createdAt.getTime().toString(36).toUpperCase();
  const suffix = id.toString(36).toUpperCase().slice(-4).padStart(4, '0');
  return `ECO-${ts}-${suffix}`;
}
