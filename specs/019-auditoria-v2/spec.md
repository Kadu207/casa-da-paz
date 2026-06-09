# Feature 019 — Auditoria V2 (export CSV/PDF)

**Status:** ✅ Concluído (2026-06-09)  
**Personas:** DIRETORIA, SUPORTE  
**RBAC:** `logs: read`

## Escopo

| In | Detalhe |
|----|---------|
| Filtros | setor, rota, período, busca, ordenação |
| Export CSV | até 5000 registros, BOM UTF-8, i18n labels |
| Export PDF | pdfkit, mesmos filtros |
| Audit trail | export registra `admin.auditoria.export.*` |
| UI | `/app/auditoria` — botões CSV/PDF com filtros aplicados |

## API

- `GET /auditoria` — paginação
- `GET /auditoria/export.csv?...`
- `GET /auditoria/export.pdf?...`

Parâmetros compartilhados: `locale`, `setor`, `rota`, `de`, `ate`, `q`, `sort`, `order`.

## Acceptance

- [x] Export respeita filtros e ordenação
- [x] Filename com intervalo quando de/até
- [x] i18n rotas financeiro conciliação
- [x] Testes `auditoria-export` + PDF
- [x] UI com erro/loading export
