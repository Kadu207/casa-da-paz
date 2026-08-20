# Cronograma — Casa da Paz

**Atualizado:** 2026-08-20

## Concluído

| Fase | Escopo | Status |
|------|--------|--------|
| 001–006 core ERP | Auth, pessoas, recepção, inscrições, livraria | ✅ Prod |
| 003 financeiro v2 | Ledger, atrasados, fluxo, conciliação | ✅ Prod |
| 011 portal público | `/public/*`, LGPD, agendamento | ✅ Prod |
| 014 alertas UI | Badge + N8N lembrete | ✅ |
| 017–019 | Dashboard, painel médium, auditoria export | ✅ |
| 020 RBAC + policies | Hierarquia + `UsuarioPolicy` | ✅ |
| 021 Asaas + marketing | Código completo | ✅ **dormant** — ver `docs/memory/runbooks/asaas-dormant.md` |
| 022–025 tesouraria | AP, recorrência, DRE, OFX | ✅ Prod |
| Contribuintes | Patrocínios / padrinhos | ✅ Prod |
| 030 security | Hardening | ✅ Prod |
| **031 estoque casa** | Almoxarifado primário | ✅ Prod |
| Stash VPS `vps-before-031` | Removido | ✅ |

## Sequência atual

```
✅ 031 Estoque em produção
    ↓
📋 032 Ingressos/eventos (spec stub — ADR-010) — aguarda abertura
    ↓
021 Asaas — dormant até chave + confirmação
    ↓
012 Chatwoot/N8N polish
    ↓
016 Next.js — ADR-008
```

## Próxima onda

| Prioridade | Item | Notas |
|------------|------|-------|
| **1** | Spec 032 detalhada | Só quando priorizar ingressos |
| **2** | Asaas sandbox | `asaas-dormant.md` gate |
| **3** | SSH allowlist :65025 | Script `infra/scripts/allowlist-ssh-65025.sh` (opcional) |
| **4** | Chatwoot/N8N | Tokens Meta / widget |
