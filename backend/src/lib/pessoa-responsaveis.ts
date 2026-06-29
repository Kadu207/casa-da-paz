import { z } from 'zod';

export const TIPOS_PERFIL = [
  'PRESIDENTE',
  'CONSULENTE',
  'MEDIUM',
  'DIRETORIA',
  'TESOURARIA',
  'CONSELHEIRO',
  'SUPORTE_TI',
  'FUNCIONARIO',
] as const;

export type TipoPerfilPessoa = (typeof TIPOS_PERFIL)[number];

export const responsavelSchema = z.object({
  nomeCompleto: z.string().min(2).max(150),
  telefone: z.string().max(20).optional(),
});

export const pessoaInputSchema = z.object({
  nomeCompleto: z.string().min(2).max(150),
  telefone: z.string().max(20).optional(),
  maiorDeIdade: z.boolean().default(true),
  tipoPerfil: z.enum(TIPOS_PERFIL),
  responsaveis: z.array(responsavelSchema).optional(),
});

export function perfilExigeResponsavel(tipoPerfil: TipoPerfilPessoa, maiorDeIdade: boolean): boolean {
  return !maiorDeIdade && (tipoPerfil === 'CONSULENTE' || tipoPerfil === 'MEDIUM');
}

export function validarResponsaveis(
  tipoPerfil: TipoPerfilPessoa,
  maiorDeIdade: boolean,
  responsaveis?: z.infer<typeof responsavelSchema>[]
): string | null {
  if (!perfilExigeResponsavel(tipoPerfil, maiorDeIdade)) return null;
  const lista = responsaveis?.filter((r) => r.nomeCompleto.trim()) ?? [];
  if (lista.length === 0) {
    return 'Informe ao menos um responsável para consulente ou médium menor de idade';
  }
  return null;
}

export function normalizarResponsaveis(
  responsaveis?: z.infer<typeof responsavelSchema>[]
): { nomeCompleto: string; telefone?: string }[] {
  if (!responsaveis?.length) return [];
  return responsaveis
    .map((r) => ({
      nomeCompleto: r.nomeCompleto.trim(),
      telefone: r.telefone?.trim() || undefined,
    }))
    .filter((r) => r.nomeCompleto.length >= 2);
}
