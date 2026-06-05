export const CATEGORIAS_RECEITA = [
  'MENSALIDADE',
  'LIVRARIA',
  'DOACAO',
  'MANUTENCAO',
  'EVENTOS',
  'OFICINAS',
] as const;

export const CATEGORIAS_DESPESA = [
  'ESTRUTURA_MANUTENCAO',
  'INSUMOS_TERREIRO',
  'CUSTOS_OPERACIONAIS',
] as const;

export const CATEGORIAS_COM_VENCIMENTO = ['MENSALIDADE', 'EVENTOS', 'OFICINAS'] as const;

export type CategoriaReceita = (typeof CATEGORIAS_RECEITA)[number];
export type CategoriaDespesa = (typeof CATEGORIAS_DESPESA)[number];

export function validarTransacao(input: {
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
  vencimento?: string | null;
  pessoaId?: number | null;
}): string | null {
  const categorias =
    input.tipo === 'RECEITA' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  if (!categorias.includes(input.categoria as never)) {
    return `Categoria inválida para ${input.tipo}`;
  }

  if (
    input.tipo === 'RECEITA' &&
    CATEGORIAS_COM_VENCIMENTO.includes(input.categoria as (typeof CATEGORIAS_COM_VENCIMENTO)[number]) &&
    !input.vencimento
  ) {
    return 'Vencimento obrigatório para esta categoria (ADR-003)';
  }

  if (input.categoria === 'MENSALIDADE' && !input.pessoaId) {
    return 'pessoaId obrigatório para mensalidade';
  }

  return null;
}
