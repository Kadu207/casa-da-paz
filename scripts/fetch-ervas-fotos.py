"""Baixa fotografias de referência (Wikimedia Commons / Wikidata) para as 100 ervas.

Só aceita licenças livres (CC0, CC BY, CC BY-SA, domínio público, GFDL).
Grava o arquivo em frontend/public/portal/ervas/fotos e o crédito na ficha.

Uso, na raiz do repositório:
  python scripts/fetch-ervas-fotos.py
  python scripts/fetch-ervas-fotos.py alecrim arruda
"""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "frontend" / "src" / "data" / "enciclopedia-ervas.json"
FOTO_DIR = ROOT / "frontend" / "public" / "portal" / "ervas" / "fotos"
UA = "CasaDaPazEncyclopedia/1.0 (estudo educativo; https://casadapaz.inovatitech.com.br)"

SYNONYM = {
    "Salvia rosmarinus": "Rosmarinus officinalis",
    "Lippia citriodora": "Aloysia citrodora",
    "Lippia sidoides": "Lippia origanoides",
    "Streptocarpus ionanthus": "Saintpaulia ionantha",
    "Dracaena trifasciata": "Sansevieria trifasciata",
    "Corymbia citriodora": "Eucalyptus citriodora",
    "Handroanthus albus": "Tabebuia alba",
    "Handroanthus impetiginosus": "Tabebuia impetiginosa",
    "Plinia cauliflora": "Myrciaria cauliflora",
    "Plectranthus barbatus": "Coleus barbatus",
    "Plectranthus neochilus": "Coleus neochilus",
    "Plectranthus amboinicus": "Coleus amboinicus",
    "Matricaria chamomilla": "Matricaria recutita",
    "Mentha × piperita": "Mentha piperita",
    "Citrus × latifolia": "Citrus latifolia",
    "Citrus × sinensis": "Citrus sinensis",
    "Citrus × aurantium": "Citrus aurantium",
    "Musa × paradisiaca": "Musa paradisiaca",
    "Kalanchoe pinnata": "Bryophyllum pinnatum",
    "Kalanchoe daigremontiana": "Bryophyllum daigremontianum",
    "Eugenia brasiliensis": "Eugenia brasiliensis grumixama",
    "Passiflora cincinnata": "Passiflora cincinnata",
    "Baccharis trimera": "Baccharis trimera",
    "Solidago chilensis": "Solidago chilensis",
    "Piptadenia stipulacea": "Piptadenia stipulacea",
    "Costus spicatus": "Costus spicatus",
    "Alpinia zerumbet": "Alpinia zerumbet",
    "Peumus boldus": "Peumus boldus",
    "Petiveria alliacea": "Petiveria alliacea",
}

SLUG_QUERIES = {
    "rosa-branca": ["Rosa white flower", "white rose bloom"],
    "rosa-vermelha": ["red rose flower Rosa", "Rosa red flower"],
    "rosa-amarela": ["yellow rose flower Rosa", "Rosa yellow flower"],
    "espada-de-ogum-especie-variavel": ["Dracaena angolensis", "Sansevieria cylindrica"],
    "espada-de-santa-barbara": ["Sansevieria trifasciata Laurentii", "Dracaena trifasciata Laurentii"],
}

BAD_TEXT = re.compile(
    r"illustration|drawing|diagram|icon|locator map|distribution map|coat of arms|"
    r"\blogo\b|\bsvg\b|painting|watercolor|postage stamp|\bstamp\b|\bcoin\b|\bflag\b|"
    r"essential oil|\bbottle\b|\bproduct\b|tea bag|recipe|\bpizza\b|\bsoup\b|"
    r"herbarium specimen|botanical illustration|artwork",
    re.I,
)


def http_json(url: str) -> dict:
    last_error: Exception | None = None
    for attempt in range(4):
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code in {429, 503, 502}:
                time.sleep(2 + attempt * 2)
                continue
            raise
        except urllib.error.URLError as error:
            last_error = error
            time.sleep(1 + attempt)
    raise RuntimeError(f"falha de rede: {url}") from last_error


def http_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as response:
        return response.read()


def plain(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def binomial(scientific: str) -> str:
    text = re.sub(r"\s*\([^)]*\)", "", scientific)
    text = text.replace("×", " ").replace("'", " ").replace("’", " ")
    return re.sub(r"\s+", " ", text).strip()


def license_ok(short: str, url: str) -> bool:
    blob = f"{short} {url}".lower()
    if re.search(r"non-?commercial|\bnc\b|-nc|noderiv|no deriv|-nd\b", blob):
        return False
    return any(
        token in blob
        for token in ("cc0", "cc by", "public domain", "no restrictions", "gfdl", "cc-zero")
    )


def extension_for(data: bytes, url: str) -> str:
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data.startswith(b"\x89PNG"):
        return ".png"
    if data.startswith(b"RIFF") and b"WEBP" in data[:16]:
        return ".webp"
    lower = url.lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        if ext in lower:
            return ".jpg" if ext == ".jpeg" else ext
    return ""


def commons_info(filename: str, hint: str = "") -> dict | None:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "titles": "File:" + filename,
            "prop": "imageinfo|categories",
            "iiprop": "url|mime|size|extmetadata",
            "iiurlwidth": "1280",
            "cllimit": "40",
            "clshow": "!hidden",
        }
    )
    data = http_json("https://commons.wikimedia.org/w/api.php?" + params)
    pages = data.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        return None
    page = pages[0]
    info = (page.get("imageinfo") or [None])[0]
    if not info:
        return None
    meta = info.get("extmetadata") or {}
    short = plain((meta.get("LicenseShortName") or {}).get("value", ""))
    license_url = plain((meta.get("LicenseUrl") or {}).get("value", ""))
    artist = plain((meta.get("Artist") or {}).get("value", "")) or "autor não informado"
    title = plain((meta.get("ObjectName") or {}).get("value", "")) or filename
    categories = " ".join(cat.get("title", "") for cat in page.get("categories") or [])
    blob = f"{filename} {title} {categories}"
    if BAD_TEXT.search(blob):
        return None
    if not license_ok(short, license_url):
        return None
    mime = info.get("mime") or ""
    if mime not in {"image/jpeg", "image/png", "image/webp"}:
        return None
    width = int(info.get("thumbwidth") or info.get("width") or 0)
    if width < 480:
        return None
    thumb = info.get("thumburl") or info.get("url")
    if not thumb:
        return None
    page_url = info.get("descriptionurl") or (
        "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(filename.replace(" ", "_"))
    )
    score = 0
    if re.search(r"photograph|photos", categories, re.I):
        score += 3
    if "herbarium" in blob.lower():
        score -= 4
    score += min(width, 1600) / 400
    for token in re.findall(r"[A-Za-z]{4,}", hint)[:4]:
        if token.lower() in blob.lower():
            score += 3
    return {
        "arquivoOriginal": filename,
        "titulo": title[:180],
        "autor": artist[:180],
        "licenca": short,
        "licencaUrl": license_url,
        "fonte": page_url,
        "thumb": thumb,
        "score": score,
        "width": width,
    }


def wikidata_filenames(search: str) -> list[str]:
    params = urllib.parse.urlencode(
        {
            "action": "wbsearchentities",
            "search": search,
            "language": "en",
            "format": "json",
            "type": "item",
            "limit": "4",
        }
    )
    data = http_json("https://www.wikidata.org/w/api.php?" + params)
    ids = [hit["id"] for hit in data.get("search", []) if hit.get("id")]
    if not ids:
        return []
    params = urllib.parse.urlencode(
        {
            "action": "wbgetentities",
            "ids": "|".join(ids),
            "props": "claims|labels",
            "languages": "en",
            "format": "json",
        }
    )
    entities = http_json("https://www.wikidata.org/w/api.php?" + params)["entities"]
    names: list[str] = []
    genus = search.split()[0].lower()
    epithet = search.split()[1].lower() if len(search.split()) > 1 else ""
    for qid in ids:
        entity = entities.get(qid) or {}
        label = ((entity.get("labels") or {}).get("en") or {}).get("value", "").lower()
        if genus not in label:
            continue
        if epithet and epithet not in {"spp.", "sp."} and epithet not in label:
            continue
        for claim in (entity.get("claims") or {}).get("P18") or []:
            value = ((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value")
            if isinstance(value, str):
                names.append(value)
    return names


def commons_search(query: str) -> list[str]:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {query}",
            "gsrnamespace": "6",
            "gsrlimit": "8",
        }
    )
    data = http_json("https://commons.wikimedia.org/w/api.php?" + params)
    pages = data.get("query", {}).get("pages") or []
    names = []
    for page in pages:
        title = page.get("title") or ""
        if title.startswith("File:"):
            names.append(title[5:])
    return names


def loose_query(query: str) -> bool:
    return any(word in query.lower() for word in ("white", "red", "yellow", "flower", "bloom"))


def best_photo(queries: list[str]) -> dict | None:
    seen: set[str] = set()
    best: dict | None = None
    usable = [query for query in queries if query and "spp." not in query.lower()]

    def consider(names: list[str], hint: str) -> None:
        nonlocal best
        for name in names:
            if name in seen:
                continue
            seen.add(name)
            time.sleep(0.15)
            info = commons_info(name, hint)
            if info and (best is None or info["score"] > best["score"]):
                best = info

    for query in usable:
        if loose_query(query):
            continue
        consider(wikidata_filenames(query), query)
        time.sleep(0.15)
        if best is not None:
            break
    if best is None:
        for query in usable[:4]:
            consider(commons_search(query), query)
            time.sleep(0.15)
            if best is not None:
                break
    return best


def queries_for(erva: dict) -> list[str]:
    scientific = erva["campos"]["Identificação botânica de referência"]
    slug = erva["slug"]
    found = list(SLUG_QUERIES.get(slug, []))
    cleaned = binomial(scientific)
    found.append(cleaned)
    synonym = SYNONYM.get(scientific) or SYNONYM.get(cleaned)
    if synonym and synonym not in found:
        found.append(synonym)
    if erva["nome"] and "spp." in scientific.lower():
        found.append(erva["nome"])
    # gênero + epíteto, sem cultivar
    parts = cleaned.split()
    if len(parts) >= 2 and parts[1] not in {"spp.", "sp."}:
        genus_species = f"{parts[0]} {parts[1]}"
        if genus_species not in found:
            found.append(genus_species)
    return found


def apply_copy(payload: dict) -> None:
    aviso = (
        "As fotografias são imagens de referência do Wikimedia Commons, com licença livre e autoria em cada ficha. "
        "Elas ajudam no reconhecimento e não substituem confirmação botânica. Não colha plantas sem identificação segura."
    )
    payload["preamble"] = [
        linha
        if not linha.startswith("IMPORTANTE")
        else aviso
        for linha in payload["preamble"]
    ]
    payload["catalogoIntro"] = (
        "Cada ficha traz uma fotografia de referência da espécie indicada, com crédito e licença. "
        "A classificação ritual é contextual e não é prescrição. “Evitar na pele” é uma decisão conservadora de segurança."
    )


def main() -> None:
    only = {arg for arg in sys.argv[1:] if not arg.startswith("-")}
    payload = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    FOTO_DIR.mkdir(parents=True, exist_ok=True)
    ok = 0
    failed: list[str] = []
    for erva in payload["ervas"]:
        if only and erva["slug"] not in only:
            continue
        print(f"→ {erva['numero']:03d} {erva['nome']}", flush=True)
        photo = best_photo(queries_for(erva))
        if not photo:
            failed.append(erva["slug"])
            print("  sem foto livre", flush=True)
            continue
        data = http_bytes(photo["thumb"])
        ext = extension_for(data, photo["thumb"])
        if not ext or len(data) < 8_000:
            failed.append(erva["slug"])
            print("  arquivo inválido", flush=True)
            continue
        dest_name = f"{erva['numero']:03d}-{erva['slug']}{ext}"
        for old in FOTO_DIR.glob(f"{erva['numero']:03d}-{erva['slug']}.*"):
            old.unlink()
        (FOTO_DIR / dest_name).write_bytes(data)
        old_png = ROOT / "frontend" / "public" / "portal" / "ervas" / f"{erva['numero']:03d}-{erva['slug']}.png"
        if old_png.exists():
            old_png.unlink()
        erva["imagem"] = f"/portal/ervas/fotos/{dest_name}"
        erva["credito"] = {
            "tipo": "fotografia",
            "autor": photo["autor"],
            "licenca": photo["licenca"],
            "licencaUrl": photo["licencaUrl"],
            "fonte": photo["fonte"],
            "titulo": photo["titulo"],
        }
        ok += 1
        print(f"  {photo['licenca']} · {photo['autor'][:60]}", flush=True)
        JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        time.sleep(0.2)
    if not only:
        apply_copy(payload)
        JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"RESUMO ok={ok} falhas={len(failed)} {' '.join(failed)}", flush=True)


if __name__ == "__main__":
    main()
