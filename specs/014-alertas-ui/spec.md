# Feature 014 — Alertas UI + automações N8N

**Status:** Proposta | **Data:** 2026-06-26  
**Depende:** `012-chatwoot-n8n` (T8 WhatsApp Meta), modelo `Alerta` (Prisma)  
**ADR:** 006 (canal WhatsApp via Chatwoot/N8N)

## Objetivo

Dar visibilidade operacional aos alertas gerados pelo backend (adimplência, vencimentos) e conectar o disparo automático via N8N → Chatwoot/WhatsApp.

Hoje existe:
- `POST /api/financeiro/sync-alertas` — cria registros `Alerta` para mensalidades atrasadas
- Botão manual em `FinanceiroLancamentosPage` (sem listagem dedicada)
- Workflow N8N `lembrete_atraso` (stub webhook)

## Escopo V1

| In | Fora |
|----|------|
| Página `/app/alertas` — listagem, filtros, paginação | Push notification mobile |
| Filtros: tipo, canal, disparado, período | E-mail como canal primário |
| Ação "Marcar disparado" / "Reenviar" (DIRETORIA, FINANCEIRO) | Cron automático na VPS (V1.1) |
| Job diário opcional via N8N (webhook backend) | Alertas de estoque/livraria |
| Disparo N8N `lembrete_atraso` ao marcar reenvio | SMS |

## Personas

| Setor | Permissão |
|-------|-----------|
| DIRETORIA | read + write (marcar disparado, reenviar) |
| FINANCEIRO | read + write |
| RECEPCAO | read (somente alertas operacionais futuros — V1.2) |
| MEDIUM | sem acesso |

## API (proposta)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/alertas` | Listagem paginada + filtros |
| PATCH | `/api/alertas/:id` | `{ disparado: true }` |
| POST | `/api/alertas/:id/reenviar` | Dispara N8N `lembrete_atraso` |

RBAC: `authorize('alertas', 'read'|'write')` — adicionar à matriz `docs/contracts/rbac-matrix.md`.

## UI

- Rota `/app/alertas` no menu Financeiro ou Operações
- Tabela: tipo, mensagem, pessoa, canal, disparado, createdAt
- Badge contador no menu (alertas pendentes `disparado=false`)
- i18n pt-BR + en

## Integração N8N

1. `POST /api/alertas/:id/reenviar` → `n8n.trigger('lembrete_atraso', payload)`
2. Payload: `{ alertaId, pessoaId, telefone, mensagem, tipo }`
3. Workflow N8N (fase 2): nó HTTP → Chatwoot API enviar mensagem WhatsApp
4. Backend marca `disparado=true` após 200 do N8N

## Acceptance

- [ ] Listagem com filtros e RBAC
- [ ] Reenvio dispara webhook N8N e atualiza `disparado`
- [ ] `sync-alertas` continua funcionando; novos alertas aparecem na UI
- [ ] Testes backend (isolamento RBAC, reenvio mock N8N)
- [ ] Build frontend + smoke manual

## Fora de escopo V1

- Alertas de evento encerrado, manutenção estrutura
- Dashboard widget de alertas
- Notificação in-app em tempo real (WebSocket)
