# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-11

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: security ops + gates 030 |
| Versão | 0.1.0-alpha |
| Commit | `a03eadc` em `main` (GitHub + GitLab + VPS) |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** |
| Deploy VPS | ✅ `a03eadc` — own-scope block + Asaas/OFX Zod |
| Segurança | ✅ host lockdown + Swarm; backend own-scope em agregados + Zod Asaas/OFX |
| CodeRabbit | ✅ `.coderabbit.yaml` em `main` + check SUCCESS no [PR #2](https://github.com/Kadu207/casa-da-paz/pull/2) |
| CRUD 029 | ✅ prod + smoke |

## Specs

| Spec | Status |
|------|--------|
| 020–029 | ✅ |
| 030 security hardening | ✅ prod + firewall host completo (incl. Swarm) |
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
2. Asaas quando houver chave  
