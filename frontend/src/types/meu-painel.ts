export interface MeuPainelResponse {
  pessoa: { id: number; nomeCompleto: string };
  financeiro: {
    resumo: { totalPago: number; totalPendente: number; atrasadosQtd: number };
    mensalidades: {
      id: number;
      valor: number;
      status: string;
      adimplencia: string;
      vencimento: string | null;
      dataTransacao: string;
    }[];
  };
  presencas: {
    id: number;
    eventoNome: string;
    horarioChegada: string;
    tipoPresenca: string;
  }[];
  inscricoes: {
    id: number;
    eventoNome: string;
    valor: number;
    statusPagamento: string;
    adimplencia: string;
    vencimento: string | null;
  }[];
}
