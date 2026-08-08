# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-08

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: security ops + gates 030 |
| Versão | 0.1.0-alpha |
| Commit | em andamento — security hardening 030 |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** |
| Deploy VPS | ⏳ 030 (headers + firewall + redeploy) |
| Segurança | harden app + `agent-security-ops` + CI tests FE |
| CRUD 029 | ✅ prod + smoke |

## Specs

| Spec | Status |
|------|--------|
| 020–029 | ✅ |
| 030 security hardening | ⏳ |
| 021 Asaas | Dormant |

## Harness

- `agents.md` — construção + ops + **security-ops**
- Checklists skills datados 2026-08-08
- V1/V2 028/029 formalizados em `tasks.md`
- CodeRabbit: `docs/coderabbit.yaml` (ativar app GitHub; raiz `.coderabbit.yaml` bloqueada no Windows)
- Spec Kit: `.specify/README.md` + templates
- CI: GitHub + GitLab com `npm test` BE/FE

## Próximos passos

1. Deploy 030 + `harden-origin-9080.sh` (sudo)
2. Instalar app CodeRabbit no GitHub apontando `docs/coderabbit.yaml` ou copiar para `.coderabbit.yaml` no Linux
3. Asaas quando houver chave
