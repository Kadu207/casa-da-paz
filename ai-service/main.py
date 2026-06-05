"""Microsserviço IA — Casa da Paz
Agentes: Executor (parser), Validador (regras), Qualidade (fuzzy dedup)
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from rapidfuzz import fuzz
import openpyxl
from io import BytesIO
from datetime import datetime

app = FastAPI(title="Casa da Paz AI Service", version="0.1.0")


class PessoaCheck(BaseModel):
    nome: str
    telefone: str
    existentes: list[dict]


class ValidacaoLote(BaseModel):
    linhas: list[dict]


@app.get("/health")
def health():
    return {"status": "ok", "service": "casadapaz-ai"}


@app.post("/parse-excel")
async def parse_excel(file: UploadFile = File(...)):
    """Agente Executor — extrai e limpa planilha xlsx"""
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(400, "Arquivo deve ser .xlsx")
    content = await file.read()
    wb = openpyxl.load_workbook(BytesIO(content), read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise HTTPException(400, "Planilha vazia")
    headers = [str(h).strip().lower() if h else "" for h in rows[0]]
    linhas = []
    for i, row in enumerate(rows[1:], start=2):
        record = dict(zip(headers, row))
        record["_linha"] = i
        linhas.append(record)
    return {"total": len(linhas), "linhas": linhas}


@app.post("/validar-lote")
def validar_lote(body: ValidacaoLote):
    """Agente Validador — regras de negócio"""
    erros = []
    for linha in body.linhas:
        n = linha.get("_linha", "?")
        valor = linha.get("valor")
        if valor is not None:
            try:
                if float(valor) <= 0:
                    erros.append({"linha": n, "erro": "Valor deve ser positivo"})
            except (TypeError, ValueError):
                erros.append({"linha": n, "erro": "Valor inválido"})
        data = linha.get("data") or linha.get("data_transacao")
        if data:
            try:
                if isinstance(data, str):
                    datetime.fromisoformat(data.replace("/", "-"))
            except ValueError:
                erros.append({"linha": n, "erro": "Data em formato incorreto"})
    if erros:
        return {"ok": False, "erros": erros, "rollback": True}
    return {"ok": True, "linhas_validadas": len(body.linhas)}


@app.post("/deduplicar")
def deduplicar(body: PessoaCheck):
    """Agente Qualidade — fuzzy matching nome + telefone"""
    matches = []
    tel = "".join(c for c in body.telefone if c.isdigit())
    for p in body.existentes:
        score_nome = fuzz.ratio(body.nome.lower(), p.get("nome", "").lower())
        tel_ex = "".join(c for c in p.get("telefone", "") if c.isdigit())
        if tel and tel_ex and tel == tel_ex:
            matches.append({"pessoa": p, "motivo": "telefone_exato", "score": 100})
        elif score_nome >= 85:
            matches.append({"pessoa": p, "motivo": "nome_similar", "score": score_nome})
    return {"duplicata_provavel": len(matches) > 0, "matches": matches}
