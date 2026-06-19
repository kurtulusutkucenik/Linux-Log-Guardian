#!/usr/bin/env bash
# CENIK madalyon — icerik merkezli kare kirpim, seffaf favicon + PDF
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:-$ROOT/assets/logo-source.png}"
if [[ ! -f "$SRC" ]]; then
  echo "[install_logo] kaynak yok: $SRC" >&2
  exit 1
fi
python3 <<PY
from PIL import Image, ImageDraw
from pathlib import Path

src = Path("$SRC")
im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()


def is_bg(r: int, g: int, b: int, a: int) -> bool:
    if a < 24:
        return True
    if r > 228 and g > 228 and b > 228:
        return True
    # dama tahtasi / acik gri arka plan (R~=G~=B)
    if r > 155 and g > 155 and b > 155 and max(r, g, b) - min(r, g, b) < 28:
        return True
    return False


for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if is_bg(r, g, b, a):
            px[x, y] = (0, 0, 0, 0)

minx, miny, maxx, maxy = w, h, 0, 0
for y in range(h):
    for x in range(w):
        if px[x, y][3] > 24:
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)

if maxx <= minx:
    raise SystemExit("[install_logo] madalyon bulunamadi — kaynak bos")

cx = (minx + maxx) // 2
cy = (miny + maxy) // 2
side = max(maxx - minx + 1, maxy - miny + 1)
side = int(side * 1.04)
left = max(0, cx - side // 2)
top = max(0, cy - side // 2)
right = min(w, left + side)
bottom = min(h, top + side)
left = max(0, right - side)
top = max(0, bottom - side)
im = im.crop((left, top, right, bottom))

s = im.size[0]
mask = Image.new("L", (s, s), 0)
ImageDraw.Draw(mask).ellipse((0, 0, s - 1, s - 1), fill=255)
out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
out.paste(im, (0, 0), mask)

root = Path("$ROOT")
pub = root / "dashboard/public"
app = root / "dashboard/src/app"
assets = root / "assets"
website = root / "assets/website"

out.save(pub / "brand-logo-circle.png")
out512 = out.resize((512, 512), Image.Resampling.LANCZOS)
out512.save(assets / "pdf-brand.png")
out512.save(website / "logo.png")

for sz in (16, 32, 48, 64, 180, 512):
    out.resize((sz, sz), Image.Resampling.LANCZOS).save(pub / f"favicon-{sz}.png")

out32 = out.resize((32, 32), Image.Resampling.LANCZOS)
out180 = out.resize((180, 180), Image.Resampling.LANCZOS)
out32.save(pub / "icon.png")
out32.save(app / "icon.png")
out180.save(pub / "apple-icon.png")
out180.save(app / "apple-icon.png")

ico = out.resize((48, 48), Image.Resampling.LANCZOS)
ico.save(pub / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
ico.save(app / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
ico.save(website / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
out32.save(website / "favicon-32.png")

# Eski Next/Vercel favicon kalintisi — app/ altinda birakma
stale = app / "favicon-32.png"
if stale.exists():
    stale.unlink()

print(f"[install_logo] OK madalyon {s}x{s} crop=({left},{top})")
print(f"[install_logo] website -> {website / 'logo.png'}")
PY
