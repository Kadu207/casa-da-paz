# Feature 029 — CRUD Usuários, Livraria (estoque) e Eventos

**Status:** Implementado  
**Data:** 2026-08-08  
**Estende:** `001-auth-rbac`, `006-livraria-pdv`, `005-inscricoes`, `020-rbac-hierarquia-policies`

## Objetivo

Completar gestão operacional: editar/desativar/excluir usuários; alinhar UI da Livraria ao grant `estoque`; CRUD de eventos em `/app/eventos`.

## Escopo

| Área | In |
|------|-----|
| Usuários | `Usuario.ativo`; login bloqueia inativo; UI editar/ativar/desativar/excluir (SUPERVISOR); resnapshot de `usuario_policies` ao mudar setor |
| Livraria | Forms de produto/estoque só com `estoque` write; conteúdo com `livraria` write; aviso MARKETING sem estoque |
| Eventos | `PUT`/`DELETE /api/eventos/:id`; UI abas Cadastro \| Inscrições; filtro ABERTO/ENCERRADO/todos |

## RBAC

| Função | Grant | Setores padrão |
|--------|-------|----------------|
| Usuários CRUD | `usuarios` write | SUPERVISOR |
| Livros + estoque | `estoque` write | DIRETORIA, LIVRARIA (+ SUPERVISOR) |
| Novidades/dicas | `livraria` write | MARKETING, LIVRARIA, DIRETORIA |
| Eventos CRUD | `eventos` write | DIRETORIA, MARKETING, RECEPCAO (+ SUPERVISOR) |

MARKETING **não** recebe `estoque`.

## Acceptance

- [x] Usuário inativo não autentica
- [x] SUPERVISOR edita, desativa e exclui usuários operacionais
- [x] Mudança de setor regenera snapshot de policies
- [x] MARKETING não vê form enganoso de cadastro de estoque
- [x] Eventos: criar, editar, encerrar/reabrir, excluir (sem inscritos)
- [x] Matriz `rbac-matrix.md` documenta MARKETING sem estoque
