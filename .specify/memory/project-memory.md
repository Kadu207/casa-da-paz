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
| Conteúdo portal | Seed `--portal-content` (estudos + giras/oficinas) — rodar em prod após pull |

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

1. Na VPS: `git pull` + `compose-prod.sh exec backend npx tsx prisma/seed.ts --portal-content` (não rodar seed completo em prod)  
2. Smoke: `/public/estudos` · `/public/eventos` (Giras/Oficinas)  
3. Ativar Asaas quando chegar `ASAAS_API_KEY` + confirmação explícita  
