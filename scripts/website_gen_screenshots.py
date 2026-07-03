#!/usr/bin/env python3
"""Dashboard onizleme PNG — Playwright (canli) veya Pillow (placeholder)."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/website/screenshots"
PW_SCRIPT = ROOT / "scripts/website_dashboard_screenshots.py"

SPECS = (
    {
        "name": "dashboard-fleet.png",
        "title": "Fleet · SOC",
        "accent": (56, 189, 248),
        "chips": ("node online", "fleet sync", "SOC timeline"),
    },
    {
        "name": "dashboard-tests.png",
        "title": "Tests · phase100",
        "accent": (34, 197, 94),
        "chips": ("75 PASS", "FAIL: 0", "72h soak"),
    },
)


def try_playwright(force: bool) -> int:
    sh = ROOT / "scripts/website_dashboard_screenshots.sh"
    if sh.is_file():
        cmd = ["bash", str(sh)]
        if force:
            cmd.append("--force")
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.stdout:
            print(proc.stdout, end="")
        if proc.stderr:
            print(proc.stderr, end="", file=sys.stderr)
        return proc.returncode
    if not PW_SCRIPT.is_file():
        return 2
    cmd = [sys.executable, str(PW_SCRIPT)]
    if force:
        cmd.append("--force")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.stdout:
        print(proc.stdout, end="")
    if proc.stderr:
        print(proc.stderr, end="", file=sys.stderr)
    return proc.returncode


def draw_placeholder(path: Path, title: str, accent: tuple[int, int, int], chips: tuple[str, ...]) -> None:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("[website_gen_screenshots] FAIL: pip install Pillow", file=sys.stderr)
        raise SystemExit(1)

    w, h = 960, 540
    img = Image.new("RGB", (w, h), (8, 10, 16))
    draw = ImageDraw.Draw(img)

    for y in range(0, h, 32):
        draw.line([(0, y), (w, y)], fill=(18, 22, 32), width=1)
    for x in range(0, w, 32):
        draw.line([(x, 0), (x, h)], fill=(18, 22, 32), width=1)

    draw.rectangle([(0, 0), (w, 4)], fill=(227, 10, 23))
    draw.rectangle([(0, 4), (w, 52)], fill=(12, 14, 22))

    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    font_lg = font_sm = None
    for fp in font_paths:
        p = Path(fp)
        if p.is_file():
            font_lg = ImageFont.truetype(str(p), 34)
            font_sm = ImageFont.truetype(str(p), 18)
            break
    if not font_lg:
        font_lg = ImageFont.load_default()
        font_sm = font_lg

    draw.text((28, 14), "Linux Log Guardian", fill=(200, 204, 214), font=font_sm)
    draw.text((28, 78), title, fill=(242, 244, 248), font=font_lg)

    ax, ay, aw, ah = 28, 140, w - 56, h - 180
    draw.rounded_rectangle([(ax, ay), (ax + aw, ay + ah)], radius=14, outline=accent, width=2, fill=(14, 16, 24))

    for i, chip in enumerate(chips):
        cx = ax + 20 + i * 210
        cy = ay + 24
        chip_fill = tuple(max(0, c - 80) for c in accent)
        draw.rounded_rectangle([(cx, cy), (cx + 190, cy + 36)], radius=18, fill=chip_fill)
        draw.rounded_rectangle([(cx, cy), (cx + 190, cy + 36)], radius=18, outline=accent, width=1)
        draw.text((cx + 14, cy + 8), chip, fill=(230, 232, 238), font=font_sm)

    for row in range(5):
        yy = ay + 90 + row * 52
        draw.line([(ax + 16, yy), (ax + aw - 16, yy)], fill=(28, 32, 44), width=1)
        bar_w = int(aw * (0.35 + (row % 3) * 0.18))
        draw.rounded_rectangle([(ax + 20, yy + 10), (ax + 20 + bar_w, yy + 34)], radius=6, fill=accent)

    glow = Image.new("RGB", (w, h), (0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([(w // 2 - 220, h // 2 - 120), (w // 2 + 220, h // 2 + 120)], fill=accent)
    img = Image.blend(img, glow, 0.06)

    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"[OK] {path.relative_to(ROOT)}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="mevcut dosyalarin ustune yaz")
    ap.add_argument(
        "--placeholder-only",
        action="store_true",
        help="Playwright atla — yalnizca Pillow placeholder",
    )
    args = ap.parse_args()

    if not args.placeholder_only:
        pw_rc = try_playwright(args.force)
        if pw_rc == 0:
            missing = [s["name"] for s in SPECS if not (OUT / s["name"]).is_file()]
            if not missing and not args.force:
                return 0
            if not missing:
                return 0
            print(f"[website_gen_screenshots] eksik: {', '.join(missing)} — placeholder dolduruluyor")
        elif pw_rc != 2:
            print("[website_gen_screenshots] playwright kismi basarisiz — placeholder deneniyor", file=sys.stderr)

    made = 0
    for spec in SPECS:
        out = OUT / spec["name"]
        if out.is_file() and not args.force:
            print(f"[skip] {out.relative_to(ROOT)} (var)")
            continue
        draw_placeholder(out, spec["title"], spec["accent"], spec["chips"])
        made += 1

    if made == 0:
        print("[OK] website_gen_screenshots — guncelleme yok")
    else:
        print(f"[OK] website_gen_screenshots — {made} placeholder")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
