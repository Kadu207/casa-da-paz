# 6. Design System

**UI viva:** `frontend/src/` (Tailwind + tokens CSS do tema Casa da Paz).

## 6.1. Identidade

Tema umbandista: terra, ouro/âmbar (`--color-accent`), superfícies escuras (`--color-surface`), tipografia serif em títulos ERP.

## 6.2. Tokens (ERP)

Preferir variáveis CSS do tema (`var(--color-accent)`, `var(--color-surface)`, `var(--color-danger)`).  
Portal público pode usar classes `primary` / Tailwind do design do portal.

## 6.3. Layouts

| Área | Layout |
|------|--------|
| Portal | `components/public/*` |
| ERP shell | layout autenticado + nav |
| Financeiro | `FinanceiroLayout` (abas) |
| Cadastros | `CadastroSecaoTable` por função |

## 6.4. i18n

Chaves em `frontend/src/i18n/erp-pt-BR.ts` e `erp-en.ts`.  
Não hardcodar strings de UI novas em português apenas.

## 6.5. Referência visual histórica

Mockups Lovable: `docs/reference/lovable/06-design-system.md` (não espelha 1:1 o ERP atual).
