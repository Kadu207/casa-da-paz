"""Gera planilha de exemplo para teste de importação financeira."""
from pathlib import Path
import openpyxl

OUT = Path(__file__).resolve().parent / "sample-import.xlsx"

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Import"
ws.append(["nome", "telefone", "valor", "categoria", "tipo", "data"])
ws.append(["Maria Teste Import", "31988887777", 150.0, "DOACAO", "RECEITA", "2026-06-01"])
ws.append(["Joao Doacao", "31977776666", 80.0, "DOACAO", "RECEITA", "2026-06-02"])
wb.save(OUT)
print(f"Gerado: {OUT}")
