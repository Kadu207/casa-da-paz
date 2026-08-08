# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-08

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: security ops + gates 030 |
| Versão | 0.1.0-alpha |
| Commit | `2422dae` em `main` (GitHub + GitLab + VPS) |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** |
| Deploy VPS | ✅ 030 headers/CSP + FE `index-BdCnS8Id.js` |
| Segurança | ✅ app harden + host lockdown P0–P2 (5440 local; 9500/9501/800x/9088/9180 filtrados; 3000/8195 local) |
| CodeRabbit | ✅ `.coderabbit.yaml` em `main` + check SUCCESS no [PR #2](https://github.com/Kadu207/casa-da-paz/pull/2) |
| CRUD 029 | ✅ prod + smoke |

## Specs

| Spec | Status |
|------|--------|
| 020–029 | ✅ |
| 030 security hardening | ✅ prod + firewall host P0–P2 aplicado |
| 021 Asaas | Dormant |

## Harness

- `agents.md` — construção + ops + **security-ops**
- Checklists skills datados 2026-08-08
- V1/V2 028/029 formalizados em `tasks.md`
- CodeRabbit: `docs/coderabbit.yaml` (ativar app GitHub; raiz `.coderabbit.yaml` bloqueada no Windows)
- Spec Kit: `.specify/README.md` + templates
- CI: GitHub + GitLab com `npm test` BE/FE

## Próximos passos

1. Fechar PR smoke CodeRabbit #2 (opcional)  
2. Avaliar Swarm `:2377/:7946` e porta `:20243` (runbook firewall)  
3. Asaas quando houver chave  
