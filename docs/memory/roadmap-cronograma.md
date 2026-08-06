# Cronograma — Casa da Paz

**Atualizado:** 2026-08-06

## Concluído

| Fase | Escopo | Status |
|------|--------|--------|
| 001–006 core ERP | Auth, pessoas, recepção, inscrições, livraria | ✅ Prod |
| 003 financeiro v2 | Ledger, atrasados, fluxo, conciliação | ✅ Prod |
| 011 portal público | `/public/*`, LGPD, agendamento | ✅ Prod |
| 014 alertas UI | Badge + N8N lembrete | ✅ |
| 017–019 | Dashboard, painel médium, auditoria export | ✅ |
| 020 RBAC + policies | Hierarquia + `UsuarioPolicy` | ✅ (+ snapshot no cadastro) |
| 021 Asaas + marketing | Código completo | ✅ **dormant** sem chave |
| 022–025 tesouraria | AP, recorrência, DRE, OFX | ✅ Validado local |
| Contribuintes | Patrocínios / padrinhos + mensalidade médiuns | ✅ Validado local |
| Harness agents | `agents.md` + 5 agentes ops | ✅ |

## Sequência atual

```
✅ 022–025 + contribuintes + policies no cadastro
    ↓
⏳ Deploy VPS (main a040174+) — gate humano / SSH local
    ↓
012 Chatwoot/N8N polish (tokens)
    ↓
Ativar Asaas (sandbox → prod) só com chave + confirmação
    ↓
016 Next.js — só com aprovação + ADR-008/009
```

## Próxima onda

| Prioridade | Item | Notas |
|------------|------|-------|
| **1** | Deploy VPS tesouraria | Código em `main`; SSH do agente sem chave |
| **2** | Chatwoot/N8N prod polish | Token Meta / widget |
| **3** | Asaas sandbox | Quando houver `ASAAS_API_KEY` |
| **4** | Portal polish | Turnstile/CDN |

## Bloqueado / adiado

| Item | Motivo |
|------|--------|
| **016 Next.js** | ADR-008 — aprovação explícita |
| **Asaas produção** | Sem chave `$aact_prod_…` + confirmação |
| **NF-e / SPED** | Fora do ciclo atual |

## Pipeline

| Ambiente | Fluxo |
|----------|--------|
| CI | backend lint+test · frontend lint+build |
| VPS | `git pull` → build FE → `CASADAPAZ_DEPLOY_CONFIRMED=yes deploy.sh` |
| Smoke local | `scripts/test-tesouraria-022.ps1` |

## Referências

- Specs: `specs/022-*` … `025-*`, `021-*`, `020-*`  
- Docs: `docs/00-index.md`  
- Memória: `.specify/memory/project-memory.md`
