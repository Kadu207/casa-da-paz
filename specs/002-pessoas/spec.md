# Feature 002 — Pessoas

## User Stories
- Como recepção/diretoria, quero cadastrar e buscar pessoas para check-in e vínculos
- Como operador, quero alertas de duplicata por telefone/nome antes de salvar

## Acceptance
- [x] CRUD `/api/pessoas` com RBAC (write: DIRETORIA, RECEPCAO)
- [x] Busca por `q` (nome/telefone) e filtro telefone normalizado
- [x] Endpoint `GET /api/pessoas/sugerir-duplicatas`
- [x] Bloqueio 409 em telefone duplicado
- [x] UI PessoasPage com aviso fuzzy e modo leitura para FINANCEIRO/LIVRARIA/SUPORTE
