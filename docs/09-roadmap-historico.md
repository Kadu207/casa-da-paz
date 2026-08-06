# 9. Histórico e Roadmap

## 9.1. Entregas recentes (2026)

| Período | Entrega |
|---------|---------|
| Jun/2026 | Financeiro v2, portal público, dashboard v2, painel médium, auditoria v2, alertas |
| Jun/2026 | RBAC hierárquico + `UsuarioPolicy` (020) |
| Ago/2026 | Asaas + marketing (021) — código pronto, **dormant** sem chave |
| Ago/2026 | Tesouraria 022–025 (AP, recorrência, DRE, OFX) sem Asaas |
| Ago/2026 | Patrocínios/padrinhos + mensalidade na lista de médiuns |
| Ago/2026 | Policies **no ato do cadastro** de usuário |
| Ago/2026 | Harness `agents.md` + 5 agentes de operação pós-construção |

Commit de referência tesouraria+policies: `a040174` (main).

## 9.2. Estado atual

Ver [`.specify/memory/project-memory.md`](../.specify/memory/project-memory.md) e [roadmap operacional](./memory/roadmap-cronograma.md).

## 9.3. Próximos passos

1. Deploy VPS do `main` atual (gate humano — SSH no terminal do usuário se o agente não tiver chave)  
2. Ativar Asaas sandbox/produção **somente** com chave e confirmação  
3. Chatwoot/N8N polish (tokens Meta / widget)  
4. Next.js (016) — bloqueado por ADR-008 até aprovação  

## 9.4. Referência Lovable

O protótipo Lovable/Supabase permanece em `docs/reference/lovable/` apenas como histórico visual — **não** descreve a stack em produção.
