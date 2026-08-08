# Tasks — 029 CRUD Usuários / Livraria / Eventos

## Validador Integração (V1) — 2026-08-08

| Item | OK | Evidência |
|------|----|-----------|
| `Usuario.ativo` schema + migration | sim | `20260808140000_usuario_ativo` |
| Login rejeita inativo | sim | `auth.ts` |
| PUT setor resnapshot policies | sim | `auth.ts` transaction |
| Livraria UI `estoque` write | sim | `LivrariaPage.tsx` + rbac MARKETING sem estoque |
| Eventos PUT/DELETE | sim | `eventos.ts` + `EventosPage.tsx` |
| FE ↔ API usuários/edit/delete | sim | `UsuariosPage.tsx` |

## Validador Qualidade (V2) — 2026-08-08

| Item | OK | Evidência |
|------|----|-----------|
| Spec acceptance marcada | sim | `spec.md` |
| Testes RBAC snapshot MARKETING | sim | `rbac-snapshot.test.ts` |
| CI GitHub | sim | run 31261582941 |
| Deploy VPS + smoke manual | sim | `cf17f28`; usuário 2026-08-08 |

**Resultado:** APROVADO V1+V2
