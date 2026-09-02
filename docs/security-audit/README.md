# Auditoria de Segurança — Casa da Paz

## Status

**F01–F10: GREEN — Remediado / Validado** (2026-09-02)  
Detalhe: [`ACHADOS.md`](./ACHADOS.md)

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `ACHADOS.md` | Matriz de status pós-remediação + evidências |
| `relatorio-auditoria-seguranca.pdf` | Relatório visual original (pt-BR) |
| `gerar_relatorio.py` | Script regenerável do PDF |
| `DEPLOY-PREP-P1.md` | Prep histórico do deploy P1 |
| `.venv/` | Ambiente Python isolado (não versionar se preferir) |

## Smoke produção

```powershell
cd "C:\Projetos DEV\Casa da Paz"
.\scripts\smoke-audit-f01-f10-prod.ps1
```

Esperado: PASS sem FAIL.

## Regenerar o PDF

```powershell
cd "c:\Projetos DEV\Casa da Paz"
python -m venv docs\security-audit\.venv
.\docs\security-audit\.venv\Scripts\pip install reportlab pillow
.\docs\security-audit\.venv\Scripts\python docs\security-audit\gerar_relatorio.py
```

Não instala pacotes globalmente. O PDF descreve o estado **pré-remediação**; a fonte de verdade pós-fix é `ACHADOS.md`.
