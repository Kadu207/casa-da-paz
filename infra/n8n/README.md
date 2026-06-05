# N8N — Workflows Casa da Paz

## Subir stack

```powershell
.\scripts\start-messaging.ps1
```

Acesse http://localhost:5678 (user `admin`, senha `changeme` por padrão).

## Importar workflows

**Automático (recomendado):**
```powershell
.\scripts\import-n8n-workflows.ps1
```
Importa JSON de `workflows/`, publica e reinicia o n8n.

**Manual:**
1. N8N → **Workflows** → **Import from File**
2. Importe os JSON desta pasta (`workflows/`)
3. Ative cada workflow (toggle **Active**)

## Webhooks esperados pelo backend

| Workflow | Path | Disparado quando |
|----------|------|------------------|
| novo-agendamento | `/webhook/casadapaz-agendamento` | POST `/api/public/agendamentos` |
| agendamento-confirmado | `/webhook/casadapaz-agendamento-confirmado` | Recepção confirma |
| agendamento-cancelado | `/webhook/casadapaz-agendamento-cancelado` | Recepção cancela |

Header opcional: `X-Webhook-Secret: n8n-dev-secret` (mesmo valor de `N8N_WEBHOOK_SECRET` no backend).

## Workflow lembrete atraso (cron)

1. Crie workflow com trigger **Schedule** (diário 9h)
2. HTTP Request GET `http://host.docker.internal:3000/api/financeiro/atrasados` com JWT de serviço (ou expandir endpoint interno)
3. Loop → Chatwoot API send message

> Em dev local, o workflow `novo-agendamento` apenas registra o payload (node **No Operation** ou **Set**). Conecte Chatwoot em produção.

## Testar webhook manualmente

```powershell
Invoke-RestMethod -Uri http://localhost:5678/webhook/casadapaz-agendamento `
  -Method POST -ContentType application/json `
  -Body '{"nome":"Teste","telefone":"31999999999"}'
```
