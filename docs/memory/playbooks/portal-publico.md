# Playbook — Portal Público

## Rotas
- `/public` — institucional
- `/public/eventos` — giras/oficinas abertas
- `/public/agendar` — solicitação de consulta
- `/public/contato` — WhatsApp + Chatwoot

## Fluxo agendamento
1. Consulente preenche formulário
2. `AgendamentoPublico` status PENDENTE
3. N8N notifica recepção
4. Recepção confirma no painel interno

## Manutenção
- Atualizar textos institucionais em `PublicHome.tsx`
- Token Chatwoot: `VITE_CHATWOOT_WEBSITE_TOKEN` no frontend
