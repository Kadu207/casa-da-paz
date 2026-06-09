# Cronograma — Casa da Paz

**Atualizado:** 2026-06-09

## Concluído

| Fase | Escopo | Status |
|------|--------|--------|
| **003-financeiro-v2 S1–S3** | API + 4 abas UI (Vite) | ✅ Produção + smoke |
| **011-portal-publico** (core) | `/public/*`, LGPD, agendamento | ✅ Produção |
| **001–006** (core ERP) | Auth, pessoas, recepção, inscrições, livraria | ✅ Base em prod |
| **017-dashboard-v2** | Filtro mês/ano no dashboard | ✅ Implementado |
| **018-painel-medium** | Painel MEDIUM (mensalidades, presenças, inscrições) | ✅ Implementado |

## Sequência acordada (Opção A)

```
✅ S2 backend + S3 UI financeiro (Vite)
✅ 017-dashboard-v2 (filtro período)
    ↓
✅ 018-painel-medium
    ↓
Auditoria V2 / 012-chatwoot-n8n-prod   ← próximo
    ↓
014-alertas-ui + automações N8N
    ↓
016-frontend-nextjs (monorepo /public + /app) — só com aprovação + ADR-009
```

## Próxima onda (recomendada)

| Prioridade | Epic / escopo | Notas |
|------------|---------------|-------|
| **1** | ~~Dashboard v2~~ | ✅ |
| **2** | ~~Painel Médium~~ | ✅ |
| **3** | **Auditoria V2** | Export CSV/PDF + filtros |
| **4** | **012 Chatwoot/N8N prod** | Token Meta + env VPS |
| **5** | **Portal polish** | Turnstile prod, imagens CDN |

## Bloqueado / adiado

| Item | Motivo |
|------|--------|
| **016 Next.js** | ADR-008 — aguarda aprovação explícita do usuário |
| **Espelhamento Windows/Debian** | Posterior — runbook em `dev-windows-linux-sync.md` |
| **Chatwoot widget prod** | `VITE_CHATWOOT_WEBSITE_TOKEN` pendente |

## Pipeline (inalterado)

| Ambiente | Fluxo |
|----------|--------|
| CI | `backend`: lint + test · `frontend`: lint + build |
| VPS | `git pull` → backup → `deploy.sh` · frontend via `sync-frontend-vps.ps1` / `.sh` |
| Next.js (futuro) | Novo job CI + runbook — só após 016 |

## Referências

- Dashboard: `specs/017-dashboard-v2/`
- Painel Médium: `specs/018-painel-medium/`
- Financeiro v2: `specs/003-financeiro-v2/`
- Portal: `specs/011-portal-publico/spec.md`
- Next.js (futuro): `specs/016-frontend-nextjs/spec.md`
- ADR adiamento Next: `docs/memory/decisions/008-defer-nextjs-pos-financeiro-v2.md`
