# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-06

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Materiais de estudo públicos (ervas/banhos) + Marketing |
| Versão | 0.1.0-alpha |
| Commit docs/código | `a040174`+ em `main` (GitHub/GitLab) |
| Produção | https://casadapaz.inovatitech.com.br |
| Asaas (021) | **Dormant** — tesouraria opera sem PSP |
| Validação local | ✅ migrate + smoke tesouraria + contribuintes |
| Deploy VPS desta onda | ⏳ pendente (SSH do agente sem chave — rodar no terminal do usuário) |

## Specs

| Spec | Status |
|------|--------|
| 020 RBAC + policies no cadastro | ✅ |
| 022–025 tesouraria | ✅ |
| Contribuintes / 026 | ✅ |
| 027 materiais de estudo | ✅ |
| 021 Asaas | Dormant até `ASAAS_API_KEY` |

## Documentação

Índice atualizado em `docs/00-index.md` (stack canônica Express/Vite — refs Lovable só em `docs/reference/lovable/`).

## Harness

- `agents.md` — construção + 5 agentes ops  
- `.specify/memory/memory.md`  

## Próximos passos

1. Deploy VPS no terminal local do usuário (`git pull` + build FE + `deploy.sh`)  
2. Smoke produção: health + Financeiro → Patrocínios + Cadastros → Médiuns  
3. Asaas quando houver chave  
