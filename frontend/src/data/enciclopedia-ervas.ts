import raw from './enciclopedia-ervas.json';

export type SegurancaErva = 'preparo-suave' | 'sem-receita' | 'atencao';

export type ClasseRitual = 'quente' | 'morna' | 'fria em algumas casas' | 'variável';

export type CreditoFoto = {
  tipo: 'fotografia' | 'esquematica';
  autor: string;
  licenca: string;
  licencaUrl: string;
  fonte: string;
  titulo: string;
  nota?: string;
};

export type ErvaFicha = {
  numero: number;
  nome: string;
  slug: string;
  imagem: string;
  campos: Record<string, string>;
  cuidados: string;
  classificacao: string;
  seguranca: SegurancaErva;
  credito?: CreditoFoto;
};

export type SecaoEnciclopedia = {
  title: string;
  paragraphs: string[];
  items: { title: string; paragraphs: string[] }[];
  tables?: string[][][];
};

export type EnciclopediaErvas = {
  titulo: string;
  subtitulo: string;
  edicao: string;
  preamble: string[];
  catalogoIntro: string;
  secoes: SecaoEnciclopedia[];
  ervas: ErvaFicha[];
  referencias: string[];
  licenca: string;
};

/** Âncoras das seções de estudo, na ordem do documento (o sumário inicial fica de fora). */
export const SECAO_ANCORAS = [
  'fundamentos',
  'classificacao',
  'seguranca',
  'preparo',
  'banhos',
  'cheiros',
  'quentes',
  'amaci',
] as const;

export const CLASSES_RITUAL: ClasseRitual[] = [
  'quente',
  'morna',
  'fria em algumas casas',
  'variável',
];

export const SEGURANCAS: SegurancaErva[] = ['preparo-suave', 'sem-receita', 'atencao'];

export const CAMPOS_FICHA = [
  'Identificação botânica de referência',
  'Classificação ritual de estudo',
  'Associação simbólica (não universal)',
  'Aroma / identificação',
  'Parte / método ritual',
] as const;

function isSeguranca(value: string): value is SegurancaErva {
  return value === 'preparo-suave' || value === 'sem-receita' || value === 'atencao';
}

function parseErva(entry: (typeof raw.ervas)[number]): ErvaFicha {
  if (!isSeguranca(entry.seguranca)) {
    throw new Error(`Segurança desconhecida em ${entry.slug}: ${entry.seguranca}`);
  }
  const tipo = entry.credito.tipo;
  if (tipo !== 'fotografia' && tipo !== 'esquematica') {
    throw new Error(`Mídia desconhecida em ${entry.slug}: ${tipo}`);
  }
  return {
    ...entry,
    seguranca: entry.seguranca,
    credito: { ...entry.credito, tipo },
  };
}

export const enciclopedia: EnciclopediaErvas = {
  titulo: raw.titulo,
  subtitulo: raw.subtitulo,
  edicao: raw.edicao,
  preamble: raw.preamble,
  catalogoIntro: raw.catalogoIntro,
  secoes: raw.secoes,
  ervas: raw.ervas.map(parseErva),
  referencias: raw.referencias,
  licenca: raw.licenca,
};

const porSlug = new Map(enciclopedia.ervas.map((erva) => [erva.slug, erva]));

export function getErvaBySlug(slug: string): ErvaFicha | undefined {
  return porSlug.get(slug);
}

export function ervasVizinhas(slug: string): { anterior?: ErvaFicha; proxima?: ErvaFicha } {
  const indice = enciclopedia.ervas.findIndex((erva) => erva.slug === slug);
  if (indice < 0) return {};
  return {
    anterior: enciclopedia.ervas[indice - 1],
    proxima: enciclopedia.ervas[indice + 1],
  };
}

export function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function filtrarErvas(opts: {
  q: string;
  classificacao: string;
  seguranca: string;
}): ErvaFicha[] {
  const q = fold(opts.q.trim());
  return enciclopedia.ervas.filter((erva) => {
    if (opts.classificacao && erva.classificacao !== opts.classificacao) return false;
    if (opts.seguranca && erva.seguranca !== opts.seguranca) return false;
    if (!q) return true;
    const hay = fold(
      [
        erva.nome,
        String(erva.numero).padStart(3, '0'),
        erva.campos['Identificação botânica de referência'] ?? '',
        erva.campos['Associação simbólica (não universal)'] ?? '',
        erva.cuidados,
      ].join(' ')
    );
    return hay.includes(q);
  });
}

export function avisosEnciclopedia(): string[] {
  return enciclopedia.preamble.filter(
    (linha) => linha.startsWith('IMPORTANTE') || linha.startsWith('O conteúdo registra')
  );
}

export function splitReferencia(linha: string): { rotulo: string; href: string } {
  const match = linha.match(/^(.*)\s—\s(https?:\/\/\S+)$/);
  if (!match) return { rotulo: linha, href: '' };
  return { rotulo: match[1].trim(), href: match[2] };
}

export function isClasseRitual(value: string): value is ClasseRitual {
  return (CLASSES_RITUAL as string[]).includes(value);
}
