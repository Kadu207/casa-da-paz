"""Gera os tamanhos do emblema a partir do arquivo enviado pela casa.

O mestre é `frontend/public/portal/logo-oficial.jpg`. O script só redimensiona.
Não remove fundo e não altera o desenho.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend" / "public" / "portal"
MASTER = OUT_DIR / "logo-oficial.jpg"


def main() -> None:
    master = Image.open(MASTER).convert("RGB")
    master.save(OUT_DIR / "logo.png", optimize=True)
    master.save(OUT_DIR / "logo.webp", quality=95, method=6)
    sizes = {
        "logo-192.png": 192,
        "logo-512.png": 512,
        "favicon-32.png": 32,
        "apple-touch-icon.png": 180,
    }
    for name, size in sizes.items():
        master.resize((size, size), Image.Resampling.LANCZOS).save(OUT_DIR / name)
    master.save(ROOT / "frontend" / "public" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("ok", master.size)


if __name__ == "__main__":
    main()
