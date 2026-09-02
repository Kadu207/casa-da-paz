import type { ErpTranslationKey } from '../i18n/erp-pt-BR';
import type { TipoPerfil } from '../types/cadastro';

export interface PessoaResponsavel {
  id: number;
  nomeCompleto: string;
  telefone: string | null;
}

export interface PessoaCadastro {
  id: number;
  nomeCompleto: string;
  telefone: string | null;
  email?: string | null;
  maiorDeIdade: boolean;
  tipoPerfil: TipoPerfil;
  dataCadastro: string;
  responsaveis?: PessoaResponsavel[];
  mensalidadePlano?: {
    id: number;
    valor: string;
    diaVencimento: number;
    ativo: boolean;
  } | null;
}

export interface CadastroSecaoConfig {
  perfil: TipoPerfil;
  titleKey: ErpTranslationKey;
  listKey: ErpTranslationKey;
  showResponsaveis: boolean;
}

export const CADASTRO_SECOES: CadastroSecaoConfig[] = [
  {
    perfil: 'PRESIDENTE',
    titleKey: 'erp.pessoas.section.presidente',
    listKey: 'erp.pessoas.section.presidenciaList',
    showResponsaveis: false,
  },
  {
    perfil: 'DIRETORIA',
    titleKey: 'erp.pessoas.section.diretoria',
    listKey: 'erp.pessoas.section.diretoriaList',
    showResponsaveis: false,
  },
  {
    perfil: 'TESOURARIA',
    titleKey: 'erp.pessoas.section.tesouraria',
    listKey: 'erp.pessoas.section.tesourariaList',
    showResponsaveis: false,
  },
  {
    perfil: 'CONSELHEIRO',
    titleKey: 'erp.pessoas.section.conselheiro',
    listKey: 'erp.pessoas.section.conselheirosList',
    showResponsaveis: false,
  },
  {
    perfil: 'MEDIUM',
    titleKey: 'erp.pessoas.section.medium',
    listKey: 'erp.pessoas.section.mediumList',
    showResponsaveis: true,
  },
  {
    perfil: 'CONSULENTE',
    titleKey: 'erp.pessoas.section.consulente',
    listKey: 'erp.pessoas.section.consulenteList',
    showResponsaveis: true,
  },
  {
    perfil: 'SUPORTE_TI',
    titleKey: 'erp.pessoas.section.suporte',
    listKey: 'erp.pessoas.section.atendentesList',
    showResponsaveis: false,
  },
];

export function formatResponsaveis(
  responsaveis: PessoaResponsavel[] | undefined,
  emptyDash: string
): string {
  if (!responsaveis?.length) return emptyDash;
  return responsaveis
    .map((r) => (r.telefone ? `${r.nomeCompleto} (${r.telefone})` : r.nomeCompleto))
    .join(' · ');
}
