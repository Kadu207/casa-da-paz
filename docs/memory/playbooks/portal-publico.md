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
| `/public/livraria` | Checkout |
| `/public/termos` | LGPD |

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
- Token Chatwoot: `VITE_CHATWOOT_WEBSITE_TOKEN` no frontend  
- ADR: [`012-galeria-midia.md`](../decisions/012-galeria-midia.md)  
