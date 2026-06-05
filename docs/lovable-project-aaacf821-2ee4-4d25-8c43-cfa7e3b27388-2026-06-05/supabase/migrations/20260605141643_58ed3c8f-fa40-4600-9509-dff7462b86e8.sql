
-- Tabela de eventos do site
CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome_evento text NOT NULL,
  data_evento timestamptz NOT NULL,
  local text NOT NULL,
  resumo text NOT NULL DEFAULT '',
  descricao text[] NOT NULL DEFAULT '{}',
  recomendacoes text[] NOT NULL DEFAULT '{}',
  capacidade_max integer,
  inscricoes integer,
  publicado boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.eventos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Público (anônimos e autenticados) só vê publicados
CREATE POLICY "eventos publicados public read"
  ON public.eventos
  FOR SELECT
  TO anon, authenticated
  USING (publicado = true);

-- Admin/atendente veem tudo
CREATE POLICY "eventos staff full read"
  ON public.eventos
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'atendente')
  );

-- Apenas admin pode inserir/atualizar/remover
CREATE POLICY "eventos admin insert"
  ON public.eventos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "eventos admin update"
  ON public.eventos
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "eventos admin delete"
  ON public.eventos
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger de updated_at (reusa touch_updated_at)
CREATE TRIGGER eventos_touch_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX eventos_publicado_ordem_idx ON public.eventos (publicado, ordem, data_evento);

-- Seed inicial com os 3 eventos atuais
INSERT INTO public.eventos (slug, nome_evento, data_evento, local, resumo, descricao, recomendacoes, capacidade_max, inscricoes, publicado, ordem) VALUES
('gira-caboclos','Gira de Caboclos','2026-06-20T19:30:00-03:00','Casa da Paz — Rua Valério Eugênio, 570, Areal',
 'Trabalho espiritual com a força da mata e dos povos originários.',
 ARRAY['A Gira de Caboclos é um trabalho de cura e orientação conduzido pela falange dos caboclos, que carregam a força da mata, das águas e da ancestralidade afro-indígena.','É um espaço aberto à comunidade, sem cobrança, para quem busca escuta, passe e direção.'],
 ARRAY['Roupas claras de preferência branca','Chegar com 20 minutos de antecedência','Evitar bebida alcoólica no dia'],
 80, 42, true, 0),
('oficina-ervas','Oficina de Ervas e Banhos','2026-07-05T15:00:00-03:00','Casa da Paz — Rua Valério Eugênio, 570, Areal',
 'Saberes ancestrais sobre plantas, banhos e cuidados energéticos.',
 ARRAY['Encontro prático para conhecer ervas usadas na tradição afro-indígena, seus usos espirituais e como preparar banhos de descarrego, prosperidade e firmeza.','Inclui material de apoio e roda de conversa final.'],
 ARRAY['Vagas limitadas — agende com antecedência','Levar um pequeno caderno se desejar anotar'],
 25, 18, true, 1),
('gira-pretos-velhos','Gira de Pretos Velhos','2026-07-18T19:30:00-03:00','Casa da Paz — Rua Valério Eugênio, 570, Areal',
 'Sabedoria, conforto e cura pela palavra dos mais velhos.',
 ARRAY['Os Pretos Velhos chegam com a sabedoria do tempo, oferecendo conselho, conforto e cura. Trabalho conduzido com cachimbo, café e muita escuta.','Aberto ao público. Crianças bem-vindas acompanhadas dos responsáveis.'],
 ARRAY['Roupas claras','Silêncio respeitoso durante o trabalho'],
 80, 12, true, 2);
