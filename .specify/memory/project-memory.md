# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-08

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Portal + tesouraria + CRUD ops 029 |
| Versão | 0.1.0-alpha |
| Commit | `main` — CRUD usuários/livraria/eventos (029) |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** — aguardando credenciais/chave do usuário |
| Validação local | ✅ vitest RBAC · tsc FE/BE |
| Deploy VPS | ⏳ aguardando confirmação (migrate `usuario_ativo` + FE sync) |
| Segurança | ✅ harden + auditoria SUPERVISOR (028) |
| Auditoria | ✅ prod `088d075` |
| CRUD 029 | ✅ `Usuario.ativo` · Livraria `estoque` · Eventos PUT/DELETE |

## Specs

| Spec | Status |
|------|--------|
| 020 RBAC + policies no cadastro | ✅ |
| 022–025 tesouraria | ✅ |
| Contribuintes / 026 | ✅ |
| 027 materiais de estudo | ✅ |
| Oficinas (`TipoEvento`) | ✅ |
| 028 auditoria SUPERVISOR | ✅ |
| 029 CRUD usuários/livraria/eventos | ✅ |
| 021 Asaas | Dormant até `ASAAS_API_KEY` |

## Documentação

Índice: `docs/00-index.md`. Workspace Cursor: `Casa da Paz.code-workspace`.

## Harness

- `agents.md` — construção + agentes ops  
- `.specify/memory/memory.md`  

## Próximos passos

1. Deploy VPS: migrate `20260808140000_usuario_ativo` + `deploy.sh` + sync FE (confirmação)  
2. Opcional: resync policies `CONFIRM_SEED_USERS=yes` se grants desatualizados  
3. Smoke: SUPERVISOR usuários; LIVRARIA estoque; RECEPCAO/MARKETING eventos  
4. Asaas quando houver chave  
