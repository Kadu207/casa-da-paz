# Guia Lovable → Cursor

## Módulos para prototipar
1. Login / Dashboard
2. Financeiro (tabela adimplência)
3. Recepção check-in
4. Livraria PDV
5. Portal público

## Fluxo
1. Prototipar no Lovable com tokens: navy `#0F172A`, gold `#D4AF37`
2. Export → branch `lovable/export-<modulo>`
3. Agente A3 refatora em `frontend/src/`
4. Conectar `src/lib/api.ts` — remover mocks

## Design reference
Ver PDF slides 6-8 para dashboards e tabela administrativa.
