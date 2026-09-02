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
| Ago/2026 | **031 Estoque primário** (almoxarifado casa, grupos limpeza, checklist) — ADR-010 |
| Ago/2026 | **030 Security hardening** (Helmet, uploads, :9080, secrets) |
| Set/2026 | Auditoria F01–F10 remediada + smoke prod **GREEN** |
| Set/2026 | **033 Delegações** (funções/tarefas/N8N) — ADR-011 |
| Set/2026 | CSP mapa OSM no portal (“Onde nos encontrar”) |

## 9.2. Estado atual

Ver [`.specify/memory/project-memory.md`](../.specify/memory/project-memory.md) e [roadmap operacional](./memory/roadmap-cronograma.md).

## 9.3. Próximos passos

1. Mensageria polish: SMTP N8N, inbox WhatsApp Meta, corrigir Chatwoot público 502  
2. Ativar Asaas sandbox/produção **somente** com chave e confirmação  
3. Controle de **ingressos/eventos** (032) — aguarda priorização  
4. Next.js (016) — bloqueado por ADR-008 até aprovação  

## 9.4. Referência Lovable

O protótipo Lovable/Supabase permanece em `docs/reference/lovable/` apenas como histórico visual — **não** descreve a stack em produção.
