export const CATEGORIAS_RECEITA = ['MENSALIDADE', 'LIVRARIA', 'DOACAO', 'MANUTENCAO', 'EVENTOS', 'OFICINAS'];
export const CATEGORIAS_DESPESA = ['ESTRUTURA_MANUTENCAO', 'INSUMOS_TERREIRO', 'CUSTOS_OPERACIONAIS'];
export const ADIMPLENCIAS = ['EM_DIA', 'ATRASADO', 'PAGO'] as const;

export function diasAtraso(vencimento: string | null): number | null {
  if (!vencimento) return null;
  const v = new Date(vencimento);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  v.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - v.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}

export function mesAnoAtual(): { mes: number; ano: number } {
  const now = new Date();
  return { mes: now.getMonth() + 1, ano: now.getFullYear() };
}
