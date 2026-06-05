## Portal Público Casa da Paz

Site institucional mobile-first, sem login, seguindo o briefing anexado.

### Design system (src/styles.css)
- Background navy `#0F172A`, surface `#1E293B`, accent gold `#D4AF37`, success `#22C55E`, danger `#EF4444`, texto branco/80%.
- Tokens em `oklch` mapeados para `--background`, `--card`, `--primary` (gold), etc.
- Tipografia: serif para títulos (Cormorant Garamond), sans para corpo (Inter), via Google Fonts.
- Botões touch-friendly (min-h 44px).

### Rotas (TanStack Start, em `src/routes/`)
1. **`/` (Home)** — Logo Casa da Paz centralizado, título serif, subtítulo, localização (Conselheiro Lafaiete, MG — Areal), parágrafo de missão, 3 CTAs (Eventos primário gold, Agendar outline gold, Contato outline neutro), link discreto "Área interna" → `/login` (placeholder externo). Hero com imagem de fundo (terreiro/natureza) com overlay navy.
2. **`/eventos`** — Header com ← Voltar, título "Próximos eventos", cards (nome, data pt-BR, X/Y inscritos). Dados estáticos no protótipo (3-4 eventos exemplo). Estado vazio tratado.
3. **`/agendar`** — Formulário: nome, telefone, data preferida, observação. Validação com Zod + react-hook-form. Tela de confirmação após submit (mock — pronto para conectar à API depois). Mensagem de sucesso verde.
4. **`/contato`** — Card com botão WhatsApp (gold, abre wa.me), link Instagram @umbandacasadapaz, endereço, placeholder para Chatwoot widget.

### Componentes compartilhados
- `PublicLayout` (header simples com logo + voltar, footer minimalista com créditos).
- Reuso de shadcn `Button`, `Card`, `Input`, `Textarea`, `Label`, `Form`.

### Assets visuais
- **Logo**: a imagem enviada (`Casa_da_Paz.png`) registrada via `lovable-assets` e usada na Home e header.
- **Imagens de fundo geradas** (respeitosas, sem clichês — natureza, velas, elementos simbólicos abstratos afro-indígenas; sem figuras religiosas caricatas):
  - Hero da Home: mata brasileira ao amanhecer com luz dourada filtrada.
  - Banner Eventos: velas acesas em ambiente sereno.
  - Banner Agendar: textura natural (folhas, terra) com tom espiritual.
  - Banner Contato: paisagem de cerrado/mata mineira ao entardecer.
- Todas geradas em `src/assets/` com overlay navy para legibilidade.

### Detalhes técnicos
- `head()` por rota com title/description em PT-BR e og tags.
- Sem backend nesta entrega (formulário e eventos usam dados estáticos prontos para troca por API real `/api/public/*`).
- Acessibilidade: contraste AA, labels nos inputs, alt text nas imagens.

### Fora de escopo
- Login / dashboard interno.
- Integração real com API, Chatwoot e N8N (deixarei pontos claros de troca).
