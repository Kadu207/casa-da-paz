# Feature 033 — Delegações / Funções da Casa

**Status:** ✅ Implementado e em produção | **Atualizado:** 2026-09-02

## Objetivo

Menu ERP **Delegações** com funções da casa (Manutenção, Obras, Financeiro, Eventos e agenda, Compras, Limpeza, Comunicação), responsáveis, checklist de tarefas (check feito/pendente) e alertas por **e-mail + WhatsApp** (N8N → Chatwoot).

## Decisões

| Tema | Escolha |
|------|---------|
| Visibilidade | Todos com `delegacoes:read` veem **todas** as funções/tarefas |
| Check | Qualquer um com `read` pode toggle concluída/pendente |
| CRUD | SUPERVISOR, ADMIN, DIRETORIA (+ policy write) |
| Notificações V1 | E-mail + WhatsApp via N8N; sem push/SMS |

## Modelos

`FuncaoCasa`, `FuncaoResponsavel`, `TarefaDelegacao` (+ `Pessoa.email` opcional)

## RBAC

Resource `delegacoes`: read amplo; write DIRETORIA/SUPERVISOR/ADMIN.

## API

`/api/delegacoes/*` — funções, responsáveis, tarefas, toggle, notificar, sync-alertas, resumo

## UI

Menu **Delegações** → `/app/delegacoes` (após Dashboard)

## Produção

- Deploy migrate + seed `--funcoes-casa-only` + rebuild BE/FE  
- Workflow N8N `tarefa-delegacao` importado e webhook ativo  
- Pendente operacional: credencial SMTP N8N + inbox WhatsApp Meta  

## Referências

- ADR: `docs/memory/decisions/011-delegacoes-casa.md`
- Matriz: `docs/contracts/rbac-matrix.md`
- Mensageria: ADR-006 · `infra/n8n/README.md`
