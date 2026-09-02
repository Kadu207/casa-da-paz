# ADR-011: Delegações / Funções da Casa

**Status:** Aceito | **Data:** 2026-09-02

## Contexto

A casa precisa de um quadro único de responsabilidades (Manutenção, Obras, Financeiro, Eventos, Compras, etc.) com tarefas checáveis e avisos por e-mail/WhatsApp.

## Decisão

- Módulo próprio `delegacoes` (não misturar com checklist de estoque/limpeza).
- Visibilidade org-wide para quem tem `read`; CRUD para DIRETORIA/SUPERVISOR/ADMIN.
- Toggle de conclusão com `authorize('delegacoes','read')`.
- Notificações via N8N (`tarefa_delegacao`) → Chatwoot WhatsApp + e-mail; `Pessoa.email` opcional + `Pessoa.telefone`.
- Alertas registrados em `Alerta` com tipos `DELEGACAO_*` para idempotência.

## Consequências

- Menu ERP **Delegações** em destaque
- Spec `033-delegacoes-casa`
- Workflow N8N a configurar na VPS
