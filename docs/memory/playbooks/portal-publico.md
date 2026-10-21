# Playbook — Portal Público

## Rotas

| Rota | Função |
|------|--------|
| `/public` | Home institucional |
| `/public/eventos` | Giras/oficinas abertas |
| `/public/agendar` | Solicitação de consulta |
| `/public/contato` | WhatsApp + Chatwoot |
| `/public/estudos` | Materiais de estudo (ervas/banhos) editáveis pelo Marketing |
| `/public/ervas` | Enciclopédia de estudo (100 espécies, estática). Alias `/ervas` |
| `/public/ervas/:slug` | Ficha da espécie. Alias `/ervas/:slug` |
| `/public/galeria` | **Galeria** fotos e vídeos públicos (Spec 034) |
| `/public/galeria/:slug` | Detalhe / player YouTube embutido |
| `/public/historia` | **Nossa história** (marcos 2015/2026 + narrativa completa) |
| `/public/livraria` | Checkout |
| `/public/termos` | LGPD |

## Enciclopédia de ervas

1. Botão **Ervas, banhos e estudos** na home, o quadro de ervas da galeria e o rodapé **Ervas & banhos** abrem `/public/ervas`.
2. Conteúdo em `frontend/src/data/enciclopedia-ervas.json` (100 fichas + fundamentos). Fotografias de referência em `frontend/public/portal/ervas/fotos/`, com autor e licença livre (Wikimedia Commons ou iNaturalist) em cada ficha.
3. `/public/estudos` continua com os materiais editáveis pelo Marketing e aponta para a enciclopédia.
4. Para trocar uma foto: `python scripts/fetch-ervas-fotos.py <slug>`. O extrator do `.docx` (`scripts/extract-enciclopedia-ervas.py`) recria só o texto e as ilustrações esquemáticas; não usar isso por cima das fotos já creditadas.
5. A jurema-branca usa fotografia de *Piptadenia retusa*: o GBIF trata *Piptadenia stipulacea* como sinônimo, e a ficha traz essa nota.
6. As fotos não entram no precache do PWA (`globIgnores` em `frontend/vite.config.ts`). A URL do emblema leva `?v=20261021c` para não reaproveitar o arquivo antigo no cache da Cloudflare. O desenho é o PNG oficial (`0ece8eb`); só o papel branco de fora do aro sai. O triângulo, o aro e as estrelas continuam brancos.

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
- **Logo oficial:** `frontend/public/portal/logo.png` e `logo.webp` (1024, fundo transparente fora do selo; o triângulo interno continua branco). Home, cabeçalho e favicon usam esse emblema. `logo-4k.*` é o arquivo de alta resolução com fundo branco e não entra na home.  
- Busca pessoas/auditoria: **FTS** (`websearch_to_tsquery` portuguese + GIN), não ILIKE aberto  
- Token Chatwoot: `VITE_CHATWOOT_WEBSITE_TOKEN` no frontend  
- ADR galeria: [`012-galeria-midia.md`](../decisions/012-galeria-midia.md)  
