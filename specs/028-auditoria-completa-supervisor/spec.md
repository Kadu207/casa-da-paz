# Feature 028 — Auditoria completa (somente SUPERVISOR)

**Status:** Implementado  
**Persona:** SUPERVISOR  
**Menu:** ERP → Auditoria → `/app/auditoria`

## Escopo

| In | Detalhe |
|----|---------|
| Middleware | Registra POST/PUT/PATCH/DELETE em `/api/*` |
| Auth | Login sucesso/falha explícito |
| Modelo | login, metodo, recurso, acao, statusHttp, sucesso, detalhe |
| RBAC | Somente SUPERVISOR (API `requireSupervisor` + FE) |
| UI | Colunas usuário/ação/status; export CSV/PDF (019) |

## Fora

- GETs de listagem
- SIEM / retenção automática

## Acceptance

- [x] DIRETORIA/SUPORTE sem acesso a `/api/auditoria`
- [x] SUPERVISOR lista e exporta
- [x] Mutações geram linha em `admin_audit_log`
- [x] Senhas/tokens não persistem em `detalhe`
