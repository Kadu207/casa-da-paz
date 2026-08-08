# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-06

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Portal: estudos + oficinas + home; tesouraria 022–026 |
| Versão | 0.1.0-alpha |
| Commit | `main` (GitHub + GitLab) — pós-deploy VPS 2026-08-06 |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** — aguardando credenciais/chave do usuário (em breve) |
| Validação local | ✅ migrate · smoke tesouraria · estudos/eventos/oficinas |
| Deploy VPS | ✅ `deploy.sh` + migrate 18/18 + FE `index-B1tA4XDZ.js` |
| Conteúdo portal | ✅ prod: 3 estudos + giras/oficinas (`--portal-content`, 2026-08-06) |
| Segurança | ✅ harden `b423f36` + auditoria completa SUPERVISOR (028) |
| Auditoria | Menu `/app/auditoria` só SUPERVISOR; middleware mutações; migrate `20260808120000` |

## Specs

| Spec | Status |
|------|--------|
| 020 RBAC + policies no cadastro | ✅ |
| 022–025 tesouraria | ✅ |
| Contribuintes / 026 | ✅ |
| 027 materiais de estudo | ✅ |
| Oficinas (`TipoEvento`) | ✅ |
| 021 Asaas | Dormant até `ASAAS_API_KEY` (credenciais previstas em breve) |

## Documentação

Índice: `docs/00-index.md`. Workspace Cursor: `Casa da Paz.code-workspace`.

## Harness

- `agents.md` — construção + agentes ops  
- `.specify/memory/memory.md`  

## Próximos passos

1. ~~Implementar auditoria SUPERVISOR~~ (build local)  
2. Deploy VPS: migrate `20260808120000` + deploy.sh + sync FE (confirmação)  
3. Smoke: login supervisor → `/app/auditoria`  
4. Asaas quando houver chave  
