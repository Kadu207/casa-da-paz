"""Regenera a enciclopédia pública a partir do .docx da pasta Casa da Paz - Enciclopédia.

Uso (na raiz do repositório): python scripts/extract-enciclopedia-ervas.py
"""
import json
import re
import unicodedata
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

DOCX = Path(r"Casa da Paz - Enciclopédia/Enciclopedia_Ervas_Umbanda_100_Especies.docx")
OUT_JSON = Path("frontend/src/data/enciclopedia-ervas.json")
IMG_DIR = Path("frontend/public/portal/ervas")

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A_BLIP = "{http://schemas.openxmlformats.org/drawingml/2006/main}blip"
R_EMBED = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"


def text_of(el) -> str:
    parts = []
    for t in el.iter(W + "t"):
        if t.text:
            parts.append(t.text)
        if t.tail:
            parts.append(t.tail)
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def images_of(el, rid: dict[str, str]) -> list[str]:
    found = []
    for b in el.iter(A_BLIP):
        embed = b.get(R_EMBED)
        if embed and rid.get(embed):
            found.append(rid[embed])
    return found


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def main() -> None:
    z = zipfile.ZipFile(DOCX)
    rels = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    rid = {rel.get("Id"): rel.get("Target") for rel in rels}
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")

    blocks: list[dict] = []
    for child in list(body):
        tag = child.tag.split("}")[-1]
        if tag == "p":
            style = ""
            pPr = child.find(W + "pPr")
            if pPr is not None:
                ps = pPr.find(W + "pStyle")
                if ps is not None:
                    style = ps.get(W + "val") or ""
            line = text_of(child)
            imgs = images_of(child, rid)
            if line or imgs:
                blocks.append({"kind": "p", "style": style, "text": line, "imgs": imgs})
        elif tag == "tbl":
            rows = []
            for tr in child.findall(W + "tr"):
                cells = [text_of(tc) for tc in tr.findall(W + "tc")]
                cells = [c for c in cells if c]
                if cells:
                    rows.append(cells)
            if rows:
                blocks.append({"kind": "tbl", "rows": rows})

    # Split at catalog heading
    catalog_at = next(
        i for i, b in enumerate(blocks) if b["kind"] == "p" and b["text"].startswith("6 • Catálogo")
    )
    refs_at = next(
        i for i, b in enumerate(blocks) if b["kind"] == "p" and b["text"].startswith("7 • Referências")
    )

    intro_blocks = blocks[:catalog_at]
    catalog_blocks = blocks[catalog_at + 1 : refs_at]
    closing_blocks = blocks[refs_at:]

    sections = []
    current = None
    for b in intro_blocks:
        if b["kind"] == "p" and b["style"] == "Heading1":
            current = {"title": b["text"], "paragraphs": [], "items": []}
            sections.append(current)
            continue
        if current is None:
            continue
        if b["kind"] == "p" and b["style"] == "Heading2":
            current["items"].append({"title": b["text"], "paragraphs": []})
            continue
        if b["kind"] == "p":
            target = current["items"][-1]["paragraphs"] if current["items"] else current["paragraphs"]
            if b["text"]:
                target.append(b["text"])
        elif b["kind"] == "tbl":
            current.setdefault("tables", []).append(b["rows"])

    herbs = []
    current_herb = None
    for b in catalog_blocks:
        if b["kind"] == "p" and b["style"] == "Heading1":
            m = re.match(r"^(\d{3})\s+[•·\-—]\s+(.+)$", b["text"])
            if not m:
                continue
            current_herb = {
                "numero": int(m.group(1)),
                "nome": m.group(2).strip(),
                "slug": slugify(m.group(2)),
                "imagem": None,
                "campos": {},
                "cuidados": "",
            }
            herbs.append(current_herb)
            continue
        if current_herb is None:
            if b["kind"] == "p" and b["text"]:
                # catalog intro paragraph stored later
                pass
            continue
        if b["kind"] == "p" and b["imgs"] and not current_herb["imagem"]:
            current_herb["imagem"] = b["imgs"][0]
        if b["kind"] == "p" and b["text"].startswith("CUIDADOS:"):
            current_herb["cuidados"] = b["text"].removeprefix("CUIDADOS:").strip()
        elif b["kind"] == "tbl":
            for row in b["rows"]:
                if len(row) >= 2 and row[0].lower() not in {"campo", "informação"}:
                    current_herb["campos"][row[0]] = row[1]

    references = []
    license_note = ""
    for b in closing_blocks:
        if b["kind"] != "p" or not b["text"]:
            continue
        if b["style"] == "Heading1":
            continue
        if b["text"].startswith("Licença editorial:"):
            license_note = b["text"]
        elif "http" in b["text"]:
            references.append(b["text"])

    # catalog intro
    catalog_intro = ""
    for b in catalog_blocks:
        if b["kind"] == "p" and b["style"] != "Heading1" and b["text"] and not b["text"].startswith("CUIDADOS") and not b["text"].startswith("Referência"):
            catalog_intro = b["text"]
            break

    # preamble before first heading
    preamble = []
    for b in intro_blocks:
        if b["kind"] == "p" and b["style"] == "Heading1":
            break
        if b["kind"] == "p" and b["text"] and b["style"] != "Title":
            preamble.append(b["text"])

    slugs = [h["slug"] for h in herbs]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        raise SystemExit(f"duplicate slugs: {dupes}")
    if len(herbs) != 100:
        raise SystemExit(f"expected 100 herbs, got {len(herbs)}")

    IMG_DIR.mkdir(parents=True, exist_ok=True)
    for h in herbs:
        src = "word/" + h["imagem"].replace("\\", "/")
        # rel targets are like media/image1.png
        src = "word/" + h["imagem"]
        data = z.read(src)
        dest_name = f"{h['numero']:03d}-{h['slug']}.png"
        (IMG_DIR / dest_name).write_bytes(data)
        h["imagem"] = f"/portal/ervas/{dest_name}"
        classe = (h["campos"].get("Classificação ritual de estudo") or "").strip().lower()
        h["classificacao"] = classe
        cuidados_l = h["cuidados"].lower()
        if cuidados_l.startswith("atenção") or "não recomendar aplicação" in cuidados_l:
            h["seguranca"] = "atencao"
        elif cuidados_l.startswith("sem receita"):
            h["seguranca"] = "sem-receita"
        else:
            h["seguranca"] = "preparo-suave"

    payload = {
        "titulo": "Enciclopédia das Ervas na Umbanda",
        "subtitulo": "100 espécies ilustradas • fundamentos • classificação ritual • banhos • preparo e segurança",
        "edicao": "Edição educativa para publicação digital | outubro de 2026",
        "preamble": preamble,
        "catalogoIntro": catalog_intro,
        "secoes": sections,
        "ervas": herbs,
        "referencias": references,
        "licenca": license_note,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    classes = {}
    seg = {}
    for h in herbs:
        classes[h["classificacao"]] = classes.get(h["classificacao"], 0) + 1
        seg[h["seguranca"]] = seg.get(h["seguranca"], 0) + 1
    print("herbs", len(herbs), "sections", len(sections))
    print("classes", classes)
    print("seguranca", seg)
    print("sample", herbs[0]["nome"], herbs[0]["campos"])
    print("json bytes", OUT_JSON.stat().st_size)


if __name__ == "__main__":
    main()
