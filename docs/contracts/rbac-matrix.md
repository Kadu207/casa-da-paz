# Matriz RBAC — Casa da Paz (hierárquica)

## Papéis de sistema

| Papel | Nível | Escopo |
|-------|-------|--------|
| **SUPERVISOR** | Master operacional | Usuários, políticas, cadastros, financeiro, manutenção — **não** integrações write |
| **ADMIN** | Técnico | Integrações (N8N, webhooks Asaas, Chatwoot), logs |

## Papéis operacionais (policies configuráveis pelo SUPERVISOR)

| Recurso / Ação | DIRETORIA | FINANCEIRO | TESOURARIA | MARKETING | RECEPCAO | LIVRARIA | MEDIUM | SUPORTE |
|----------------|-----------|------------|------------|-----------|----------|----------|--------|---------|
| Usuários CRUD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pessoas CRUD | ✅ | 👁️ | 👁️ | ❌ | ✅ | 👁️ | ❌ | 👁️ |
| Financeiro | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ próprio | ❌ |
| Cobranças Asaas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ próprio | ❌ |
| Contas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transparência | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Contas a pagar | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Recorrência | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Patrocínios / Padrinhos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DRE / orçamento | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Conciliação OFX | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Marketing | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Import Excel | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Eventos / check-in | ✅ | 👁️ | 👁️ | ✅ (publicar) | ✅ | ❌ | ❌ | ❌ |
| PDV/Livraria/Estoque (venda) | ✅ | 👁️ | 👁️ | ✅ (publicar conteúdo; **sem** `estoque`) | ❌ | ✅ | ❌ | ❌ |
| Estoque da Casa (`estoque_casa`) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌* | ❌ |
| Delegações (`delegacoes`) | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| Ecommerce | ✅ | 👁️ | 👁️ | ✅ (publicar) | ❌ | ✅ | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ próprio | ❌ |
| Agendamentos | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Auditoria (logs de atividades) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Alertas | ✅ | ✅ | ✅ | ❌ | 👁️ | ❌ | ❌ | 👁️ |
| Logs/Manutenção | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Auditoria:** somente **SUPERVISOR** (fora da tabela operacional). Menu ERP → **Auditoria** (`/app/auditoria`). DIRETORIA/SUPORTE não têm acesso.

**MARKETING** publica eventos/conteúdo/galeria (`eventos`/`livraria`/`marketing` write; upload Cloudflare Images via `marketing` **ou** `eventos` write) mas **não** cadastra estoque (`estoque` só DIRETORIA/LIVRARIA/SUPERVISOR). Cadastro de livros: setor LIVRARIA.

**Galeria (Spec 034):** CRUD em `/api/marketing/galeria` com resource `marketing`. Consumo interno `/api/galeria` e menu `/app/galeria` para **qualquer usuário autenticado**. Portal público `/public/galeria` só itens `PUBLICO` ao vivo.

**Estoque da Casa (`estoque_casa`):** almoxarifado primário (ADR-010). Write default: SUPERVISOR, ADMIN, DIRETORIA, TESOURARIA. \*MEDIUM: policy `write` para catálogo/movimentações; responsável de `GrupoLimpeza` ativo recebe **read** + checklist do próprio grupo (não write org-wide). Separado do estoque de venda da livraria.

**Delegações (`delegacoes`):** quadro de funções da casa (ADR-011). Write: SUPERVISOR, ADMIN, DIRETORIA. Read: todos os setores operacionais (+ MEDIUM). Toggle de tarefa exige apenas `read`.

**TESOURARIA** = setor operacional dos logins `tesouraria01`–`04` (mesma matriz financeira que FINANCEIRO; FINANCEIRO permanece por compatibilidade).

**SUPERVISOR** gerencia usuários operacionais e define `usuario_policies.grants` **no ato do cadastro** (snapshot do setor + overrides). Edição posterior via UI Políticas.

Legenda: ✅ total | 👁️ leitura/limitado | ❌ negado

Specs: `specs/020-rbac-hierarquia-policies/spec.md`, `specs/021-financeiro-asaas-gestor/spec.md`, `specs/022-contas-a-pagar/` … `025-conciliacao-ofx/`, `specs/026-contribuintes-patrocinio-padrinho/`
