#!/usr/bin/env python3
"""Kenardaki beyaz/gri arka planı şeffaf yapar ve rozeti kırpar.

Kenardan flood-fill: sadece kenara bağlı açık (beyaz-gri) pikseller silinir,
rozet içindeki ay-yıldız beyazı korunur.
"""
import sys
from collections import deque
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "landing/public/logo-cenik.png"
DST = sys.argv[2] if len(sys.argv) > 2 else SRC

im = Image.open(SRC).convert("RGBA")
w, h = im.size
px = im.load()

THRESH = 178  # r,g,b hepsi bunun üstündeyse "arka plan" adayı


def is_bg(x, y):
    r, g, b, a = px[x, y]
    return a > 0 and r >= THRESH and g >= THRESH and b >= THRESH


visited = bytearray(w * h)
dq = deque()
for x in range(w):
    for y in (0, h - 1):
        dq.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        dq.append((x, y))

while dq:
    x, y = dq.popleft()
    if x < 0 or y < 0 or x >= w or y >= h:
        continue
    idx = y * w + x
    if visited[idx]:
        continue
    visited[idx] = 1
    if not is_bg(x, y):
        continue
    px[x, y] = (0, 0, 0, 0)
    dq.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

# Kalan opak içeriğe göre kırp
bbox = im.getbbox()
if bbox:
    im = im.crop(bbox)

im.save(DST)
print(f"[trim_logo] {SRC} -> {DST} boyut={im.size}")
