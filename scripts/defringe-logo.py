"""Recorta o papel branco de fora do selo oficial, sem redesenhar o emblema.

O mestre é o PNG sem perda de `0ece8eb` (mesmo desenho do arquivo 4K).
Por dentro do aro o pixels ficam intactos: triângulo, estrelas e aro brancos.
Por fora, o branco vira transparência e o miolo das letras acompanha o fundo.
"""

from __future__ import annotations

import io
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend" / "public" / "portal"
# O aro branco termina por volta deste raio. As letras ficam fora.
OUTER_RADIUS = 426 / 1024


def load_original() -> Image.Image:
    data = subprocess.check_output(["git", "show", "0ece8eb:frontend/public/portal/logo.png"])
    return Image.open(io.BytesIO(data)).convert("RGB")


def knock_out(image: Image.Image) -> Image.Image:
    width, height = image.size
    pixels = image.get_flattened_data()
    center_x = (width - 1) / 2
    center_y = (height - 1) / 2
    limit = OUTER_RADIUS * width
    output: list[tuple[int, int, int, int]] = []

    for index, (red, green, blue) in enumerate(pixels):
        y, x = divmod(index, width)
        distance = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
        if distance <= limit:
            output.append((red, green, blue, 255))
            continue
        darkest = min(red, green, blue)
        if darkest >= 248:
            output.append((red, green, blue, 0))
            continue
        coverage = min(1.0, (255 - darkest) / 210)
        if coverage >= 0.82:
            output.append((red, green, blue, 255))
            continue
        if coverage <= 0.04:
            output.append((red, green, blue, 0))
            continue

        def unmix(channel: int, cover: float = coverage) -> int:
            value = (channel - 253 * (1 - cover)) / cover
            return max(0, min(255, int(round(value))))

        output.append((unmix(red), unmix(green), unmix(blue), int(round(coverage * 255))))

    result = Image.new("RGBA", (width, height))
    result.putdata(output)
    return result


def main() -> None:
    master = knock_out(load_original())
    master.save(OUT_DIR / "logo.png", optimize=True)
    master.save(OUT_DIR / "logo.webp", lossless=True, quality=100, method=6)
    sizes = {
        "logo-192.png": 192,
        "logo-512.png": 512,
        "favicon-32.png": 32,
        "apple-touch-icon.png": 180,
    }
    for name, size in sizes.items():
        master.resize((size, size), Image.Resampling.LANCZOS).save(OUT_DIR / name)
    master.save(
        ROOT / "frontend" / "public" / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("ok", master.size, master.getchannel("A").getextrema())


if __name__ == "__main__":
    main()
