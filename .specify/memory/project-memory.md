# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-11

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: security ops + multi-app |
| Versão | 0.1.0-alpha |
| Commit | `50d8abc` em `main` (smoke own-scope) |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** |
| Deploy VPS | ✅ own-scope + smoke MEDIUM OK |
| Segurança | ✅ host lockdown; own-scope agregados; OFX/Asaas Zod |
| CodeRabbit | ✅ PR #2 **fechado** (smoke ok; config em main) |
| Multi-app | ✅ n8n-excellence 200; Swarm n8n **não** subir; agenda loops = CF |
| CRUD 029 | ✅ prod + smoke |

## Specs

| Spec | Status |
|------|--------|
| 020–029 | ✅ |
| 030 security hardening | ✅ |
| 021 Asaas | Dormant |

## Harness

- `agents.md` — construção + ops + **security-ops**
- Checklists skills datados 2026-08-08
- Smoke MEDIUM: `scripts/test-own-scope-medium.ps1`
- CodeRabbit: `docs/coderabbit.yaml` (raiz `.coderabbit.yaml` bloqueada no Windows)
- Spec Kit: `.specify/README.md` + templates
- CI: GitHub + GitLab com `npm test` BE/FE

## Próximos passos

1. Cloudflare (manual): SSL Full + origins agenda/`api`/healthplataform; Gastro → `127.0.0.1:9088`  
2. Asaas quando houver chave  
3. Opcional: apontar `wf` → excellence `:5678`  
