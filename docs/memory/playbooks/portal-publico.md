# Playbook — Portal Público

## Rotas

| Rota | Função |
|------|--------|
| `/public` | Home institucional |
| `/public/eventos` | Giras/oficinas abertas |
| `/public/agendar` | Solicitação de consulta |
| `/public/contato` | WhatsApp + Chatwoot |
| `/public/estudos` | Materiais de estudo (ervas/banhos) |
| `/public/galeria` | **Galeria** fotos e vídeos públicos (Spec 034) |
| `/public/galeria/:slug` | Detalhe / player YouTube embutido |
| `/public/historia` | **Nossa história** (marcos 2015/2026 + narrativa completa) |
| `/public/livraria` | Checkout |
| `/public/termos` | LGPD |

## Nossa história

1. Botão **Nossa história** na home e link no rodapé → `/public/historia`
2. Marcos fixos na UI: início **26/09/2015**; em **26/09/2026** — 11 anos de início e 10 anos de registro
3. **Narrativa completa:** editar chave i18n `historia.body` em:
   - `frontend/src/i18n/pt-BR.ts`
   - `frontend/src/i18n/en.ts`
4. Após editar o texto: build FE + deploy (ou `build-frontend-on-vps.sh` + restart frontend)
5. Componente: `frontend/src/pages/public/PublicHistoria.tsx`

## Galeria (034)

1. MARKETING (ou Diretoria / Mãe de Santo / Supervisor / Admin) publica em ERP → **Marketing → Galeria**
2. **Vídeo:** colar link YouTube (preferencial); prévia no formulário; thumb automática  
3. **Foto:** upload Cloudflare Images  
4. **Visibilidade:** `PUBLICO` → `/public/galeria`; `PRIVADO` → só `/app/galeria` (JWT)  
5. **Álbum:** escolher ou criar (ex. *Batizado 2026*, *Festa dos Erês 2026*) — filtro na grade pública e no ERP  
6. `publicadoEm` opcional agenda o go-live  

APIs úteis: `GET /api/public/galeria`, `GET /api/public/galeria/albuns`, CRUD `/api/marketing/galeria` + `/api/marketing/galeria/albuns`.

Canal YouTube da casa: hospeda o arquivo; o site só embute o player (CSP `youtube-nocookie`).

## Fluxo agendamento

1. Consulente preenche formulário  
2. `AgendamentoPublico` status PENDENTE  
3. N8N notifica recepção  
4. Recepção confirma no painel interno  

## Manutenção

- Textos institucionais: `PublicHome.tsx`  
- História completa: i18n `historia.*`  
- **Logo oficial:** `frontend/public/portal/logo.png` (1024) + `logo-4k.webp` / `logo-4k.jpg` (3840×3840) na home; favicon em `frontend/public/favicon.ico`  
- Busca pessoas/auditoria: **FTS** (`websearch_to_tsquery` portuguese + GIN), não ILIKE aberto  
- Token Chatwoot: `VITE_CHATWOOT_WEBSITE_TOKEN` no frontend  
- ADR galeria: [`012-galeria-midia.md`](../decisions/012-galeria-midia.md)  
