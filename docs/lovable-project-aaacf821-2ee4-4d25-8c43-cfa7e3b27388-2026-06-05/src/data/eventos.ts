export type Evento = {
  id: string;
  nomeEvento: string;
  dataEvento: string; // ISO
  local: string;
  capacidadeMax?: number;
  inscricoes?: number;
  resumo: string;
  descricao: string[];
  recomendacoes?: string[];
};

export const eventos: Evento[] = [
  {
    id: "gira-caboclos",
    nomeEvento: "Gira de Caboclos",
    dataEvento: "2026-06-20T19:30:00",
    local: "Casa da Paz — Rua Valério Eugênio, 570, Areal",
    capacidadeMax: 80,
    inscricoes: 42,
    resumo: "Trabalho espiritual com a força da mata e dos povos originários.",
    descricao: [
      "A Gira de Caboclos é um trabalho de cura e orientação conduzido pela falange dos caboclos, que carregam a força da mata, das águas e da ancestralidade afro-indígena.",
      "É um espaço aberto à comunidade, sem cobrança, para quem busca escuta, passe e direção.",
    ],
    recomendacoes: [
      "Roupas claras de preferência branca",
      "Chegar com 20 minutos de antecedência",
      "Evitar bebida alcoólica no dia",
    ],
  },
  {
    id: "oficina-ervas",
    nomeEvento: "Oficina de Ervas e Banhos",
    dataEvento: "2026-07-05T15:00:00",
    local: "Casa da Paz — Rua Valério Eugênio, 570, Areal",
    capacidadeMax: 25,
    inscricoes: 18,
    resumo: "Saberes ancestrais sobre plantas, banhos e cuidados energéticos.",
    descricao: [
      "Encontro prático para conhecer ervas usadas na tradição afro-indígena, seus usos espirituais e como preparar banhos de descarrego, prosperidade e firmeza.",
      "Inclui material de apoio e roda de conversa final.",
    ],
    recomendacoes: [
      "Vagas limitadas — agende com antecedência",
      "Levar um pequeno caderno se desejar anotar",
    ],
  },
  {
    id: "gira-pretos-velhos",
    nomeEvento: "Gira de Pretos Velhos",
    dataEvento: "2026-07-18T19:30:00",
    local: "Casa da Paz — Rua Valério Eugênio, 570, Areal",
    capacidadeMax: 80,
    inscricoes: 12,
    resumo: "Sabedoria, conforto e cura pela palavra dos mais velhos.",
    descricao: [
      "Os Pretos Velhos chegam com a sabedoria do tempo, oferecendo conselho, conforto e cura. Trabalho conduzido com cachimbo, café e muita escuta.",
      "Aberto ao público. Crianças bem-vindas acompanhadas dos responsáveis.",
    ],
    recomendacoes: [
      "Roupas claras",
      "Silêncio respeitoso durante o trabalho",
    ],
  },
];

export const getEvento = (id: string) => eventos.find((e) => e.id === id);

export const formatEventoDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatEventoDay = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const formatEventoHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
