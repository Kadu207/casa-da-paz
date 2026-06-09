export interface Transacao {
  id: number;
  tipo: string;
  categoria: string;
  valor: string;
  status: string;
  adimplencia: string;
  vencimento: string | null;
  dataTransacao: string;
  pessoaId: number | null;
  observacoes?: string | null;
  pessoa?: { id: number; nomeCompleto: string; telefone?: string };
}

export interface PaginatedTransacoes {
  data: Transacao[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface FluxoCaixaResponse {
  periodo: { de: string; ate: string };
  totais: {
    receitasConcluidas: number;
    despesasConcluidas: number;
    saldo: number;
    pendentesValor: number;
    pendentesQtd: number;
    atrasadosValor: number;
    atrasadosQtd: number;
  };
  porSemana: { semana: string; receitas: number; despesas: number; saldoAcumulado: number }[];
  porCategoria: {
    receitas: { categoria: string; valor: number }[];
    despesas: { categoria: string; valor: number }[];
  };
}

export interface ConciliacaoResponse {
  mes: number;
  ano: number;
  checklist: {
    mensalidadesPendentes: number;
    atrasados: number;
    despesasNoMes: number;
  };
  totais: { receitas: number; despesas: number; saldo: number };
  fechamento: {
    id: number;
    fechadoEm: string;
    fechadoPor: { id: number; nome: string };
  } | null;
}
