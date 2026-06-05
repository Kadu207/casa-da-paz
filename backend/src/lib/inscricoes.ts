export function eventoLotado(capacidadeMax: number | null | undefined, inscricoesAtivas: number): boolean {
  if (capacidadeMax == null || capacidadeMax <= 0) return false;
  return inscricoesAtivas >= capacidadeMax;
}

export function podeInscrever(input: {
  eventoStatus: 'ABERTO' | 'ENCERRADO';
  capacidadeMax: number | null | undefined;
  inscricoesAtivas: number;
  jaInscrito: boolean;
}): string | null {
  if (input.eventoStatus !== 'ABERTO') return 'Evento encerrado';
  if (input.jaInscrito) return 'Pessoa já inscrita neste evento';
  if (eventoLotado(input.capacidadeMax, input.inscricoesAtivas)) {
    return 'Lotação esgotada';
  }
  return null;
}
