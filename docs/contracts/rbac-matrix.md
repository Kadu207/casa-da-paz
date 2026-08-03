# Matriz RBAC — Casa da Paz (hierárquica)

## Papéis de sistema

| Papel | Nível | Escopo |
|-------|-------|--------|
| **SUPERVISOR** | Master operacional | Usuários, políticas, cadastros, financeiro, manutenção — **não** integrações write |
| **ADMIN** | Técnico | Integrações (N8N, webhooks Asaas, Chatwoot), logs |

## Papéis operacionais (policies configuráveis pelo SUPERVISOR)

| Recurso / Ação | DIRETORIA | FINANCEIRO | MARKETING | RECEPCAO | LIVRARIA | MEDIUM | SUPORTE |
|----------------|-----------|------------|-----------|----------|----------|--------|---------|
| Usuários CRUD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pessoas CRUD | ✅ | 👁️ | ❌ | ✅ | 👁️ | ❌ | 👁️ |
| Financeiro | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ próprio | ❌ |
| Cobranças Asaas | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ próprio | ❌ |
| Contas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transparência | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Marketing | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Import Excel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Eventos / check-in | ✅ | 👁️ | ✅ (publicar) | ✅ | ❌ | ❌ | ❌ |
| PDV/Livraria/Estoque | ✅ | 👁️ | ✅ (publicar) | ❌ | ✅ | ❌ | ❌ |
| Ecommerce | ✅ | 👁️ | ✅ (publicar) | ❌ | ✅ | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ próprio | ❌ |
| Agendamentos | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Auditoria | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ |
| Alertas | ✅ | ✅ | ❌ | 👁️ | ❌ | ❌ | 👁️ |
| Logs/Manutenção | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**SUPERVISOR** gerencia usuários operacionais e sobrescreve permissões via `usuario_policies.grants` (JSON).

Legenda: ✅ total | 👁️ leitura/limitado | ❌ negado

Specs: `specs/020-rbac-hierarquia-policies/spec.md`, `specs/021-financeiro-asaas-gestor/spec.md`
