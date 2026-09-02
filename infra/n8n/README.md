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
| lembrete-atraso | `/webhook/casadapaz-lembrete-atraso` | Alertas financeiros |
| tarefa-delegacao | `/webhook/casadapaz-tarefa-delegacao` | Feature 033 — nova/vencimento/atrasada/concluída |

Header opcional: `X-Webhook-Secret` (mesmo valor de `N8N_WEBHOOK_SECRET` no backend).

## Workflow tarefa delegação (033)

1. Na VPS: `./scripts/setup-n8n-delegacao-vps.sh` (ou `./scripts/import-n8n-workflows.sh tarefa-delegacao.json`)
2. Credencial N8N **SMTP Casa da Paz** (host/user/pass) + `SMTP_FROM` opcional no `.env.production`
3. Inbox WhatsApp no Chatwoot (Meta) → `CHATWOOT_INBOX_ID`
4. Schedule diário (opcional): HTTP POST `/api/delegacoes/sync-alertas` com JWT write

**Estado VPS (2026-09-02):** workflow importado e webhook OK; SMTP e inbox WhatsApp ainda pendentes (só WebWidget id=3).

Payload esperado:
```json
{
  "workflow": "tarefa_delegacao",
  "tarefaId": 1,
  "titulo": "...",
  "funcao": "Manutenção",
  "pessoaNome": "...",
  "telefone": "...",
  "email": "...",
  "vencimento": "2026-09-10",
  "tipoEvento": "CRIADA|VENCIMENTO|ATRASADA|CONCLUIDA",
  "canal": "WHATSAPP|EMAIL"
}
```

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
