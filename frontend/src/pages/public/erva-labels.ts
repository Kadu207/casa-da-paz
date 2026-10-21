import type { TranslationKey } from '../../i18n/I18nContext';
import type { ErvaFicha, SegurancaErva } from '../../data/enciclopedia-ervas';
import { SECAO_ANCORAS, isClasseRitual } from '../../data/enciclopedia-ervas';

export function classeKey(value: string): TranslationKey | null {
  if (!isClasseRitual(value)) return null;
  switch (value) {
    case 'quente':
      return 'herbs.class.quente';
    case 'morna':
      return 'herbs.class.morna';
    case 'fria em algumas casas':
      return 'herbs.class.fria';
    case 'variável':
      return 'herbs.class.variavel';
    default: {
      const unknown: never = value;
      return unknown;
    }
  }
}

export function segurancaKey(seguranca: SegurancaErva): TranslationKey {
  switch (seguranca) {
    case 'preparo-suave':
      return 'herbs.safety.suave';
    case 'sem-receita':
      return 'herbs.safety.semReceita';
    case 'atencao':
      return 'herbs.safety.atencao';
    default: {
      const unknown: never = seguranca;
      return unknown;
    }
  }
}

export function campoKey(campo: string): TranslationKey | null {
  switch (campo) {
    case 'Identificação botânica de referência':
      return 'herbs.field.botanical';
    case 'Classificação ritual de estudo':
      return 'herbs.field.class';
    case 'Associação simbólica (não universal)':
      return 'herbs.field.symbolic';
    case 'Aroma / identificação':
      return 'herbs.field.aroma';
    case 'Parte / método ritual':
      return 'herbs.field.part';
    default:
      return null;
  }
}

export const SECAO_LABEL: Record<(typeof SECAO_ANCORAS)[number], TranslationKey> = {
  fundamentos: 'herbs.nav.fundamentos',
  classificacao: 'herbs.nav.classificacao',
  seguranca: 'herbs.nav.seguranca',
  preparo: 'herbs.nav.preparo',
  banhos: 'herbs.nav.banhos',
  cheiros: 'herbs.nav.cheiros',
  quentes: 'herbs.nav.quentes',
  amaci: 'herbs.nav.amaci',
};

export function pillClass(seguranca: ErvaFicha['seguranca']): string {
  switch (seguranca) {
    case 'atencao':
      return 'border border-destructive/40 text-destructive bg-destructive/10';
    case 'preparo-suave':
      return 'border border-primary/40 text-primary bg-primary/10';
    case 'sem-receita':
      return 'border border-border text-foreground/75 bg-background/40';
    default: {
      const unknown: never = seguranca;
      return unknown;
    }
  }
}
