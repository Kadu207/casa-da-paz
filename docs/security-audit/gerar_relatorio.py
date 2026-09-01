#!/usr/bin/env python3
"""
Gera o Relatório de Auditoria de Segurança — Casa da Paz (PDF A4).
Uso (venv local, sem install global):
  python -m venv docs/security-audit/.venv
  docs/security-audit/.venv/Scripts/pip install reportlab pillow
  docs/security-audit/.venv/Scripts/python docs/security-audit/gerar_relatorio.py
"""
from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT_DIR = Path(__file__).resolve().parent
PDF_PATH = OUT_DIR / "relatorio-auditoria-seguranca.pdf"
PROJECT = "Casa da Paz Management System Cloud"
AUDIT_DATE = date.today().strftime("%d/%m/%Y")

CRIT = colors.HexColor("#B91C1C")
ALTA = colors.HexColor("#EA580C")
MEDIA = colors.HexColor("#D97706")
BAIXA = colors.HexColor("#2563EB")
FORTE = colors.HexColor("#059669")
INFO = colors.HexColor("#64748B")
BG = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#E2E8F0")
TEXT = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#475569")

SEV_COLOR = {
    "crítica": CRIT,
    "alta": ALTA,
    "média": MEDIA,
    "baixa": BAIXA,
    "informativa": INFO,
}
SEV_HEX = {
    "crítica": "#B91C1C",
    "alta": "#EA580C",
    "média": "#D97706",
    "baixa": "#2563EB",
    "informativa": "#64748B",
}

FINDINGS = [
    {
        "id": "F01",
        "sev": "crítica",
        "cat": "1. Isolamento / IDOR",
        "file": "backend/src/lib/listagem-financeiro.ts",
        "lines": "105-110",
        "title": "Query pessoaId sobrescreve escopo own na listagem financeira",
        "desc": (
            "buildListagemWhere copia o scope (own → {pessoaId do JWT}) e depois "
            "sobrescreve base.pessoaId com filtros.pessoaId da query, sem validar igualdade."
        ),
        "exploit": (
            "MEDIUM com financeiro:own autentica e chama GET /api/financeiro?pessoaId=<outro> "
            "para listar lançamentos alheios."
        ),
        "code": "const base = { ...scope }; … if (filtros.pessoaId) base.pessoaId = filtros.pessoaId;",
        "impact": "Quebra de confidencialidade financeira entre médiuns (IDOR).",
        "fix": (
            "Se scope já define pessoaId, ignorar filtros.pessoaId ou exigir igualdade "
            "(403 se divergir). Teste de regressão obrigatório."
        ),
    },
    {
        "id": "F02",
        "sev": "crítica",
        "cat": "1. Isolamento / IDOR",
        "file": "backend/src/routes/financeiro.ts",
        "lines": "130-138",
        "title": "GET /api/financeiro propaga pessoaId da query para buildListagemWhere",
        "desc": (
            "Handler autenticado com authorize(financeiro,read) passa parseListagemQuery "
            "(inclui pessoaId) e mediumScope(req) para buildListagemWhere — vetor de F01."
        ),
        "exploit": "Mesmo vetor de F01 via endpoint de listagem.",
        "code": "buildListagemWhere(parsed, mediumScope(req));",
        "impact": "Exposição de dados financeiros de terceiros via API.",
        "fix": "Não passar pessoaId da query quando reqIsOwnScope; ou validar no handler.",
    },
    {
        "id": "F03",
        "sev": "alta",
        "cat": "2. Permissão / privilégio",
        "file": "backend/src/routes/estoque-casa.ts",
        "lines": "68-84, 109-110",
        "title": "Responsável de limpeza recebe write org-wide em estoque_casa",
        "desc": (
            "requireEstoqueCasa chama assertEstoqueCasaAccess sem grupoId. "
            "isResponsavelGrupoLimpeza(userId) sem grupoId = qualquer grupo ativo. "
            "enrichEstoqueCasaGrants também promove a write (estoque-casa.ts lib:27-28)."
        ),
        "exploit": (
            "Médium responsável de limpeza sem policy estoque_casa:write cria/altera itens "
            "e movimentações (POST /itens, POST /movimentacoes)."
        ),
        "code": "return isResponsavelGrupoLimpeza(user.userId, grupoId); // grupoId omitido",
        "impact": "Elevação de privilégio — integridade do estoque da casa.",
        "fix": (
            "Bypass só em rotas de checklist do próprio grupo; itens/mov exigem "
            "authorize('estoque_casa','write')."
        ),
    },
    {
        "id": "F04",
        "sev": "alta",
        "cat": "4. Segredos / defaults",
        "file": "infra/docker-compose.yml + runtime-env.ts",
        "lines": "compose:32; runtime-env:3-8",
        "title": "JWT default 'dev-secret' fora da denylist de produção",
        "desc": (
            "docker-compose.yml usa JWT_SECRET=${JWT_SECRET:-dev-secret}. "
            "DEV_DEFAULTS em runtime-env.ts lista 'dev-secret-change-me' mas NÃO 'dev-secret'. "
            "check-prod-secrets.sh também omite 'dev-secret'. compose.prod exige JWT sem default "
            "(mitigação parcial se só prod for usado)."
        ),
        "exploit": (
            "Ambiente com CASADAPAZ_ENV/NODE_ENV=production e JWT_SECRET=dev-secret "
            "(copiado do compose de dev) passa resolveSecret e permite forjar JWTs."
        ),
        "code": "JWT_SECRET: ${JWT_SECRET:-dev-secret}  // DEV_DEFAULTS sem 'dev-secret'",
        "impact": "Comprometimento de autenticação se default for usado em runtime prod.",
        "fix": "Incluir 'dev-secret' e 'changeme' na denylist; alinhar check-prod-secrets.sh.",
    },
    {
        "id": "F05",
        "sev": "média",
        "cat": "4. Segredos / defaults",
        "file": "backend/src/lib/n8n.ts",
        "lines": "28",
        "title": "Fallback n8n-dev-secret sem resolveSecret no outbound N8N",
        "desc": (
            "dispararN8n usa process.env.N8N_WEBHOOK_SECRET ?? 'n8n-dev-secret' "
            "sem resolveSecret. Em produção sem env, envia header com segredo público "
            "para o webhook N8N (se N8N_URL estiver setado)."
        ),
        "exploit": "Atacante que conhece n8n-dev-secret pode forjar chamadas se o N8N confiar no header.",
        "code": "const secret = process.env.N8N_WEBHOOK_SECRET ?? 'n8n-dev-secret';",
        "impact": "Integridade de automações N8N em ambientes mal configurados.",
        "fix": "Usar resolveSecret('N8N_WEBHOOK_SECRET', 'n8n-dev-secret'); fail-closed se N8N ativo.",
    },
    {
        "id": "F06",
        "sev": "média",
        "cat": "4. Segredos / defaults",
        "file": "backend/prisma/seed.ts",
        "lines": "95, 104",
        "title": "Senhas padrão de seed documentadas (admin123 / supervisor123)",
        "desc": (
            "Seed cria admin/supervisor com senhas conhecidas, repetidas em README e runbooks. "
            "Risco residual se seed rodou em produção sem rotação."
        ),
        "exploit": "Login com credenciais públicas se contas seed permanecerem ativas.",
        "code": "senha: 'admin123' / senha: 'supervisor123'",
        "impact": "Acesso privilegiado residual pós-bootstrap.",
        "fix": "Forçar troca no 1º login; senhas aleatórias em prod; checklist de rotação.",
    },
    {
        "id": "F07",
        "sev": "média",
        "cat": "2. Permissão (frontend)",
        "file": "frontend/src/App.tsx",
        "lines": "93-112",
        "title": "Sub-rotas financeiras sem RequireRole por recurso",
        "desc": (
            "Pai /app/financeiro exige só financeiro:read. Filhos ofx, contas-pagar, dre, "
            "recorrencia, contribuintes, contas NÃO têm RequireRole próprio (diferente de "
            "cobrancas/transparencia/alertas). FinanceiroLayout só esconde abas. "
            "RequireRole checa apenas 'read' (guards/RequireRole.tsx:28)."
        ),
        "exploit": (
            "Usuário com financeiro:read abre /app/financeiro/ofx etc. por URL. "
            "API ainda deve 403 — defesa em profundidade incompleta no FE."
        ),
        "code": "<Route path=\"ofx\" element={<FinanceiroOfxPage />} /> // sem RequireRole",
        "impact": "UX/erro e superfície se API falhar; alinhamento FE↔BE incompleto.",
        "fix": "Espelhar resource:read em cada sub-rota; gates write no FE onde houver mutação.",
    },
    {
        "id": "F08",
        "sev": "média",
        "cat": "2. Permissão (frontend)",
        "file": "frontend/src/pages (Marketing / Ecommerce)",
        "lines": "RequireRole read-only",
        "title": "UI de escrita sem gate write em marketing e ecommerce",
        "desc": (
            "RequireRole só valida read. Páginas marketing/ecommerce expõem formulários "
            "de mutação a quem tem apenas read (confirmado: sem hasPermission write nessas páginas)."
        ),
        "exploit": "Qualquer marketing:read vê e tenta POST/PATCH; BE deve negar.",
        "code": "RequireRole → hasPermission(..., 'read') apenas",
        "impact": "Defesa em profundidade; depende 100% do authorize no backend.",
        "fix": "Ocultar ações write com hasPermission(resource,'write'); manter authorize no BE.",
    },
    {
        "id": "F09",
        "sev": "baixa",
        "cat": "5. XSS / inputs",
        "file": "frontend (invoiceUrl / imagemUrl)",
        "lines": "vários",
        "title": "URLs de API em href/src sem allowlist de esquema",
        "desc": (
            "Sem dangerouslySetInnerHTML/eval (ponto forte). invoiceUrl e imagemUrl "
            "vão para href/src sem validar http/https — risco phishing/open-redirect, "
            "não XSS clássico via React text."
        ),
        "exploit": "Se API/DB armazenar javascript: ou URL maliciosa, link/imagem abusável.",
        "code": "href={c.invoiceUrl} / src={imagemUrl}",
        "impact": "Phishing ou esquema perigoso; XSS clássico não evidenciado.",
        "fix": "Helper safeUrl() com allowlist http/https.",
    },
    {
        "id": "F10",
        "sev": "informativa",
        "cat": "4. Segredos",
        "file": "infra/scripts/check-prod-secrets.sh",
        "lines": "13",
        "title": "Script CI/VPS alinhado à denylist incompleta (mesmo tema F04)",
        "desc": "DEV_BAD omite 'dev-secret' e 'changeme' usados em compose de desenvolvimento.",
        "exploit": "Gate pode aprovar JWT_SECRET=dev-secret se presente no .env.production.",
        "code": 'DEV_BAD=("dev-secret-change-me" "asaas-dev-webhook-token" ...)',
        "impact": "Falha de gate de deploy (agrupado com F04).",
        "fix": "Expandir DEV_BAD; falhar pipeline.",
    },
]

STRENGTHS = [
    "Isolamento: JWT + RBAC authorize + own por pessoa_id (single-tenant). Não Supabase RLS.",
    "Cobranças: own força filtro; pessoaId da query é ignorado quando own (cobrancas.ts).",
    "denyOwnOrgWide em dashboard/métricas; meu-painel só self.",
    "Mutações financeiras pontuais usam canAccessPessoaId; delete bloqueado para own.",
    "Histórico GET /financeiro/pessoas/:pessoaId/historico valida canAccessPessoaId.",
    "Usuários: authorize + canManageTargetUser; auditoria requireSupervisor.",
    "Webhooks Asaas/PIX fail-closed em produção + timing-safe.",
    "resolveSecret rejeita defaults listados em NODE_ENV/CASADAPAZ_ENV=production.",
    "compose.prod.yml exige JWT_SECRET sem default inline.",
    "Helmet + CSP nginx; .env gitignored; sem API keys live em arquivos rastreados.",
    "Frontend: zero dangerouslySetInnerHTML/eval; React escapa texto (ex.: materiais de estudo).",
    "Maioria das rotas API: authenticate + authorize de forma consistente.",
]

ISSUES = [
    {
        "n": 1,
        "title": "[Segurança] IDOR: MEDIUM lista financeiro de outro médium via ?pessoaId=",
        "labels": "security, crítica",
        "findings": ["F01", "F02"],
        "body": """## Problema
`buildListagemWhere` sobrescreve o filtro de escopo `own` com `pessoaId` da query.

## Por que é explorável
1. Autenticar como MEDIUM com `financeiro: own`.
2. `GET /api/financeiro?pessoaId=<id_de_outro>`.
3. Lista lançamentos do outro médium.

## Evidência
- `backend/src/lib/listagem-financeiro.ts:105-110`
- `backend/src/routes/financeiro.ts:130-138`

```ts
const base: Prisma.FinanceiroTransacaoWhereInput = { ...scope };
if (filtros.pessoaId) base.pessoaId = filtros.pessoaId;
```

## Impacto
Confidencialidade financeira entre médiuns.

## Sugestão
Quando `scope.pessoaId` estiver definido, ignorar query ou retornar 403 se divergir.

## Critérios de aceite
- [ ] MEDIUM own + `?pessoaId=<outro>` → 403 ou só dados próprios
- [ ] Staff continua filtrando por pessoaId
- [ ] Teste automatizado de regressão
""",
    },
    {
        "n": 2,
        "title": "[Segurança] Elevação: responsável limpeza tem write org-wide em estoque_casa",
        "labels": "security, alta",
        "findings": ["F03"],
        "body": """## Problema
`assertEstoqueCasaAccess` sem `grupoId` libera qualquer responsável de limpeza para CRUD de itens/movimentações.

## Evidência
- `backend/src/routes/estoque-casa.ts:68-84, 109-110`
- `backend/src/lib/estoque-casa.ts:5-15, 27-28`

## Impacto
Integridade do inventário da casa.

## Sugestão
Bypass só em checklist do grupo; itens/mov com `authorize('estoque_casa','write')`.

## Critérios de aceite
- [ ] Responsável limpeza: checklist OK; POST item/mov → 403 sem policy
- [ ] Staff/policy write: fluxo completo OK
""",
    },
    {
        "n": 3,
        "title": "[Segurança] Defaults públicos JWT/N8N fora da denylist / sem resolveSecret",
        "labels": "security, alta",
        "findings": ["F04", "F05", "F10"],
        "body": """## Problema
`dev-secret` (compose) não está em DEV_DEFAULTS/DEV_BAD. Outbound N8N faz fallback `n8n-dev-secret` sem `resolveSecret`.

## Evidência
- `infra/docker-compose.yml:32` — `JWT_SECRET:-dev-secret`
- `backend/src/lib/runtime-env.ts:3-8`
- `backend/src/lib/n8n.ts:28`
- `infra/scripts/check-prod-secrets.sh:13`

## Impacto
JWT forjável / webhook N8N autenticável se defaults forem a produção.

## Sugestão
Expandir denylist; `resolveSecret` no N8N; falhar boot/CI.

## Critérios de aceite
- [ ] Boot prod com `JWT_SECRET=dev-secret` falha
- [ ] N8N sem secret forte não usa fallback em prod
- [ ] `check-prod-secrets.sh` detecta `dev-secret`
""",
    },
    {
        "n": 4,
        "title": "[Segurança] Endurecer seed + RequireRole nas sub-rotas financeiras e write UI",
        "labels": "security, média",
        "findings": ["F06", "F07", "F08"],
        "body": """## Problema
Senhas seed conhecidas; sub-rotas FE financeiras sem gate por recurso; marketing/ecommerce write UI só com read.

## Evidência
- `backend/prisma/seed.ts:95,104`
- `frontend/src/App.tsx:93-112`
- `frontend/src/guards/RequireRole.tsx:28`

## Sugestão
Rotação forçada; RequireRole por recurso filho; `hasPermission(...,'write')` nas mutações FE.

## Critérios de aceite
- [ ] Contas seed exigem troca ou desabilitadas pós-bootstrap
- [ ] URL `/app/financeiro/ofx` sem grant → redirect
- [ ] marketing:read não mostra botões de criar/editar
""",
    },
    {
        "n": 5,
        "title": "[Segurança] Allowlist de esquema em URLs (href/src)",
        "labels": "security, baixa",
        "findings": ["F09"],
        "body": """## Problema
invoiceUrl/imagemUrl sem allowlist http(s).

## Sugestão
`safeUrl()` rejeitando esquemas não http/https.

## Critérios de aceite
- [ ] `javascript:` não vira href
- [ ] http/https legítimos OK
""",
    },
]


def make_donut(sev_counts: dict) -> Drawing:
    labels = [k for k, v in sev_counts.items() if v > 0]
    sizes = [sev_counts[k] for k in labels]
    d = Drawing(400, 220)
    d.add(String(200, 205, "Achados por severidade", textAnchor="middle", fontSize=11, fillColor=TEXT))
    pie = Pie()
    pie.x = 40
    pie.y = 25
    pie.width = 150
    pie.height = 150
    pie.data = sizes
    pie.labels = [f"{l} ({sev_counts[l]})" for l in labels]
    pie.slices.strokeWidth = 1
    pie.slices.strokeColor = colors.white
    pie.innerRadiusFraction = 0.45
    for i, lab in enumerate(labels):
        pie.slices[i].fillColor = colors.HexColor(SEV_HEX[lab])
    d.add(pie)
    y = 160
    for lab in labels:
        d.add(Rect(230, y, 12, 12, fillColor=colors.HexColor(SEV_HEX[lab]), strokeColor=None))
        d.add(String(248, y + 2, f"{lab}: {sev_counts[lab]}", fontSize=9, fillColor=TEXT))
        y -= 18
    return d


def make_bars(cat_counts: dict) -> Drawing:
    cats = list(cat_counts.keys())
    vals = [cat_counts[c] for c in cats]
    d = Drawing(460, 200)
    d.add(String(230, 185, "Achados por categoria", textAnchor="middle", fontSize=11, fillColor=TEXT))
    bc = HorizontalBarChart()
    bc.x = 140
    bc.y = 20
    bc.height = 150
    bc.width = 280
    bc.data = [vals]
    bc.categoryAxis.categoryNames = [c.split(". ", 1)[-1][:32] for c in cats]
    bc.bars[0].fillColor = colors.HexColor("#0F766E")
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = max(vals) + 1
    bc.valueAxis.valueStep = 1
    d.add(bc)
    return d


def build_styles():
    ss = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title", parent=ss["Title"], fontSize=18, leading=24,
            textColor=TEXT, alignment=TA_CENTER, spaceAfter=10,
        ),
        "h1": ParagraphStyle("h1", parent=ss["Heading1"], fontSize=13, textColor=TEXT, spaceBefore=12, spaceAfter=6),
        "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontSize=11, textColor=TEXT, spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("body", parent=ss["Normal"], fontSize=9, leading=12, textColor=TEXT, alignment=TA_JUSTIFY),
        "small": ParagraphStyle("small", parent=ss["Normal"], fontSize=7.5, leading=10, textColor=MUTED),
        "chip": ParagraphStyle("chip", parent=ss["Normal"], fontSize=7, textColor=colors.white, alignment=TA_CENTER),
        "issue": ParagraphStyle(
            "issue", parent=ss["Normal"], fontSize=7, leading=9.5, textColor=TEXT, fontName="Courier",
        ),
        "center": ParagraphStyle("center", parent=ss["Normal"], fontSize=9, leading=12, alignment=TA_CENTER, textColor=TEXT),
    }


def header_footer(canvas: pdfcanvas.Canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(2 * cm, h - 1.4 * cm, w - 2 * cm, h - 1.4 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(2 * cm, h - 1.15 * cm, "Relatório de Auditoria de Segurança — Casa da Paz")
    canvas.line(2 * cm, 1.4 * cm, w - 2 * cm, 1.4 * cm)
    canvas.drawRightString(w - 2 * cm, 0.9 * cm, f"Página {doc.page}")
    canvas.restoreState()


def sev_chip(sev: str, styles) -> Table:
    c = SEV_COLOR.get(sev, INFO)
    t = Table([[Paragraph(sev.upper(), styles["chip"])]], colWidths=[2.1 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), c),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return t


def main():
    styles = build_styles()
    sev_counts = {"crítica": 0, "alta": 0, "média": 0, "baixa": 0, "informativa": 0}
    cat_counts: dict[str, int] = {}
    for f in FINDINGS:
        sev_counts[f["sev"]] = sev_counts.get(f["sev"], 0) + 1
        cat_counts[f["cat"]] = cat_counts.get(f["cat"], 0) + 1

    story = []

    # CAPA
    story.append(Spacer(1, 2.8 * cm))
    story.append(Paragraph("Relatório de Auditoria de Segurança", styles["cover_title"]))
    story.append(Paragraph(f"— {PROJECT} —", styles["cover_title"]))
    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(f"<b>Data:</b> {AUDIT_DATE}", styles["center"]))
    story.append(
        Paragraph(
            "<b>Escopo:</b> Backend Express/Prisma · Frontend React/Vite · Docker/CI · secrets · XSS",
            styles["center"],
        )
    )
    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph("Nota metodológica", styles["h2"]))
    story.append(
        Paragraph(
            "Stack detectada: <b>React/Vite/TypeScript</b> + <b>Express/Prisma/PostgreSQL</b> + "
            "Docker Compose / scripts CI. Isolamento = <b>JWT + RBAC (`authorize`)</b> e filtro "
            "<b>own por `pessoa_id`</b> (casa single-tenant; não há Supabase RLS). "
            "Categorias: (1) furo em own-scope/listagens; (2) gates FE vs authorize BE; "
            "(3) IDOR por ID em todos os routers; (4) secrets/defaults compose/CI; "
            "(5) XSS (dangerouslySetInnerHTML, markdown, URLs). "
            "Somente achados verificados no código; pontos fortes documentam cobertura.",
            styles["body"],
        )
    )
    story.append(PageBreak())

    # RESUMO
    story.append(Paragraph("1. Resumo executivo", styles["h1"]))
    total = len(FINDINGS)
    story.append(
        Paragraph(
            f"Foram identificados <b>{total} achados</b> verificados: "
            f"{sev_counts['crítica']} crítica(s), {sev_counts['alta']} alta(s), "
            f"{sev_counts['média']} média(s), {sev_counts['baixa']} baixa(s), "
            f"{sev_counts['informativa']} informativa(s).",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.3 * cm))
    story.append(make_donut(sev_counts))
    story.append(Spacer(1, 0.2 * cm))
    story.append(make_bars(cat_counts))
    story.append(PageBreak())

    story.append(Paragraph("2. Pontos fortes", styles["h1"]))
    for s in STRENGTHS:
        story.append(Paragraph(f"• <font color='#059669'>●</font> {s}", styles["body"]))
        story.append(Spacer(1, 0.08 * cm))

    story.append(Paragraph("3. Pontos fracos (riscos centrais)", styles["h1"]))
    story.append(
        Paragraph(
            "• <b>IDOR financeiro:</b> GET listagem permite MEDIUM ler lançamentos de outro via <font face='Courier'>pessoaId</font>.<br/>"
            "• <b>Privilégio estoque:</b> responsável de limpeza sobe para write org-wide.<br/>"
            "• <b>Defaults de segredo:</b> <font face='Courier'>dev-secret</font> fora da denylist; N8N sem resolveSecret.",
            styles["body"],
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("4. Achados detalhados", styles["h1"]))
    header = [
        Paragraph("<b><font color='white'>Sev.</font></b>", styles["small"]),
        Paragraph("<b><font color='white'>Arquivo:linha</font></b>", styles["small"]),
        Paragraph("<b><font color='white'>Descrição</font></b>", styles["small"]),
    ]
    rows = [header]
    for f in FINDINGS:
        loc = f"{f['file']}:{f['lines']}"
        rows.append(
            [
                sev_chip(f["sev"], styles),
                Paragraph(loc.replace("/", "/\u200b"), styles["small"]),
                Paragraph(
                    f"<b>{f['id']} — {f['title']}</b><br/>{f['desc']}<br/>"
                    f"<i>Explorável:</i> {f['exploit']}",
                    styles["small"],
                ),
            ]
        )
    t = Table(rows, colWidths=[2.3 * cm, 4.0 * cm, 10.7 * cm], repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG]),
            ]
        )
    )
    story.append(t)
    story.append(PageBreak())

    story.append(Paragraph("5. Evidências por achado", styles["h1"]))
    for f in FINDINGS:
        block = [
            Paragraph(f"{f['id']} — {f['title']} [{f['sev'].upper()}]", styles["h2"]),
            Paragraph(
                f"<b>Arquivo:</b> {f['file']}:{f['lines']} | <b>Categoria:</b> {f['cat']}",
                styles["small"],
            ),
            Paragraph(f"<b>Código:</b> <font face='Courier' size='7'>{f['code']}</font>", styles["body"]),
            Paragraph(f"<b>Impacto:</b> {f['impact']}", styles["body"]),
            Paragraph(f"<b>Correção:</b> {f['fix']}", styles["body"]),
            Spacer(1, 0.2 * cm),
        ]
        story.append(KeepTogether(block))

    story.append(PageBreak())
    story.append(Paragraph("6. Recomendações priorizadas", styles["h1"]))
    recs = [
        ("P1", "Corrigir sobrescrita de pessoaId em buildListagemWhere + teste (F01/F02)."),
        ("P1", "Restringir bypass limpeza em estoque_casa às rotas de checklist (F03)."),
        ("P1", "Incluir 'dev-secret' na denylist; resolveSecret no N8N outbound (F04/F05/F10)."),
        ("P2", "Rotacionar senhas seed; RequireRole por sub-rota financeira (F06/F07)."),
        ("P2", "Gates write no FE para marketing/ecommerce (F08)."),
        ("P3", "Allowlist de esquema em href/src (F09)."),
    ]
    for p, text in recs:
        story.append(Paragraph(f"<b>{p}</b> — {text}", styles["body"]))
        story.append(Spacer(1, 0.12 * cm))

    story.append(PageBreak())
    story.append(Paragraph("7. ISSUES PARA O GITHUB", styles["h1"]))
    story.append(
        Paragraph(
            "Copie cada bloco para criar issues. Labels: <b>security</b> + severidade.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.25 * cm))
    for iss in ISSUES:
        text = (
            f"--- ISSUE {iss['n']} ---\n"
            f"Título: {iss['title']}\n"
            f"Labels: {iss['labels']}\n"
            f"Achados: {', '.join(iss['findings'])}\n\n"
            f"{iss['body']}\n"
            f"--- FIM ISSUE {iss['n']} ---"
        )
        story.append(Preformatted(text, styles["issue"], maxLineLength=100))
        story.append(Spacer(1, 0.35 * cm))

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Auditoria de Segurança — {PROJECT}",
        author="Auditoria Casa da Paz",
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF: {PDF_PATH}")
    print(f"Achados: {total} | crítica={sev_counts['crítica']} alta={sev_counts['alta']} média={sev_counts['média']}")


if __name__ == "__main__":
    main()
