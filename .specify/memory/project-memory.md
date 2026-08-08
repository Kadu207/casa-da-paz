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
| Segurança | ✅ app harden + firewall `:9080` (iptables CASADAPAZ-9080) |
| CRUD 029 | ✅ prod + smoke |

## Specs

| Spec | Status |
|------|--------|
| 020–029 | ✅ |
| 030 security hardening | ✅ prod (firewall sudo pendente) |
| 021 Asaas | Dormant |

## Harness

- `agents.md` — construção + ops + **security-ops**
- Checklists skills datados 2026-08-08
- V1/V2 028/029 formalizados em `tasks.md`
- CodeRabbit: `docs/coderabbit.yaml` (ativar app GitHub; raiz `.coderabbit.yaml` bloqueada no Windows)
- Spec Kit: `.specify/README.md` + templates
- CI: GitHub + GitLab com `npm test` BE/FE

## Próximos passos

1. ~~Firewall `:9080`~~ ✅  
2. Ativar/verificar CodeRabbit no GitHub (`docs/coderabbit.yaml`)  
3. Asaas quando houver chave  
4. Opcional: `sudo apt install iptables-persistent` na VPS para persistir regras após reboot  
