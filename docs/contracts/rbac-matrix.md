# Matriz RBAC — Casa da Paz (hierárquica)

## Papéis de sistema

| Papel | Nível | Escopo |
|-------|-------|--------|
| **SUPERVISOR** | Master operacional | Usuários, políticas, cadastros, financeiro, manutenção — **não** integrações write |
| **ADMIN** | Técnico | Integrações (N8N, webhooks, Chatwoot), logs |

## Papéis operacionais (policies configuráveis pelo SUPERVISOR)

| Recurso / Ação | DIRETORIA | FINANCEIRO | RECEPCAO | LIVRARIA | MEDIUM | SUPORTE |
|----------------|-----------|------------|----------|----------|--------|---------|
| Usuários CRUD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pessoas CRUD | ✅ | 👁️ | ✅ | 👁️ | ❌ | 👁️ |
| Financeiro | ✅ | ✅ | ❌ | ❌ | 👁️ próprio | ❌ |
| Import Excel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Eventos / check-in | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| PDV/Livraria/Estoque | ✅ | 👁️ | ❌ | ✅ | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ❌ | ❌ | 👁️ próprio | ❌ |
| Agendamentos | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Auditoria | ✅ | ❌ | ❌ | ❌ | ❌ | 👁️ |
| Logs/Manutenção | 👁️ | ❌ | ❌ | ❌ | ❌ | ✅ |

**SUPERVISOR** gerencia usuários operacionais e sobrescreve permissões via `usuario_policies.grants` (JSON).

Legenda: ✅ total | 👁️ leitura/limitado | ❌ negado

Spec: `specs/020-rbac-hierarquia-policies/spec.md`
