# Auditoria de Segurança — Casa da Paz

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `relatorio-auditoria-seguranca.pdf` | Relatório visual (pt-BR) |
| `gerar_relatorio.py` | Script regenerável |
| `.venv/` | Ambiente Python isolado (não versionar se preferir) |

## Regenerar o PDF

```powershell
cd "c:\Projetos DEV\Casa da Paz"
python -m venv docs\security-audit\.venv
.\docs\security-audit\.venv\Scripts\pip install reportlab pillow
.\docs\security-audit\.venv\Scripts\python docs\security-audit\gerar_relatorio.py
```

Não instala pacotes globalmente.
