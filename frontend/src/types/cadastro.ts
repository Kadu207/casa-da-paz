export type TipoPerfil =
  | 'PRESIDENTE'
  | 'CONSULENTE'
  | 'MEDIUM'
  | 'DIRETORIA'
  | 'TESOURARIA'
  | 'CONSELHEIRO'
  | 'SUPORTE_TI'
  | 'FUNCIONARIO';

export interface ResponsavelForm {
  nomeCompleto: string;
  telefone: string;
}

export const PERFIS_FORM: TipoPerfil[] = [
  'PRESIDENTE',
  'DIRETORIA',
  'TESOURARIA',
  'CONSELHEIRO',
  'MEDIUM',
  'CONSULENTE',
  'SUPORTE_TI',
];

export function perfilExigeResponsavel(tipoPerfil: TipoPerfil, maiorDeIdade: boolean): boolean {
  return !maiorDeIdade && (tipoPerfil === 'CONSULENTE' || tipoPerfil === 'MEDIUM');
}
