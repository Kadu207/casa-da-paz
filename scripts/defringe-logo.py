"""Remove só o branco de fora do selo e tira a auréola branca das bordas."""

from __future__ import annotations

import subprocess
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend" / "public" / "portal"


def load_original() -> Image.Image:
    data = subprocess.check_output(
        ["git", "show", "0ece8eb:frontend/public/portal/logo.png"]
    )
    return Image.open(__import__("io").BytesIO(data)).convert("RGB")


def knock_out(image: Image.Image) -> Image.Image:
    width, height = image.size
    pixels = list(image.getdata())
    background = bytearray(width * height)

    def index(y: int, x: int) -> int:
        return y * width + x

    def is_near_white(pixel: tuple[int, int, int]) -> bool:
        return pixel[0] >= 248 and pixel[1] >= 248 and pixel[2] >= 248

    queue: deque[int] = deque()

    def seed(y: int, x: int) -> None:
        i = index(y, x)
        if not background[i] and is_near_white(pixels[i]):
            background[i] = 1
            queue.append(i)

    for x in range(width):
        seed(0, x)
        seed(height - 1, x)
    for y in range(height):
        seed(y, 0)
        seed(y, width - 1)

    while queue:
        i = queue.popleft()
        y, x = divmod(i, width)
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < height and 0 <= nx < width:
                j = index(ny, nx)
                if not background[j] and is_near_white(pixels[j]):
                    background[j] = 1
                    queue.append(j)

    # Três pixels para dentro da borda anti-aliasada.
    fringe = bytearray(background)
    for _ in range(3):
        grown = bytearray(fringe)
        for i, marked in enumerate(fringe):
            if not marked:
                continue
            y, x = divmod(i, width)
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < height and 0 <= nx < width:
                    grown[index(ny, nx)] = 1
        fringe = grown

    out: list[tuple[int, int, int, int]] = []
    for i, (red, green, blue) in enumerate(pixels):
        if background[i]:
            out.append((red, green, blue, 0))
            continue
        if not fringe[i]:
            out.append((red, green, blue, 255))
            continue
        distance = max(255 - red, 255 - green, 255 - blue)
        alpha = min(255, int(distance * 1.35))
        if alpha <= 0:
            out.append((red, green, blue, 0))
            continue
        coverage = alpha / 255
        def unmix(channel: int) -> int:
            value = (channel - 255 * (1 - coverage)) / coverage
            return max(0, min(255, int(round(value))))

        out.append((unmix(red), unmix(green), unmix(blue), alpha))

    result = Image.new("RGBA", (width, height))
    result.putdata(out)
    # Buracos das letras (A, D, O, P, R) ficam fora do selo e ainda estão brancos.
    result = clear_letter_counters(result)
    return result


def clear_letter_counters(image: Image.Image) -> Image.Image:
    width, height = image.size
    pixels = list(image.getdata())
    seen = bytearray(width * height)
    center_x = (width - 1) / 2
    center_y = (height - 1) / 2
    # O selo (aro, estrelas, triângulo) fica dentro deste raio. As letras ficam fora.
    limit = 0.40 * width

    def index(y: int, x: int) -> int:
        return y * width + x

    def is_hole(pixel: tuple[int, int, int, int]) -> bool:
        return pixel[3] > 200 and pixel[0] >= 230 and pixel[1] >= 230 and pixel[2] >= 230

    for start, pixel in enumerate(pixels):
        if seen[start] or not is_hole(pixel):
            continue
        queue = deque([start])
        seen[start] = 1
        component = [start]
        while queue:
            i = queue.popleft()
            y, x = divmod(i, width)
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < height and 0 <= nx < width:
                    j = index(ny, nx)
                    if not seen[j] and is_hole(pixels[j]):
                        seen[j] = 1
                        queue.append(j)
                        component.append(j)
        distances = []
        for i in component:
            y, x = divmod(i, width)
            distances.append(((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5)
        if sum(distances) / len(distances) < limit:
            continue
        for i in component:
            red, green, blue, _alpha = pixels[i]
            pixels[i] = (red, green, blue, 0)

    # Borda clara das letras, fora do selo: tira o branco misturado.
    radius_limit = 0.405 * width
    for i, (red, green, blue, alpha) in enumerate(pixels):
        if alpha == 0:
            continue
        y, x = divmod(i, width)
        distance = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
        if distance < radius_limit:
            continue
        whiteness = min(red, green, blue)
        if whiteness < 70:
            continue
        coverage = max(0.0, 1.0 - whiteness / 255.0)
        new_alpha = int(round(coverage * 255))
        if new_alpha <= 8:
            pixels[i] = (red, green, blue, 0)
            continue

        def unmix(channel: int, cover: float = coverage) -> int:
            value = (channel - 255 * (1 - cover)) / cover
            return max(0, min(255, int(round(value))))

        pixels[i] = (unmix(red), unmix(green), unmix(blue), new_alpha)

    cleaned = Image.new("RGBA", (width, height))
    cleaned.putdata(pixels)
    return cleaned


def main() -> None:
    master = knock_out(load_original())
    master.save(OUT_DIR / "logo.png", optimize=True)
    master.save(OUT_DIR / "logo.webp", lossless=False, quality=90, method=6)
    sizes = {
        "logo-192.png": 192,
        "logo-512.png": 512,
        "favicon-32.png": 32,
        "apple-touch-icon.png": 180,
    }
    for name, size in sizes.items():
        master.resize((size, size), Image.Resampling.LANCZOS).save(OUT_DIR / name)
    master.save(ROOT / "frontend" / "public" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    navy = Image.new("RGBA", master.size, (15, 23, 42, 255))
    preview = Image.alpha_composite(navy, master).convert("RGB")
    preview.resize((640, 640), Image.Resampling.LANCZOS).save(ROOT / "scripts" / "_logo_fixed_preview.jpg", quality=92)
    preview.crop((0, 0, 1024, 280)).resize((800, 220)).save(ROOT / "scripts" / "_logo_fixed_top.jpg", quality=92)
    print("ok", master.getchannel("A").getextrema())


if __name__ == "__main__":
    main()
